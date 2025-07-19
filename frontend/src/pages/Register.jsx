import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Google Login Button Component
const GoogleLoginButton = () => {
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <button 
      type="button" 
      className="btn btn-google w-100 mb-3"
      onClick={handleGoogleLogin}
    >
      <svg className="google-icon" width="20" height="20" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continue with Google
    </button>
  );
};

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: '',
    companyName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (formData.role === 'job_poster' && !formData.companyName) {
      setError('Company name is required for job posters');
      setLoading(false);
      return;
    }

    const result = await register(formData);
    
    if (result.success) {
      if (result.user.role === 'job_seeker') {
        navigate('/preferences');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="container-sm py-5">
      <div className="card">
        <div className="card-body">
          <h2 className="text-center mb-4">Join JobPortal</h2>
          
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <GoogleLoginButton />
            
            <div className="divider">
              <span>or</span>
            </div>
            
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="role" className="form-label">I am a</label>
              <select
                id="role"
                name="role"
                className="form-control form-select"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="">Select your role</option>
                <option value="job_seeker">Job Seeker</option>
                <option value="job_poster">Job Poster</option>
              </select>
            </div>
            
            {formData.role === 'job_poster' && (
              <div className="form-group">
                <label htmlFor="companyName" className="form-label">Company Name</label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  className="form-control"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          
          <div className="text-center mt-3">
            <p className="text-muted">
              Already have an account? 
              <Link to="/login" className="text-primary"> Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;