/**
 * Authentication Routes
 * All authentication-related endpoints
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../utils/validation');
const {
  signup,
  login,
  sendOTP,
  verifyOTP,
  getCurrentUser,
  resendOTP
} = require('../controllers/authController');

/**
 * @route   POST /api/v1/auth/signup
 * @desc    Register new user
 * @access  Public
 */
router.post('/signup', handleValidationErrors, signup);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', handleValidationErrors, login);

/**
 * @route   POST /api/v1/auth/otp/send
 * @desc    Send OTP for email verification
 * @access  Public
 */
router.post('/otp/send', handleValidationErrors, sendOTP);

/**
 * @route   POST /api/v1/auth/otp/verify
 * @desc    Verify OTP
 * @access  Public
 */
router.post('/otp/verify', handleValidationErrors, verifyOTP);

/**
 * @route   POST /api/v1/auth/otp/resend
 * @desc    Resend OTP
 * @access  Public
 */
router.post('/otp/resend', handleValidationErrors, resendOTP);

/**
 * @route   GET /api/v1/auth/user
 * @desc    Get current user
 * @access  Private
 */
router.get('/user', protect, getCurrentUser);

module.exports = router;
