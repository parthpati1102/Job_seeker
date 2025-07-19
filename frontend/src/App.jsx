import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import JobCreation from './pages/JobCreation';
import JobBrowse from './pages/JobBrowse';
import JobPreferences from './pages/JobPreferences';
import ApplicationActivity from './pages/ApplicationActivity';
import ApplicationManagement from './pages/ApplicationManagement';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import JobManagement from './pages/JobManagement';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

// OAuth Callback Component
const OAuthCallback = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    
    if (token && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        login(token, userData);
        
        // Redirect based on user role and profile completeness
        if (userData.role === 'job_seeker' && (!userData.preferences || !userData.preferences.jobRoles)) {
          navigate('/preferences');
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login?error=oauth_failed');
      }
    } else if (user) {
      // User is already logged in
      if (user.role === 'job_seeker' && (!user.preferences || !user.preferences.jobRoles)) {
        navigate('/preferences');
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, [user, login, navigate]);
  
  return <LoadingSpinner />;
};

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/login" 
            element={!user ? <Login /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/register" 
            element={!user ? <Register /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/forgot-password" 
            element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/reset-password" 
            element={!user ? <ResetPassword /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/create-job" 
            element={user?.role === 'job_poster' ? <JobCreation /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/browse-jobs" 
            element={user?.role === 'job_seeker' ? <JobBrowse /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/preferences" 
            element={user?.role === 'job_seeker' ? <JobPreferences /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/activity" 
            element={user?.role === 'job_seeker' ? <ApplicationActivity /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/manage-applications" 
            element={user?.role === 'job_poster' ? <ApplicationManagement /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/job-management" 
            element={user?.role === 'job_poster' ? <JobManagement /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/profile" 
            element={user ? <Profile /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/edit-profile" 
            element={user ? <EditProfile /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/auth/callback" 
            element={<OAuthCallback />} 
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;