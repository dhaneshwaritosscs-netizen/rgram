/**
 * Search Routes
 * All search and exploration endpoints
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  searchUsers,
  explorePosts,
  searchPostsByHashtag,
  searchPostsByLocation,
  getTrendingHashtags,
  getSuggestedUsers
} = require('../controllers/searchController');

// Import middleware
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const {
  validateSearch,
  validatePagination
} = require('../utils/validation');

/**
 * @route   GET /api/v1/search/users
 * @desc    Search users
 * @access  Private
 */
router.get('/users', protect, validateSearch, searchUsers);

/**
 * @route   GET /api/v1/explore
 * @desc    Explore posts
 * @access  Private
 */
router.get('/explore', protect, validatePagination, explorePosts);

/**
 * @route   GET /api/v1/search/posts/hashtag/:hashtag
 * @desc    Search posts by hashtag
 * @access  Public
 */
router.get('/posts/hashtag/:hashtag', validatePagination, optionalAuth, searchPostsByHashtag);

/**
 * @route   GET /api/v1/search/posts/location
 * @desc    Search posts by location
 * @access  Public
 */
router.get('/posts/location', validatePagination, optionalAuth, searchPostsByLocation);

/**
 * @route   GET /api/v1/search/trending-hashtags
 * @desc    Get trending hashtags
 * @access  Public
 */
router.get('/trending-hashtags', getTrendingHashtags);

/**
 * @route   GET /api/v1/search/suggested-users
 * @desc    Get suggested users
 * @access  Private
 */
router.get('/suggested-users', protect, validatePagination, getSuggestedUsers);

module.exports = router;
