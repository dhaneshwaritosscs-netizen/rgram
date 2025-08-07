/**
 * User Routes
 * All user-related endpoints
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { handleValidationErrors, validateProfileUpdate, validateObjectId, validatePagination } = require('../utils/validation');
const { uploadAvatar } = require('../config/upload');
const {
  getUserById,
  editProfile,
  uploadAvatar: uploadAvatarController,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  getSavedPosts,
  getSuggestedUsers,
  deleteAccount
} = require('../controllers/userController');

router.get('/', (req, res) => {
  res.json({ message: 'User route working!' });
});

/**
 * @route   GET /api/v1/user/:id
 * @desc    Get user by ID
 * @access  Public
 */
router.get('/:id', validateObjectId, validatePagination, getUserById);

/**
 * @route   PUT /api/v1/user/:id/edit
 * @desc    Edit user profile
 * @access  Private
 */
router.put('/:id/edit', protect, validateObjectId, validateProfileUpdate, editProfile);

/**
 * @route   PUT /api/v1/user/:id/avatar
 * @desc    Upload/change avatar
 * @access  Private
 */
router.put('/:id/avatar', protect, validateObjectId, uploadAvatar.single('avatar'), uploadAvatarController);

/**
 * @route   GET /api/v1/user/:id/followers
 * @desc    Get user followers
 * @access  Public
 */
router.get('/:id/followers', validateObjectId, validatePagination, getFollowers);

/**
 * @route   GET /api/v1/user/:id/following
 * @desc    Get user following
 * @access  Public
 */
router.get('/:id/following', validateObjectId, validatePagination, getFollowing);

/**
 * @route   POST /api/v1/user/:id/follow
 * @desc    Follow a user
 * @access  Private
 */
router.post('/:id/follow', protect, validateObjectId, followUser);

/**
 * @route   POST /api/v1/user/:id/unfollow
 * @desc    Unfollow a user
 * @access  Private
 */
router.post('/:id/unfollow', protect, validateObjectId, unfollowUser);

/**
 * @route   GET /api/v1/user/:id/saved
 * @desc    Get saved posts
 * @access  Private
 */
router.get('/:id/saved', protect, validateObjectId, validatePagination, getSavedPosts);

/**
 * @route   GET /api/v1/user/suggested
 * @desc    Get suggested users to follow
 * @access  Private
 */
router.get('/suggested', protect, validatePagination, getSuggestedUsers);

/**
 * @route   DELETE /api/v1/user/:id
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/:id', protect, validateObjectId, deleteAccount);

module.exports = router;
