const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@jobportal.com',
      to,
      subject,
      html
    });

    console.log('✅ Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email sending error:', error);
    throw error;
  }
};

module.exports = sendEmail;
