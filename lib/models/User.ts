import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  phone?: string;
  password: string;
  fullName: string;
  bio?: string;
  avatar: {
    url: string;
    public_id?: string;
  };
  website?: string;
  location?: string;
  googleId?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isPrivate: boolean;
  isActive: boolean;
  role: 'user' | 'moderator' | 'admin';
  followersCount: number;
  followingCount: number;
  postsCount: number;
  reelsCount: number;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getPublicProfile(): any;
  profileUrl: string;
}

const userSchema = new Schema<IUser>({
  // Basic Information
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },

  // Profile Information
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [50, 'Full name cannot exceed 50 characters']
  },
  bio: {
    type: String,
    maxlength: [150, 'Bio cannot exceed 150 characters'],
    default: ''
  },
  avatar: {
    url: {
      type: String,
      default: 'https://res.cloudinary.com/your-cloud/image/upload/v1/rgram/defaults/default-avatar.png'
    },
    public_id: String
  },
  website: {
    type: String,
    match: [/^https?:\/\/.+/, 'Please enter a valid URL']
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },

  // Social Media Integration
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },

  // Account Settings
  isPrivate: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },

  // Statistics
  followersCount: {
    type: Number,
    default: 0
  },
  followingCount: {
    type: Number,
    default: 0
  },
  postsCount: {
    type: Number,
    default: 0
  },
  reelsCount: {
    type: Number,
    default: 0
  },

  // Timestamps
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full profile URL
userSchema.virtual('profileUrl').get(function() {
  return `/api/user/${this._id}`;
});

// Indexes for better performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  
  // Remove sensitive fields
  delete userObject.password;
  delete userObject.googleId;
  delete userObject.isEmailVerified;
  delete userObject.isPhoneVerified;
  delete userObject.role;
  delete userObject.isActive;
  delete userObject.lastActive;
  
  return userObject;
};

// Static method to find user by email or username
userSchema.statics.findByEmailOrUsername = function(identifier: string) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  });
};

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema); 