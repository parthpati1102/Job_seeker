import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ApplicationManagement = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', notes: '' });
  const [updating, setUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/applications/my-job-applications');
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId) => {
    if (!statusUpdate.status) {
      alert('Please select a status');
      return;
    }

    setUpdating(true);
    try {
      const response = await axios.put(`/applications/${applicationId}/status`, statusUpdate);
      
      if (response.data.message) {
        // Update the application in the list
        setApplications(applications.map(app => 
          app._id === applicationId 
            ? { ...app, status: statusUpdate.status, notes: statusUpdate.notes }
            : app
        ));
        
        setSelectedApplication(null);
        setStatusUpdate({ status: '', notes: '' });
        alert('Application status updated successfully!');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert(error.response?.data?.message || 'Failed to update application status');
    } finally {
      setUpdating(false);
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openApplicationModal = (application) => {
    setSelectedApplication(application);
    setStatusUpdate({ status: application.status, notes: application.notes || '' });
  };

  const closeApplicationModal = () => {
    setSelectedApplication(null);
    setStatusUpdate({ status: '', notes: '' });
  };

  // Filter applications based on status and search term
  const filteredApplications = applications.filter(application => {
    const matchesStatus = filterStatus === 'all' || application.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      application.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.applicant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.applicant?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusCounts = () => {
    return {
      all: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      reviewed: applications.filter(app => app.status === 'reviewed').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      rejected: applications.filter(app => app.status === 'rejected').length
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-3">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
          <button className="btn btn-primary" onClick={fetchApplications}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1>Application Management</h1>
            <p className="text-muted">
              Review and manage applications for your job postings
            </p>
          </div>
          <Link to="/job-management" className="btn btn-secondary">
            Manage Jobs
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid mb-4">
        <div className="stat-card">
          <div className="stat-number">{statusCounts.all}</div>
          <div className="stat-label">📊 Total Applications</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{statusCounts.pending}</div>
          <div className="stat-label">⏳ Pending Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{statusCounts.reviewed}</div>
          <div className="stat-label">👀 Reviewed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{statusCounts.accepted}</div>
          <div className="stat-label">✅ Accepted</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <label className="form-label">Filter by Status</label>
              <select 
                className="form-control form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Applications ({statusCounts.all})</option>
                <option value="pending">Pending ({statusCounts.pending})</option>
                <option value="reviewed">Reviewed ({statusCounts.reviewed})</option>
                <option value="accepted">Accepted ({statusCounts.accepted})</option>
                <option value="rejected">Rejected ({statusCounts.rejected})</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Search Applications</label>
              <input 
                type="text"
                className="form-control"
                placeholder="Search by job title, applicant name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="text-center py-5">
          <div className="card">
            <div className="card-body">
              <h3>No Applications Found</h3>
              <p className="text-muted">
                {applications.length === 0 
                  ? 'No applications received yet.' 
                  : 'No applications match your current filters.'
                }
              </p>
              {applications.length === 0 && (
                <Link to="/create-job" className="btn btn-primary">
                  Create Your First Job
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3>Applications ({filteredApplications.length})</h3>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Applicant</th>
                    <th>Contact</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map(application => (
                    <tr key={application._id}>
                      <td>
                        <strong>{application.job?.title || 'N/A'}</strong>
                        <br />
                        <small className="text-muted">{application.job?.companyName || 'N/A'}</small>
                      </td>
                      <td>{application.applicant?.name || 'N/A'}</td>
                      <td>
                        <div>{application.applicant?.email || 'N/A'}</div>
                        <small className="text-muted">{application.applicant?.phone || 'N/A'}</small>
                      </td>
                      <td>{formatDate(application.appliedDate || application.createdAt)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(application.status)}`}>
                          {application.status?.charAt(0).toUpperCase() + application.status?.slice(1) || 'Unknown'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => openApplicationModal(application)}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Application Review Modal */}
      {selectedApplication && (
        <div className="modal-overlay" onClick={closeApplicationModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Review Application</h3>
              <button className="btn btn-sm btn-secondary" onClick={closeApplicationModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="mb-4">
                <h4>{selectedApplication.job?.title || 'Job Title N/A'}</h4>
                <p className="text-muted">
                  Applied on {formatDate(selectedApplication.appliedDate || selectedApplication.createdAt)}
                </p>
              </div>

              <div className="mb-4">
                <h5>Applicant Details</h5>
                <div className="row">
                  <div className="col-6">
                    <p><strong>Name:</strong> {selectedApplication.applicant?.name || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedApplication.applicant?.email || 'N/A'}</p>
                  </div>
                  <div className="col-6">
                    <p><strong>Phone:</strong> {selectedApplication.applicant?.phone || 'N/A'}</p>
                    {selectedApplication.applicant?.resume && (
                      <p>
                        <strong>Resume:</strong> 
                        <a 
                          href={`http://localhost:5000${selectedApplication.applicant.resume.path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ms-2"
                        >
                          {selectedApplication.applicant.resume.filename}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h5>Update Status</h5>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control form-select"
                    value={statusUpdate.status}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={statusUpdate.notes}
                    onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                    placeholder="Add any notes for the applicant..."
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button 
                  className="btn btn-secondary" 
                  onClick={closeApplicationModal}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleStatusUpdate(selectedApplication._id)}
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationManagement;