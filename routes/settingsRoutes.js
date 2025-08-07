const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { handleValidationErrors, validatePasswordChange } = require('../utils/validation');
const {
  updatePrivacySettings,
  changePassword,
  getUserSettings,
  deactivateAccount,
  reactivateAccount
} = require('../controllers/settingsController');

/**
 * @route   GET /api/v1/settings
 * @desc    Get user settings
 * @access  Private
 */
router.get('/', protect, getUserSettings);

/**
 * @route   PUT /api/v1/settings/privacy
 * @desc    Update privacy settings
 * @access  Private
 */
router.put('/privacy', protect, handleValidationErrors, updatePrivacySettings);

/**
 * @route   PUT /api/v1/settings/password
 * @desc    Change password
 * @access  Private
 */
router.put('/password', protect, validatePasswordChange, changePassword);

/**
 * @route   PUT /api/v1/settings/deactivate
 * @desc    Deactivate account
 * @access  Private
 */
router.put('/deactivate', protect, handleValidationErrors, deactivateAccount);

/**
 * @route   PUT /api/v1/settings/reactivate
 * @desc    Reactivate account
 * @access  Public
 */
router.put('/reactivate', handleValidationErrors, reactivateAccount);

module.exports = router;
