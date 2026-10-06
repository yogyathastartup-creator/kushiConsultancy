import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, '../logs');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'kushi-consultancy' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write security audit logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, 'rejections.log') })
  ]
});

// Always log to the console: hosts like Render only show stdout/stderr, and their
// filesystem is wiped on every deploy, so the log files above are not durable there.
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.Console({ format: logFormat }));
} else if (process.env.NODE_ENV !== 'test') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Create security audit logger
const securityLogger = {
  logAuthAttempt: (username, success, ip, reason = '') => {
    logger.warn('Authentication attempt', {
      event: 'auth_attempt',
      username,
      success,
      ip,
      reason,
      timestamp: new Date().toISOString()
    });
  },
  logFileUpload: (filename, size, ip, success, reason = '') => {
    logger.info('File upload', {
      event: 'file_upload',
      filename,
      size,
      ip,
      success,
      reason,
      timestamp: new Date().toISOString()
    });
  },
  logSuspiciousActivity: (activity, ip, details = {}) => {
    logger.warn('Suspicious activity detected', {
      event: 'suspicious_activity',
      activity,
      ip,
      ...details,
      timestamp: new Date().toISOString()
    });
  }
};

export { logger, securityLogger };
