/**
 * Reel Model
 * Mongoose schema for short-form video content (Reels)
 */

const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({
  // Reel Owner
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Reel Content
  caption: {
    type: String,
    maxlength: [2200, 'Caption cannot exceed 2200 characters'],
    trim: true
  },
  video: {
    url: {
      type: String,
      required: true
    },
    public_id: String,
    width: Number,
    height: Number,
    duration: {
      type: Number,
      required: true,
      min: [1, 'Video must be at least 1 second'],
      max: [300, 'Video cannot exceed 5 minutes (300 seconds)']
    },
    thumbnail: String,
    format: String,
    size: Number // in bytes
  },

  // Audio/Music
  audio: {
    title: String,
    artist: String,
    url: String,
    public_id: String
  },

  // Location
  location: {
    name: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },

  // Tags and Mentions
  hashtags: [{
    type: String,
    trim: true
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Engagement
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  sharesCount: {
    type: Number,
    default: 0
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  savesCount: {
    type: Number,
    default: 0
  },

  // Privacy and Settings
  isPrivate: {
    type: Boolean,
    default: false
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  allowLikes: {
    type: Boolean,
    default: true
  },
  allowDuets: {
    type: Boolean,
    default: true
  },

  // Reel Features
  isDuet: {
    type: Boolean,
    default: false
  },
  originalReel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reel'
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for comments (populated separately for performance)
reelSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'reel'
});

// Indexes for better performance
reelSchema.index({ user: 1, createdAt: -1 });
reelSchema.index({ createdAt: -1 });
reelSchema.index({ hashtags: 1 });
reelSchema.index({ 'likes.user': 1 });
reelSchema.index({ isActive: 1, isDeleted: 1 });
reelSchema.index({ viewsCount: -1 });

// Pre-save middleware to update counts
reelSchema.pre('save', function(next) {
  this.likesCount = this.likes.length;
  next();
});

// Pre-save middleware to update user reel count
reelSchema.pre('save', async function(next) {
  if (this.isNew) {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(this.user, {
      $inc: { reelsCount: 1 }
    });
  }
  next();
});

// Pre-remove middleware to update user reel count
reelSchema.pre('remove', async function(next) {
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(this.user, {
    $inc: { reelsCount: -1 }
  });
  next();
});

// Instance method to add like
reelSchema.methods.addLike = function(userId) {
  if (!this.likes.some(like => like.user.toString() === userId.toString())) {
    this.likes.push({ user: userId });
    this.likesCount = this.likes.length;
  }
  return this.save();
};

// Instance method to remove like
reelSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  this.likesCount = this.likes.length;
  return this.save();
};

// Instance method to check if user liked
reelSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Instance method to increment views
reelSchema.methods.incrementViews = function() {
  this.viewsCount += 1;
  return this.save();
};

// Static method to get trending reels
reelSchema.statics.getTrendingReels = function(page = 1, limit = 10) {
  return this.find({
    isActive: true,
    isDeleted: false,
    isApproved: true,
    $or: [
      { isPrivate: false },
      { viewsCount: { $gte: 1000 } } // Show popular private reels too
    ]
  })
  .populate('user', 'username fullName avatar isPrivate')
  .populate('mentions', 'username fullName avatar')
  .sort({ viewsCount: -1, likesCount: -1, createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);
};

// Static method to get user reels
reelSchema.statics.getUserReels = function(userId, targetUserId, page = 1, limit = 10) {
  const query = {
    user: targetUserId,
    isActive: true,
    isDeleted: false,
    isApproved: true
  };

  // If viewing someone else's reels, only show public ones
  if (userId.toString() !== targetUserId.toString()) {
    query.isPrivate = false;
  }

  return this.find(query)
  .populate('user', 'username fullName avatar isPrivate')
  .populate('mentions', 'username fullName avatar')
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);
};

// Static method to get reels by hashtag
reelSchema.statics.getReelsByHashtag = function(hashtag, page = 1, limit = 10) {
  return this.find({
    hashtags: { $in: [hashtag] },
    isActive: true,
    isDeleted: false,
    isApproved: true,
    isPrivate: false
  })
  .populate('user', 'username fullName avatar isPrivate')
  .populate('mentions', 'username fullName avatar')
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);
};

module.exports = mongoose.model('Reel', reelSchema);
