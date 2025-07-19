const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const OTP = require('../models/OTP');
const PasswordReset = require('../models/PasswordReset');
const auth = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: 'Too many OTP requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: { message: 'Too many password reset requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Utility functions
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  const phoneRegex = /^\+91[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

const formatPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  return `+91${cleaned}`;
};

// 1️⃣ Send OTP to Email
router.post('/send-email-otp', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email: normalizedEmail, type: 'login' });

    // Create new OTP entry
    await OTP.create({
      email: normalizedEmail,
      otp: otp,
      type: 'login',
      expiresAt,
      attempts: 0
    });

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; font-size: 2rem; font-weight: 800;">JobPortal</h1>
            <p style="color: #6b7280; margin: 10px 0; font-size: 1.1rem;">Your Login Verification Code</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb); padding: 30px; border-radius: 15px; text-align: center; margin: 30px 0; border: 2px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin: 0; font-size: 2.5rem; letter-spacing: 8px; font-weight: 700;">${otp}</h2>
            <p style="color: #6b7280; margin: 10px 0; font-size: 0.9rem;">This code expires in 5 minutes</p>
          </div>
          
          <div style="margin: 30px 0;">
            <p style="color: #374151; line-height: 1.6; font-size: 1rem; margin-bottom: 20px;">
              Use this verification code to complete your login to JobPortal.
            </p>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-weight: 600;">
                🔒 <strong>Security Notice:</strong> Never share this code with anyone.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    await sendEmail(normalizedEmail, 'Your JobPortal Login Code', html);
    
    res.json({ 
      success: true,
      message: 'OTP sent to your email successfully',
      expiresIn: 300
    });
  } catch (err) {
    console.error('Send email OTP error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send OTP. Please try again.'
    });
  }
});

// 2️⃣ Send OTP to Phone
router.post('/send-phone-otp', otpLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const formattedPhone = formatPhoneNumber(phone);
    
    if (!isValidPhone(formattedPhone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid Indian phone number' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTP for this phone
    await OTP.deleteMany({ phone: formattedPhone, type: 'login' });

    // Create new OTP entry
    await OTP.create({
      phone: formattedPhone,
      otp: otp,
      type: 'login',
      expiresAt,
      attempts: 0
    });

    // For demo purposes, we'll just log the OTP (in production, use SMS service)
    console.log(`SMS OTP for ${formattedPhone}: ${otp}`);
    
    res.json({ 
      success: true,
      message: 'OTP sent to your phone successfully',
      expiresIn: 300,
      // Remove this in production
      debug_otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (err) {
    console.error('Send phone OTP error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send OTP. Please try again.'
    });
  }
});

// 3️⃣ Verify Email OTP and Login
router.post('/verify-email-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpString = otp.toString().trim();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    if (otpString.length !== 6 || !/^\d{6}$/.test(otpString)) {
      return res.status(400).json({ success: false, message: 'OTP must be exactly 6 digits' });
    }

    const otpEntry = await OTP.findOne({ 
      email: normalizedEmail,
      type: 'login',
      expiresAt: { $gt: new Date() },
      isUsed: false
    });
    
    if (!otpEntry) {
      return res.status(400).json({ success: false, message: 'OTP not found or expired. Please request a new OTP.' });
    }

    if (otpEntry.attempts >= 3) {
      await OTP.deleteOne({ email: normalizedEmail, type: 'login' });
      return res.status(400).json({ success: false, message: 'Too many invalid attempts. Please request a new OTP.' });
    }

    if (otpEntry.otp !== otpString) {
      await OTP.updateOne(
        { email: normalizedEmail, type: 'login' }, 
        { $inc: { attempts: 1 } }
      );
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    // Mark OTP as used
    await OTP.updateOne(
      { email: normalizedEmail, type: 'login' },
      { isUsed: true }
    );

    // Find or create user
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = new User({ 
        email: normalizedEmail, 
        name: email.split('@')[0],
        role: 'job_seeker',
        isActive: true,
        authProvider: 'email_otp'
      });
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
        preferences: user.preferences
      }
    });
  } catch (err) {
    console.error('Verify email OTP error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// 4️⃣ Verify Phone OTP and Login
router.post('/verify-phone-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone number and OTP are required' });
    }

    const formattedPhone = formatPhoneNumber(phone);
    const otpString = otp.toString().trim();

    if (!isValidPhone(formattedPhone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid phone number' });
    }

    if (otpString.length !== 6 || !/^\d{6}$/.test(otpString)) {
      return res.status(400).json({ success: false, message: 'OTP must be exactly 6 digits' });
    }

    const otpEntry = await OTP.findOne({ 
      phone: formattedPhone,
      type: 'login',
      expiresAt: { $gt: new Date() },
      isUsed: false
    });
    
    if (!otpEntry) {
      return res.status(400).json({ success: false, message: 'OTP not found or expired. Please request a new OTP.' });
    }

    if (otpEntry.attempts >= 3) {
      await OTP.deleteOne({ phone: formattedPhone, type: 'login' });
      return res.status(400).json({ success: false, message: 'Too many invalid attempts. Please request a new OTP.' });
    }

    if (otpEntry.otp !== otpString) {
      await OTP.updateOne(
        { phone: formattedPhone, type: 'login' }, 
        { $inc: { attempts: 1 } }
      );
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    // Mark OTP as used
    await OTP.updateOne(
      { phone: formattedPhone, type: 'login' },
      { isUsed: true }
    );

    // Find or create user
    let user = await User.findOne({ phone: formattedPhone });
    if (!user) {
      user = new User({ 
        phone: formattedPhone,
        name: `User_${formattedPhone.slice(-4)}`,
        role: 'job_seeker',
        isActive: true,
        authProvider: 'phone_otp'
      });
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
        preferences: user.preferences
      }
    });
  } catch (err) {
    console.error('Verify phone OTP error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again.'
    });
  }
});

