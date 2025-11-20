package com.kushi.consultancy.service;

import java.io.File;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service for sending emails via Gmail SMTP.
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    private final JavaMailSender mailSender;

    @Value("${app.mail.to:}")
    private String defaultRecipient;

    @Value("${app.mail.from:}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send CV submission notification to the default recipient with attachment.
     * This method runs asynchronously to avoid blocking the upload response.
     */
    @Async("taskExecutor")
    public void sendCvNotification(String applicantName, String email, String phone, 
                                     String position, String experience, String location,
                                     File cvFile, String originalFilename) {
        if (defaultRecipient == null || defaultRecipient.isBlank()) {
            logger.warn("Email sending skipped: defaultRecipient is not configured");
            return;
        }
        
        logger.info("Preparing to send CV notification email for: {}", applicantName);
        logger.debug("Email will be sent to: {} with attachment: {}", defaultRecipient, originalFilename);
        
        try {
            var mimeMessage = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            // Use configured Gmail as "from" address for reliable delivery
            if (fromAddress != null && !fromAddress.isBlank()) {
                helper.setFrom(fromAddress);
                logger.debug("Email from address set to: {}", fromAddress);
            }
            
            // Set reply-to as the applicant's email for easy responses
            helper.setReplyTo(email, applicantName);
            logger.debug("Reply-to set to: {} ({})", applicantName, email);
            
            helper.setTo(defaultRecipient);
            helper.setSubject("New CV Submission: " + applicantName + " - " + position);
            
            // Create detailed HTML email body with professional design
            String htmlBody = String.format(
                "<html>" +
                "<head>" +
                "<meta charset='UTF-8'>" +
                "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "</head>" +
                "<body style='margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;'>" +
                "<div style='max-width: 650px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>" +
                
                "<!-- Header Banner -->" +
                "<div style='background: linear-gradient(135deg, #1e88e5 0%%, #1565c0 100%%); padding: 30px 20px; text-align: center;'>" +
                "<div style='display: inline-block; background: rgba(255,255,255,0.2); padding: 12px; border-radius: 50%%; margin-bottom: 10px;'>" +
                "<span style='font-size: 32px;'>📋</span>" +
                "</div>" +
                "<h1 style='color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;'>New CV Submission Received</h1>" +
                "<p style='color: #e3f2fd; margin: 5px 0 0 0; font-size: 14px;'>Kushi Consultancy - Recruitment Portal</p>" +
                "</div>" +
                
                "<!-- Applicant Information Section -->" +
                "<div style='padding: 30px 40px;'>" +
                "<div style='border-left: 4px solid #1e88e5; padding-left: 15px; margin-bottom: 25px;'>" +
                "<h2 style='color: #1e88e5; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;'>Applicant Information</h2>" +
                "</div>" +
                
                "<!-- Info Grid -->" +
                "<table style='width: 100%%; border-collapse: collapse;'>" +
                "<tr>" +
                "<td style='padding: 12px 0; vertical-align: top;'>" +
                "<span style='color: #1e88e5; font-size: 18px; margin-right: 8px;'>👤</span>" +
                "<span style='color: #757575; font-size: 13px; display: inline-block; min-width: 120px;'>Full Name:</span>" +
                "</td>" +
                "<td style='padding: 12px 0; color: #212121; font-weight: 500;'>%s</td>" +
                "</tr>" +
                "<tr>" +
                "<td style='padding: 12px 0; vertical-align: top;'>" +
                "<span style='color: #1e88e5; font-size: 18px; margin-right: 8px;'>✉️</span>" +
                "<span style='color: #757575; font-size: 13px; display: inline-block; min-width: 120px;'>Email:</span>" +
                "</td>" +
                "<td style='padding: 12px 0;'><a href='mailto:%s' style='color: #1e88e5; text-decoration: none;'>%s</a></td>" +
                "</tr>" +
                "<tr>" +
                "<td style='padding: 12px 0; vertical-align: top;'>" +
                "<span style='color: #1e88e5; font-size: 18px; margin-right: 8px;'>📞</span>" +
                "<span style='color: #757575; font-size: 13px; display: inline-block; min-width: 120px;'>Phone:</span>" +
                "</td>" +
                "<td style='padding: 12px 0; color: #212121; font-weight: 500;'>%s</td>" +
                "</tr>" +
                "<tr>" +
                "<td style='padding: 12px 0; vertical-align: top;'>" +
                "<span style='color: #1e88e5; font-size: 18px; margin-right: 8px;'>💼</span>" +
                "<span style='color: #757575; font-size: 13px; display: inline-block; min-width: 120px;'>Position Applied:</span>" +
                "</td>" +
                "<td style='padding: 12px 0; color: #212121; font-weight: 500;'>%s</td>" +
                "</tr>" +
                "<tr>" +
                "<td style='padding: 12px 0; vertical-align: top;'>" +
                "<span style='color: #1e88e5; font-size: 18px; margin-right: 8px;'>⭐</span>" +
                "<span style='color: #757575; font-size: 13px; display: inline-block; min-width: 120px;'>Experience:</span>" +
                "</td>" +
                "<td style='padding: 12px 0; color: #212121; font-weight: 500;'>%s</td>" +
                "</tr>" +
                "<tr>" +
                "<td style='padding: 12px 0; vertical-align: top;'>" +
                "<span style='color: #1e88e5; font-size: 18px; margin-right: 8px;'>📍</span>" +
                "<span style='color: #757575; font-size: 13px; display: inline-block; min-width: 120px;'>Location:</span>" +
                "</td>" +
                "<td style='padding: 12px 0; color: #212121; font-weight: 500;'>%s</td>" +
                "</tr>" +
                "</table>" +
                
                "<!-- Resume Attachment Section -->" +
                "<div style='margin-top: 30px; padding: 20px; background: #f5f5f5; border-radius: 8px; text-align: center;'>" +
                "<div style='color: #90caf9; font-size: 48px; margin-bottom: 10px;'>📄</div>" +
                "<p style='margin: 0; color: #424242; font-weight: 500;'>Resume/CV Attached</p>" +
                "<p style='margin: 5px 0 0 0; color: #757575; font-size: 13px;'>%s</p>" +
                "</div>" +
                
                "<!-- Action Required Notice -->" +
                "<div style='margin-top: 20px; padding: 15px 20px; background: #fff9c4; border-left: 4px solid #fbc02d; border-radius: 4px;'>" +
                "<p style='margin: 0; color: #f57f17; font-size: 14px;'>" +
                "<span style='font-weight: 600;'>⚠️ Action Required:</span> " +
                "Please review the attached CV and contact the candidate within 3-5 business days if their profile matches your requirements." +
                "</p>" +
                "</div>" +
                "</div>" +
                
                "<!-- Footer -->" +
                "<div style='background: #37474f; padding: 25px 40px; text-align: center;'>" +
                "<p style='margin: 0 0 10px 0; color: #ffffff; font-weight: 500; font-size: 14px;'>Kushi Consultancy - Expert Recruitment Services</p>" +
                "<p style='margin: 0; color: #90a4ae; font-size: 12px;'>" +
                "Oil & Gas | Energy | Infrastructure | FMCG" +
                "</p>" +
                "<p style='margin: 10px 0 0 0; color: #78909c; font-size: 11px;'>Submitted on: " + 
                java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("EEEE, MMMM dd, yyyy 'at' hh:mm a")) +
                "</p>" +
                "</div>" +
                
                "</div>" +
                "</body>" +
                "</html>",
                applicantName, email, email, phone, position, experience, location, originalFilename
            );
            
            helper.setText(htmlBody, true);
            
            // Attach the CV file
            if (cvFile != null && cvFile.exists()) {
                logger.debug("Attaching CV file: {} (size: {} bytes)", cvFile.getName(), cvFile.length());
                FileSystemResource fileResource = new FileSystemResource(cvFile);
                helper.addAttachment(originalFilename, fileResource);
            } else {
                logger.warn("CV file does not exist or is null: {}", cvFile);
            }
            
            logger.debug("Sending email via JavaMailSender...");
            mailSender.send(mimeMessage);
            logger.info("Email sent successfully for applicant: {}", applicantName);
        } catch (Exception e) {
            logger.error("Failed to send email for applicant: {} - Error: {}", applicantName, e.getMessage());
            logger.debug("Email error details:", e);
        }
    }

    /**
     * Send a test email to verify SMTP configuration.
     */
    public boolean sendTestEmail(String recipient) {
        logger.info("Sending test email to: {}", recipient);
        try {
            var mimeMessage = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            if (fromAddress != null && !fromAddress.isBlank()) {
                helper.setFrom(fromAddress);
            }
            helper.setTo(recipient);
            helper.setSubject("Kushi Consultancy - Test Email");
            helper.setText(
                "This is a test email from Kushi Consultancy backend.\n\n" +
                "If you received this, Gmail SMTP is configured correctly!", 
                false
            );
            
            mailSender.send(mimeMessage);
            logger.info("Test email sent successfully to: {}", recipient);
            return true;
        } catch (Exception e) {
            logger.error("Failed to send test email to: {}", recipient, e);
            return false;
        }
    }
}
