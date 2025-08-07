import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/database';
import User from '../../../lib/models/User';
import { generateToken } from '../../../lib/middleware/auth';
import { sendWelcomeEmail } from '../../../lib/utils/email';

/**
 * Generate unique username
 */
const generateUniqueUsername = async (baseUsername: string): Promise<string> => {
  if (!baseUsername || typeof baseUsername !== 'string') {
    baseUsername = 'user';
  }
  let username = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
  let counter = 1;
  let finalUsername = username;

  while (await User.findOne({ username: finalUsername })) {
    finalUsername = `${username}${counter}`;
    counter++;
  }

  return finalUsername;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { email, password, fullName, username } = req.body;

    // Validation
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and full name are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Generate unique username if not provided
    const finalUsername = username ? await generateUniqueUsername(username) : await generateUniqueUsername(fullName);

    // Create user
    const user = await User.create({
      email,
      password,
      fullName,
      username: finalUsername
    });

    // Generate JWT token
    const token = generateToken(user._id);

    // Send welcome email (optional)
    try {
      await sendWelcomeEmail(email, finalUsername);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified
        },
        token
      }
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 