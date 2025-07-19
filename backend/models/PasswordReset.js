const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate secure reset token
passwordResetSchema.statics.generateResetToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Index for cleanup
passwordResetSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // Auto-delete after 1 hour

module.exports = mongoose.model('PasswordReset', passwordResetSchema);