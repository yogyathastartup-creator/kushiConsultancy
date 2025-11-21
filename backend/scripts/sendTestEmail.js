import nodemailer from 'nodemailer';

async function sendTestEmail() {
  // Replace these with your SMTP server details
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Gmail SMTP
    port: 587,
    secure: false,
    auth: {
      user: 'kushi.yogyatha@gmail.com',
      pass: '***REDACTED***'
    }
  });

  try {
    const info = await transporter.sendMail({
      from: 'kushi.yogyatha@gmail.com',
      to: 'kushi.yogyatha@gmail.com',
      subject: 'Test Email from Node.js',
      text: 'Hello! This is a test email sent from Node.js using nodemailer.'
    });
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

sendTestEmail();

