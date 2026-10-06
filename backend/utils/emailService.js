import { Resend } from 'resend';
import { promises as fs } from 'fs';
import { logger } from './logger.js';

// Resend delivers over HTTPS (port 443), which avoids the outbound SMTP port
// blocks/timeouts that many cheap hosting providers (e.g. Render) impose to
// prevent their platform being used as a spam relay.
let cachedClient = null;

const getClient = () => {
    if (cachedClient) {
        return cachedClient;
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        const msg = 'RESEND_API_KEY is not set. Configure it in your hosting provider\'s environment variables.';
        logger.error(msg);
        throw new Error(msg);
    }

    cachedClient = new Resend(apiKey);
    return cachedClient;
};

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Applicant fields come straight from a public form, so never put them into HTML unescaped
export const escapeHtml = (value) =>
    String(value ?? '').replace(/[&<>"']/g, char => HTML_ESCAPES[char]);

const getFromAddress = () =>
    process.env.MAIL_FROM_ADDRESS || process.env.EMAIL_FROM || 'noreply@kushiconsultancy.com';

const getToAddress = () =>
    process.env.MAIL_TO_ADDRESS || process.env.EMAIL_TO || process.env.EMAIL_USER;

/**
 * Send CV upload notification email
 */
export const sendCVUploadNotification = async (applicantData, filePath, originalFileName) => {
    try {
        const resend = getClient();
        const to = getToAddress();
        if (!to) {
            const msg = 'No recipient configured. Set MAIL_TO_ADDRESS (or EMAIL_TO / EMAIL_USER).';
            logger.error(msg);
            return { success: false, error: msg };
        }

        const safe = Object.fromEntries(
            Object.entries(applicantData).map(([key, value]) => [key, escapeHtml(value)])
        );
        const safeFileName = escapeHtml(originalFileName);

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
                <span class="info-value">${safe.name}</span>
            </div>

            <div class="info-row">
                <span class="info-label">📧 Email:</span>
                <span class="info-value"><a href="mailto:${safe.email}">${safe.email}</a></span>
            </div>

            <div class="info-row">
                <span class="info-label">📱 Phone:</span>
                <span class="info-value"><a href="tel:${safe.phone}">${safe.phone}</a></span>
            </div>

            <div class="info-row">
                <span class="info-label">💼 Position Applied:</span>
                <span class="info-value">${safe.position}</span>
            </div>

            <div class="info-row">
                <span class="info-label">⏱️ Experience:</span>
                <span class="info-value">${safe.experience}</span>
            </div>

            <div class="info-row">
                <span class="info-label">📍 Location:</span>
                <span class="info-value">${safe.location}</span>
            </div>
        </div>

        <div class="file-info">
            <div class="file-icon">📄</div>
            <strong>Resume/CV Attached</strong><br>
            <span style="color: #666; font-size: 14px;">${safeFileName}</span>
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

        const fileBuffer = await fs.readFile(filePath);

        const { data, error } = await resend.emails.send({
            from: `Kushi Consultancy Portal <${getFromAddress()}>`,
            to,
            subject: `New CV Submission: ${applicantData.name} - ${applicantData.position}`.replace(/[\r\n]+/g, ' '),
            html: emailTemplate,
            attachments: [
                {
                    filename: originalFileName,
                    content: fileBuffer,
                },
            ],
        });

        if (error) {
            throw new Error(error.message || JSON.stringify(error));
        }

        logger.info('CV notification email sent successfully', {
            messageId: data?.id,
            recipient: to,
            position: applicantData.position
        });
        return { success: true, messageId: data?.id };
    } catch (error) {
        logger.error('Failed to send CV notification email', {
            error: error.message,
            stack: error.stack,
            position: applicantData.position
        });
        // Don't throw error - log it but continue
        return { success: false, error: error.message };
    }
};

/**
 * Send a simple test email to verify Resend configuration
 */
export const sendTestEmail = async () => {
    try {
        const resend = getClient();
        const to = getToAddress();
        if (!to) {
            const msg = 'No recipient configured for test email. Set MAIL_TO_ADDRESS (or EMAIL_TO / EMAIL_USER).';
            logger.error(msg);
            return { success: false, error: msg };
        }

        const html = `
            <div style="font-family: Arial, sans-serif; line-height:1.6">
                <h2>Resend Test Email ✅</h2>
                <p>This is a test email from the Kushi Consultancy server to verify your Resend configuration.</p>
                <ul>
                    <li><strong>From</strong>: ${getFromAddress()}</li>
                    <li><strong>Environment</strong>: ${process.env.NODE_ENV || 'development'}</li>
                </ul>
                <p style="color:#555;font-size:12px">Timestamp: ${new Date().toISOString()}</p>
            </div>`;

        const { data, error } = await resend.emails.send({
            from: `Kushi Consultancy Portal <${getFromAddress()}>`,
            to,
            subject: 'Kushi Consultancy | Resend test email',
            html,
        });

        if (error) {
            throw new Error(error.message || JSON.stringify(error));
        }

        logger.info('Test email sent successfully', { messageId: data?.id, recipient: to });
        return { success: true, messageId: data?.id };
    } catch (error) {
        logger.error('Failed to send test email', { error: error.message, stack: error.stack });
        return { success: false, error: error.message };
    }
};
