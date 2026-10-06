import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { logger } from './utils/logger.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import emailRoutes from './routes/email.js';
import versionRoutes from './routes/version.js';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5174',
  'https://kushiconsultancy.com',
  'https://www.kushiconsultancy.com',
  'https://inspiring-dolphin-fd2ca1.netlify.app'
];

// CORS_ORIGINS (comma-separated) is merged with the defaults so a new frontend
// domain can be allowed from the hosting dashboard without a code change.
export const getAllowedOrigins = () => {
  const fromEnv = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...fromEnv])];
};

const getRateLimitValue = (envVar, defaultValue) => {
  const value = Number(envVar);
  return envVar === undefined || isNaN(value) ? defaultValue : value;
};

const app = express();

// Render (and most PaaS hosts) sit behind a reverse proxy and set X-Forwarded-For.
// Without this, express-rate-limit throws on every request trying to read req.ip,
// which is caught by the unhandledRejection handler and crashes the process.
app.set('trust proxy', 1);

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

// CORS Configuration - Must be before body parsers
const allowedOrigins = getAllowedOrigins();
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      const error = new Error('Not allowed by CORS');
      error.status = 403;
      callback(error);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Body Parser & Cookie Parser (CV files go through multer, so JSON bodies stay small)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
} else if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

const globalLimiter = rateLimit({
  windowMs: getRateLimitValue(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  max: getRateLimitValue(process.env.RATE_LIMIT_MAX_REQUESTS, 1000),
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

// Root health check (used by the hosting provider's health probe)
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

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not Found', message: 'Resource not found' });
});

// Error Handling Middleware (Express identifies it by its four arguments)
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    logger.error(`Error: ${err.message}`, {
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip
    });
  } else {
    logger.warn(`Request rejected: ${err.message}`, { url: req.url, method: req.method, ip: req.ip });
  }

  const isDev = process.env.NODE_ENV !== 'production';
  res.status(status).json({
    error: status < 500 || isDev ? err.message : 'Internal server error',
    ...(isDev && status >= 500 && { stack: err.stack })
  });
});

export default app;
