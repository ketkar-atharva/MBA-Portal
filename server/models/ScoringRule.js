const mongoose = require('mongoose');

const scoringRuleSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: [true, 'Role is required'],
      unique: true,
      enum: {
        values: ['Participant', 'Organizer', 'Winner', 'Head'],
        message: 'Role must be Participant, Organizer, Winner, or Head'
      }
    },
    points: {
      type: Number,
      required: [true, 'Points value is required'],
      min: [0, 'Points cannot be negative']
    },
    description: {
      type: String,
      trim: true
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

const ScoringRule = mongoose.model('ScoringRule', scoringRuleSchema);

module.exports = ScoringRule;
