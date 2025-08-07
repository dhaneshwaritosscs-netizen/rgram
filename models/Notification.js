/**
 * Notification Model
 * Mongoose schema for user notifications
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Sender (who triggered the notification)
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Notification Type
  type: {
    type: String,
    enum: [
      'follow',           // Someone followed you
      'unfollow',         // Someone unfollowed you
      'like_post',        // Someone liked your post
      'like_reel',        // Someone liked your reel
      'like_comment',     // Someone liked your comment
      'comment_post',     // Someone commented on your post
      'comment_reel',     // Someone commented on your reel
      'reply_comment',    // Someone replied to your comment
      'mention_post',     // Someone mentioned you in a post
      'mention_reel',     // Someone mentioned you in a reel
      'mention_comment',  // Someone mentioned you in a comment
      'share_post',       // Someone shared your post
      'share_reel',       // Someone shared your reel
      'save_post',        // Someone saved your post
      'save_reel',        // Someone saved your reel
      'duet_reel',        // Someone made a duet with your reel
      'system'            // System notification
    ],
    required: true
  },

  // Related Content (optional)
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  reel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reel'
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },

  // Notification Content
  title: {
    type: String,
    required: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },

  // Additional Data
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Read timestamp
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ sender: 1, type: 1 });
notificationSchema.index({ isActive: 1 });

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Instance method to mark as unread
notificationSchema.methods.markAsUnread = function() {
  this.isRead = false;
  this.readAt = null;
  return this.save();
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(userId, page = 1, limit = 20) {
  return this.find({
    recipient: userId,
    isActive: true
  })
  .populate('sender', 'username fullName avatar')
  .populate('post', 'caption media')
  .populate('reel', 'caption video')
  .populate('comment', 'content')
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);
};

// Static method to get unread notifications count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
    isActive: true
  });
};

// Static method to mark all notifications as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    {
      recipient: userId,
      isRead: false,
      isActive: true
    },
    {
      isRead: true,
      readAt: new Date()
    }
  );
};

// Static method to create notification
notificationSchema.statics.createNotification = function(data) {
  return this.create(data);
};

// Static method to create follow notification
notificationSchema.statics.createFollowNotification = function(recipientId, senderId) {
  return this.create({
    recipient: recipientId,
    sender: senderId,
    type: 'follow',
    title: 'New Follower',
    message: 'started following you'
  });
};

// Static method to create like notification
notificationSchema.statics.createLikeNotification = function(recipientId, senderId, contentType, contentId) {
  const type = contentType === 'post' ? 'like_post' : 'like_reel';
  const title = contentType === 'post' ? 'New Like' : 'New Reel Like';
  const message = `liked your ${contentType}`;

  return this.create({
    recipient: recipientId,
    sender: senderId,
    type,
    title,
    message,
    [contentType]: contentId
  });
};

// Static method to create comment notification
notificationSchema.statics.createCommentNotification = function(recipientId, senderId, contentType, contentId, commentId) {
  const type = contentType === 'post' ? 'comment_post' : 'comment_reel';
  const title = contentType === 'post' ? 'New Comment' : 'New Reel Comment';
  const message = `commented on your ${contentType}`;

  return this.create({
    recipient: recipientId,
    sender: senderId,
    type,
    title,
    message,
    [contentType]: contentId,
    comment: commentId
  });
};

// Static method to create mention notification
notificationSchema.statics.createMentionNotification = function(recipientId, senderId, contentType, contentId, commentId = null) {
  const type = commentId ? 'mention_comment' : (contentType === 'post' ? 'mention_post' : 'mention_reel');
  const title = 'Mention';
  const message = `mentioned you in a ${commentId ? 'comment' : contentType}`;

  const notificationData = {
    recipient: recipientId,
    sender: senderId,
    type,
    title,
    message
  };

  if (commentId) {
    notificationData.comment = commentId;
  } else {
    notificationData[contentType] = contentId;
  }

  return this.create(notificationData);
};

module.exports = mongoose.model('Notification', notificationSchema);
