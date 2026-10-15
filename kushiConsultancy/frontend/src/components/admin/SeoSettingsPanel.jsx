import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../../utils/api';
import { DEFAULT_SEO_SETTINGS, PUBLIC_PAGES } from '../../seo/siteConfig';
import '../../styles/SeoSettingsPanel.css';

// Recommended lengths for search results. The server enforces the looser hard limits.
const RECOMMENDED = { title: 60, description: 160 };

const toFormState = (settings) => ({
    ...DEFAULT_SEO_SETTINGS,
    ...settings,
    pages: PUBLIC_PAGES.reduce((acc, page) => {
        const override = settings?.pages?.[page.path] || {};
        acc[page.path] = {
            title: override.title || '',
            description: override.description || '',
            keywords: Array.isArray(override.keywords) ? override.keywords.join(', ') : (override.keywords || ''),
            noindex: Boolean(override.noindex),
        };
        return acc;
    }, {}),
});

// Only send pages that have at least one override, so the stored file stays small.
const toPayload = (form) => ({
    ...form,
    pages: Object.fromEntries(
        Object.entries(form.pages).filter(([, override]) => (
            override.title.trim() || override.description.trim() || override.keywords.trim() || override.noindex
        ))
    ),
});

// Stable, valid HTML id for a page path, e.g. "/about" -> "about", "/" -> "home".
const pageId = (pagePath) => pagePath.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';

const Counter = ({ value, recommended }) => {
    const length = value.length;
    const tooLong = length > recommended;
    return (
        <span className={`seo-counter ${tooLong ? 'seo-counter-warn' : ''}`}>
            {length} / {recommended} recommended characters
        </span>
    );
};