// 5️⃣ Forgot Password - Send Reset Link
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ 
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link.' 
      });
    }

    // Delete any existing reset tokens for this email
    await PasswordReset.deleteMany({ email: normalizedEmail });

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Create password reset entry
    await PasswordReset.create({
      email: normalizedEmail,
      token: resetToken,
      expiresAt
    });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div style="background: white; border-radius: 20px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; font-size: 2rem; font-weight: 800;">JobPortal</h1>
            <p style="color: #6b7280; margin: 10px 0; font-size: 1.1rem;">Password Reset Request</p>
          </div>
          
          <div style="margin: 30px 0;">
            <p style="color: #374151; line-height: 1.6; font-size: 1rem; margin-bottom: 20px;">
              Hello ${user.name},
            </p>
            <p style="color: #374151; line-height: 1.6; font-size: 1rem; margin-bottom: 20px;">
              We received a request to reset your password for your JobPortal account. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 1rem;">
                Reset My Password
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 20px;">
              Or copy and paste this link in your browser:
            </p>
            <p style="color: #3b82f6; font-size: 0.9rem; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>
            
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 10px; margin: 30px 0;">
              <p style="margin: 0; color: #92400e; font-weight: 600;">
                🔒 <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    await sendEmail(normalizedEmail, 'Reset Your JobPortal Password', html);
    
    res.json({ 
      success: true,
      message: 'If an account with this email exists, you will receive a password reset link.' 
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to process password reset request. Please try again.'
    });
  }
});

// 6️⃣ Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    
    if (!token || !email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token, email, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Find valid reset token
    const resetEntry = await PasswordReset.findOne({
      email: normalizedEmail,
      token: token,
      expiresAt: { $gt: new Date() },
      isUsed: false
    });

    if (!resetEntry) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update password
    user.password = newPassword; // Will be hashed by pre-save middleware
    await user.save();

    // Mark reset token as used
    resetEntry.isUsed = true;
    await resetEntry.save();
    
    res.json({ 
      success: true,
      message: 'Password reset successful. You can now login with your new password.' 
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to reset password. Please try again.'
    });
  }
});

// Google OAuth setup (existing code)
let passport = null;
let GoogleStrategy = null;

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport = require("passport");
  GoogleStrategy = require("passport-google-oauth20").Strategy;

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "http://localhost:5000/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });
          if (user) return done(null, user);

          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            user.googleId = profile.id;
            user.authProvider = "google";
            user.profilePhoto = profile.photos?.[0]?.value || null;
            await user.save();
            return done(null, user);
          }

          const newUser = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            profilePhoto: profile.photos?.[0]?.value || null,
            authProvider: "google",
            role: "job_seeker",
            phone: "",
            isActive: true,
          });
          await newUser.save();
          done(null, newUser);
        } catch (err) {
          done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user._id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  router.get(
    "/google/callback",
    passport.authenticate("google", { session: false }),
    async (req, res) => {
      try {
        const token = jwt.sign(
          { userId: req.user._id, role: req.user.role },
          process.env.JWT_SECRET || "your-secret-key",
          { expiresIn: "7d" }
        );

        res.redirect(
          `http://localhost:5173/auth/callback?token=${token}&user=${encodeURIComponent(
            JSON.stringify({
              id: req.user._id,
              name: req.user.name,
              email: req.user.email,
              role: req.user.role,
              profilePhoto: req.user.profilePhoto,
              phone: req.user.phone,
            })
          )}`
        );
      } catch (error) {
        res.redirect("http://localhost:5173/login?error=oauth_failed");
      }
    }
  );
} else {
  router.get("/google", (req, res) =>
    res.status(501).json({ message: "Google OAuth not configured" })
  );
  router.get("/google/callback", (req, res) =>
    res.redirect("http://localhost:5173/login?error=oauth_not_configured")
  );
}

// Register route
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, role, companyName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const userData = { name, email, password, phone, role };
    if (role === "job_poster") userData.companyName = companyName;

    const user = new User(userData);
    await user.save();

    const emailHtml = `
      <div style="max-width: 600px; margin: auto; font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center;">
          <h2 style="color: #333;">Welcome to <span style="color: #4CAF50;">JobPortal</span>, ${name}!</h2>
        </div>
        <p style="font-size: 16px; color: #555;">
          Thank you for registering as a <strong>${
            role === "job_poster" ? "Job Poster" : "Job Seeker"
          }</strong> on our platform.
        </p>
        <hr style="border: none; border-top: 1px solid #ccc;" />
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        ${
          companyName
            ? `<p><strong>Company Name:</strong> ${companyName}</p>`
            : ""
        }
        <br />
        <div style="text-align: center; margin-top: 30px;">
          <a href="http://localhost:5173" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
        </div>
        <p style="margin-top: 40px; font-size: 13px; color: #aaa; text-align: center;">
          If you did not register on our platform, you can safely ignore this email.
        </p>
      </div>
    `;

    await sendEmail(email, "Welcome to JobPortal!", emailHtml);

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Email-password login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }
    
    // Check if user has a password (for users who registered via OTP)
    if (!user.password) {
      return res.status(400).json({ 
        success: false,
        message: 'This account was created using OTP. Please use OTP login or set a password first.' 
      });
    }
    
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        preferences: user.preferences,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get current user route
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;