import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mirrors DEFAULT_SEO_SETTINGS in frontend/src/seo/siteConfig.js. Used when nothing has been saved yet.
export const DEFAULT_SEO_SETTINGS = Object.freeze({
  indexingEnabled: true,
  siteName: 'Kushi Civil and Structural Consultancy',
  defaultDescription: 'Kushi Consultancy hires structural engineers and engineering talent for EPC/EPCM projects, onshore and offshore, in India and abroad. Browse openings and upload your CV.',
  ogImagePath: '/constructionimg.jpg',
  googleSiteVerification: '',
  bingSiteVerification: '',
  contactEmail: 'madhu@kushiconsultancy.com',
  contactPhone: '+91-96770-54461',
  pages: {},
});

const LIMITS = {
  siteName: 120,
  defaultDescription: 300,
  ogImagePath: 300,
  verification: 200,
  email: 254,
  phone: 40,
  pageTitle: 120,
  pageDescription: 320,
  keyword: 60,
  keywordsPerPage: 15,
  pageOverrides: 50,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+0-9()\s-]*$/;
const VERIFICATION_PATTERN = /^[A-Za-z0-9_-]*$/;
const PAGE_PATH_PATTERN = /^\/[a-z0-9/-]*$/;

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// Returns a cleaned copy of the input plus a list of human-readable problems.
// Unknown keys are dropped so the stored file only ever contains the fields we use.
export const sanitizeSeoSettings = (input) => {
  const errors = [];
  if (!isPlainObject(input)) {
    return { value: null, errors: ['Body must be a JSON object'] };
  }

  const text = (field, max, { required = false } = {}) => {
    const raw = input[field];
    if (raw === undefined || raw === null) {
      if (required) errors.push(`${field} is required`);
      return '';
    }
    if (typeof raw !== 'string') {
      errors.push(`${field} must be a string`);
      return '';
    }
    const trimmed = raw.trim();
    if (required && !trimmed) errors.push(`${field} is required`);
    if (trimmed.length > max) errors.push(`${field} must be ${max} characters or fewer`);
    return trimmed;
  };

  const indexingEnabled = input.indexingEnabled === undefined ? DEFAULT_SEO_SETTINGS.indexingEnabled : input.indexingEnabled;
  if (typeof indexingEnabled !== 'boolean') errors.push('indexingEnabled must be true or false');

  const siteName = text('siteName', LIMITS.siteName, { required: true });
  const defaultDescription = text('defaultDescription', LIMITS.defaultDescription, { required: true });
  const ogImagePath = text('ogImagePath', LIMITS.ogImagePath, { required: true });
  if (ogImagePath && !/^(\/|https:\/\/)/.test(ogImagePath)) {
    errors.push('ogImagePath must start with "/" or "https://"');
  }

  const verification = (field) => {
    const value = text(field, LIMITS.verification);
    if (value && !VERIFICATION_PATTERN.test(value)) errors.push(`${field} may only contain letters, numbers, "-" and "_"`);
    return value;
  };
  const googleSiteVerification = verification('googleSiteVerification');
  const bingSiteVerification = verification('bingSiteVerification');

  const contactEmail = text('contactEmail', LIMITS.email, { required: true });
  if (contactEmail && !EMAIL_PATTERN.test(contactEmail)) errors.push('contactEmail is not a valid email address');

  const contactPhone = text('contactPhone', LIMITS.phone);
  if (contactPhone && !PHONE_PATTERN.test(contactPhone)) errors.push('contactPhone may only contain digits, spaces, "+", "-" and parentheses');

  const pages = {};
  const rawPages = input.pages ?? {};
  if (!isPlainObject(rawPages)) {
    errors.push('pages must be an object keyed by path');
  } else if (Object.keys(rawPages).length > LIMITS.pageOverrides) {
    errors.push(`pages can contain at most ${LIMITS.pageOverrides} entries`);
  } else {
    for (const [pagePath, override] of Object.entries(rawPages)) {
      if (!PAGE_PATH_PATTERN.test(pagePath) || pagePath.length > 100) {
        errors.push(`page path "${pagePath}" is not a valid site path`);
        continue;
      }
      if (!isPlainObject(override)) {
        errors.push(`pages["${pagePath}"] must be an object`);
        continue;
      }
      pages[pagePath] = sanitizePageOverride(pagePath, override, errors);
    }
  }

  if (errors.length) return { value: null, errors };

  return {
    value: {
      indexingEnabled,
      siteName,
      defaultDescription,
      ogImagePath,
      googleSiteVerification,
      bingSiteVerification,
      contactEmail,
      contactPhone,
      pages,
    },
    errors: [],
  };
};

const sanitizePageOverride = (pagePath, override, errors) => {
  const result = {};

  const title = typeof override.title === 'string' ? override.title.trim() : '';
  if (title.length > LIMITS.pageTitle) errors.push(`pages["${pagePath}"].title must be ${LIMITS.pageTitle} characters or fewer`);
  if (title) result.title = title;

  const description = typeof override.description === 'string' ? override.description.trim() : '';
  if (description.length > LIMITS.pageDescription) errors.push(`pages["${pagePath}"].description must be ${LIMITS.pageDescription} characters or fewer`);
  if (description) result.description = description;

  // Accept either an array or a comma-separated string from the admin form.
  const rawKeywords = Array.isArray(override.keywords)
    ? override.keywords
    : typeof override.keywords === 'string' ? override.keywords.split(',') : [];
  const keywords = rawKeywords
    .map((keyword) => (typeof keyword === 'string' ? keyword.trim() : ''))
    .filter(Boolean);
  if (keywords.length > LIMITS.keywordsPerPage) errors.push(`pages["${pagePath}"] can have at most ${LIMITS.keywordsPerPage} keywords`);
  if (keywords.some((keyword) => keyword.length > LIMITS.keyword)) errors.push(`pages["${pagePath}"] keywords must be ${LIMITS.keyword} characters or fewer`);
  if (keywords.length) result.keywords = keywords;

  if (override.noindex !== undefined) {
    if (typeof override.noindex !== 'boolean') errors.push(`pages["${pagePath}"].noindex must be true or false`);
    else result.noindex = override.noindex;
  }

  return result;
};

export const seoSettingsPath = () => process.env.SEO_SETTINGS_PATH
  || path.join(__dirname, '..', 'data', 'seo-settings.json');

// Missing or unreadable files fall back to defaults so the public site keeps working.
export const readSeoSettings = async () => {
  try {
    const raw = await fs.readFile(seoSettingsPath(), 'utf8');
    const { value, errors } = sanitizeSeoSettings({ ...DEFAULT_SEO_SETTINGS, ...JSON.parse(raw) });
    if (errors.length) {
      console.error('Stored SEO settings are invalid, using defaults:', errors.join('; '));
      return { ...DEFAULT_SEO_SETTINGS };
    }
    return value;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Could not read SEO settings, using defaults:', error.message);
    }
    return { ...DEFAULT_SEO_SETTINGS };
  }
};

// Write to a temp file and rename, so a crash mid-write never leaves a truncated settings file.
export const writeSeoSettings = async (settings) => {
  const target = seoSettingsPath();
  await fs.mkdir(path.dirname(target), { recursive: true });
  const tempPath = `${target}.${process.pid}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
  await fs.rename(tempPath, target);
};
