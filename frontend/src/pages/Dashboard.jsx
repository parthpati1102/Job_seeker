import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      if (user?.role === 'job_seeker') {
        const statsResponse = await axios.get('/applications/stats');
        setStats(statsResponse.data);
      } else if (user?.role === 'job_poster') {
        const jobsResponse = await axios.get('/jobs/my-jobs');
        setJobs(jobsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="mb-4">
        <h1>Welcome to your Dashboard</h1>
        <p className="text-muted">
          {user?.role === 'job_seeker' 
            ? 'Track your job applications and discover new opportunities'
            : 'Manage your job postings and review applications'
          }
        </p>
      </div>

      {user?.role === 'job_seeker' ? (
        <JobSeekerDashboard stats={stats} />
      ) : (
        <JobPosterDashboard jobs={jobs} />
      )}
    </div>
  );
};

const JobSeekerDashboard = ({ stats }) => {
  const { user } = useAuth();
  
  const needsPreferences = !user?.preferences || 
    !user.preferences.jobRoles || 
    user.preferences.jobRoles.length === 0;

  return (
    <div>
      {needsPreferences && (
        <div className="alert alert-info mb-4" style={{
          background: 'linear-gradient(135deg, var(--primary-50), var(--accent-50))',
          border: '2px solid var(--primary-200)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)'
        }}>
          <h4 style={{color: 'var(--primary-800)', marginBottom: 'var(--space-3)'}}>🚀 Unlock Your Potential</h4>
          <p style={{color: 'var(--primary-700)', marginBottom: 'var(--space-4)'}}>Set your job preferences to receive AI-powered job recommendations tailored just for you. Get matched with opportunities that align with your career goals!</p>
          <Link to="/preferences" className="btn btn-warning">
            ⚙️ Set Preferences
          </Link>
          <Link to="/browse-jobs" className="btn btn-secondary ms-2">
            🌍 Browse All Jobs
          </Link>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="stat-card" style={{background: 'linear-gradient(135deg, white, var(--primary-50))'}}>
          <div className="stat-number">{stats.total || 0}</div>
          <div className="stat-label">📊 Total Applications</div>
        </div>
        <div className="stat-card" style={{background: 'linear-gradient(135deg, white, var(--secondary-50))'}}>
          <div className="stat-number">{stats.today || 0}</div>
          <div className="stat-label">🎯 Applied Today</div>
        </div>
        <div className="stat-card" style={{background: 'linear-gradient(135deg, white, var(--warning-50))'}}>
          <div className="stat-number">{stats.pending || 0}</div>
          <div className="stat-label">⏳ Pending Review</div>
        </div>
        <div className="stat-card" style={{background: 'linear-gradient(135deg, white, var(--accent-50))'}}>
          <div className="stat-number">{stats.reviewed || 0}</div>
          <div className="stat-label">✅ Reviewed</div>
        </div>
      </div>

      <div className="row">
        <div className="col-2">
          <div className="card" style={{background: 'linear-gradient(135deg, white, var(--primary-50))'}}>
            <div className="card-body text-center">
              <div style={{fontSize: '3rem', marginBottom: 'var(--space-4)'}}>🔍</div>
              <h4 className="mb-3" style={{color: 'var(--gray-800)'}}>Discover Opportunities</h4>
              <p className="text-muted mb-3" style={{fontSize: '0.95rem'}}>
                Find your next career move with AI-powered job matching
              </p>
              <Link to="/browse-jobs" className="btn btn-primary">
                🚀 Start Browsing
              </Link>
            </div>
          </div>
        </div>
        <div className="col-2">
          <div className="card" style={{background: 'linear-gradient(135deg, white, var(--secondary-50))'}}>
            <div className="card-body text-center">
              <div style={{fontSize: '3rem', marginBottom: 'var(--space-4)'}}>📈</div>
              <h4 className="mb-3" style={{color: 'var(--gray-800)'}}>Track Progress</h4>
              <p className="text-muted mb-3" style={{fontSize: '0.95rem'}}>
                Monitor your applications and get real-time updates
              </p>
              <Link to="/activity" className="btn btn-secondary">
                📊 View Activity
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const JobPosterDashboard = ({ jobs }) => {
  const totalApplications = jobs.reduce((sum, job) => sum + job.applications.length, 0);
  const activeJobs = jobs.filter(job => job.isActive).length;

  return (
    <div>
      <div className="dashboard-grid">
        <div className="stat-card" style={{background: 'linear-gradient(135deg, white, var(--primary-50))'}}>
          <div className="stat-number">{jobs.length}</div>
          <div className="stat-label">💼 Total Jobs Posted</div>
        </div>
        <div className="stat-card" style={{background: 'linear-gradient(135deg, white, var(--secondary-50))'}}>
          <div className="stat-number">{activeJobs}</div>
          <div className="stat-label">🟢 Active Jobs</div>
        </div>
        <div className="stat-card" style={{background: 'linear-gradient(135deg, white, var(--accent-50))'}}>
          <div className="stat-number">{totalApplications}</div>
          <div className="stat-label">📋 Total Applications</div>
        </div>
        <div className="stat-card" style={{background: 'linear-gradient(135deg, white, var(--warning-50))'}}>
          <div className="stat-number">{jobs.length - activeJobs}</div>
          <div className="stat-label">⏸️ Closed Jobs</div>
        </div>
      </div>

      <div className="row">
        <div className="col-2">
          <div className="card" style={{background: 'linear-gradient(135deg, white, var(--primary-50))'}}>
            <div className="card-body text-center">
              <div style={{fontSize: '3rem', marginBottom: 'var(--space-4)'}}>➕</div>
              <h4 className="mb-3" style={{color: 'var(--gray-800)'}}>Post New Job</h4>
              <p className="text-muted mb-3" style={{fontSize: '0.95rem'}}>
                Create compelling job listings and attract top talent
              </p>
              <Link to="/create-job" className="btn btn-primary">
                ✨ Create Job
              </Link>
            </div>
          </div>
        </div>
        <div className="col-2">
          <div className="card" style={{background: 'linear-gradient(135deg, white, var(--secondary-50))'}}>
            <div className="card-body text-center">
              <div style={{fontSize: '3rem', marginBottom: 'var(--space-4)'}}>📊</div>
              <h4 className="mb-3" style={{color: 'var(--gray-800)'}}>Manage Jobs</h4>
              <p className="text-muted mb-3" style={{fontSize: '0.95rem'}}>
                {jobs.length > 0 ? 'Edit and track your job postings' : 'No jobs posted yet'}
              </p>
              {jobs.length > 0 ? (
                <div className="text-left">
                  {jobs.slice(0, 3).map(job => (
                    <div key={job._id} className="mb-2" style={{
                      padding: 'var(--space-2)',
                      background: 'var(--gray-50)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem'
                    }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <span style={{fontWeight: '500', color: 'var(--gray-700)'}}>{job.title}</span>
                        <span className="badge badge-primary">{job.applications.length}</span>
                      </div>
                    </div>
                  ))}
                  <Link to="/job-management" className="btn btn-secondary btn-sm mt-2">
                    📋 View All
                  </Link>
                </div>
              ) : (
                <Link to="/create-job" className="btn btn-secondary">
                  🚀 Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;