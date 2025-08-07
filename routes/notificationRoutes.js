/**
 * Notification Routes
 * All notification-related endpoints
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  deleteNotification,
  deleteAllNotifications
} = require('../controllers/notificationController');

// Import middleware
const { protect } = require('../middleware/authMiddleware');
const {
  validateObjectId,
  validatePagination
} = require('../utils/validation');

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', protect, validatePagination, getNotifications);

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get unread notifications count
 * @access  Private
 */
router.get('/unread-count', protect, getUnreadCount);

/**
 * @route   PUT /api/v1/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', validateObjectId, protect, markNotificationAsRead);

/**
 * @route   PUT /api/v1/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', protect, markAllNotificationsAsRead);

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', validateObjectId, protect, deleteNotification);

/**
 * @route   DELETE /api/v1/notifications
 * @desc    Delete all notifications
 * @access  Private
 */
router.delete('/', protect, deleteAllNotifications);

module.exports = router;
