#!/usr/bin/env node
import dotenv from 'dotenv';
import { sendTestEmail } from '../utils/emailService.js';
import { logger } from '../utils/logger.js';

dotenv.config();

(async function main() {
  try {
    const res = await sendTestEmail();
    if (res.success) {
      console.log('Test email sent successfully. messageId=', res.messageId);
    } else {
      console.error('Test email failed:', res.error);
    }
  } catch (err) {
    logger.error('sendTestEmail script error', { error: err.message, stack: err.stack });
    console.error('Unexpected error:', err.message);
    process.exitCode = 1;
  }
})();
