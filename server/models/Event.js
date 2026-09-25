const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      maxlength: [200, 'Event name cannot exceed 200 characters']
    },
    category: {
      type: String,
      required: [true, 'Event category is required'],
      trim: true,
      index: true
    },
    organizer: {
      type: String,
      required: [true, 'Event organizer is required'],
      trim: true
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required']
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be at least 1'],
      max: [10, 'Semester cannot exceed 10']
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
      match: [/^\d{4}-\d{4}$/, 'Academic year must follow YYYY-YYYY format (e.g., 2025-2026)']
    },
    status: {
      type: String,
      required: [true, 'Event status is required'],
      enum: {
        values: ['Draft', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
        message: 'Status must be Draft, Upcoming, Ongoing, Completed, or Cancelled'
      },
      default: 'Upcoming',
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user reference is required'],
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for common event queries
eventSchema.index({ academicYear: 1, semester: 1 });
eventSchema.index({ eventDate: 1, status: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
