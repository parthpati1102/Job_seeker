import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const JobCreation = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    jobType: '',
    workType: '',
    jobLevel: '',
    companyName: '',
    location: '',
    salary: {
      min: '',
      max: '',
      currency: 'USD'
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

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

      await axios.post('/jobs', jobData);
      setSuccess('Job created successfully!');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Job creation error:', error);
      setError(error.response?.data?.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-sm py-5">
      <div className="card">
        <div className="card-header">
          <h2>Create New Job Posting</h2>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title" className="form-label">Job Title</label>
              <input
                type="text"
                id="title"
                name="title"
                className="form-control"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            
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
            
            <div className="form-group">
              <label htmlFor="location" className="form-label">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                className="form-control"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="row">
              <div className="col-2">
                <div className="form-group">
                  <label htmlFor="jobType" className="form-label">Job Type</label>
                  <select
                    id="jobType"
                    name="jobType"
                    className="form-control form-select"
                    value={formData.jobType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select job type</option>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>
              <div className="col-2">
                <div className="form-group">
                  <label htmlFor="workType" className="form-label">Work Type</label>
                  <select
                    id="workType"
                    name="workType"
                    className="form-control form-select"
                    value={formData.workType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select work type</option>
                    <option value="remote">Remote</option>
                    <option value="on-site">On-site</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="jobLevel" className="form-label">Job Level</label>
              <select
                id="jobLevel"
                name="jobLevel"
                className="form-control form-select"
                value={formData.jobLevel}
                onChange={handleChange}
                required
              >
                <option value="">Select job level</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="executive">Executive</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="requiredSkills" className="form-label">Required Skills</label>
              <input
                type="text"
                id="requiredSkills"
                name="requiredSkills"
                className="form-control"
                value={formData.requiredSkills}
                onChange={handleChange}
                placeholder="e.g., JavaScript, React, Node.js (separate with commas)"
                required
              />
            </div>
            
            <div className="row">
              <div className="col-2">
                <div className="form-group">
                  <label htmlFor="salary.min" className="form-label">Min Salary</label>
                  <input
                    type="number"
                    id="salary.min"
                    name="salary.min"
                    className="form-control"
                    value={formData.salary.min}
                    onChange={handleChange}
                    placeholder="50000"
                  />
                </div>
              </div>
              <div className="col-2">
                <div className="form-group">
                  <label htmlFor="salary.max" className="form-label">Max Salary</label>
                  <input
                    type="number"
                    id="salary.max"
                    name="salary.max"
                    className="form-control"
                    value={formData.salary.max}
                    onChange={handleChange}
                    placeholder="80000"
                  />
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="description" className="form-label">Job Description</label>
              <textarea
                id="description"
                name="description"
                className="form-control form-textarea"
                value={formData.description}
                onChange={handleChange}
                rows="6"
                placeholder="Describe the job responsibilities, requirements, and benefits..."
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating Job...' : 'Create Job'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JobCreation;