import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './utils/logger.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import emailRoutes from './routes/email.js';
import versionRoutes from './routes/version.js';

dotenv.config();

// Add error handlers for uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}));

// CSP nonce middleware - TEMPORARILY DISABLED FOR DEBUGGING
// app.use((req, res, next) => {
//   try {
//     const nonce = crypto.randomBytes(16).toString('base64');
//     res.locals.cspNonce = nonce;

//     const directives = [
//       `default-src 'self'`,
//       `script-src 'self' https://cdn.jsdelivr.net 'nonce-${nonce}'`,
//       `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
//       `font-src 'self' data: https://fonts.gstatic.com`,
//       `img-src 'self' data: https:`,
//       `connect-src 'self' https://api.emailjs.com https://kushiconsultancy.onrender.com`,
//       `frame-ancestors 'none'`,
//       `base-uri 'self'`,
//       `form-action 'self'`
//     ].join('; ');

//     res.setHeader('Content-Security-Policy', directives);
//   } catch (e) {
//     logger.warn('Failed to generate CSP nonce', e?.message || e);
//   }
//   next();
// });

// CORS Configuration - Must be before body parsers
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5174', 'http://localhost:4173'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Body Parser & Cookie Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
} else {
  app.use(morgan('dev'));
}

// Global Rate Limiting - Hardened for Vercel
const getRateLimitValue = (envVar, defaultValue) => {
  const value = Number(envVar);
  return isNaN(value) ? defaultValue : value;
};

const globalLimiter = rateLimit({
  windowMs: getRateLimitValue(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  max: getRateLimitValue(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later.'
    });
  }
});
app.use(globalLimiter);

// Health Check Endpoint - Vercel requires a root-level health check
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Health check successful',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/version', versionRoutes);

// Unified health endpoint under /api as in Java backend
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Keep the existing /health route for consistency if needed
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString()
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  const isDev = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack })
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not Found', message: 'Resource not found' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    logger.error(`Server error: ${error.message}`);
    throw error;
  }
});

export default app;