import express from 'express';
import rateLimit from 'express-rate-limit';
import { sendTestEmail } from '../utils/emailService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Rate limit to avoid abuse
const testEmailLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/email/test - trigger a test email
router.get('/test', testEmailLimiter, async (req, res) => {
  try {
    const result = await sendTestEmail();
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }
    res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    logger.error('Test email endpoint error', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to send test email' });
  }
});

export default router;
