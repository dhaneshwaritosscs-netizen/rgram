/**
 * Notification Controller
 * Handles user notifications and activity alerts
 */

const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get user notifications
 * @route   GET /api/v1/notifications
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const userId = req.user._id;

  const notifications = await Notification.getUserNotifications(userId, parseInt(page), parseInt(limit));

  res.json({
    success: true,
    data: {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: notifications.length === parseInt(limit)
      }
    }
  });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private
 */
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findById(id);
  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  // Check if user owns the notification
  if (notification.recipient.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only mark your own notifications as read'
    });
  }

  await notification.markAsRead();

  res.json({
    success: true,
    message: 'Notification marked as read'
  });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/v1/notifications/read-all
 * @access  Private
 */
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await Notification.markAllAsRead(userId);

  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
});

/**
 * @desc    Get unread notifications count
 * @route   GET /api/v1/notifications/unread-count
 * @access  Private
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const count = await Notification.getUnreadCount(userId);

  res.json({
    success: true,
    data: {
      unreadCount: count
    }
  });
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findById(id);
  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  // Check if user owns the notification
  if (notification.recipient.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own notifications'
    });
  }

  await Notification.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

/**
 * @desc    Delete all notifications
 * @route   DELETE /api/v1/notifications
 * @access  Private
 */
const deleteAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await Notification.deleteMany({ recipient: userId });

  res.json({
    success: true,
    message: 'All notifications deleted successfully'
  });
});

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  deleteNotification,
  deleteAllNotifications
};
