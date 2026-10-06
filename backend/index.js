import 'dotenv/config';
import { logger } from './utils/logger.js';
import app from './app.js';

// Add error handlers for uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const PORT = process.env.PORT || 3001;

const missingConfig = ['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'JWT_SECRET', 'RESEND_API_KEY', 'MAIL_TO_ADDRESS']
  .filter(name => !process.env[name]);
if (missingConfig.length > 0) {
  logger.warn(`Missing environment variables: ${missingConfig.join(', ')}. Related features will not work.`);
}

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
