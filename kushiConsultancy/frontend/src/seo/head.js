// Builds the <head> metadata for a route. Pure functions only, so the same logic runs in the
// build-time prerender (serialized to HTML) and in the browser (applied to document.head).
import {
    BRAND_NAME,
    DEFAULT_SEO_SETTINGS,
    DEFAULT_SITE_URL,
    ORGANIZATION,
    findPublicPage,
    normalizePath,
} from './siteConfig.js';

const nonEmpty = (value) => (typeof value === 'string' && value.trim() ? value.trim() : null);

export const resolveSettings = (input = {}) => ({
    ...DEFAULT_SEO_SETTINGS,
    ...input,
    pages: { ...(input.pages || {}) },
});

const toAbsoluteUrl = (value, base) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `${base}${value.startsWith('/') ? '' : '/'}${value}`;
};

export const resolvePageMeta = (pathname, settings) => {
    const path = normalizePath(pathname);
    const page = findPublicPage(path);

    // Unknown routes (for example /admin/*) are never indexed.
    if (!page) {
        return {
            path,
            title: settings.siteName,
            description: settings.defaultDescription,
            keywords: [],
            noindex: true,
        };
    }

    const override = settings.pages[path] || {};
    const keywords = Array.isArray(override.keywords) && override.keywords.length
        ? override.keywords
        : page.keywords;

    return {
        path,
        title: nonEmpty(override.title) || page.title,
        description: nonEmpty(override.description) || page.description,
        keywords,
        noindex: !settings.indexingEnabled || Boolean(override.noindex),
    };
};

// Each entry: `selector` finds the existing element in the DOM, `attrs`/`text` are the values.
// A `null` entry means "not set": the browser removes any leftover element for that selector.
export const buildHeadTags = ({ pathname, settings = DEFAULT_SEO_SETTINGS, siteUrl = DEFAULT_SITE_URL }) => {
    const base = siteUrl.replace(/\/+$/, '');
    const merged = resolveSettings(settings);
    const meta = resolvePageMeta(pathname, merged);
    const canonicalUrl = meta.path === '/' ? `${base}/` : `${base}${meta.path}`;
    const imageUrl = toAbsoluteUrl(merged.ogImagePath, base);
    const metaName = (name, content) => ({ selector: `meta[name="${name}"]`, tag: 'meta', attrs: { name, content } });
    const metaProperty = (property, content) => ({ selector: `meta[property="${property}"]`, tag: 'meta', attrs: { property, content } });
    const verification = (name, code) => ({
        selector: `meta[name="${name}"]`,
        tag: 'meta',
        attrs: nonEmpty(code) ? { name, content: code.trim() } : null,
    });

    const keywords = meta.keywords.join(', ');

    return [
        { selector: 'title', tag: 'title', text: meta.title },
        metaName('description', meta.description),
        { selector: 'meta[name="keywords"]', tag: 'meta', attrs: keywords ? { name: 'keywords', content: keywords } : null },
        metaName('robots', meta.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'),
        { selector: 'link[rel="canonical"]', tag: 'link', attrs: { rel: 'canonical', href: canonicalUrl } },
        metaProperty('og:title', meta.title),
        metaProperty('og:description', meta.description),
        metaProperty('og:url', canonicalUrl),
        metaProperty('og:type', 'website'),
        metaProperty('og:site_name', merged.siteName),
        metaProperty('og:locale', 'en_IN'),
        metaProperty('og:image', imageUrl),
        metaName('twitter:card', 'summary_large_image'),
        metaName('twitter:title', meta.title),
        metaName('twitter:description', meta.description),
        metaName('twitter:image', imageUrl),
        verification('google-site-verification', merged.googleSiteVerification),
        verification('msvalidate.01', merged.bingSiteVerification),
        {
            selector: 'script[type="application/ld+json"][data-seo]',
            tag: 'script',
            attrs: { type: 'application/ld+json', 'data-seo': '' },
            text: buildJsonLd({ base, merged, meta, canonicalUrl }),
        },
        {
            selector: 'script[type="application/json"][id="seo-settings"]',
            tag: 'script',
            attrs: { type: 'application/json', id: 'seo-settings' },
            text: JSON.stringify({ ...merged, siteUrl: base }),
        },
    ];
};

const buildJsonLd = ({ base, merged, meta, canonicalUrl }) => {
    const orgId = `${base}/#organization`;
    const websiteId = `${base}/#website`;
    const graph = [
        {
            '@type': ['Organization', 'EmploymentAgency'],
            '@id': orgId,
            name: merged.siteName,
            alternateName: BRAND_NAME,
            legalName: ORGANIZATION.legalName,
            url: `${base}/`,
            logo: { '@type': 'ImageObject', url: `${base}${ORGANIZATION.logoPath}` },
            description: merged.defaultDescription,
            telephone: merged.contactPhone,
            email: merged.contactEmail,
            address: { '@type': 'PostalAddress', ...ORGANIZATION.address },
            sameAs: ORGANIZATION.sameAs,
        },
        {
            '@type': 'WebSite',
            '@id': websiteId,
            url: `${base}/`,
            name: BRAND_NAME,
            publisher: { '@id': orgId },
            inLanguage: 'en',
        },
        {
            '@type': 'WebPage',
            '@id': `${canonicalUrl}#webpage`,
            url: canonicalUrl,
            name: meta.title,
            description: meta.description,
            isPartOf: { '@id': websiteId },
            about: { '@id': orgId },
            inLanguage: 'en',
        },
    ];
    return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
};

// ---- Server-side serialization (used by scripts/prerender.mjs) ----

export const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Keeps JSON safe inside a <script> element: no raw "<", ">" or "&" can end the block early.
export const safeJsonForScript = (value) => value
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

// Entries with `attrs: null` mean "not set", so they are skipped here.
export const serializeHeadTags = (tags) => tags
    .filter((tag) => tag.attrs !== null)
    .map((tag) => {
        if (tag.tag === 'title') return `<title>${escapeHtml(tag.text)}</title>`;
        if (tag.tag === 'script') {
            const attrs = Object.entries(tag.attrs)
                .map(([key, value]) => (value === '' ? key : `${key}="${escapeHtml(value)}"`))
                .join(' ');
            return `<script ${attrs}>${safeJsonForScript(tag.text)}</script>`;
        }
        const attrs = Object.entries(tag.attrs)
            .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
            .join(' ');
        return `<${tag.tag} ${attrs}>`;
    })
    .join('\n    ');
