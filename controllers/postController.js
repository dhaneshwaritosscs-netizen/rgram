/**
 * Post Controller
 * Handles post creation, likes, comments, sharing, and saving
 */

const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const SavedPost = require('../models/SavedPost');
const Follow = require('../models/Follow');
const { generateFileUrl, deleteFile } = require('../config/upload');
const { validationResult } = require('express-validator');
const path = require('path');

/**
 * @desc    Create new post
 * @route   POST /api/v1/post/create
 * @access  Private
 */
const createPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { caption, location, tags, isPrivate } = req.body;
    const userId = req.user.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image'
      });
    }

    // Process uploaded files
    const media = req.files.map(file => {
      const mediaUrl = generateFileUrl(file.filename, 'images', req.protocol + '://' + req.get('host'));
      return {
        url: mediaUrl,
        filename: file.filename,
        type: file.mimetype,
        size: file.size
      };
    });

    // Create post
    const post = await Post.create({
      user: userId,
      caption,
      media,
      location,
      tags: tags ? JSON.parse(tags) : [],
      isPrivate: isPrivate === 'true'
    });

    // Populate user info
    await post.populate('user', 'username fullName avatar');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        post
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all posts (feed)
 * @route   GET /api/v1/post/all
 * @access  Private
 */
const getAllPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    // Get users that the current user is following
    const following = await Follow.find({ follower: userId }).select('following');
    const followingIds = following.map(f => f.following);

    // Get posts from followed users and public posts from others
    const posts = await Post.find({
      $or: [
        { user: { $in: followingIds } },
        { user: userId },
        { isPrivate: false }
      ]
    })
      .populate('user', 'username fullName avatar')
      .populate('comments', 'content user createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: posts.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single post
 * @route   GET /api/v1/post/:id
 * @access  Public
 */
const getPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate('user', 'username fullName avatar bio')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username fullName avatar'
        }
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user can view private post
    if (post.isPrivate && req.user && post.user._id.toString() !== req.user.id) {
      const isFollowing = await Follow.findOne({
        follower: req.user.id,
        following: post.user._id
      });
      
      if (!isFollowing) {
        return res.status(403).json({
          success: false,
          message: 'This post is private'
        });
      }
    }

    res.json({
      success: true,
      data: {
        post
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete post
 * @route   DELETE /api/v1/post/:id
 * @access  Private
 */
const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns the post
    if (post.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    // Delete media files
    if (post.media && post.media.length > 0) {
      for (const media of post.media) {
        if (media.filename) {
          const mediaPath = path.join(__dirname, '..', 'uploads', 'images', media.filename);
          deleteFile(mediaPath);
        }
      }
    }

    // Delete post
    await Post.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Like a post
 * @route   PUT /api/v1/post/:id/like
 * @access  Private
 */
const likePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if already liked
    if (post.likes.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Post already liked'
      });
    }

    // Add like
    post.likes.push(userId);
    await post.save();

    res.json({
      success: true,
      message: 'Post liked successfully',
      data: {
        likesCount: post.likes.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unlike a post
 * @route   PUT /api/v1/post/:id/unlike
 * @access  Private
 */
const unlikePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if liked
    if (!post.likes.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Post not liked'
      });
    }

    // Remove like
    post.likes = post.likes.filter(likeId => likeId.toString() !== userId);
    await post.save();

    res.json({
      success: true,
      message: 'Post unliked successfully',
      data: {
        likesCount: post.likes.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add comment to post
 * @route   POST /api/v1/post/:id/comment
 * @access  Private
 */
const addComment = async (req, res, next) => {
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
    const { content, parentComment } = req.body;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Create comment
    const comment = await Comment.create({
      post: id,
      user: userId,
      content,
      parentComment
    });

    // Populate user info
    await comment.populate('user', 'username fullName avatar');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete comment
 * @route   DELETE /api/v1/post/:postId/comment/:commentId
 * @access  Private
 */
const deleteComment = async (req, res, next) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment or the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (comment.user.toString() !== userId && post.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    await Comment.findByIdAndDelete(commentId);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Share post
 * @route   POST /api/v1/post/:id/share
 * @access  Private
 */
const sharePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Increment share count
    post.shares += 1;
    await post.save();

    res.json({
      success: true,
      message: 'Post shared successfully',
      data: {
        sharesCount: post.shares
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Save post
 * @route   POST /api/v1/post/:id/save
 * @access  Private
 */
const savePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if already saved
    const existingSave = await SavedPost.findOne({
      user: userId,
      content: id,
      contentType: 'Post'
    });

    if (existingSave) {
      return res.status(400).json({
        success: false,
        message: 'Post already saved'
      });
    }

    // Save post
    await SavedPost.create({
      user: userId,
      content: id,
      contentType: 'Post'
    });

    res.json({
      success: true,
      message: 'Post saved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unsave post
 * @route   POST /api/v1/post/:id/unsave
 * @access  Private
 */
const unsavePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const savedPost = await SavedPost.findOne({
      user: userId,
      content: id,
      contentType: 'Post'
    });

    if (!savedPost) {
      return res.status(400).json({
        success: false,
        message: 'Post not saved'
      });
    }

    await SavedPost.findByIdAndDelete(savedPost._id);

    res.json({
      success: true,
      message: 'Post unsaved successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  deleteComment,
  sharePost,
  savePost,
  unsavePost
};
