// Build-time prerender: writes crawlable HTML for every public route into dist/, plus robots.txt and sitemap.xml.
// Runs after `vite build` (client) and `vite build --ssr` (.ssr-build). See the "build" script in package.json.
//
// Environment variables (set in Netlify, not VITE_*):
//   SITE_URL      canonical site origin, default https://kushiconsultancy.com
//   SEO_API_URL   backend endpoint that returns the admin SEO settings, e.g. https://api.example.com/api/seo
//                 If set and the request fails, the build fails so an unpublished SEO change can't go live silently.
import { readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DEFAULT_SEO_SETTINGS, DEFAULT_SITE_URL, PUBLIC_PAGES } from '../src/seo/siteConfig.js';
import { buildHeadTags, resolveSettings, serializeHeadTags } from '../src/seo/head.js';
import { buildRobotsTxt, buildSitemapXml } from '../src/seo/sitemap.js';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(frontendDir, 'dist');
const ssrDir = path.join(frontendDir, '.ssr-build');
const siteUrl = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');

const loadSettings = async () => {
    const endpoint = process.env.SEO_API_URL;
    if (!endpoint) {
        console.warn('[prerender] SEO_API_URL is not set; using the default SEO settings.');
        return resolveSettings(DEFAULT_SEO_SETTINGS);
    }

    let response;
    try {
        response = await fetch(endpoint, { signal: AbortSignal.timeout(15_000) });
    } catch (error) {
        throw new Error(`SEO settings request to ${endpoint} failed: ${error.message}`);
    }
    if (!response.ok) {
        throw new Error(`SEO settings request to ${endpoint} failed with HTTP ${response.status}`);
    }
    const body = await response.json();
    const settings = body?.settings;
    if (!settings || typeof settings !== 'object') {
        throw new Error('SEO settings response did not contain a "settings" object');
    }
    console.log(`[prerender] Loaded SEO settings from ${endpoint}`);
    return resolveSettings(settings);
};

// Splices the head tags and rendered markup into the Vite-built index.html.
const applyTemplate = (template, { headHtml, bodyHtml }) => template
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name="description"[^>]*>\s*/i, '')
    .replace('</head>', `    ${headHtml}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);

const outputPathFor = (pagePath) => (pagePath === '/'
    ? path.join(distDir, 'index.html')
    : path.join(distDir, pagePath.replace(/^\//, ''), 'index.html'));

const main = async () => {
    const template = await readFile(path.join(distDir, 'index.html'), 'utf8');
    const settings = await loadSettings();
    const { renderPage } = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href);

    for (const page of PUBLIC_PAGES) {
        // The head also embeds the settings, so the browser stays consistent after client-side navigation.
        const tags = buildHeadTags({ pathname: page.path, settings, siteUrl });
        const bodyHtml = page.prerender ? await renderPage(page.path) : '';
        const html = applyTemplate(template, { headHtml: serializeHeadTags(tags), bodyHtml });

        const outputPath = outputPathFor(page.path);
        await mkdir(path.dirname(outputPath), { recursive: true });
        await writeFile(outputPath, html, 'utf8');
        console.log(`[prerender] ${page.path} -> ${path.relative(frontendDir, outputPath)}${page.prerender ? '' : ' (head only)'}`);
    }

    // dist/index.html holds the prerendered homepage, so SPA fallbacks (admin pages, unknown paths) need
    // an empty app shell. Hydrating the homepage markup into a different route would fail.
    const shellTags = buildHeadTags({ pathname: '/admin', settings, siteUrl });
    await writeFile(
        path.join(distDir, 'app-shell.html'),
        applyTemplate(template, { headHtml: serializeHeadTags(shellTags), bodyHtml: '' }),
        'utf8',
    );

    await writeFile(path.join(distDir, 'robots.txt'), buildRobotsTxt({ settings, siteUrl }), 'utf8');

    const sitemapPath = path.join(distDir, 'sitemap.xml');
    if (settings.indexingEnabled) {
        await writeFile(sitemapPath, buildSitemapXml({ settings, siteUrl }), 'utf8');
    } else {
        // Indexing is switched off in the admin panel: publish no sitemap at all.
        await rm(sitemapPath, { force: true });
    }
    console.log(`[prerender] Wrote robots.txt and ${settings.indexingEnabled ? 'sitemap.xml' : 'no sitemap (indexing disabled)'}`);
};

try {
    await main();
} finally {
    await rm(ssrDir, { recursive: true, force: true });
}
