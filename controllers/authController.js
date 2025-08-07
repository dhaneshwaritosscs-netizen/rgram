/**
 * Authentication Controller
 * Handles user registration, login, OAuth, and OTP verification
 */

const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateToken, verifyToken } = require('../middleware/authMiddleware');
const { sendOTPEmail, sendWelcomeEmail } = require('../config/email');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate unique username
 * @param {string} baseUsername - Base username
 * @returns {string} Unique username
 */
const generateUniqueUsername = async (baseUsername) => {
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

/**
 * @desc    Register new user
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, fullName, username } = req.body;

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

    // Send welcome email
    sendWelcomeEmail(email, finalUsername);

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
          isVerified: user.isVerified
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
          isVerified: user.isVerified
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send OTP for email verification
 * @route   POST /api/v1/auth/otp/send
 * @access  Public
 */
const sendOTP = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, purpose = 'signup' } = req.body;

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
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP
 * @route   POST /api/v1/auth/otp/verify
 * @access  Public
 */
const verifyOTP = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, code, purpose = 'signup' } = req.body;

    // Verify OTP
    const verification = await OTP.verifyOTP(email, code, purpose);
    
    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    // Handle different purposes
    if (purpose === 'signup') {
      // For signup, just verify the OTP was valid
      res.json({
        success: true,
        message: 'Email verified successfully. You can now complete your registration.',
        data: { email, verified: true }
      });
    } else if (purpose === 'login') {
      // For login, find user and generate token
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const token = generateToken(user._id);
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            avatar: user.avatar,
            isVerified: user.isVerified
          },
          token
        }
      });
    } else if (purpose === 'password_reset') {
      // For password reset, return success to allow password change
      res.json({
        success: true,
        message: 'OTP verified. You can now reset your password.',
        data: { email, verified: true }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user
 * @route   GET /api/v1/auth/user
 * @access  Private
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
          bio: user.bio,
          website: user.website,
          location: user.location,
          isPrivate: user.isPrivate,
          isVerified: user.isVerified,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          postsCount: user.postsCount,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend OTP
 * @route   POST /api/v1/auth/otp/resend
 * @access  Public
 */
const resendOTP = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, purpose = 'signup' } = req.body;

    // Resend OTP
    const otpData = await OTP.resendOTP(email, purpose);
    
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
      message: `OTP resent to ${email}`,
      data: {
        email,
        purpose,
        expiresAt: otpData.expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  sendOTP,
  verifyOTP,
  getCurrentUser,
  resendOTP
};
