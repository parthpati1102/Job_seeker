const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: false,
    lowercase: true,
    trim: true,
    sparse: true
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    sparse: true
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  type: {
    type: String,
    enum: ['login', 'password_reset'],
    default: 'login'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
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

// Indexes for better performance
otpSchema.index({ email: 1, type: 1, expiresAt: 1 });
otpSchema.index({ phone: 1, type: 1, expiresAt: 1 });
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 }); // Auto-delete after 15 minutes

otpSchema.pre('save', function(next) {
  if (!this.email && !this.phone) {
    return next(new Error('Either email or phone must be provided'));
  }
  next();
});

module.exports = mongoose.model('OTP', otpSchema);