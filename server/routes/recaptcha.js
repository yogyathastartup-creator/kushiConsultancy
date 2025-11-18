import express from 'express';
const router = express.Router();

// POST /api/recaptcha/verify
// Body: { token: string }
router.post('/verify', async (req, res) => {
  const token = req.body.token;
  if (!token) return res.status(400).json({ success: false, error: 'No token provided' });

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return res.status(400).json({ success: false, error: 'Recaptcha not configured' });

  try {
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);

    const resp = await fetch(verifyUrl, { method: 'POST', body: params });
    const data = await resp.json();
    // data.success, score, action, etc.
    return res.json({ success: !!data.success, score: data.score, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err?.message || err });
  }
});

export default router;
