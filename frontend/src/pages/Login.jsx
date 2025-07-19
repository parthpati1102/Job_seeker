import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

// Google Login Button
const GoogleLoginButton = () => {
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  return (
    <button
      type="button"
      className="btn btn-google w-100 mb-4"
      onClick={handleGoogleLogin}
    >
      <svg className="google-icon" width="20" height="20" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Continue with Google
    </button>
  );
};

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    otp: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loginMode, setLoginMode] = useState("password"); // 'password', 'email_otp', 'phone_otp'
  const [otpTimer, setOtpTimer] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((timer) => timer - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
      return `+${cleaned}`;
    }
    return `+91${cleaned}`;
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 6) {
      setFormData({ ...formData, otp: value });
    }
  };

  const handleSendEmailOtp = async () => {
    const email = formData.email.trim().toLowerCase();
    if (!email) {
      setError("Please enter your email first.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await axios.post("/auth/send-email-otp", { email });

      if (response.data.success) {
        setOtpSent(true);
        setOtpTimer(60);
        setSuccess("OTP sent to your email successfully!");
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      const errorMessage = err.response?.data?.message || "Failed to send OTP.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    const phone = formData.phone.trim();
    if (!phone) {
      setError("Please enter your phone number first.");
      return;
    }

    const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ""))) {
      setError("Please enter a valid Indian phone number.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const formattedPhone = formatPhoneNumber(phone);
      const response = await axios.post("/auth/send-phone-otp", {
        phone: formattedPhone,
      });

      if (response.data.success) {
        setOtpSent(true);
        setOtpTimer(60);
        setSuccess("OTP sent to your phone successfully!");
        
        // Show debug OTP in development
        if (response.data.debug_otp) {
          setSuccess(`OTP sent! Debug OTP: ${response.data.debug_otp}`);
        }
      }
    } catch (err) {
      console.error("Send phone OTP error:", err);
      const errorMessage = err.response?.data?.message || "Failed to send OTP.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailOtpLogin = async () => {
    const email = formData.email.trim().toLowerCase();
    const otp = formData.otp.trim();

    if (!email || !otp) {
      setError("Email and OTP are required.");
      return;
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError("OTP must be exactly 6 digits.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post("/auth/verify-email-otp", { email, otp });

      if (response.data.success) {
        const { token, user } = response.data;
        login(token, user);
        setSuccess("Login successful! Redirecting...");
        
        // Redirect based on user role and profile completeness
        setTimeout(() => {
          if (user.role === 'job_seeker' && (!user.preferences || !user.preferences.jobRoles)) {
            navigate("/preferences");
          } else {
            navigate("/dashboard");
          }
        }, 1500);
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      const errorMessage = err.response?.data?.message || "OTP verification failed.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneOtpLogin = async () => {
    const phone = formData.phone.trim();
    const otp = formData.otp.trim();

    if (!phone || !otp) {
      setError("Phone number and OTP are required.");
      return;
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError("OTP must be exactly 6 digits.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formattedPhone = formatPhoneNumber(phone);
      const response = await axios.post("/auth/verify-phone-otp", {
        phone: formattedPhone,
        otp,
      });

      if (response.data.success) {
        const { token, user } = response.data;
        login(token, user);
        setSuccess("Login successful! Redirecting...");
        
        // Redirect based on user role and profile completeness
        setTimeout(() => {
          if (user.role === 'job_seeker' && (!user.preferences || !user.preferences.jobRoles)) {
            navigate("/preferences");
          } else {
            navigate("/dashboard");
          }
        }, 1500);
      }
    } catch (err) {
      console.error("Phone OTP verification error:", err);
      const errorMessage = err.response?.data?.message || "OTP verification failed.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await login(email, password);
      if (result.success) {
        setSuccess("Login successful! Redirecting...");
        setTimeout(() => {
          if (result.user.role === 'job_seeker' && (!result.user.preferences || !result.user.preferences.jobRoles)) {
            navigate("/preferences");
          } else {
            navigate("/dashboard");
          }
        }, 1500);
      } else {
        setError(result.error || "Invalid credentials");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loginMode === "email_otp") {
      return handleEmailOtpLogin();
    }
    
    if (loginMode === "phone_otp") {
      return handlePhoneOtpLogin();
    }
    
    // Password login
    return handlePasswordLogin();
  };

  const toggleLoginMode = (mode) => {
    setLoginMode(mode);
    setOtpSent(false);
    setOtpTimer(0);
    setFormData({ email: "", phone: "", password: "", otp: "" });
    setError("");
    setSuccess("");
  };

  const resendOtp = () => {
    if (loginMode === "email_otp") {
      handleSendEmailOtp();
    } else if (loginMode === "phone_otp") {
      handleSendPhoneOtp();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-icon">🚀</div>
            <h1>Welcome Back</h1>
            <p>Sign in to your JobPortal account</p>
          </div>
        </div>

        <div className="auth-body">
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <span className="alert-icon">✅</span>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <GoogleLoginButton />
            
            <div className="divider">
              <span>or continue with</span>
            </div>

            {/* Login Mode Selection */}
            <div className="login-mode-selector">
              <button
                type="button"
                className={`mode-btn ${loginMode === "password" ? "active" : ""}`}
                onClick={() => toggleLoginMode("password")}
              >
                <span className="mode-icon">🔑</span>
                Password
              </button>
              <button
                type="button"
                className={`mode-btn ${loginMode === "email_otp" ? "active" : ""}`}
                onClick={() => toggleLoginMode("email_otp")}
              >
                <span className="mode-icon">📧</span>
                Email OTP
              </button>
              <button
                type="button"
                className={`mode-btn ${loginMode === "phone_otp" ? "active" : ""}`}
                onClick={() => toggleLoginMode("phone_otp")}
              >
                <span className="mode-icon">📱</span>
                Phone OTP
              </button>
            </div>

            {/* Email Input */}
            {(loginMode === "password" || loginMode === "email_otp") && (
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <span className="label-icon">📧</span>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
            )}

            {/* Phone Input */}
            {loginMode === "phone_otp" && (
              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  <span className="label-icon">📱</span>
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="form-control"
                  placeholder="+91 XXXXXXXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {/* Password Input */}
            {loginMode === "password" && (
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  <span className="label-icon">🔒</span>
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-control"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
                <div className="form-help">
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot your password?
                  </Link>
                </div>
              </div>
            )}

            {/* OTP Input and Send Button */}
            {(loginMode === "email_otp" || loginMode === "phone_otp") && (
              <div className="otp-section">
                <div className="form-group">
                  <label htmlFor="otp" className="form-label">
                    <span className="label-icon">🔢</span>
                    Enter OTP
                  </label>
                  <div className="otp-input-group">
                    <input
                      type="text"
                      id="otp"
                      name="otp"
                      className="form-control otp-input"
                      value={formData.otp}
                      onChange={handleOtpChange}
                      placeholder="000000"
                      maxLength="6"
                      required
                    />
                    <button
                      type="button"
                      className="otp-send-btn"
                      onClick={
                        loginMode === "email_otp"
                          ? handleSendEmailOtp
                          : handleSendPhoneOtp
                      }
                      disabled={loading || otpTimer > 0}
                    >
                      {otpTimer > 0
                        ? `${otpTimer}s`
                        : otpSent
                        ? "Resend"
                        : "Send OTP"}
                    </button>
                  </div>
                </div>

                {otpSent && otpTimer === 0 && (
                  <div className="resend-section">
                    <p className="resend-text">Didn't receive the code?</p>
                    <button
                      type="button"
                      className="resend-btn"
                      onClick={resendOtp}
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-auth"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">
                  <span className="spinner"></span>
                  Processing...
                </span>
              ) : loginMode === "email_otp" ? (
                "Verify Email OTP"
              ) : loginMode === "phone_otp" ? (
                "Verify Phone OTP"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{" "}
              <Link to="/register" className="auth-link">
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;