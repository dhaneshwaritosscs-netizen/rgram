import mongoose, { Document, Schema } from 'mongoose';
import speakeasy from 'speakeasy';

export interface IOTP extends Document {
  email: string;
  otp: string;
  purpose: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOTP>({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['signup', 'login', 'password_reset', 'email_verification'],
    default: 'signup',
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
otpSchema.index({ email: 1, purpose: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create OTP
otpSchema.statics.createOTP = async function(email: string, purpose: string = 'signup') {
  // Delete any existing OTP for this email and purpose
  await this.deleteMany({ email, purpose });

  // Generate OTP
  const otp = speakeasy.totp({
    secret: speakeasy.generateSecret({ length: 20 }).base32,
    digits: 6,
    step: 600, // 10 minutes
  });

  // Set expiration (10 minutes from now)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Create OTP record
  const otpRecord = await this.create({
    email,
    otp,
    purpose,
    expiresAt,
  });

  return {
    otp,
    expiresAt,
  };
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function(email: string, code: string, purpose: string = 'signup') {
  const otpRecord = await this.findOne({
    email,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord) {
    return {
      valid: false,
      message: 'OTP not found or expired',
    };
  }

  if (otpRecord.otp !== code) {
    return {
      valid: false,
      message: 'Invalid OTP code',
    };
  }

  // Mark OTP as used
  otpRecord.isUsed = true;
  await otpRecord.save();

  return {
    valid: true,
    message: 'OTP verified successfully',
  };
};

// Static method to resend OTP
otpSchema.statics.resendOTP = async function(email: string, purpose: string = 'signup') {
  // Delete any existing OTP for this email and purpose
  await this.deleteMany({ email, purpose });

  // Generate new OTP
  const otp = speakeasy.totp({
    secret: speakeasy.generateSecret({ length: 20 }).base32,
    digits: 6,
    step: 600, // 10 minutes
  });

  // Set expiration (10 minutes from now)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Create new OTP record
  await this.create({
    email,
    otp,
    purpose,
    expiresAt,
  });

  return {
    otp,
    expiresAt,
  };
};

export default mongoose.models.OTP || mongoose.model<IOTP>('OTP', otpSchema); 