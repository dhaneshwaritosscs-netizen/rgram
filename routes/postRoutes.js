/**
 * Post Routes
 * All post-related endpoints
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { handleValidationErrors, validatePost, validateComment, validateObjectId, validatePagination } = require('../utils/validation');
const { uploadImage } = require('../config/upload');
const {
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
} = require('../controllers/postController');

/**
 * @route   POST /api/v1/post/create
 * @desc    Create new post
 * @access  Private
 */
router.post('/create', protect, uploadImage.array('media', 10), validatePost, createPost);

/**
 * @route   GET /api/v1/post/all
 * @desc    Get all posts (feed)
 * @access  Private
 */
router.get('/all', protect, validatePagination, getAllPosts);

/**
 * @route   GET /api/v1/post/:id
 * @desc    Get single post
 * @access  Public
 */
router.get('/:id', validateObjectId, getPost);

/**
 * @route   DELETE /api/v1/post/:id
 * @desc    Delete post
 * @access  Private
 */
router.delete('/:id', protect, validateObjectId, deletePost);

/**
 * @route   PUT /api/v1/post/:id/like
 * @desc    Like a post
 * @access  Private
 */
router.put('/:id/like', protect, validateObjectId, likePost);

/**
 * @route   PUT /api/v1/post/:id/unlike
 * @desc    Unlike a post
 * @access  Private
 */
router.put('/:id/unlike', protect, validateObjectId, unlikePost);

/**
 * @route   POST /api/v1/post/:id/comment
 * @desc    Add comment to post
 * @access  Private
 */
router.post('/:id/comment', protect, validateObjectId, validateComment, addComment);

/**
 * @route   DELETE /api/v1/post/:postId/comment/:commentId
 * @desc    Delete comment
 * @access  Private
 */
router.delete('/:postId/comment/:commentId', protect, validateObjectId, deleteComment);

/**
 * @route   POST /api/v1/post/:id/share
 * @desc    Share post
 * @access  Private
 */
router.post('/:id/share', protect, validateObjectId, sharePost);

/**
 * @route   POST /api/v1/post/:id/save
 * @desc    Save post
 * @access  Private
 */
router.post('/:id/save', protect, validateObjectId, savePost);

/**
 * @route   POST /api/v1/post/:id/unsave
 * @desc    Unsave post
 * @access  Private
 */
router.post('/:id/unsave', protect, validateObjectId, unsavePost);

module.exports = router;
