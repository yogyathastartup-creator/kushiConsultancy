import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { securityLogger } from '../utils/logger.js';

const router = express.Router();

// Brute-force protection: 10 failed attempts per IP per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});

const loginValidation = [
  body('username').isString().trim().notEmpty().isLength({ max: 100 }),
  body('password').isString().notEmpty().isLength({ max: 200 })
];

const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd, // true in production (HTTPS), false in development
    sameSite: isProd ? 'none' : 'lax', // 'none' so the cross-site frontend can send it
    path: '/'
  };
};

// Constant-time comparison so response timing does not reveal how much of a guess matched
const safeEqual = (a, b) => {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
};

const getAuthenticatedUser = (req) => {
  const token = req.cookies?.accessToken;
  const jwtSecret = process.env.JWT_SECRET;
  if (!token || !jwtSecret) {
    return null;
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);
    return decoded.role === 'admin' ? { username: decoded.username, role: decoded.role } : null;
  } catch {
    return null;
  }
};

// Middleware for routes that only the logged-in admin may call
export const requireAdmin = (req, res, next) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  req.user = user;
  next();
};

// POST /api/auth/login
router.post('/login', loginLimiter, loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const { username, password } = req.body;

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;

  if (!adminUsername || !adminPassword || !jwtSecret) {
    console.error('Login rejected: ADMIN_USERNAME, ADMIN_PASSWORD, and JWT_SECRET must all be set in the environment.');
    return res.status(500).json({ error: 'Server is not configured for authentication' });
  }

  const isValidUsername = safeEqual(username, adminUsername);
  const isValidPassword = adminPassword.startsWith('$2')
    ? await bcrypt.compare(password, adminPassword)
    : safeEqual(password, adminPassword);

  if (!isValidUsername || !isValidPassword) {
    securityLogger.logAuthAttempt(username, false, req.ip, 'invalid_credentials');
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  securityLogger.logAuthAttempt(username, true, req.ip);
  const token = jwt.sign({ username, role: 'admin' }, jwtSecret, { expiresIn: '1h' });

  res.cookie('accessToken', token, {
    ...getCookieOptions(),
    maxAge: 60 * 60 * 1000 // 1 hour
  });

  res.json({ success: true, message: 'Login successful', user: { username, role: 'admin' } });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // Browsers only drop the cookie when the attributes match the ones it was set with
  res.clearCookie('accessToken', getCookieOptions());
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({ authenticated: true, user });
});

export default router;
