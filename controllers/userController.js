/**
 * User Controller
 * Handles user profile management, following/followers, and avatar uploads
 */

const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Follow = require('../models/Follow');
const SavedPost = require('../models/SavedPost');
const { generateFileUrl, deleteFile } = require('../config/upload');
const { validationResult } = require('express-validator');
const path = require('path');

/**
 * @desc    Get user by ID
 * @route   GET /api/v1/user/:id
 * @access  Public
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const user = await User.findById(id)
      .select('-password -email -phone -isActive -lastLogin');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if current user is following this user
    let isFollowing = false;
    if (req.user) {
      const follow = await Follow.findOne({
        follower: req.user.id,
        following: id
      });
      isFollowing = !!follow;
    }

    // Get user's posts
    const posts = await Post.find({ user: id, isPrivate: false })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('user', 'username fullName avatar');

    res.json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          isFollowing
        },
        posts
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Edit user profile
 * @route   PUT /api/v1/user/:id/edit
 * @access  Private
 */
const editProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { fullName, username, bio, website, location, isPrivate } = req.body;

    // Check if user exists and is the owner
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this profile'
      });
    }

    // Check if username is already taken (if changed)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        fullName,
        username,
        bio,
        website,
        location,
        isPrivate
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload/change avatar
 * @route   PUT /api/v1/user/:id/avatar
 * @access  Private
 */
const uploadAvatar = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user exists and is the owner
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to change this avatar'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    // Delete old avatar if exists
    if (user.avatar && user.avatar.url) {
      const oldAvatarPath = path.join(__dirname, '..', 'uploads', 'avatars', path.basename(user.avatar.url));
      deleteFile(oldAvatarPath);
    }

    // Generate new avatar URL
    const avatarUrl = generateFileUrl(req.file.filename, 'avatars', req.protocol + '://' + req.get('host'));

    // Update user avatar
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        avatar: {
          url: avatarUrl,
          filename: req.file.filename
        }
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user followers
 * @route   GET /api/v1/user/:id/followers
 * @access  Public
 */
const getFollowers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const followers = await Follow.find({ following: id })
      .populate('follower', 'username fullName avatar bio')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: {
        followers: followers.map(f => f.follower),
        total: user.followersCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user following
 * @route   GET /api/v1/user/:id/following
 * @access  Public
 */
const getFollowing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const following = await Follow.find({ follower: id })
      .populate('following', 'username fullName avatar bio')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: {
        following: following.map(f => f.following),
        total: user.followingCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Follow a user
 * @route   POST /api/v1/user/:id/follow
 * @access  Private
 */
const followUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const followerId = req.user.id;

    // Check if user exists
    const userToFollow = await User.findById(id);
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if trying to follow self
    if (followerId === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: id
    });

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user'
      });
    }

    // Create follow relationship
    await Follow.create({
      follower: followerId,
      following: id
    });

    res.json({
      success: true,
      message: 'User followed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unfollow a user
 * @route   POST /api/v1/user/:id/unfollow
 * @access  Private
 */
const unfollowUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const followerId = req.user.id;

    // Check if user exists
    const userToUnfollow = await User.findById(id);
    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if following
    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: id
    });

    if (!existingFollow) {
      return res.status(400).json({
        success: false,
        message: 'Not following this user'
      });
    }

    // Remove follow relationship
    await Follow.findByIdAndDelete(existingFollow._id);

    res.json({
      success: true,
      message: 'User unfollowed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get saved posts
 * @route   GET /api/v1/user/:id/saved
 * @access  Private
 */
const getSavedPosts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if user exists and is the owner
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view saved posts'
      });
    }

    const savedPosts = await SavedPost.find({ user: id })
      .populate({
        path: 'content',
        populate: {
          path: 'user',
          select: 'username fullName avatar'
        }
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: {
        savedPosts: savedPosts.map(sp => sp.content)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get suggested users to follow
 * @route   GET /api/v1/user/suggested
 * @access  Private
 */
const getSuggestedUsers = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.id;

    // Get users that the current user is not following
    const following = await Follow.find({ follower: userId }).select('following');
    const followingIds = following.map(f => f.following);

    // Get suggested users (excluding self and already following)
    const suggestedUsers = await User.find({
      _id: { $nin: [userId, ...followingIds] },
      isPrivate: false
    })
      .select('username fullName avatar bio followersCount')
      .sort({ followersCount: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        suggestedUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/v1/user/:id
 * @access  Private
 */
const deleteAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user exists and is the owner
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this account'
      });
    }

    // Delete user's posts and their media files
    const posts = await Post.find({ user: id });
    for (const post of posts) {
      if (post.media && post.media.length > 0) {
        for (const media of post.media) {
          if (media.filename) {
            const mediaPath = path.join(__dirname, '..', 'uploads', 'images', media.filename);
            deleteFile(mediaPath);
          }
        }
      }
    }
    await Post.deleteMany({ user: id });

    // Delete user's reels and their media files
    const reels = await Reel.find({ user: id });
    for (const reel of reels) {
      if (reel.video && reel.video.filename) {
        const videoPath = path.join(__dirname, '..', 'uploads', 'videos', reel.video.filename);
        deleteFile(videoPath);
      }
    }
    await Reel.deleteMany({ user: id });

    // Delete user's avatar
    if (user.avatar && user.avatar.filename) {
      const avatarPath = path.join(__dirname, '..', 'uploads', 'avatars', user.avatar.filename);
      deleteFile(avatarPath);
    }

    // Delete related data
    await Follow.deleteMany({ $or: [{ follower: id }, { following: id }] });
    await SavedPost.deleteMany({ user: id });
    await SavedPost.deleteMany({ 'content.user': id });

    // Delete user
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserById,
  editProfile,
  uploadAvatar,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  getSavedPosts,
  getSuggestedUsers,
  deleteAccount
};
