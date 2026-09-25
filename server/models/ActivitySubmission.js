const mongoose = require('mongoose');

const activitySubmissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID reference is required'],
      index: true
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID reference is required'],
      index: true
    },
    // Denormalized from Event to allow atomic, database-level compound uniqueness indexing
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be at least 1'],
      max: [10, 'Semester cannot exceed 10'],
      index: true
    },
    role: {
      type: String,
      required: [true, 'Activity role is required'],
      enum: {
        values: ['Participant', 'Organizer', 'Winner', 'Head'],
        message: 'Role must be Participant, Organizer, Winner, or Head'
      }
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    proofUrl: {
      type: String,
      required: [true, 'Proof URL is required'],
      trim: true
    },
    proofType: {
      type: String,
      required: [true, 'Proof document type is required'],
      trim: true
    },
    status: {
      type: String,
      required: [true, 'Submission status is required'],
      enum: {
        values: ['Pending', 'Approved', 'Rejected', 'Resubmitted', 'Overridden'],
        message: 'Status must be Pending, Approved, Rejected, Resubmitted, or Overridden'
      },
      default: 'Pending',
      index: true
    },
    // Points are strictly server-derived via ScoringRule upon verification/approval.
    // Initialized to 0 by default; never accepted from untrusted client input.
    points: {
      type: Number,
      default: 0,
      min: [0, 'Points cannot be negative']
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null,
      trim: true
    },
    resubmissionCount: {
      type: Number,
      default: 0,
      min: [0, 'Resubmission count cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

// Prevents a student from submitting duplicate claims for the same role in the same event within a given semester.
activitySubmissionSchema.index(
  { studentId: 1, eventId: 1, role: 1, semester: 1 },
  { unique: true }
);

// Query optimization index for verification queues (faculty/admin)
activitySubmissionSchema.index({ status: 1, submittedAt: -1 });

// Query optimization index for student activity dashboards
activitySubmissionSchema.index({ studentId: 1, status: 1 });

const ActivitySubmission = mongoose.model('ActivitySubmission', activitySubmissionSchema);

module.exports = ActivitySubmission;
