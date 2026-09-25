const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID reference is required'],
      unique: true,
      index: true
    },
    rollNo: {
      type: String,
      required: [true, 'Roll number is required'],
      trim: true,
      uppercase: true,
      index: true
    },
    program: {
      type: String,
      required: [true, 'Program is required'],
      trim: true
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
    // Cached aggregate value representing verified co-curricular points.
    // Not the source of truth; derived by summing approved ActivitySubmissions.
    totalPoints: {
      type: Number,
      default: 0,
      min: [0, 'Total points cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying students by program and semester
studentProfileSchema.index({ program: 1, semester: 1 });

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

module.exports = StudentProfile;
