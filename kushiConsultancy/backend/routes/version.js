import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// GET /api/version - mimic Java build-info endpoint
router.get('/', (req, res) => {
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkgRaw = fs.readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgRaw);
    res.json({
      name: pkg.name,
      version: pkg.version,
      timestamp: new Date().toISOString(),
      epochSeconds: Math.floor(Date.now() / 1000)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Version read failed' });
  }
});

export default router;