import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    if (!tokenParam || !emailParam) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }
    
    setToken(tokenParam);
    setEmail(emailParam);
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { newPassword, confirmPassword } = formData;
    
    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post('/auth/reset-password', {
        token,
        email,
        newPassword
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">❌</div>
              <h1>Invalid Reset Link</h1>
              <p>This password reset link is invalid or has expired</p>
            </div>
          </div>

          <div className="auth-body">
            <div className="error-message">
              <p>The password reset link you clicked is invalid or has expired.</p>
              <p>Please request a new password reset to continue.</p>
            </div>

            <div className="auth-actions">
              <Link to="/forgot-password" className="btn btn-primary btn-auth">
                Request New Reset
              </Link>
              <Link to="/login" className="btn btn-secondary btn-auth">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">✅</div>
              <h1>Password Reset Successful!</h1>
              <p>Your password has been updated successfully</p>
            </div>
          </div>

          <div className="auth-body">
            <div className="success-message">
              <div className="success-icon">🎉</div>
              <h3>All Set!</h3>
              <p>
                Your password has been reset successfully. You can now login with your new password.
              </p>
              <p className="help-text">
                Redirecting to login page in a few seconds...
              </p>
            </div>

            <div className="auth-actions">
              <Link to="/login" className="btn btn-primary btn-auth">
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-icon">🔒</div>
            <h1>Reset Your Password</h1>
            <p>Enter your new password below</p>
          </div>
        </div>

        <div className="auth-body">
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="reset-info">
            <p>
              <strong>Email:</strong> {email}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="newPassword" className="form-label">
                <span className="label-icon">🔒</span>
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                className="form-control"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter your new password"
                required
              />
              <div className="form-help">
                Password must be at least 6 characters long
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                <span className="label-icon">🔒</span>
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-auth"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">
                  <span className="spinner"></span>
                  Resetting...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Remember your password?{' '}
              <Link to="/login" className="auth-link">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;