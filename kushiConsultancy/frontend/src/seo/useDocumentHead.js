import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { buildHeadTags, resolveSettings } from './head.js';
import { DEFAULT_SITE_URL } from './siteConfig.js';

// The prerender embeds the active settings (and site URL) in <script id="seo-settings">.
// Reading them back keeps client-side navigation consistent with the static HTML.
const readEmbeddedSettings = () => {
    try {
        const raw = document.getElementById('seo-settings')?.textContent;
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

const applyHeadTags = (tags) => {
    tags.forEach((tag) => {
        if (tag.tag === 'title') {
            document.title = tag.text;
            return;
        }

        const existing = document.head.querySelector(tag.selector);
        if (tag.attrs === null) {
            existing?.remove();
            return;
        }

        const element = existing || document.createElement(tag.tag);
        Object.entries(tag.attrs).forEach(([name, value]) => element.setAttribute(name, value));
        if (tag.tag === 'script') {
            element.textContent = tag.text;
        }
        if (!existing) {
            document.head.appendChild(element);
        }
    });
};

// Keeps the document title, description, canonical, robots and social tags in sync with the route.
const useDocumentHead = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        const embedded = readEmbeddedSettings();
        const tags = buildHeadTags({
            pathname,
            settings: resolveSettings(embedded),
            siteUrl: embedded.siteUrl || DEFAULT_SITE_URL,
        });
        applyHeadTags(tags);
    }, [pathname]);
};

export default useDocumentHead;
