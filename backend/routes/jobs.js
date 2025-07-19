const express = require('express');
const Job = require('../models/Job');
const Application = require('../models/Application');
const auth = require('../middleware/auth');
const router = express.Router();

// Create job (job posters only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'job_poster') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const jobData = {
      ...req.body,
      postedBy: req.user.userId
    };

    const job = new Job(jobData);
    await job.save();

    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get jobs for job seekers (filtered and excluding applied jobs)
router.get('/browse', auth, async (req, res) => {
  try {
    console.log('=== BROWSE JOBS DEBUG ===');
    console.log('User ID:', req.user.userId, 'Role:', req.user.role);
    
    if (req.user.role !== 'job_seeker') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // First, let's check if there are ANY jobs in the database
    const totalJobs = await Job.countDocuments();
    console.log('Total jobs in database:', totalJobs);
    
    if (totalJobs === 0) {
      return res.json([]);
    }

    const User = require('../models/User');
    const user = await User.findById(req.user.userId);
    const preferences = user?.preferences || {};
    
    console.log('User preferences:', JSON.stringify(preferences, null, 2));

    // Get jobs user has already applied to
    const appliedJobs = await Application.find({ applicant: req.user.userId }).select('job');
    const appliedJobIds = appliedJobs.map(app => app.job.toString());
    
    console.log('Applied job IDs:', appliedJobIds.length);

    // Check query parameter for showing all jobs
    const showAll = req.query.showAll === 'true';
    console.log('Show all jobs requested:', showAll);

    // Build filter based on preferences
    let filter = {
      isActive: true,
      _id: { $nin: appliedJobIds }
    };

    // Only apply preference filters if not showing all jobs and preferences exist
    if (!showAll && preferences && Object.keys(preferences).length > 0) {
      console.log('Applying preference filters...');
      
      if (preferences.jobType && preferences.jobType.trim()) {
        filter.workType = preferences.jobType;
        console.log('Added workType filter:', preferences.jobType);
      }

      if (preferences.jobLevel && preferences.jobLevel.trim()) {
        filter.jobLevel = preferences.jobLevel;
        console.log('Added jobLevel filter:', preferences.jobLevel);
      }

      if (preferences.preferredLocations && preferences.preferredLocations.length > 0) {
        const locationRegex = preferences.preferredLocations.map(loc => new RegExp(loc, 'i'));
        filter.$or = locationRegex.map(regex => ({ location: regex }));
        console.log('Added location filters:', preferences.preferredLocations);
      }

      if (preferences.jobRoles && preferences.jobRoles.length > 0) {
        const roleRegex = preferences.jobRoles.map(role => new RegExp(role, 'i'));
        if (!filter.$or) filter.$or = [];
        filter.$or.push(...roleRegex.map(regex => ({ title: regex })));
        console.log('Added job role filters:', preferences.jobRoles);
      }
    } else {
      console.log('Showing all jobs (no preference filtering)');
    }

    console.log('Final filter:', JSON.stringify(filter, null, 2));

    const jobs = await Job.find(filter)
      .populate('postedBy', 'name companyName')
      .sort({ createdAt: -1 });

    console.log('Found jobs with filter:', jobs.length);
    
    // If no jobs found with preferences and not already showing all, try without preference filters
    if (jobs.length === 0 && !showAll && preferences && Object.keys(preferences).length > 0) {
      console.log('No jobs found with preferences, trying without preference filters...');
      const basicFilter = {
        isActive: true,
        _id: { $nin: appliedJobIds }
      };
      
      const allJobs = await Job.find(basicFilter)
        .populate('postedBy', 'name companyName')
        .sort({ createdAt: -1 });
        
      console.log('Found jobs without preference filters:', allJobs.length);
      return res.json(allJobs);
    }

    res.json(jobs);
  } catch (error) {
    console.error('Browse jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all jobs without filters (for job seekers who want to see everything)
router.get('/all-available', auth, async (req, res) => {
  try {
    console.log('=== ALL AVAILABLE JOBS DEBUG ===');
    console.log('User ID:', req.user.userId, 'Role:', req.user.role);
    
    if (req.user.role !== 'job_seeker') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get jobs user has already applied to
    const appliedJobs = await Application.find({ applicant: req.user.userId }).select('job');
    const appliedJobIds = appliedJobs.map(app => app.job.toString());
    
    console.log('Applied job IDs count:', appliedJobIds.length);

    const filter = {
      isActive: true,
      _id: { $nin: appliedJobIds }
    };

    console.log('Filter for all available jobs:', JSON.stringify(filter, null, 2));

    const jobs = await Job.find(filter)
      .populate('postedBy', 'name companyName')
      .sort({ createdAt: -1 });

    console.log('Found all available jobs:', jobs.length);
    res.json(jobs);
  } catch (error) {
    console.error('Get all available jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all jobs for job posters (to see other jobs and manage applications)
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'job_poster') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const jobs = await Job.find({ isActive: true })
      .populate('postedBy', 'name companyName')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error('Get all jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get jobs posted by current user (job posters only)
router.get('/my-jobs', auth, async (req, res) => {
  try {
    if (req.user.role !== 'job_poster') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const jobs = await Job.find({ postedBy: req.user.userId })
      .populate('applications')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single job
router.get('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name companyName');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update job
router.put('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user.userId });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    Object.assign(job, req.body);
    await job.save();

    res.json({
      message: 'Job updated successfully',
      job
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete job
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, postedBy: req.user.userId });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;