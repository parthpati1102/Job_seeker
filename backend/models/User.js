const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: function () {
        return !this.phone; // Email not required if phone is provided
      },
      unique: true,
      sparse: true, // Allow multiple null values
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId && this.authProvider === "local"; // Password not required for OAuth or OTP users
      },
      minlength: 6,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ["local", "email_otp", "phone_otp", "google"],
      default: "email_otp",
    },
    phone: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
    },
    role: {
      type: String,
      enum: ["job_seeker", "job_poster"],
      required: true,
    },
    companyName: {
      type: String,
      required: function () {
        return this.role === "job_poster";
      },
    },
    // Job seeker specific fields
    preferences: {
      jobRoles: [String],
      jobType: {
        type: String,
        enum: ["remote", "on-site", "hybrid"],
      },
      jobLevel: {
        type: String,
        enum: ["entry", "mid", "senior", "executive"],
      },
      preferredLocations: [String],
      skills: [String],
    },
    resume: {
      filename: String,
      path: String,
      uploadDate: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
