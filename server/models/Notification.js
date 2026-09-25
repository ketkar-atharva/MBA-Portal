const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required'],
      index: true
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Notification message cannot exceed 500 characters']
    },
    relatedSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ActivitySubmission',
      default: null,
      index: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true
    }
  },
  {
    timestamps: false
  }
);

// Compound index for fast retrieval of unread notifications by user
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
