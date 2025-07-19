const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  requiredSkills: [{
    type: String,
    required: true
  }],
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    required: true
  },
  workType: {
    type: String,
    enum: ['remote', 'on-site', 'hybrid'],
    required: true
  },
  jobLevel: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'executive'],
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);