const nodemailer = require('nodemailer');

/**
 * Email Configuration for R-GRAM
 * Uses Gmail SMTP (FREE) with App Password
 */

// Create transporter for Gmail
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use App Password, not regular password
    },
  });
};

/**
 * Send OTP email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} purpose - Purpose of OTP (login, signup, etc.)
 */
const sendOTPEmail = async (email, otp, purpose = 'verification') => {
  try {
    const transporter = createTransporter();
    
    const subject = `R-GRAM ${purpose.charAt(0).toUpperCase() + purpose.slice(1)} Code`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">R-GRAM</h1>
          <p style="color: white; margin: 10px 0 0 0;">Spiritual Social Media Platform</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Your Verification Code</h2>
          <p style="color: #666; margin-bottom: 20px;">
            Use this code to complete your ${purpose} on R-GRAM:
          </p>
          
          <div style="background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This code will expire in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.
          </p>
          
          <p style="color: #666; font-size: 14px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
        
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 12px;">
            © 2024 R-GRAM. All rights reserved.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@rgram.com',
      to: email,
      subject: subject,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

/**
 * Send welcome email
 * @param {string} email - Recipient email
 * @param {string} username - Username
 */
const sendWelcomeEmail = async (email, username) => {
  try {
    const transporter = createTransporter();
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">R-GRAM</h1>
          <p style="color: white; margin: 10px 0 0 0;">Welcome to Spiritual Social Media</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome to R-GRAM, ${username}! 🙏</h2>
          <p style="color: #666; margin-bottom: 20px;">
            Thank you for joining our spiritual community. Connect with like-minded souls, 
            share your spiritual journey, and discover inspiring content.
          </p>
          
          <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">What you can do on R-GRAM:</h3>
            <ul style="color: #666;">
              <li>Share spiritual posts and reels</li>
              <li>Connect with spiritual communities</li>
              <li>Discover inspiring content</li>
              <li>Engage in meaningful discussions</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Start your spiritual journey today! 🌟
          </p>
        </div>
        
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 12px;">
            © 2024 R-GRAM. All rights reserved.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@rgram.com',
      to: email,
      subject: 'Welcome to R-GRAM - Your Spiritual Journey Begins!',
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
  createTransporter,
};
