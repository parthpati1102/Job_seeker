import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  const API_URL = 'http://localhost:5000/api';
  axios.defaults.baseURL = API_URL;

  // Set auth token in axios headers
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  };

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch current user
  const fetchUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Login function - handles both token/user object and email/password
  const login = async (emailOrToken, passwordOrUser) => {
    try {
      // If first parameter is a token (string) and second is user object
      if (typeof emailOrToken === 'string' && typeof passwordOrUser === 'object') {
        const token = emailOrToken;
        const user = passwordOrUser;
        setAuthToken(token);
        setUser(user);
        return { success: true, user };
      }
      
      // Email/password login
      const email = emailOrToken;
      const password = passwordOrUser;
      
      const response = await axios.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, user } = response.data;
        setAuthToken(token);
        setUser(user);
        return { success: true, user };
      } else {
        return { success: false, error: response.data.message };
      }
      
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData);
      const { token, user } = response.data;
      
      setAuthToken(token);
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  // Logout function
  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  // Update user preferences
  const updatePreferences = async (preferences) => {
    try {
      const response = await axios.put('/users/preferences', preferences);
      if (response.data.success) {
        setUser(prev => ({ ...prev, preferences: response.data.preferences }));
        return { success: true };
      } else {
        return { success: false, error: 'Failed to update preferences' };
      }
    } catch (error) {
      console.error('Update preferences error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Update failed' 
      };
    }
  };

  // Upload resume
  const uploadResume = async (file) => {
    try {
      const formData = new FormData();
      formData.append('resume', file);
      
      const response = await axios.post('/users/upload-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setUser(prev => ({ ...prev, resume: response.data.resume }));
        return { success: true };
      } else {
        return { success: false, error: 'Failed to upload resume' };
      }
    } catch (error) {
      console.error('Resume upload error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Upload failed' 
      };
    }
  };

  // Upload profile photo
  const uploadProfilePhoto = async (file) => {
    try {
      const formData = new FormData();
      formData.append('profilePhoto', file);
      
      const response = await axios.post('/users/upload-profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setUser(prev => ({ ...prev, profilePhoto: response.data.profilePhoto }));
        return { success: true };
      } else {
        return { success: false, error: 'Failed to upload profile photo' };
      }
    } catch (error) {
      console.error('Profile photo upload error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Upload failed' 
      };
    }
  };

  // Set random avatar
  const setRandomAvatar = async () => {
    try {
      const response = await axios.post('/users/set-random-avatar');
      
      if (response.data.success) {
        setUser(prev => ({ ...prev, profilePhoto: response.data.profilePhoto }));
        return { success: true };
      } else {
        return { success: false, error: 'Failed to set random avatar' };
      }
    } catch (error) {
      console.error('Set random avatar error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to set avatar' 
      };
    }
  };

  // Check Gravatar
  const checkGravatar = async () => {
    try {
      const response = await axios.post('/users/check-gravatar');
      
      if (response.data.success) {
        setUser(prev => ({ ...prev, profilePhoto: response.data.profilePhoto }));
        return { success: true, message: response.data.message };
      } else {
        return { success: false, error: 'Failed to check Gravatar' };
      }
    } catch (error) {
      console.error('Check Gravatar error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to check Gravatar' 
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updatePreferences,
    uploadResume,
    uploadProfilePhoto,
    setRandomAvatar,
    checkGravatar
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};