
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const router = express.Router();

const loginValidation = [
  body('username').trim().notEmpty(),
  body('password').notEmpty()
];

// POST /api/auth/login
router.post('/login', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || '***REDACTED***';

  if (username !== adminUsername) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  let isValidPassword = false;
  if (adminPassword.startsWith('$2')) {
    isValidPassword = bcrypt.compareSync(password, adminPassword);
  } else {
    isValidPassword = password === adminPassword;
  }
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const jwtSecret = process.env.JWT_SECRET || '***REDACTED***';
  const token = jwt.sign({ username, role: 'admin' }, jwtSecret, { expiresIn: '1h' });

  // Set cookie options based on environment
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: isProd, // true in production (HTTPS), false in development
    sameSite: isProd ? 'none' : 'lax', // 'none' for prod, 'lax' for dev
    maxAge: 60 * 60 * 1000 // 1 hour
  });

  res.json({ success: true, message: 'Login successful', user: { username, role: 'admin' } });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  const token = req.cookies.accessToken;
  const jwtSecret = process.env.JWT_SECRET || '***REDACTED***';

  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    res.json({ authenticated: true, user: { username: decoded.username, role: decoded.role } });
  } catch {
    res.status(401).json({ authenticated: false });
  }
});

export default router;
