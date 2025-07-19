import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const JobManagement = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get('/jobs/my-jobs');
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      requiredSkills: job.requiredSkills.join(', '),
      jobType: job.jobType,
      workType: job.workType,
      jobLevel: job.jobLevel,
      companyName: job.companyName,
      location: job.location,
      salary: {
        min: job.salary?.min || '',
        max: job.salary?.max || '',
        currency: job.salary?.currency || 'USD'
      }
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const jobData = {
        ...formData,
        requiredSkills: formData.requiredSkills.split(',').map(skill => skill.trim()),
        salary: {
          min: formData.salary.min ? Number(formData.salary.min) : undefined,
          max: formData.salary.max ? Number(formData.salary.max) : undefined,
          currency: formData.salary.currency
        }
      };

      await axios.put(`/jobs/${editingJob._id}`, jobData);
      
      // Update the job in the list
      setJobs(jobs.map(job => 
        job._id === editingJob._id 
          ? { ...job, ...jobData }
          : job
      ));
      
      setEditingJob(null);
      alert('Job updated successfully!');
    } catch (error) {
      console.error('Error updating job:', error);
      alert('Failed to update job');
    }
  };

  const handleDelete = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      try {
        await axios.delete(`/jobs/${jobId}`);
        setJobs(jobs.filter(job => job._id !== jobId));
        alert('Job deleted successfully!');
      } catch (error) {
        console.error('Error deleting job:', error);
        alert('Failed to delete job');
      }
    }
  };

  const handleToggleStatus = async (jobId, currentStatus) => {
    try {
      await axios.put(`/jobs/${jobId}`, { isActive: !currentStatus });
      setJobs(jobs.map(job => 
        job._id === jobId 
          ? { ...job, isActive: !currentStatus }
          : job
      ));
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Failed to update job status');
    }
  };

  const handleChange = (e) => {
    if (e.target.name.startsWith('salary.')) {
      const salaryField = e.target.name.split('.')[1];
      setFormData({
        ...formData,
        salary: {
          ...formData.salary,
          [salaryField]: e.target.value
        }
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-3">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="job-management-header">
        <div>
          <h1>Job Management</h1>
          <p className="text-muted">Manage your job postings and track applications</p>
        </div>
        <Link to="/create-job" className="btn btn-primary">
          Create New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-5">
          <h3>No jobs posted yet</h3>
          <p className="text-muted">Create your first job posting to get started</p>
          <Link to="/create-job" className="btn btn-primary">
            Create Job
          </Link>
        </div>
      ) : (
        <div className="job-list">
          {jobs.map(job => (
            <div key={job._id} className="job-item">
              <div className="job-item-header">
                <div>
                  <h3>{job.title}</h3>
                  <p className="text-muted">{job.companyName} • {job.location}</p>
                </div>
                <div className="job-item-actions">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => setSelectedJob(job)}
                  >
                    View
                  </button>
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => handleEdit(job)}
                  >
                    Edit
                  </button>
                  <button 
                    className={`btn btn-sm ${job.isActive ? 'btn-warning' : 'btn-success'}`}
                    onClick={() => handleToggleStatus(job._id, job.isActive)}
                  >
                    {job.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(job._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="job-item-meta">
                <span>Posted: {formatDate(job.createdAt)}</span>
                <span>Type: {job.jobType}</span>
                <span>Work: {job.workType}</span>
                <span>Level: {job.jobLevel}</span>
                <span className={`badge ${job.isActive ? 'badge-success' : 'badge-secondary'}`}>
                  {job.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="mt-2">
                <span className="applications-count">
                  {job.applications.length} Application{job.applications.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedJob.title}</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setSelectedJob(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <h5 className="text-primary">{selectedJob.companyName}</h5>
                <p className="text-muted">{selectedJob.location}</p>
              </div>
              
              <div className="mb-3">
                <span className="badge badge-primary me-2">{selectedJob.jobType}</span>
                <span className="badge badge-secondary me-2">{selectedJob.workType}</span>
                <span className="badge badge-success">{selectedJob.jobLevel}</span>
              </div>
              
              {selectedJob.salary?.min && (
                <div className="mb-3">
                  <strong>Salary:</strong>
                  <span className="text-success ms-2">
                    ${selectedJob.salary.min.toLocaleString()}
                    {selectedJob.salary.max && ` - $${selectedJob.salary.max.toLocaleString()}`}
                  </span>
                </div>
              )}
              
              <div className="mb-3">
                <strong>Required Skills:</strong>
                <div className="mt-2">
                  {selectedJob.requiredSkills.map((skill, index) => (
                    <span key={index} className="badge badge-secondary me-1 mb-1">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mb-3">
                <strong>Job Description:</strong>
                <p className="mt-2">{selectedJob.description}</p>
              </div>
              
              <div className="mb-3">
                <strong>Posted:</strong> {formatDate(selectedJob.createdAt)}
              </div>
              
              <div className="mb-3">
                <strong>Applications:</strong> {selectedJob.applications.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {editingJob && (
        <div className="modal-overlay" onClick={() => setEditingJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Job</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setEditingJob(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdate}>
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input
                    type="text"
                    name="title"
                    className="form-control"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    className="form-control"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    name="location"
                    className="form-control"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Job Type</label>
                      <select
                        name="jobType"
                        className="form-control form-select"
                        value={formData.jobType}
                        onChange={handleChange}
                        required
                      >
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Work Type</label>
                      <select
                        name="workType"
                        className="form-control form-select"
                        value={formData.workType}
                        onChange={handleChange}
                        required
                      >
                        <option value="remote">Remote</option>
                        <option value="on-site">On-site</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Job Level</label>
                  <select
                    name="jobLevel"
                    className="form-control form-select"
                    value={formData.jobLevel}
                    onChange={handleChange}
                    required
                  >
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Required Skills</label>
                  <input
                    type="text"
                    name="requiredSkills"
                    className="form-control"
                    value={formData.requiredSkills}
                    onChange={handleChange}
                    placeholder="Separate with commas"
                    required
                  />
                </div>
                
                <div className="row">
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Min Salary</label>
                      <input
                        type="number"
                        name="salary.min"
                        className="form-control"
                        value={formData.salary?.min}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="form-group">
                      <label className="form-label">Max Salary</label>
                      <input
                        type="number"
                        name="salary.max"
                        className="form-control"
                        value={formData.salary?.max}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Job Description</label>
                  <textarea
                    name="description"
                    className="form-control form-textarea"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    required
                  />
                </div>
                
                <div className="d-flex gap-2 justify-content-end">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setEditingJob(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Job
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobManagement;