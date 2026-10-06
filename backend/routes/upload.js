import express from 'express';
import multer from 'multer';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { logger, securityLogger } from '../utils/logger.js';
import { sendCVUploadNotification, sendApplicantConfirmation } from '../utils/emailService.js';
import { scanFile } from '../utils/avScanner.js';

const router = express.Router();

// File validation settings
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = (process.env.ALLOWED_FILE_TYPES ||
  'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  .split(',');

// Leading bytes of each allowed format: PDF, legacy Word (OLE2), and DOCX (ZIP)
const FILE_SIGNATURES = {
  '.pdf': [Buffer.from('%PDF')],
  '.doc': [Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])],
  '.docx': [Buffer.from([0x50, 0x4b, 0x03, 0x04])]
};

// The browser-supplied MIME type and extension are attacker controlled, so
// confirm the file content actually starts like the format it claims to be.
const hasValidSignature = (buffer, originalName) => {
  const signatures = FILE_SIGNATURES[path.extname(originalName).toLowerCase()];
  if (!signatures) {
    return false;
  }
  return signatures.some(sig => buffer.length >= sig.length && buffer.subarray(0, sig.length).equals(sig));
};

// Each submission emails the applicant a confirmation, so limit how often one
// IP can submit to stop the form being used to send mail to arbitrary people.
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many applications from this network. Please try again later.' }
});

const fileFilter = (req, file, cb) => {
  const ip = req.ip;

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    securityLogger.logFileUpload(file.originalname, 0, ip, false, 'invalid_mime_type');
    return cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  if (!allowedExtensions.includes(ext)) {
    securityLogger.logFileUpload(file.originalname, 0, ip, false, 'invalid_extension');
    return cb(new Error('Invalid file extension. Allowed: PDF, DOC, DOCX'), false);
  }

  // Reject path-like filenames (the name is reused as the email attachment name)
  if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    securityLogger.logSuspiciousActivity('directory_traversal_attempt', ip, { filename: file.originalname });
    return cb(new Error('Invalid filename'), false);
  }

  cb(null, true);
};

// CVs are held in memory only long enough to email them; nothing is written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1 // Only one file at a time
  }
});

// Input validation for upload metadata
const uploadValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name too long')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name contains invalid characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone is required')
    .matches(/^[+\d\s()-]+$/).withMessage('Invalid phone format')
    .isLength({ min: 10, max: 20 }).withMessage('Phone number invalid'),
  body('position')
    .trim()
    .notEmpty().withMessage('Position is required')
    .isLength({ max: 100 }).withMessage('Position too long'),
  body('experience')
    .trim()
    .notEmpty().withMessage('Experience is required')
    .isLength({ max: 50 }).withMessage('Experience too long'),
  body('location')
    .trim()
    .notEmpty().withMessage('Location is required')
    .isLength({ max: 100 }).withMessage('Location too long')
];

// POST /api/upload/cv
router.post('/cv', uploadLimiter, (req, res, next) => {
  upload.single('cv')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        securityLogger.logFileUpload('unknown', MAX_FILE_SIZE + 1, req.ip, false, 'file_too_large');
        return res.status(400).json({
          error: 'File too large',
          message: `Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        });
      }
      logger.error('Multer error:', err);
      return res.status(400).json({ error: 'File upload error', message: err.message });
    } else if (err) {
      logger.error('Upload error:', err);
      return res.status(400).json({ error: 'Upload failed', message: err.message });
    }
    next();
  });
}, uploadValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const ip = req.ip;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { buffer, originalname, size, mimetype } = req.file;

  try {
    if (!hasValidSignature(buffer, originalname)) {
      securityLogger.logFileUpload(originalname, size, ip, false, 'content_mismatch');
      return res.status(400).json({
        success: false,
        message: 'The file content does not match a PDF, DOC or DOCX document'
      });
    }

    // AV-scan: run a virus/malware scanner before accepting the file
    const scanResult = await scanFile(buffer);
    if (!scanResult || !scanResult.clean) {
      securityLogger.logFileUpload(originalname, size, ip, false, 'av_scan_failed');
      return res.status(400).json({ success: false, message: 'Uploaded file failed virus scan' });
    }

    const applicant = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      position: req.body.position,
      experience: req.body.experience,
      location: req.body.location
    };

    // The notification email is the only copy of the CV, so wait for it: if it
    // fails the applicant is told to retry instead of the CV being silently lost.
    const notification = await sendCVUploadNotification(applicant, buffer, originalname);
    if (!notification.success) {
      logger.error('CV notification email failed', { error: notification.error, position: applicant.position });
      return res.status(502).json({
        success: false,
        message: 'We could not submit your application right now. Please try again in a few minutes or email your CV to us directly.'
      });
    }

    // Keep applicant contact details out of the logs; they are delivered by email only
    logger.info('CV submitted and emailed', { size, mimeType: mimetype, position: applicant.position });
    securityLogger.logFileUpload(originalname, size, ip, true);

    res.json({
      success: true,
      message: 'Application submitted successfully. A confirmation email is on its way.'
    });

    // The confirmation is a courtesy, so it is sent after responding and a
    // failure here does not affect the (already delivered) application.
    sendApplicantConfirmation(applicant)
      .then((result) => {
        if (!result.success) {
          logger.warn('Applicant confirmation email failed', { error: result.error, position: applicant.position });
        }
      })
      .catch((error) => {
        logger.error('Applicant confirmation email threw unexpectedly', { error: error.message });
      });
  } catch (error) {
    logger.error('Upload processing error:', error);
    res.status(500).json({
      error: 'Upload processing failed',
      message: 'An error occurred while processing your upload'
    });
  }
});

export default router;
