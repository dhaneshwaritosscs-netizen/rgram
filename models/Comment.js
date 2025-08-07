/**
 * Comment Model
 * Mongoose schema for post comments
 */

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  // Comment Owner
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Post Reference
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },

  // Comment Content
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    trim: true
  },

  // Parent Comment (for replies)
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },

  // Mentions in comment
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
  repliesCount: {
    type: Number,
    default: 0
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

// Virtual for replies
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment'
});

// Indexes for better performance
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ 'likes.user': 1 });
commentSchema.index({ isActive: 1, isDeleted: 1 });

// Pre-save middleware to update counts
commentSchema.pre('save', function(next) {
  this.likesCount = this.likes.length;
  next();
});

// Pre-save middleware to update post comment count
commentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Post = mongoose.model('Post');
    await Post.findByIdAndUpdate(this.post, {
      $inc: { commentsCount: 1 }
    });
  }
  next();
});

// Pre-remove middleware to update post comment count
commentSchema.pre('remove', async function(next) {
  const Post = mongoose.model('Post');
  await Post.findByIdAndUpdate(this.post, {
    $inc: { commentsCount: -1 }
  });
  next();
});

// Instance method to add like
commentSchema.methods.addLike = function(userId) {
  if (!this.likes.some(like => like.user.toString() === userId.toString())) {
    this.likes.push({ user: userId });
    this.likesCount = this.likes.length;
  }
  return this.save();
};

// Instance method to remove like
commentSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  this.likesCount = this.likes.length;
  return this.save();
};

// Instance method to check if user liked
commentSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Static method to get post comments
commentSchema.statics.getPostComments = function(postId, page = 1, limit = 20) {
  return this.find({
    post: postId,
    parentComment: null, // Only top-level comments
    isActive: true,
    isDeleted: false
  })
  .populate('user', 'username fullName avatar')
  .populate('mentions', 'username fullName avatar')
  .populate({
    path: 'replies',
    match: { isActive: true, isDeleted: false },
    populate: {
      path: 'user',
      select: 'username fullName avatar'
    },
    options: { sort: { createdAt: 1 } }
  })
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);
};

// Static method to get comment replies
commentSchema.statics.getCommentReplies = function(commentId, page = 1, limit = 10) {
  return this.find({
    parentComment: commentId,
    isActive: true,
    isDeleted: false
  })
  .populate('user', 'username fullName avatar')
  .populate('mentions', 'username fullName avatar')
  .sort({ createdAt: 1 })
  .skip((page - 1) * limit)
  .limit(limit);
};

module.exports = mongoose.model('Comment', commentSchema);
