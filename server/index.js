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

dotenv.config();

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

// Simplified and hardened CORS Configuration for Vercel
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);

// In production, log the origins to help with debugging.
if (process.env.NODE_ENV === 'production') {
  logger.info(`Configured CORS allowed origins: ${JSON.stringify(allowedOrigins)}`);
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests) and requests from allowed origins.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.error(`CORS Error: Origin ${origin} not allowed.`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200, // For legacy browser support
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
  res.status(404).json({ error: 'Not found' });
});

// Start server only when not in a serverless environment (like Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;