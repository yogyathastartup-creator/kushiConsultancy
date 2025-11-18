import nodemailer from 'nodemailer';
import { logger } from './logger.js';

// Create reusable transporter
const createTransporter = () => {
    // If custom SMTP is configured, use it; otherwise fall back to Gmail service
    // Custom SMTP is recommended for domain mailboxes (e.g., GoDaddy, Zoho, Office 365)
    if (process.env.EMAIL_HOST) {
        const port = parseInt(process.env.EMAIL_PORT || '587', 10);
        const secure = process.env.EMAIL_SECURE === 'true' || port === 465;

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port,
            secure, // true for 465, false for 587/STARTTLS
            auth: {
                user: process.env.EMAIL_USER,
                pass: (process.env.EMAIL_PASSWORD || '').replace(/\s+/g, ''),
            },
        });
    }

    // Gmail fallback (requires App Password with 2FA enabled)
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'yogyatha.startup@gmail.com',
            pass: (process.env.EMAIL_PASSWORD || '').replace(/\s+/g, ''),
        },
    });
};

/**
 * Send CV upload notification email
 */
export const sendCVUploadNotification = async (applicantData, filePath, originalFileName) => {
  try {
    const transporter = createTransporter();
    
    const emailTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New CV Submission</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #0073b1 0%, #005582 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            background: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
            border-top: none;
        }
        .info-section {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            border-left: 4px solid #0073b1;
        }
        .info-row {
            margin: 12px 0;
            display: flex;
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: bold;
            color: #0073b1;
            min-width: 150px;
        }
        .info-value {
            color: #333;
        }
        .file-info {
            background: #e8f4f8;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
            text-align: center;
        }
        .file-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .footer {
            background: #333;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 8px 8px;
            font-size: 14px;
        }
        .timestamp {
            color: #666;
            font-size: 12px;
            text-align: right;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📧 New CV Submission Received</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Kushi Consultancy - Recruitment Portal</p>
    </div>
    
    <div class="content">
        <div class="info-section">
            <h2 style="color: #0073b1; margin-top: 0;">Applicant Information</h2>
            
            <div class="info-row">
                <span class="info-label">👤 Full Name:</span>
                <span class="info-value">${applicantData.name}</span>
            </div>
            
            <div class="info-row">
                <span class="info-label">📧 Email:</span>
                <span class="info-value"><a href="mailto:${applicantData.email}">${applicantData.email}</a></span>
            </div>
            
            <div class="info-row">
                <span class="info-label">📱 Phone:</span>
                <span class="info-value"><a href="tel:${applicantData.phone}">${applicantData.phone}</a></span>
            </div>
            
            <div class="info-row">
                <span class="info-label">💼 Position Applied:</span>
                <span class="info-value">${applicantData.position}</span>
            </div>
            
            <div class="info-row">
                <span class="info-label">⏱️ Experience:</span>
                <span class="info-value">${applicantData.experience}</span>
            </div>
            
            <div class="info-row">
                <span class="info-label">📍 Location:</span>
                <span class="info-value">${applicantData.location}</span>
            </div>
        </div>
        
        <div class="file-info">
            <div class="file-icon">📄</div>
            <strong>Resume/CV Attached</strong><br>
            <span style="color: #666; font-size: 14px;">${originalFileName}</span>
        </div>
        
        <p style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 4px; margin: 20px 0;">
            <strong>⚠️ Action Required:</strong> Please review the attached CV and contact the candidate within 3-5 business days if their profile matches your requirements.
        </p>
        
        <div class="timestamp">
            Submitted on: ${new Date().toLocaleString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
        </div>
    </div>
    
    <div class="footer">
        <p style="margin: 0;">Kushi Consultancy - Expert Recruitment Services</p>
        <p style="margin: 10px 0 0 0; font-size: 12px;">Oil & Gas | Energy | Infrastructure | FMCG</p>
    </div>
</body>
</html>
    `;

        const mailOptions = {
            from: {
                name: 'Kushi Consultancy Portal',
                address: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@kushiconsultancy.com',
            },
            // support comma-separated recipients if provided
            to: process.env.EMAIL_TO || process.env.EMAIL_USER || 'madhu@kushiconsultancy.com',
            subject: `New CV Submission: ${applicantData.name} - ${applicantData.position}`,
            html: emailTemplate,
            attachments: [
                {
                    filename: originalFileName,
                    path: filePath,
                },
            ],
        };

    const info = await transporter.sendMail(mailOptions);
    logger.info('CV notification email sent successfully', {
      messageId: info.messageId,
            recipient: mailOptions.to,
      applicant: applicantData.name
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send CV notification email', {
      error: error.message,
      stack: error.stack,
      applicant: applicantData.name
    });
    
    // Don't throw error - log it but continue
    return { success: false, error: error.message };
  }
};

/**
 * Send a simple test email to verify SMTP configuration
 */
export const sendTestEmail = async () => {
    try {
        const transporter = createTransporter();
        const to = process.env.EMAIL_TO || process.env.EMAIL_USER;

        const html = `
            <div style="font-family: Arial, sans-serif; line-height:1.6">
                <h2>SMTP Test Email ✅</h2>
                <p>This is a test email from the Kushi Consultancy server to verify your SMTP settings.</p>
                <ul>
                    <li><strong>Host</strong>: ${process.env.EMAIL_HOST || 'gmail (service)'}</li>
                    <li><strong>Port</strong>: ${process.env.EMAIL_PORT || 'default'}</li>
                    <li><strong>Secure</strong>: ${process.env.EMAIL_SECURE || 'auto'}</li>
                    <li><strong>Environment</strong>: ${process.env.NODE_ENV || 'development'}</li>
                </ul>
                <p style="color:#555;font-size:12px">Timestamp: ${new Date().toISOString()}</p>
            </div>`;

        const mailOptions = {
            from: {
                name: 'Kushi Consultancy Portal',
                address: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@kushiconsultancy.com',
            },
            to,
            subject: 'Kushi Consultancy | SMTP test email',
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info('Test email sent successfully', { messageId: info.messageId, recipient: to });
        return { success: true, messageId: info.messageId };
    } catch (error) {
        logger.error('Failed to send test email', { error: error.message, stack: error.stack });
        return { success: false, error: error.message };
    }
};
