/**
 * Search Controller
 * Handles user search and content exploration
 */

const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Search users
 * @route   GET /api/v1/search/users
 * @access  Private
 */
const searchUsers = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  const userId = req.user._id;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const searchQuery = {
    $or: [
      { username: { $regex: q, $options: 'i' } },
      { fullName: { $regex: q, $options: 'i' } },
      { bio: { $regex: q, $options: 'i' } }
    ],
    _id: { $ne: userId }, // Exclude current user
    isActive: true
  };

  const users = await User.find(searchQuery)
    .select('username fullName avatar bio isPrivate followersCount')
    .sort({ followersCount: -1, username: 1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: {
      users,
      query: q,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: users.length === parseInt(limit)
      }
    }
  });
});

/**
 * @desc    Explore posts
 * @route   GET /api/v1/explore
 * @access  Private
 */
const explorePosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user._id;

  // Get posts from users the current user is not following
  const following = await require('../models/Follow').find({ follower: userId }).select('following');
  const followingIds = following.map(f => f.following);

  const posts = await Post.find({
    user: { $nin: [...followingIds, userId] },
    isPrivate: false,
    isActive: true,
    isDeleted: false
  })
  .populate('user', 'username fullName avatar isPrivate')
  .populate('mentions', 'username fullName avatar')
  .sort({ likesCount: -1, commentsCount: -1, createdAt: -1 })
  .skip((parseInt(page) - 1) * parseInt(limit))
  .limit(parseInt(limit));

  // Add like status for each post
  const postsWithLikeStatus = posts.map(post => {
    const postObj = post.toObject();
    postObj.isLiked = post.isLikedBy(userId);
    return postObj;
  });

  res.json({
    success: true,
    data: {
      posts: postsWithLikeStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit)
      }
    }
  });
});

/**
 * @desc    Search posts by hashtag
 * @route   GET /api/v1/search/posts/hashtag/:hashtag
 * @access  Public
 */
const searchPostsByHashtag = asyncHandler(async (req, res) => {
  const { hashtag } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user?._id;

  const posts = await Post.find({
    hashtags: { $in: [hashtag] },
    isPrivate: false,
    isActive: true,
    isDeleted: false
  })
  .populate('user', 'username fullName avatar isPrivate')
  .populate('mentions', 'username fullName avatar')
  .sort({ likesCount: -1, commentsCount: -1, createdAt: -1 })
  .skip((parseInt(page) - 1) * parseInt(limit))
  .limit(parseInt(limit));

  // Add like status for each post
  const postsWithLikeStatus = posts.map(post => {
    const postObj = post.toObject();
    if (userId) {
      postObj.isLiked = post.isLikedBy(userId);
    }
    return postObj;
  });

  res.json({
    success: true,
    data: {
      posts: postsWithLikeStatus,
      hashtag,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit)
      }
    }
  });
});

/**
 * @desc    Search posts by location
 * @route   GET /api/v1/search/posts/location
 * @access  Public
 */
const searchPostsByLocation = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 10, page = 1, limit = 10 } = req.query;
  const userId = req.user?._id;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required'
    });
  }

  const posts = await Post.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
      }
    },
    isPrivate: false,
    isActive: true,
    isDeleted: false
  })
  .populate('user', 'username fullName avatar isPrivate')
  .populate('mentions', 'username fullName avatar')
  .sort({ createdAt: -1 })
  .skip((parseInt(page) - 1) * parseInt(limit))
  .limit(parseInt(limit));

  // Add like status for each post
  const postsWithLikeStatus = posts.map(post => {
    const postObj = post.toObject();
    if (userId) {
      postObj.isLiked = post.isLikedBy(userId);
    }
    return postObj;
  });

  res.json({
    success: true,
    data: {
      posts: postsWithLikeStatus,
      location: { lat: parseFloat(lat), lng: parseFloat(lng), radius: parseFloat(radius) },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit)
      }
    }
  });
});

/**
 * @desc    Get trending hashtags
 * @route   GET /api/v1/search/trending-hashtags
 * @access  Public
 */
const getTrendingHashtags = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const hashtags = await Post.aggregate([
    {
      $match: {
        isActive: true,
        isDeleted: false,
        isPrivate: false
      }
    },
    {
      $unwind: '$hashtags'
    },
    {
      $group: {
        _id: '$hashtags',
        count: { $sum: 1 },
        recentPosts: { $sum: { $cond: [{ $gte: ['$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] }, 1, 0] } }
      }
    },
    {
      $sort: { recentPosts: -1, count: -1 }
    },
    {
      $limit: parseInt(limit)
    },
    {
      $project: {
        hashtag: '$_id',
        count: 1,
        recentPosts: 1
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      hashtags
    }
  });
});

/**
 * @desc    Get suggested users
 * @route   GET /api/v1/search/suggested-users
 * @access  Private
 */
const getSuggestedUsers = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const userId = req.user._id;

  const Follow = require('../models/Follow');
  const suggestedUsers = await Follow.getSuggestedUsers(userId, parseInt(limit));

  res.json({
    success: true,
    data: {
      suggestedUsers
    }
  });
});

module.exports = {
  searchUsers,
  explorePosts,
  searchPostsByHashtag,
  searchPostsByLocation,
  getTrendingHashtags,
  getSuggestedUsers
};
