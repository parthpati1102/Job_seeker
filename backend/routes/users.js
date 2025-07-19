const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Anime character photos for fallback
const animePhotos = [
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face'
];

// Function to get random anime photo
const getRandomAnimePhoto = () => {
  return animePhotos[Math.floor(Math.random() * animePhotos.length)];
};

// Function to get Gravatar URL
const getGravatarUrl = (email) => {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=400&d=404`;
};

// Ensure resume upload directory exists
const resumeUploadPath = path.join(__dirname, '../uploads/resumes');
const profilePhotoUploadPath = path.join(__dirname, '../uploads/profile-photos');
if (!fs.existsSync(resumeUploadPath)) {
  fs.mkdirSync(resumeUploadPath, { recursive: true });
}
if (!fs.existsSync(profilePhotoUploadPath)) {
  fs.mkdirSync(profilePhotoUploadPath, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, resumeUploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Profile photo storage
const profilePhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profilePhotoUploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadProfilePhoto = multer({
  storage: profilePhotoStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, PNG, and GIF files are allowed'));
    }
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});


// @route POST /api/users/upload-profile-photo
// @desc  Upload profile photo
// @access Private
router.post('/upload-profile-photo', auth, uploadProfilePhoto.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old profile photo if it exists and is not a URL
    if (user.profilePhoto && user.profilePhoto.startsWith('/uploads/')) {
      const oldPhotoPath = path.join(__dirname, '..', user.profilePhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    user.profilePhoto = `/uploads/profile-photos/${req.file.filename}`;
    await user.save();

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      profilePhoto: user.profilePhoto
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({ success: false, message: 'Server error during photo upload' });
  }
});

// @route POST /api/users/set-random-avatar
// @desc  Set random anime avatar
// @access Private
router.post('/set-random-avatar', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.profilePhoto = getRandomAnimePhoto();
    await user.save();

    res.json({
      success: true,
      message: 'Random avatar set successfully',
      profilePhoto: user.profilePhoto
    });
  } catch (error) {
    console.error('Set random avatar error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route POST /api/users/check-gravatar
// @desc  Check and set Gravatar if available
// @access Private
router.post('/check-gravatar', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const gravatarUrl = getGravatarUrl(user.email);
    
    try {
      const response = await axios.head(gravatarUrl);
      if (response.status === 200) {
        user.profilePhoto = gravatarUrl;
        await user.save();
        return res.json({
          success: true,
          message: 'Gravatar found and set',
          profilePhoto: user.profilePhoto
        });
      }
    } catch (error) {
      // Gravatar not found, set random anime photo
      user.profilePhoto = getRandomAnimePhoto();
      await user.save();
      return res.json({
        success: true,
        message: 'No Gravatar found, random avatar set',
        profilePhoto: user.profilePhoto
      });
    }
  } catch (error) {
    console.error('Check Gravatar error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =================== ROUTES =================== //

// @route PUT /api/users/preferences
// @desc  Update user job preferences
// @access Private (job_seeker only)
router.put('/preferences', auth, async (req, res) => {
  try {
    if (req.user.role !== 'job_seeker') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.preferences = { ...user.preferences, ...req.body };
    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// @route POST /api/users/upload-resume
// @desc  Upload resume for job_seeker
// @access Private (job_seeker only)
router.post('/upload-resume', auth, upload.single('resume'), async (req, res) => {
  try {
    if (req.user.role !== 'job_seeker') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.resume = {
      filename: req.file.originalname,
      storedName: req.file.filename,
      path: `/uploads/resumes/${req.file.filename}`,
      uploadDate: new Date()
    };

    await user.save();

    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      resume: user.resume
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ success: false, message: 'Server error during resume upload' });
  }
});


// @route GET /api/users/profile
// @desc  Get user profile
// @access Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route PUT /api/users/profile
// @desc  Update user profile
// @access Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, companyName } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update allowed fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (companyName && user.role === 'job_poster') user.companyName = companyName;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        companyName: user.companyName
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
