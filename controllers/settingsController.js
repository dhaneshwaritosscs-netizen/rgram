/**
 * Settings Controller
 * Handles user settings, privacy, and password management
 */

const User = require('../models/User');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

/**
 * @desc    Update privacy settings
 * @route   PUT /api/v1/settings/privacy
 * @access  Private
 */
const updatePrivacySettings = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { isPrivate, allowComments, allowLikes, allowFollows } = req.body;
    const userId = req.user.id;

    // Update user privacy settings
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        isPrivate,
        privacySettings: {
          allowComments: allowComments !== undefined ? allowComments : true,
          allowLikes: allowLikes !== undefined ? allowLikes : true,
          allowFollows: allowFollows !== undefined ? allowFollows : true
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: {
        user: {
          id: updatedUser._id,
          isPrivate: updatedUser.isPrivate,
          privacySettings: updatedUser.privacySettings
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/v1/settings/password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user settings
 * @route   GET /api/v1/settings
 * @access  Private
 */
const getUserSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        settings: {
          isPrivate: user.isPrivate,
          privacySettings: user.privacySettings || {
            allowComments: true,
            allowLikes: true,
            allowFollows: true
          },
          email: user.email,
          username: user.username,
          fullName: user.fullName,
          bio: user.bio,
          website: user.website,
          location: user.location,
          avatar: user.avatar,
          isVerified: user.isVerified,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate account
 * @route   PUT /api/v1/settings/deactivate
 * @access  Private
 */
const deactivateAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to deactivate account'
      });
    }

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Deactivate account
    user.isActive = false;
    user.deactivatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Account deactivated successfully. You can reactivate by logging in again.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reactivate account
 * @route   PUT /api/v1/settings/reactivate
 * @access  Public
 */
const reactivateAccount = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find deactivated user
    const user = await User.findOne({ email, isActive: false }).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No deactivated account found with this email'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reactivate account
    user.isActive = true;
    user.deactivatedAt = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Account reactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updatePrivacySettings,
  changePassword,
  getUserSettings,
  deactivateAccount,
  reactivateAccount
};
