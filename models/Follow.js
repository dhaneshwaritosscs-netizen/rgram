/**
 * Follow Model
 * Mongoose schema for user following relationships
 */

const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  // Follower (user who is following)
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Following (user being followed)
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Follow timestamp
  followedAt: {
    type: Date,
    default: Date.now
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure unique follower-following pairs
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Indexes for better performance
followSchema.index({ follower: 1, followedAt: -1 });
followSchema.index({ following: 1, followedAt: -1 });
followSchema.index({ isActive: 1 });

// Pre-save middleware to prevent self-following
followSchema.pre('save', function(next) {
  if (this.follower.toString() === this.following.toString()) {
    return next(new Error('Users cannot follow themselves'));
  }
  next();
});

// Pre-save middleware to update user counts
followSchema.pre('save', async function(next) {
  if (this.isNew) {
    const User = mongoose.model('User');
    
    // Increment follower's following count
    await User.findByIdAndUpdate(this.follower, {
      $inc: { followingCount: 1 }
    });
    
    // Increment following's followers count
    await User.findByIdAndUpdate(this.following, {
      $inc: { followersCount: 1 }
    });
  }
  next();
});

// Pre-remove middleware to update user counts
followSchema.pre('remove', async function(next) {
  const User = mongoose.model('User');
  
  // Decrement follower's following count
  await User.findByIdAndUpdate(this.follower, {
    $inc: { followingCount: -1 }
  });
  
  // Decrement following's followers count
  await User.findByIdAndUpdate(this.following, {
    $inc: { followersCount: -1 }
  });
  next();
});

// Static method to follow a user
followSchema.statics.followUser = function(followerId, followingId) {
  return this.findOneAndUpdate(
    { follower: followerId, following: followingId },
    { isActive: true, followedAt: new Date() },
    { upsert: true, new: true }
  );
};

// Static method to unfollow a user
followSchema.statics.unfollowUser = function(followerId, followingId) {
  return this.findOneAndDelete({ follower: followerId, following: followingId });
};

// Static method to check if user is following another
followSchema.statics.isFollowing = function(followerId, followingId) {
  return this.findOne({
    follower: followerId,
    following: followingId,
    isActive: true
  });
};

// Static method to get user's followers
followSchema.statics.getFollowers = function(userId, page = 1, limit = 20) {
  return this.find({
    following: userId,
    isActive: true
  })
  .populate('follower', 'username fullName avatar bio isPrivate')
  .sort({ followedAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);
};

// Static method to get user's following
followSchema.statics.getFollowing = function(userId, page = 1, limit = 20) {
  return this.find({
    follower: userId,
    isActive: true
  })
  .populate('following', 'username fullName avatar bio isPrivate')
  .sort({ followedAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);
};

// Static method to get mutual followers
followSchema.statics.getMutualFollowers = function(userId1, userId2) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { follower: mongoose.Types.ObjectId(userId1), isActive: true },
          { follower: mongoose.Types.ObjectId(userId2), isActive: true }
        ]
      }
    },
    {
      $group: {
        _id: '$following',
        count: { $sum: 1 }
      }
    },
    {
      $match: { count: 2 }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        _id: '$user._id',
        username: '$user.username',
        fullName: '$user.fullName',
        avatar: '$user.avatar',
        bio: '$user.bio'
      }
    }
  ]);
};

// Static method to get suggested users to follow
followSchema.statics.getSuggestedUsers = function(userId, limit = 10) {
  return this.aggregate([
    // Get users that the current user is not following
    {
      $match: {
        follower: { $ne: mongoose.Types.ObjectId(userId) },
        isActive: true
      }
    },
    // Group by following and count followers
    {
      $group: {
        _id: '$following',
        followersCount: { $sum: 1 }
      }
    },
    // Sort by followers count (most popular first)
    {
      $sort: { followersCount: -1 }
    },
    // Limit results
    {
      $limit: limit
    },
    // Lookup user details
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    // Filter out private accounts and the user themselves
    {
      $match: {
        'user.isPrivate': false,
        'user._id': { $ne: mongoose.Types.ObjectId(userId) }
      }
    },
    // Project final fields
    {
      $project: {
        _id: '$user._id',
        username: '$user.username',
        fullName: '$user.fullName',
        avatar: '$user.avatar',
        bio: '$user.bio',
        followersCount: 1
      }
    }
  ]);
};

module.exports = mongoose.model('Follow', followSchema);
