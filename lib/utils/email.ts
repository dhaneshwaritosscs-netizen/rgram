import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send OTP email
 */
export const sendOTPEmail = async (
  email: string,
  otp: string,
  purpose: string = 'signup'
): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const subject = {
      signup: 'Verify Your Email - R-GRAM',
      login: 'Login OTP - R-GRAM',
      password_reset: 'Password Reset OTP - R-GRAM',
    }[purpose] || 'OTP - R-GRAM';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">R-GRAM</h1>
          <p style="color: white; margin: 10px 0 0 0;">Spiritual & Religious Social Media</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">${subject}</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Your verification code is:
          </p>
          
          <div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #667eea; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 14px;">
              Best regards,<br>
              The R-GRAM Team
            </p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"R-GRAM" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (
  email: string,
  username: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">R-GRAM</h1>
          <p style="color: white; margin: 10px 0 0 0;">Spiritual & Religious Social Media</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome to R-GRAM! 🙏</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Hello <strong>${username}</strong>,
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            Welcome to R-GRAM! We're excited to have you join our community of spiritual and religious content creators and seekers.
          </p>
          
          <div style="background: #fff; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">What you can do on R-GRAM:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>Share spiritual insights and religious content</li>
              <li>Connect with like-minded individuals</li>
              <li>Discover inspiring posts and reels</li>
              <li>Build a community around your faith</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">
              Start Exploring
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            If you have any questions or need help getting started, feel free to reach out to our support team.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 14px;">
              Best regards,<br>
              The R-GRAM Team
            </p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"R-GRAM" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to R-GRAM! 🙏',
      html,
    });

    return true;
  } catch (error) {
    console.error('Welcome email sending error:', error);
    return false;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">R-GRAM</h1>
          <p style="color: white; margin: 10px 0 0 0;">Password Reset Request</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
          
          <p style="color: #666; line-height: 1.6;">
            You requested to reset your password. Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            If you didn't request this password reset, please ignore this email. This link will expire in 1 hour.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 14px;">
              Best regards,<br>
              The R-GRAM Team
            </p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"R-GRAM" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password - R-GRAM',
      html,
    });

    return true;
  } catch (error) {
    console.error('Password reset email sending error:', error);
    return false;
  }
}; 