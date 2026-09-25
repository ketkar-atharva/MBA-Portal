const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please enter a valid email address'
      ],
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false // Excluded by default from queries for security
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['student', 'faculty', 'admin'],
        message: 'Role must be student, faculty, or admin'
      },
      lowercase: true,
      trim: true,
      index: true
    },
    rollNo: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      index: true
    },
    program: {
      type: String,
      trim: true
    },
    year: {
      type: Number,
      min: [1, 'Year must be at least 1'],
      max: [5, 'Year cannot exceed 5']
    },
    division: {
      type: String,
      trim: true,
      uppercase: true
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
