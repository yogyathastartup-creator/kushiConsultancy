import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { logger, securityLogger } from '../utils/logger.js';
import { getMongoClient } from '../utils/db.js';

const router = express.Router();

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  skipSuccessfulRequests: false,
  message: 'Too many login attempts, please try again later.',
  handler: (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    securityLogger.logSuspiciousActivity('rate_limit_exceeded', ip, { endpoint: '/api/auth/login' });
    res.status(429).json({
      error: 'Too many attempts',
      message: 'Account temporarily locked due to too many failed login attempts. Please try again in 15 minutes.'
    });
  }
});

// In-memory store for failed login attempts (in production, use Redis or database)
const loginAttempts = new Map();
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Check if account is locked
const isAccountLocked = (username) => {
  const attempts = loginAttempts.get(username);
  if (!attempts) return false;
  
  if (attempts.count >= LOCKOUT_THRESHOLD) {
    const lockoutEnd = attempts.lastAttempt + LOCKOUT_DURATION;
    if (Date.now() < lockoutEnd) {
      return true;
    } else {
      // Lockout expired, reset
      loginAttempts.delete(username);
      return false;
    }
  }
  return false;
};

// Record failed login attempt
const recordFailedAttempt = (username) => {
  const attempts = loginAttempts.get(username) || { count: 0, lastAttempt: 0 };
  attempts.count += 1;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(username, attempts);
};

// Clear failed attempts on successful login
const clearFailedAttempts = (username) => {
  loginAttempts.delete(username);
};

// Login validation
const loginValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

// POST /api/auth/login
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  try {
    // Check if account is locked
    if (isAccountLocked(username)) {
      securityLogger.logAuthAttempt(username, false, ip, 'account_locked');
      return res.status(423).json({
        error: 'Account locked',
        message: 'Too many failed login attempts. Please try again in 15 minutes.'
      });
    }

    // Attempt to load admin credentials from DB; fall back to env variables
    let adminUsername = process.env.ADMIN_USERNAME || 'admin';
    let adminPassword = process.env.ADMIN_PASSWORD || 'kushiadmin123';

    try {
      const client = getMongoClient();
      const db = client.db(process.env.MONGO_DB_NAME || 'kushi_consultancy');
      const adminDoc = await db.collection('admins').findOne({}, { projection: { username: 1, password: 1 } });
      if (adminDoc && adminDoc.username) {
        adminUsername = adminDoc.username;
        // If password stored hashed in DB, you'd compare via bcrypt; for now we accept plain text fallback
        if (adminDoc.password) adminPassword = adminDoc.password;
      }
    } catch (err) {
      // DB not available or error reading admin; continue using env values
      logger.info('Admin credentials not loaded from DB, using env defaults or existing values');
    }

    // Verify username
    if (username !== adminUsername) {
      recordFailedAttempt(username);
      securityLogger.logAuthAttempt(username, false, ip, 'invalid_username');
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid username or password'
      });
    }

    // Verify password (in production, compare hashed password with bcrypt)
    const isValidPassword = password === adminPassword;
    
    if (!isValidPassword) {
      recordFailedAttempt(username);
      securityLogger.logAuthAttempt(username, false, ip, 'invalid_password');
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid username or password'
      });
    }

    // Successful login
    clearFailedAttempts(username);
    securityLogger.logAuthAttempt(username, true, ip);

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Set secure HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 }); // 1 hour
    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        username,
        role: 'admin'
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during login'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const newAccessToken = jwt.sign(
      { username: decoded.username, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    res.json({ success: true, message: 'Token refreshed' });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// GET /api/auth/verify - Verify if user is authenticated
router.get('/verify', (req, res) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    res.json({
      authenticated: true,
      user: {
        username: decoded.username,
        role: decoded.role
      }
    });
  } catch (error) {
    res.status(401).json({ authenticated: false });
  }
});

export default router;
