/**
 * OTP Model
 * Mongoose schema for One-Time Password verification
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');

/**
 * OTP Schema for Email-based verification
 * FREE VERSION - Uses email instead of SMS
 */
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  code: {
    type: String,
    required: [true, 'OTP code is required'],
    minlength: [6, 'OTP code must be at least 6 characters'],
    maxlength: [6, 'OTP code cannot exceed 6 characters']
  },
  purpose: {
    type: String,
    required: [true, 'OTP purpose is required'],
    enum: ['signup', 'login', 'password_reset', 'email_verification'],
    default: 'signup'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      // OTP expires in 10 minutes by default
      return new Date(Date.now() + (parseInt(process.env.OTP_EXPIRE_MINUTES) || 10) * 60 * 1000);
    }
  },
  attempts: {
    type: Number,
    default: 0,
    max: [5, 'Maximum 5 attempts allowed']
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for automatic expiration
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for email and purpose combination
otpSchema.index({ email: 1, purpose: 1 });

// Pre-save middleware to hash OTP code
otpSchema.pre('save', async function(next) {
  if (!this.isModified('code')) return next();
  
  try {
    // Hash the OTP code for security
    this.code = await bcrypt.hash(this.code, 12);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Generate a new OTP code
 * @returns {string} 6-digit OTP code
 */
otpSchema.statics.generateOTP = function() {
  return speakeasy.totp({
    secret: speakeasy.generateSecret().base32,
    digits: 6,
    step: 300, // 5 minutes
    window: 1
  });
};

/**
 * Create a new OTP for email verification
 * @param {string} email - User email
 * @param {string} purpose - Purpose of OTP
 * @returns {Promise<Object>} Created OTP object
 */
otpSchema.statics.createOTP = async function(email, purpose = 'signup') {
  try {
    // Delete any existing OTPs for this email and purpose
    await this.deleteMany({ email, purpose });
    
    // Generate new OTP
    const otpCode = this.generateOTP();
    
    // Create new OTP record
    const otp = new this({
      email,
      code: otpCode,
      purpose,
      expiresAt: new Date(Date.now() + (parseInt(process.env.OTP_EXPIRE_MINUTES) || 10) * 60 * 1000)
    });
    
    await otp.save();
    
    // Return the plain OTP code for sending via email
    return {
      otp: otpCode,
      expiresAt: otp.expiresAt,
      purpose: otp.purpose
    };
  } catch (error) {
    throw new Error(`Failed to create OTP: ${error.message}`);
  }
};

/**
 * Verify OTP code
 * @param {string} email - User email
 * @param {string} code - OTP code to verify
 * @param {string} purpose - Purpose of OTP
 * @returns {Promise<boolean>} Verification result
 */
otpSchema.statics.verifyOTP = async function(email, code, purpose = 'signup') {
  try {
    const otp = await this.findOne({ 
      email, 
      purpose, 
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!otp) {
      return { valid: false, message: 'Invalid or expired OTP' };
    }
    
    // Check attempts
    if (otp.attempts >= 5) {
      return { valid: false, message: 'Too many attempts. Please request a new OTP.' };
    }
    
    // Increment attempts
    otp.attempts += 1;
    await otp.save();
    
    // Verify the code
    const isValid = await bcrypt.compare(code, otp.code);
    
    if (isValid) {
      // Mark as used
      otp.isUsed = true;
      await otp.save();
      
      return { valid: true, message: 'OTP verified successfully' };
    } else {
      return { valid: false, message: 'Invalid OTP code' };
    }
  } catch (error) {
    throw new Error(`OTP verification failed: ${error.message}`);
  }
};

/**
 * Resend OTP
 * @param {string} email - User email
 * @param {string} purpose - Purpose of OTP
 * @returns {Promise<Object>} New OTP object
 */
otpSchema.statics.resendOTP = async function(email, purpose = 'signup') {
  try {
    // Check if there's a recent OTP (within 1 minute)
    const recentOTP = await this.findOne({
      email,
      purpose,
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
    });
    
    if (recentOTP) {
      throw new Error('Please wait at least 1 minute before requesting a new OTP');
    }
    
    // Create new OTP
    return await this.createOTP(email, purpose);
  } catch (error) {
    throw new Error(`Failed to resend OTP: ${error.message}`);
  }
};

/**
 * Get OTP info without revealing the code
 * @param {string} email - User email
 * @param {string} purpose - Purpose of OTP
 * @returns {Promise<Object>} OTP info
 */
otpSchema.statics.getOTPInfo = async function(email, purpose = 'signup') {
  try {
    const otp = await this.findOne({ email, purpose, isUsed: false });
    
    if (!otp) {
      return null;
    }
    
    return {
      email: otp.email,
      purpose: otp.purpose,
      expiresAt: otp.expiresAt,
      attempts: otp.attempts,
      createdAt: otp.createdAt
    };
  } catch (error) {
    throw new Error(`Failed to get OTP info: ${error.message}`);
  }
};

/**
 * Clean up expired OTPs
 * @returns {Promise<number>} Number of deleted OTPs
 */
otpSchema.statics.cleanupExpiredOTPs = async function() {
  try {
    const result = await this.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    return result.deletedCount;
  } catch (error) {
    throw new Error(`Failed to cleanup expired OTPs: ${error.message}`);
  }
};

module.exports = mongoose.model('OTP', otpSchema);
