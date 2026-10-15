import express from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { readSeoSettings, sanitizeSeoSettings, writeSeoSettings } from '../utils/seoSettings.js';

const router = express.Router();

// GET /api/seo - public. The static build reads this to render titles, meta tags and robots.txt.
router.get('/', async (req, res) => {
  const settings = await readSeoSettings();
  res.set('Cache-Control', 'no-store');
  res.json({ settings });
});

// PUT /api/seo - admin only. Changes take effect the next time the site is built.
router.put('/', requireAdmin, async (req, res) => {
  const { value, errors } = sanitizeSeoSettings(req.body);
  if (errors.length) {
    return res.status(400).json({ error: 'Invalid SEO settings', details: errors });
  }

  await writeSeoSettings(value);
  return res.json({ success: true, settings: value });
});

export default router;
