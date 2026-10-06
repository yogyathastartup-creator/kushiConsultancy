import express from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import os from 'os';
import { body, validationResult } from 'express-validator';
import { logger, securityLogger } from '../utils/logger.js';
import { sendCVUploadNotification } from '../utils/emailService.js';
import { scanFile } from '../utils/avScanner.js';

const router = express.Router();

// Use system temp directory for uploads (compatible with Vercel/Serverless)
const UPLOAD_DIR = os.tmpdir();
const ensureUploadDir = async () => {
  // Temp dir always exists, but good to be safe
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    // Should not happen for os.tmpdir(), but fallback just in case
    await fs.mkdir(UPLOAD_DIR, { recursive: true, mode: 0o700 });
  }
};
ensureUploadDir();

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
const hasValidSignature = async (filePath, originalName) => {
  const signatures = FILE_SIGNATURES[path.extname(originalName).toLowerCase()];
  if (!signatures) {
    return false;
  }
  const handle = await fs.open(filePath, 'r');
  try {
    const header = Buffer.alloc(8);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    return signatures.some(sig => bytesRead >= sig.length && header.subarray(0, sig.length).equals(sig));
  } finally {
    await handle.close();
  }
};

// Configure multer for secure file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate cryptographically secure random filename
    const randomName = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedExt = ext.replace(/[^a-z0-9.]/gi, ''); // Remove dangerous characters
    cb(null, `${randomName}${sanitizedExt}`);
  }
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

  // Prevent directory traversal in filename
  if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    securityLogger.logSuspiciousActivity('directory_traversal_attempt', ip, { filename: file.originalname });
    return cb(new Error('Invalid filename'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
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
    .normalizeEmail(),
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
router.post('/cv', (req, res, next) => {
  upload.single('cv')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const ip = req.ip;
      if (err.code === 'LIMIT_FILE_SIZE') {
        securityLogger.logFileUpload('unknown', MAX_FILE_SIZE + 1, ip, false, 'file_too_large');
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
    // Delete uploaded file if validation fails
    if (req.file) {
      await fs.unlink(req.file.path).catch(err => logger.error('Failed to delete file:', err));
    }
    return res.status(400).json({ errors: errors.array() });
  }

  const ip = req.ip;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    if (!(await hasValidSignature(req.file.path, req.file.originalname))) {
      await fs.unlink(req.file.path).catch(err => logger.error('Failed to delete file:', err));
      securityLogger.logFileUpload(req.file.originalname, req.file.size, ip, false, 'content_mismatch');
      return res.status(400).json({
        success: false,
        message: 'The file content does not match a PDF, DOC or DOCX document'
      });
    }

    // AV-scan: run a virus/malware scanner before accepting the file
    const scanResult = await scanFile(req.file.path);
    if (!scanResult || !scanResult.clean) {
      // Delete the uploaded file and reject
      await fs.unlink(req.file.path).catch(err => logger.error('Failed to delete infected file:', err));
      securityLogger.logFileUpload(req.file.originalname, req.file.size, ip, false, 'av_scan_failed');
      return res.status(400).json({ success: false, message: 'Uploaded file failed virus scan' });
    }

    const fileInfo = {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadDate: new Date().toISOString(),
      applicant: {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        position: req.body.position,
        experience: req.body.experience,
        location: req.body.location
      }
    };

    // Keep applicant contact details out of the logs; they are delivered by email only
    logger.info('CV uploaded successfully', {
      storedName: fileInfo.storedName,
      size: fileInfo.size,
      mimeType: fileInfo.mimeType,
      position: fileInfo.applicant.position
    });
    securityLogger.logFileUpload(req.file.originalname, req.file.size, ip, true);

    // Respond immediately; send the notification email in the background so the
    // browser isn't stuck waiting on an SMTP round trip before it hears back.
    res.json({
      success: true,
      message: 'CV uploaded successfully',
      fileId: crypto.createHash('sha256').update(req.file.filename).digest('hex').substring(0, 16)
    });

    sendCVUploadNotification(fileInfo.applicant, req.file.path, req.file.originalname)
      .then((emailResult) => {
        if (!emailResult.success) {
          logger.warn('Email notification failed but upload succeeded', {
            error: emailResult.error,
            position: req.body.position
          });
        }
      })
      .catch((error) => {
        logger.error('Email notification threw unexpectedly', { error: error.message });
      })
      .finally(() => {
        fs.unlink(req.file.path).catch(err => logger.error('Failed to delete file after email send:', err));
      });

  } catch (error) {
    logger.error('Upload processing error:', error);
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(err => logger.error('Failed to delete file:', err));
    }
    res.status(500).json({
      error: 'Upload processing failed',
      message: 'An error occurred while processing your upload'
    });
  }
});

export default router;
