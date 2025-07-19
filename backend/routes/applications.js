const express = require('express');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const auth = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();

// Apply for job
router.post('/:jobId/apply', auth, async (req, res) => {
  try {
    if (req.user.role !== 'job_seeker') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { jobId } = req.params;
    const applicantId = req.user.userId;

    const job = await Job.findById(jobId).populate('postedBy');
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const existingApp = await Application.findOne({ job: jobId, applicant: applicantId });
    if (existingApp) return res.status(400).json({ message: 'Already applied' });

    const application = new Application({ job: jobId, applicant: applicantId });
    await application.save();

    job.applications.push(application._id);
    await job.save();

    const applicant = await User.findById(applicantId);

    const emailSubject = `New Application for ${job.title}`;
    const emailBody = `
      <h2>New Job Application</h2>
      <p>You have received a new application for: <strong>${job.title}</strong></p>
      <h3>Applicant Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${applicant.name}</li>
        <li><strong>Email:</strong> ${applicant.email}</li>
        <li><strong>Phone:</strong> ${applicant.phone}</li>
      </ul>
      ${applicant.resume ? `<p><strong>Resume:</strong> ${applicant.resume.filename}</p>` : ''}
      <p>Login to your dashboard to review the application.</p>
    `;

    try {
      await sendEmail(job.postedBy.email, emailSubject, emailBody);
    } catch (e) {
      console.error('Email failed:', e);
    }

    res.status(201).json({ message: 'Application submitted', application });
  } catch (error) {
    console.error('Application Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get logged-in job seeker's applications
router.get('/my-applications', auth, async (req, res) => {
  try {
    if (req.user.role !== 'job_seeker') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const applications = await Application.find({ applicant: req.user.userId })
      .populate('job', 'title companyName location')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('My Applications Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Application statistics
router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'job_seeker') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const total = await Application.countDocuments({ applicant: req.user.userId });
    const todayCount = await Application.countDocuments({
      applicant: req.user.userId,
      createdAt: { $gte: today }
    });

    const statusCounts = await Application.aggregate([
      { $match: { applicant: req.user.userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const stats = {
      total,
      today: todayCount,
      pending: 0,
      reviewed: 0,
      accepted: 0,
      rejected: 0
    };

    statusCounts.forEach(({ _id, count }) => {
      stats[_id] = count;
    });

    res.json(stats);
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Applications for a specific job
router.get('/job/:jobId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'job_poster') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const job = await Job.findOne({ _id: req.params.jobId, postedBy: req.user.userId });
    if (!job) return res.status(404).json({ message: 'Job not found or unauthorized' });

    const applications = await Application.find({ job: req.params.jobId })
      .populate('applicant', 'name email phone resume')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Job Applications Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update application status
router.put('/:applicationId/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'job_poster') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, notes } = req.body;

    if (!['pending', 'reviewed', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await Application.findById(req.params.applicationId)
      .populate('job')
      .populate('applicant', 'name email');

    if (!application) return res.status(404).json({ message: 'Application not found' });

    if (application.job.postedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    application.status = status;
    if (notes) application.notes = notes;

    await application.save();

    const statusMessages = {
      reviewed: 'Your application has been reviewed.',
      accepted: 'Congratulations! Your application has been accepted.',
      rejected: 'We regret to inform you that your application was not selected.'
    };

    if (statusMessages[status]) {
      const emailSubject = `Application Update: ${application.job.title}`;
      const emailBody = `
        <h2>Application Status Update</h2>
        <p>Dear ${application.applicant.name},</p>
        <p>${statusMessages[status]}</p>
        ${notes ? `<p><strong>Note:</strong> ${notes}</p>` : ''}
        <p>Thank you for applying.</p>
      `;

      try {
        await sendEmail(application.applicant.email, emailSubject, emailBody);
      } catch (e) {
        console.error('Email send failed:', e);
      }
    }

    res.json({ message: 'Status updated', application });
  } catch (error) {
    console.error('Status Update Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// All applications for poster’s jobs
router.get('/my-job-applications', auth, async (req, res) => {
  try {
    if (req.user.role !== 'job_poster') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const myJobs = await Job.find({ postedBy: req.user.userId }).select('_id');
    const jobIds = myJobs.map(job => job._id);

    const applications = await Application.find({ job: { $in: jobIds } })
      .populate('job', 'title companyName')
      .populate('applicant', 'name email phone resume')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('All My Applications Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
