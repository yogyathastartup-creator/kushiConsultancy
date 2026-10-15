// robots.txt and sitemap.xml generators. Used by scripts/prerender.mjs at build time.
import { DEFAULT_SITE_URL, PUBLIC_PAGES } from './siteConfig.js';
import { escapeHtml, resolvePageMeta, resolveSettings } from './head.js';

const trimSlash = (value) => value.replace(/\/+$/, '');

// Admin paths and the API are never useful to search engines.
const DISALLOWED_PATHS = ['/admin/', '/api/'];

export const buildRobotsTxt = ({ settings, siteUrl = DEFAULT_SITE_URL }) => {
    const merged = resolveSettings(settings);
    const base = trimSlash(siteUrl);
    const lines = ['# Generated at build time from the SEO settings in the admin panel.', 'User-agent: *'];

    if (!merged.indexingEnabled) {
        lines.push('Disallow: /');
        return `${lines.join('\n')}\n`;
    }

    lines.push('Allow: /');
    DISALLOWED_PATHS.forEach((path) => lines.push(`Disallow: ${path}`));
    lines.push('', `Sitemap: ${base}/sitemap.xml`);
    return `${lines.join('\n')}\n`;
};

export const buildSitemapXml = ({ settings, siteUrl = DEFAULT_SITE_URL, lastmod = new Date() }) => {
    const merged = resolveSettings(settings);
    const base = trimSlash(siteUrl);
    const date = lastmod.toISOString().slice(0, 10);

    const urls = PUBLIC_PAGES
        .filter((page) => merged.indexingEnabled && !resolvePageMeta(page.path, merged).noindex)
        .map((page) => {
            const loc = page.path === '/' ? `${base}/` : `${base}${page.path}`;
            return [
                '  <url>',
                `    <loc>${escapeHtml(loc)}</loc>`,
                `    <lastmod>${date}</lastmod>`,
                `    <changefreq>${page.changefreq}</changefreq>`,
                `    <priority>${page.priority.toFixed(1)}</priority>`,
                '  </url>',
            ].join('\n');
        });

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls,
        '</urlset>',
        '',
    ].join('\n');
};
