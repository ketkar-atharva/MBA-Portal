const mongoose = require('mongoose');

const facultyProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required'],
      unique: true,
      index: true
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      index: true
    },
    assignedPrograms: {
      type: [
        {
          type: String,
          trim: true
        }
      ],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const FacultyProfile = mongoose.model('FacultyProfile', facultyProfileSchema);

module.exports = FacultyProfile;
