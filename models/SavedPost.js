/**
 * SavedPost Model
 * Mongoose schema for saved posts and reels
 */

const mongoose = require('mongoose');

const savedPostSchema = new mongoose.Schema({
  // User who saved the content
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Saved content (either post or reel)
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  reel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reel'
  },

  // Collection name (optional)
  collection: {
    type: String,
    maxlength: [50, 'Collection name cannot exceed 50 characters'],
    default: 'All Posts'
  },

  // Saved at timestamp
  savedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure either post or reel is provided, but not both
savedPostSchema.pre('save', function(next) {
  if (!this.post && !this.reel) {
    return next(new Error('Either post or reel must be provided'));
  }
  if (this.post && this.reel) {
    return next(new Error('Cannot save both post and reel in the same record'));
  }
  next();
});

// Indexes for better performance
savedPostSchema.index({ user: 1, savedAt: -1 });
savedPostSchema.index({ user: 1, post: 1 }, { unique: true, sparse: true });
savedPostSchema.index({ user: 1, reel: 1 }, { unique: true, sparse: true });
savedPostSchema.index({ user: 1, collection: 1 });

// Static method to get user's saved content
savedPostSchema.statics.getUserSavedContent = function(userId, page = 1, limit = 20, collection = null) {
  const query = { user: userId };
  
  if (collection && collection !== 'All Posts') {
    query.collection = collection;
  }

  return this.find(query)
  .populate('post', 'caption media user createdAt likesCount commentsCount')
  .populate('reel', 'caption video user createdAt likesCount commentsCount viewsCount')
  .populate('post.user', 'username fullName avatar')
  .populate('reel.user', 'username fullName avatar')
  .sort({ savedAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);
};

// Static method to get user's collections
savedPostSchema.statics.getUserCollections = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$collection', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

// Static method to check if content is saved
savedPostSchema.statics.isSaved = function(userId, postId = null, reelId = null) {
  const query = { user: userId };
  
  if (postId) {
    query.post = postId;
  } else if (reelId) {
    query.reel = reelId;
  }

  return this.findOne(query);
};

// Static method to save content
savedPostSchema.statics.saveContent = function(userId, postId = null, reelId = null, collection = 'All Posts') {
  const saveData = {
    user: userId,
    collection
  };

  if (postId) {
    saveData.post = postId;
  } else if (reelId) {
    saveData.reel = reelId;
  }

  return this.create(saveData);
};

// Static method to unsave content
savedPostSchema.statics.unsaveContent = function(userId, postId = null, reelId = null) {
  const query = { user: userId };
  
  if (postId) {
    query.post = postId;
  } else if (reelId) {
    query.reel = reelId;
  }

  return this.findOneAndDelete(query);
};

module.exports = mongoose.model('SavedPost', savedPostSchema);
