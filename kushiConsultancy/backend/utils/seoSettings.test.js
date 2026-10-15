import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { DEFAULT_SEO_SETTINGS, readSeoSettings, sanitizeSeoSettings, writeSeoSettings } from './seoSettings.js';

test('the default settings pass validation', () => {
  const { value, errors } = sanitizeSeoSettings(DEFAULT_SEO_SETTINGS);
  assert.deepEqual(errors, []);
  assert.deepEqual(value, DEFAULT_SEO_SETTINGS);
});

test('unknown keys are dropped', () => {
  const { value, errors } = sanitizeSeoSettings({ ...DEFAULT_SEO_SETTINGS, adminNote: 'x', pages: {} });
  assert.deepEqual(errors, []);
  assert.equal('adminNote' in value, false);
});

test('keywords can be sent as a comma-separated string', () => {
  const { value, errors } = sanitizeSeoSettings({
    ...DEFAULT_SEO_SETTINGS,
    pages: { '/recruitment': { keywords: ' structural engineer jobs, onshore jobs ,, ' } },
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(value.pages['/recruitment'].keywords, ['structural engineer jobs', 'onshore jobs']);
});

test('invalid input is reported with a message for each problem', () => {
  const { value, errors } = sanitizeSeoSettings({
    ...DEFAULT_SEO_SETTINGS,
    indexingEnabled: 'yes',
    defaultDescription: 'x'.repeat(301),
    contactEmail: 'not-an-email',
    contactPhone: 'call me',
    googleSiteVerification: '<script>',
    ogImagePath: 'javascript:alert(1)',
    pages: { '/../admin': { title: 'x' }, '/about': { noindex: 'maybe' } },
  });
  assert.equal(value, null);
  assert.ok(errors.some((e) => e.includes('indexingEnabled')));
  assert.ok(errors.some((e) => e.includes('defaultDescription')));
  assert.ok(errors.some((e) => e.includes('contactEmail')));
  assert.ok(errors.some((e) => e.includes('contactPhone')));
  assert.ok(errors.some((e) => e.includes('googleSiteVerification')));
  assert.ok(errors.some((e) => e.includes('ogImagePath')));
  assert.ok(errors.some((e) => e.includes('/../admin')));
  assert.ok(errors.some((e) => e.includes('noindex')));
});

test('a non-object body is rejected', () => {
  assert.equal(sanitizeSeoSettings(['nope']).value, null);
  assert.equal(sanitizeSeoSettings(null).value, null);
});

test('settings round-trip through the file store, and a missing file falls back to defaults', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'seo-test-'));
  const previous = process.env.SEO_SETTINGS_PATH;
  process.env.SEO_SETTINGS_PATH = path.join(dir, 'nested', 'seo.json');
  try {
    assert.deepEqual(await readSeoSettings(), DEFAULT_SEO_SETTINGS);

    const updated = { ...DEFAULT_SEO_SETTINGS, indexingEnabled: false, pages: { '/about': { noindex: true } } };
    await writeSeoSettings(updated);
    assert.deepEqual(await readSeoSettings(), updated);
  } finally {
    if (previous === undefined) delete process.env.SEO_SETTINGS_PATH; else process.env.SEO_SETTINGS_PATH = previous;
    await fs.rm(dir, { recursive: true, force: true });
  }
});
