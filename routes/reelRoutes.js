/**
 * Reel Routes
 * All reel-related endpoints
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { handleValidationErrors, validateReel, validateComment, validateObjectId, validatePagination } = require('../utils/validation');
const { uploadVideo } = require('../config/upload');
const {
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
} = require('../controllers/reelController');

/**
 * @route   POST /api/v1/reel/create
 * @desc    Create new reel
 * @access  Private
 */
router.post('/create', protect, uploadVideo.single('video'), validateReel, createReel);

/**
 * @route   GET /api/v1/reel/all
 * @desc    Get all reels (trending)
 * @access  Public
 */
router.get('/all', validatePagination, getAllReels);

/**
 * @route   GET /api/v1/reel/:id
 * @desc    Get single reel
 * @access  Public
 */
router.get('/:id', validateObjectId, getReel);

/**
 * @route   DELETE /api/v1/reel/:id
 * @desc    Delete reel
 * @access  Private
 */
router.delete('/:id', protect, validateObjectId, deleteReel);

/**
 * @route   PUT /api/v1/reel/:id/like
 * @desc    Like a reel
 * @access  Private
 */
router.put('/:id/like', protect, validateObjectId, likeReel);

/**
 * @route   PUT /api/v1/reel/:id/unlike
 * @desc    Unlike a reel
 * @access  Private
 */
router.put('/:id/unlike', protect, validateObjectId, unlikeReel);

/**
 * @route   POST /api/v1/reel/:id/comment
 * @desc    Add comment to reel
 * @access  Private
 */
router.post('/:id/comment', protect, validateObjectId, validateComment, addComment);

/**
 * @route   GET /api/v1/reel/:id/comments
 * @desc    Get reel comments
 * @access  Public
 */
router.get('/:id/comments', validateObjectId, validatePagination, getReelComments);

/**
 * @route   POST /api/v1/reel/:id/save
 * @desc    Save reel
 * @access  Private
 */
router.post('/:id/save', protect, validateObjectId, saveReel);

/**
 * @route   POST /api/v1/reel/:id/unsave
 * @desc    Unsave reel
 * @access  Private
 */
router.post('/:id/unsave', protect, validateObjectId, unsaveReel);

/**
 * @route   GET /api/v1/reel/hashtag/:tag
 * @desc    Get reels by hashtag
 * @access  Public
 */
router.get('/hashtag/:tag', validatePagination, getReelsByHashtag);

module.exports = router;