const SeoSettingsPanel = () => {
    const [form, setForm] = useState(() => toFormState(DEFAULT_SEO_SETTINGS));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await fetch(`${getApiUrl()}/seo`, { credentials: 'include' });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                setForm(toFormState(data.settings));
            } catch {
                setStatus({ type: 'error', message: 'Could not load the saved SEO settings. Showing defaults.' });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

    const updatePage = (pagePath, field, value) => setForm((prev) => ({
        ...prev,
        pages: { ...prev.pages, [pagePath]: { ...prev.pages[pagePath], [field]: value } },
    }));

    const handleSave = async () => {
        setSaving(true);
        setStatus(null);
        try {
            const response = await fetch(`${getApiUrl()}/seo`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(toPayload(form)),
            });
            const data = await response.json().catch(() => ({}));

            if (response.status === 401 || response.status === 403) {
                setStatus({ type: 'error', message: 'Your admin session has expired. Log in again to save.' });
            } else if (!response.ok) {
                const details = Array.isArray(data.details) ? ` ${data.details.join(' ')}` : '';
                setStatus({ type: 'error', message: `${data.error || 'Save failed.'}${details}` });
            } else {
                setForm(toFormState(data.settings));
                setStatus({ type: 'success', message: 'SEO settings saved. They appear on the live site after the next site build.' });
            }
        } catch {
            setStatus({ type: 'error', message: 'Could not reach the server. Check your connection and try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="content-editor"><p>Loading SEO settings…</p></div>;
    }

    return (
        <div className="content-editor seo-panel">
            <h3>Search Engine Visibility (SEO)</h3>

            {status && (
                <div className={`seo-status seo-status-${status.type}`} role="status">
                    {status.message}
                </div>
            )}

            <div className="setting-card">
                <div className="setting-header">
                    <div>
                        <h3>🔍 Allow search engines to index the site</h3>
                        <p>Turn off to ask search engines not to index any page (for example, while the site is being rebuilt).</p>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={form.indexingEnabled}
                            onChange={(e) => updateField('indexingEnabled', e.target.checked)}
                        />
                        <span className="slider"></span>
                    </label>
                </div>
            </div>

            <div className="editor-section">
                <h4>🌐 Site-wide defaults</h4>
                <div className="form-group">
                    <label htmlFor="seo-site-name">Site name:</label>
                    <input
                        id="seo-site-name"
                        type="text"
                        className="form-input"
                        value={form.siteName}
                        onChange={(e) => updateField('siteName', e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="seo-default-description">Default description (used when a page has none):</label>
                    <textarea
                        id="seo-default-description"
                        className="form-textarea"
                        rows="3"
                        value={form.defaultDescription}
                        onChange={(e) => updateField('defaultDescription', e.target.value)}
                    />
                    <Counter value={form.defaultDescription} recommended={RECOMMENDED.description} />
                </div>
                <div className="form-group">
                    <label htmlFor="seo-og-image">Social share image (path on this site or full https:// URL):</label>
                    <input
                        id="seo-og-image"
                        type="text"
                        className="form-input"
                        value={form.ogImagePath}
                        onChange={(e) => updateField('ogImagePath', e.target.value)}
                    />
                </div>
            </div>

            <div className="editor-section">
                <h4>📇 Contact details (used in search result data)</h4>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="seo-contact-email">Contact email:</label>
                        <input
                            id="seo-contact-email"
                            type="email"
                            className="form-input"
                            value={form.contactEmail}
                            onChange={(e) => updateField('contactEmail', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="seo-contact-phone">Contact phone:</label>
                        <input
                            id="seo-contact-phone"
                            type="text"
                            className="form-input"
                            value={form.contactPhone}
                            onChange={(e) => updateField('contactPhone', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="editor-section">
                <h4>✅ Search console verification</h4>
                <p className="seo-help">
                    Paste the verification code from Google Search Console or Bing Webmaster Tools. Only the code value is needed, not the whole tag.
                </p>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="seo-google-verification">Google verification code:</label>
                        <input
                            id="seo-google-verification"
                            type="text"
                            className="form-input"
                            value={form.googleSiteVerification}
                            onChange={(e) => updateField('googleSiteVerification', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="seo-bing-verification">Bing verification code:</label>
                        <input
                            id="seo-bing-verification"
                            type="text"
                            className="form-input"
                            value={form.bingSiteVerification}
                            onChange={(e) => updateField('bingSiteVerification', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="editor-section">
                <h4>📄 Per-page titles, descriptions and keywords</h4>
                <p className="seo-help">
                    Leave a field empty to use the built-in text for that page. Keywords are comma-separated; search engines weigh the title, description and page copy far more than keywords.
                </p>
                {PUBLIC_PAGES.map((page) => {
                    const override = form.pages[page.path];
                    const id = pageId(page.path);
                    const titleId = `seo-title-${id}`;
                    const descId = `seo-description-${id}`;
                    const keywordsId = `seo-keywords-${id}`;
                    return (
                        <div key={page.path} className="seo-page-card">
                            <div className="seo-page-header">
                                <strong>{page.path}</strong>
                                <label className="seo-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={override.noindex}
                                        onChange={(e) => updatePage(page.path, 'noindex', e.target.checked)}
                                    />
                                    Hide from search engines
                                </label>
                            </div>
                            <div className="form-group">
                                <label htmlFor={titleId}>Title:</label>
                                <input
                                    id={titleId}
                                    type="text"
                                    className="form-input"
                                    placeholder={page.title}
                                    value={override.title}
                                    onChange={(e) => updatePage(page.path, 'title', e.target.value)}
                                />
                                <Counter value={override.title} recommended={RECOMMENDED.title} />
                            </div>
                            <div className="form-group">
                                <label htmlFor={descId}>Description:</label>
                                <textarea
                                    id={descId}
                                    className="form-textarea"
                                    rows="2"
                                    placeholder={page.description}
                                    value={override.description}
                                    onChange={(e) => updatePage(page.path, 'description', e.target.value)}
                                />
                                <Counter value={override.description} recommended={RECOMMENDED.description} />
                            </div>
                            <div className="form-group">
                                <label htmlFor={keywordsId}>Keywords (comma-separated):</label>
                                <input
                                    id={keywordsId}
                                    type="text"
                                    className="form-input"
                                    placeholder={page.keywords.join(', ')}
                                    value={override.keywords}
                                    onChange={(e) => updatePage(page.path, 'keywords', e.target.value)}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="setting-card seo-info">
                <h4>💡 How this works</h4>
                <ul>
                    <li>Saved settings are stored on the server and applied when the site is built. Trigger a new Netlify deploy after saving.</li>
                    <li>Robots rules and the sitemap are regenerated on every build from these settings.</li>
                    <li>Submit <code>https://kushiconsultancy.com/sitemap.xml</code> in Google Search Console after the first deploy.</li>
                </ul>
            </div>

            <button onClick={handleSave} className="btn-save" disabled={saving}>
                {saving ? 'Saving…' : '💾 Save SEO Settings'}
            </button>
        </div>
    );
};

export default SeoSettingsPanel;
