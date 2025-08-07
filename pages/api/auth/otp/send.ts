import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../../lib/database';
import User from '../../../../lib/models/User';
import OTP from '../../../../lib/models/OTP';
import { sendOTPEmail } from '../../../../lib/utils/email';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { email, purpose = 'signup' } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists for login/password reset
    if (purpose === 'login' || purpose === 'password_reset') {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    }

    // Check if user already exists for signup
    if (purpose === 'signup') {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
    }

    // Create and send OTP
    const otpData = await OTP.createOTP(email, purpose);
    
    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otpData.otp, purpose);
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email'
      });
    }

    res.json({
      success: true,
      message: `OTP sent to ${email}`,
      data: {
        email,
        purpose,
        expiresAt: otpData.expiresAt
      }
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 