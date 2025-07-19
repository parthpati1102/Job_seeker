import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-content d-flex justify-content-between align-items-center">
        <Link to="/" className="navbar-brand">
          JobPortal
        </Link>

        <div className="navbar-nav d-flex align-items-center gap-3">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              >
                Dashboard
              </Link>

              {user.role === 'job_poster' && (
                <>
                  <Link
                    to="/create-job"
                    className={`nav-link ${isActive('/create-job') ? 'active' : ''}`}
                  >
                    Create Job
                  </Link>
                  <Link
                    to="/job-management"
                    className={`nav-link ${isActive('/job-management') ? 'active' : ''}`}
                  >
                    Manage Jobs
                  </Link>
                  <Link
                    to="/manage-applications"
                    className={`nav-link ${isActive('/manage-applications') ? 'active' : ''}`}
                  >
                    Applications
                  </Link>
                </>
              )}

              {user.role === 'job_seeker' && (
                <>
                  <Link
                    to="/browse-jobs"
                    className={`nav-link ${isActive('/browse-jobs') ? 'active' : ''}`}
                  >
                    Browse Jobs
                  </Link>
                  <Link
                    to="/preferences"
                    className={`nav-link ${isActive('/preferences') ? 'active' : ''}`}
                  >
                    Preferences
                  </Link>
                  <Link
                    to="/activity"
                    className={`nav-link ${isActive('/activity') ? 'active' : ''}`}
                  >
                    Activity
                  </Link>
                </>
              )}

              <Link
                to="/profile"
                className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
              >
                <div className="nav-profile d-flex align-items-center gap-2">
                  {user.profilePhoto ? (
                    <img
                      src={user.profilePhoto.startsWith('http') ? user.profilePhoto : `http://localhost:5000${user.profilePhoto}`}
                      alt="Profile"
                      className="nav-avatar"
                    />
                  ) : (
                    <div className="nav-avatar-placeholder">
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <span>{user.name}</span>
                </div>
              </Link>

              <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`nav-link ${isActive('/login') ? 'active' : ''}`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
