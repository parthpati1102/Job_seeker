import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApplicationActivity = () => {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplicationData();
  }, []);

  const fetchApplicationData = async () => {
    try {
      const [applicationsResponse, statsResponse] = await Promise.all([
        axios.get('/applications/my-applications'),
        axios.get('/applications/stats')
      ]);
      
      setApplications(applicationsResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching application data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: 'badge-warning',
      reviewed: 'badge-info',
      accepted: 'badge-success',
      rejected: 'badge-danger'
    };
    return statusMap[status] || 'badge-secondary';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-3">Loading application activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="mb-4">
        <h1>Application Activity</h1>
        <p className="text-muted">
          Track your job applications and their status
        </p>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid mb-5">
        <div className="stat-card">
          <div className="stat-number">{stats.total || 0}</div>
          <div className="stat-label">Total Applications</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.today || 0}</div>
          <div className="stat-label">Applied Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.pending || 0}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.reviewed || 0}</div>
          <div className="stat-label">Reviewed</div>
        </div>
      </div>

      {/* Applications List */}
      <div className="card">
        <div className="card-header">
          <h3>Your Applications</h3>
        </div>
        <div className="card-body">
          {applications.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">You haven't applied to any jobs yet.</p>
              <a href="/browse-jobs" className="btn btn-primary">
                Start Browsing Jobs
              </a>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Location</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(application => (
                    <tr key={application._id}>
                      <td>
                        <strong>{application.job.title}</strong>
                      </td>
                      <td>{application.job.companyName}</td>
                      <td>{application.job.location}</td>
                      <td>{formatDate(application.appliedDate)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(application.status)}`}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Status Legend */}
      <div className="mt-4">
        <div className="card">
          <div className="card-body">
            <h5>Status Legend</h5>
            <div className="d-flex gap-3 flex-wrap">
              <div className="d-flex align-items-center">
                <span className="badge badge-warning me-2">Pending</span>
                <span>Application submitted, waiting for review</span>
              </div>
              <div className="d-flex align-items-center">
                <span className="badge badge-info me-2">Reviewed</span>
                <span>Application has been reviewed by employer</span>
              </div>
              <div className="d-flex align-items-center">
                <span className="badge badge-success me-2">Accepted</span>
                <span>Congratulations! You've been selected</span>
              </div>
              <div className="d-flex align-items-center">
                <span className="badge badge-danger me-2">Rejected</span>
                <span>Application was not successful</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationActivity;