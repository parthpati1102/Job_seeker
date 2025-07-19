import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post('/auth/forgot-password', { 
        email: email.trim().toLowerCase() 
      });

      if (response.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">📧</div>
              <h1>Check Your Email</h1>
              <p>We've sent password reset instructions to your email</p>
            </div>
          </div>

          <div className="auth-body">
            <div className="success-message">
              <div className="success-icon">✅</div>
              <h3>Email Sent Successfully!</h3>
              <p>
                If an account with <strong>{email}</strong> exists, you will receive a password reset link shortly.
              </p>
              <p className="help-text">
                Check your spam folder if you don't see the email in your inbox.
              </p>
            </div>

            <div className="auth-actions">
              <Link to="/login" className="btn btn-primary btn-auth">
                Back to Login
              </Link>
              <button 
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                className="btn btn-secondary btn-auth"
              >
                Try Different Email
              </button>
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
            <div className="logo-icon">🔑</div>
            <h1>Forgot Password?</h1>
            <p>No worries! Enter your email and we'll send you reset instructions</p>
          </div>
        </div>

        <div className="auth-body">
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <span className="label-icon">📧</span>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Enter your email address"
                required
              />
              <div className="form-help">
                Enter the email address associated with your account
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-auth"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">
                  <span className="spinner"></span>
                  Sending...
                </span>
              ) : (
                'Send Reset Instructions'
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

export default ForgotPassword;