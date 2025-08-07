/**
 * Post Model
 * Mongoose schema for user posts
 */

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  // Post Owner
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Post Content
  caption: {
    type: String,
    maxlength: [2200, 'Caption cannot exceed 2200 characters'],
    trim: true
  },
  media: [{
    url: {
      type: String,
      required: true
    },
    public_id: String,
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    width: Number,
    height: Number,
    duration: Number, // for videos
    thumbnail: String // for videos
  }],

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

  // Post Type
  type: {
    type: String,
    enum: ['post', 'story', 'highlight'],
    default: 'post'
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for comments (populated separately for performance)
postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post'
});

// Indexes for better performance
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ 'likes.user': 1 });
postSchema.index({ isActive: 1, isDeleted: 1 });

// Pre-save middleware to update counts
postSchema.pre('save', function(next) {
  // Update likes count
  this.likesCount = this.likes.length;
  next();
});

// Instance method to add like
postSchema.methods.addLike = function(userId) {
  if (!this.likes.some(like => like.user.toString() === userId.toString())) {
    this.likes.push({ user: userId });
    this.likesCount = this.likes.length;
  }
  return this.save();
};

// Instance method to remove like
postSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  this.likesCount = this.likes.length;
  return this.save();
};

// Instance method to check if user liked
postSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Static method to get feed posts
postSchema.statics.getFeedPosts = function(userId, page = 1, limit = 10) {
  return this.find({
    isActive: true,
    isDeleted: false,
    $or: [
      { isPrivate: false },
      { user: userId } // User's own posts
    ]
  })
  .populate('user', 'username fullName avatar isPrivate')
  .populate('mentions', 'username fullName avatar')
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);
};

// Static method to get user posts
postSchema.statics.getUserPosts = function(userId, targetUserId, page = 1, limit = 10) {
  const query = {
    user: targetUserId,
    isActive: true,
    isDeleted: false
  };

  // If viewing someone else's posts, only show public ones
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

module.exports = mongoose.model('Post', postSchema);
