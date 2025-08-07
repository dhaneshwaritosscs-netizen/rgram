/**
 * Reel Controller
 * Handles reel creation, likes, comments, and video uploads
 */

const Reel = require('../models/Reel');
const User = require('../models/User');
const Comment = require('../models/Comment');
const SavedPost = require('../models/SavedPost');
const Follow = require('../models/Follow');
const { generateFileUrl, deleteFile } = require('../config/upload');
const { validationResult } = require('express-validator');
const path = require('path');

/**
 * @desc    Create new reel
 * @route   POST /api/v1/reel/create
 * @access  Private
 */
const createReel = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { caption, duration, location, tags, isPrivate } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a video file'
      });
    }

    // Generate video URL
    const videoUrl = generateFileUrl(req.file.filename, 'videos', req.protocol + '://' + req.get('host'));

    // Create reel
    const reel = await Reel.create({
      user: userId,
      caption,
      video: {
        url: videoUrl,
        filename: req.file.filename,
        type: req.file.mimetype,
        size: req.file.size,
        duration: duration || 0
      },
      location,
      tags: tags ? JSON.parse(tags) : [],
      isPrivate: isPrivate === 'true'
    });

    // Populate user info
    await reel.populate('user', 'username fullName avatar');

    res.status(201).json({
      success: true,
      message: 'Reel created successfully',
      data: {
        reel
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reels (trending)
 * @route   GET /api/v1/reel/all
 * @access  Public
 */
const getAllReels = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reels = await Reel.find({ isPrivate: false })
      .populate('user', 'username fullName avatar')
      .populate('comments', 'content user createdAt')
      .sort({ views: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: {
        reels,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: reels.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single reel
 * @route   GET /api/v1/reel/:id
 * @access  Public
 */
const getReel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reel = await Reel.findById(id)
      .populate('user', 'username fullName avatar bio')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username fullName avatar'
        }
      });

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Check if user can view private reel
    if (reel.isPrivate && req.user && reel.user._id.toString() !== req.user.id) {
      const isFollowing = await Follow.findOne({
        follower: req.user.id,
        following: reel.user._id
      });
      
      if (!isFollowing) {
        return res.status(403).json({
          success: false,
          message: 'This reel is private'
        });
      }
    }

    // Increment view count
    reel.views += 1;
    await reel.save();

    res.json({
      success: true,
      data: {
        reel
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete reel
 * @route   DELETE /api/v1/reel/:id
 * @access  Private
 */
const deleteReel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Check if user owns the reel
    if (reel.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this reel'
      });
    }

    // Delete video file
    if (reel.video && reel.video.filename) {
      const videoPath = path.join(__dirname, '..', 'uploads', 'videos', reel.video.filename);
      deleteFile(videoPath);
    }

    // Delete reel
    await Reel.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Reel deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Like a reel
 * @route   PUT /api/v1/reel/:id/like
 * @access  Private
 */
const likeReel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Check if already liked
    if (reel.likes.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Reel already liked'
      });
    }

    // Add like
    reel.likes.push(userId);
    await reel.save();

    res.json({
      success: true,
      message: 'Reel liked successfully',
      data: {
        likesCount: reel.likes.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unlike a reel
 * @route   PUT /api/v1/reel/:id/unlike
 * @access  Private
 */
const unlikeReel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Check if liked
    if (!reel.likes.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Reel not liked'
      });
    }

    // Remove like
    reel.likes = reel.likes.filter(likeId => likeId.toString() !== userId);
    await reel.save();

    res.json({
      success: true,
      message: 'Reel unliked successfully',
      data: {
        likesCount: reel.likes.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add comment to reel
 * @route   POST /api/v1/reel/:id/comment
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

    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Create comment
    const comment = await Comment.create({
      reel: id,
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
 * @desc    Get reel comments
 * @route   GET /api/v1/reel/:id/comments
 * @access  Public
 */
const getReelComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    const comments = await Comment.find({ reel: id })
      .populate('user', 'username fullName avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: comments.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Save reel
 * @route   POST /api/v1/reel/:id/save
 * @access  Private
 */
const saveReel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({
        success: false,
        message: 'Reel not found'
      });
    }

    // Check if already saved
    const existingSave = await SavedPost.findOne({
      user: userId,
      content: id,
      contentType: 'Reel'
    });

    if (existingSave) {
      return res.status(400).json({
        success: false,
        message: 'Reel already saved'
      });
    }

    // Save reel
    await SavedPost.create({
      user: userId,
      content: id,
      contentType: 'Reel'
    });

    res.json({
      success: true,
      message: 'Reel saved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unsave reel
 * @route   POST /api/v1/reel/:id/unsave
 * @access  Private
 */
const unsaveReel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const savedReel = await SavedPost.findOne({
      user: userId,
      content: id,
      contentType: 'Reel'
    });

    if (!savedReel) {
      return res.status(400).json({
        success: false,
        message: 'Reel not saved'
      });
    }

    await SavedPost.findByIdAndDelete(savedReel._id);

    res.json({
      success: true,
      message: 'Reel unsaved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get reels by hashtag
 * @route   GET /api/v1/reel/hashtag/:tag
 * @access  Public
 */
const getReelsByHashtag = async (req, res, next) => {
  try {
    const { tag } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reels = await Reel.find({
      tags: { $in: [tag] },
      isPrivate: false
    })
      .populate('user', 'username fullName avatar')
      .sort({ views: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      data: {
        reels,
        tag,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: reels.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReel,
  getAllReels,
  getReel,
  deleteReel,
  likeReel,
  unlikeReel,
  addComment,
  getReelComments,
  saveReel,
  unsaveReel,
  getReelsByHashtag
};
