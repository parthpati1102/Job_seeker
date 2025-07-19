import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const JobBrowse = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [error, setError] = useState('');
  const [showingAll, setShowingAll] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    jobType: '',
    workType: '',
    jobLevel: '',
    location: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async (showAll = false) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching jobs for user role:', user?.role);
      console.log('Show all requested:', showAll);
      
      let endpoint;
      if (user?.role === 'job_seeker') {
        endpoint = showAll ? '/jobs/all-available' : '/jobs/browse';
      } else {
        endpoint = '/jobs/all';
      }
      
      console.log('Using endpoint:', endpoint);
      
      const response = await axios.get(endpoint);
      
      console.log('Fetched jobs:', response.data);
      setJobs(response.data);
      setShowingAll(showAll);
      
      if (response.data.length === 0) {
        if (showAll) {
          setError('No jobs available at the moment. Check back later or create some job postings!');
        } else {
          setError('No jobs match your preferences. Try viewing all jobs or updating your preferences.');
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError(`Failed to load jobs: ${error.response?.data?.message || error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAllJobs = () => {
    fetchJobs(true);
  };

  const handleShowPreferredJobs = () => {
    fetchJobs(false);
  };

  const applyFilters = () => {
    let filteredJobs = [...allJobs];
    
    if (filterOptions.jobType) {
      filteredJobs = filteredJobs.filter(job => job.jobType === filterOptions.jobType);
    }
    
    if (filterOptions.workType) {
      filteredJobs = filteredJobs.filter(job => job.workType === filterOptions.workType);
    }
    
    if (filterOptions.jobLevel) {
      filteredJobs = filteredJobs.filter(job => job.jobLevel === filterOptions.jobLevel);
    }
    
    if (filterOptions.location) {
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes(filterOptions.location.toLowerCase())
      );
    }
    
    setJobs(filteredJobs);
    setCurrentJobIndex(0);
  };

  const clearFilters = () => {
    setFilterOptions({
      jobType: '',
      workType: '',
      jobLevel: '',
      location: ''
    });
    setJobs([...allJobs]);
    setCurrentJobIndex(0);
  };

  const handleSkip = () => {
    if (currentJobIndex < jobs.length - 1) {
      setCurrentJobIndex(currentJobIndex + 1);
    } else {
      setCurrentJobIndex(0); // Loop back to first job
    }
  };

  const handleApply = async () => {
    if (!jobs[currentJobIndex] || user?.role !== 'job_seeker') return;
    
    setApplying(true);
    try {
      await axios.post(`/applications/${jobs[currentJobIndex]._id}/apply`);
      
      // Remove applied job from the list
      const newJobs = jobs.filter((_, index) => index !== currentJobIndex);
      setJobs(newJobs);
      
      // Adjust current index if needed
      if (currentJobIndex >= newJobs.length && newJobs.length > 0) {
        setCurrentJobIndex(0);
      }
      
      if (newJobs.length === 0) {
        setError('No more jobs available. Great job applying!');
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      alert(error.response?.data?.message || 'Failed to apply to job. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const handleJobClick = (job) => {
    setSelectedJob(job);
  };

  const closeJobModal = () => {
    setSelectedJob(null);
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

  if (error || jobs.length === 0) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <h2>{user?.role === 'job_seeker' ? 'No Jobs Available' : 'No Jobs Posted Yet'}</h2>
          <p className="text-muted">
            {error || (user?.role === 'job_seeker' 
              ? "You've seen all available jobs that match your preferences, or no jobs are currently posted."
              : "No jobs have been posted by other users yet."
            )}
          </p>
          {user?.role === 'job_seeker' && (
            <div className="d-flex justify-content-center gap-3">
              <button className="btn btn-primary" onClick={() => fetchJobs(false)}>
                Refresh Preferred Jobs
              </button>
              <button className="btn btn-secondary" onClick={handleShowAllJobs}>
                Show All Jobs
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentJob = jobs[currentJobIndex];

  return (
    <div className="container py-5">
      <div className="text-center mb-4">
        <h1>{user?.role === 'job_seeker' ? 'Browse Jobs' : 'All Job Postings'}</h1>
        <p className="text-muted">
          Job {currentJobIndex + 1} of {jobs.length}
          {user?.role === 'job_seeker' && (
            <span> • {showingAll ? 'Showing all jobs' : 'Showing preferred jobs'}</span>
          )}
        </p>
        
        {user?.role === 'job_seeker' && (
          <div className="mb-4">
            <div className="d-flex justify-content-center gap-2 mb-3">
              <button 
                className={`btn ${!showingAll ? 'btn-primary' : 'btn-secondary'}`}
                onClick={handleShowPreferredJobs}
              >
                🎯 Smart Matches
              </button>
              <button 
                className={`btn ${showingAll ? 'btn-primary' : 'btn-secondary'}`}
                onClick={handleShowAllJobs}
              >
                🌍 All Opportunities
              </button>
            </div>
            
            {/* Filter Options */}
            <div className="card" style={{background: 'linear-gradient(135deg, var(--gray-50), white)'}}>
              <div className="card-body">
                <h5 style={{color: 'var(--gray-800)', marginBottom: 'var(--space-4)'}}>🔍 Refine Your Search</h5>
                <div className="row">
                  <div className="col-md-3">
                    <label className="form-label">Job Type</label>
                    <select 
                      className="form-control form-select"
                      value={filterOptions.jobType}
                      onChange={(e) => setFilterOptions({...filterOptions, jobType: e.target.value})}
                    >
                      <option value="">All Job Types</option>
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Work Style</label>
                    <select 
                      className="form-control form-select"
                      value={filterOptions.workType}
                      onChange={(e) => setFilterOptions({...filterOptions, workType: e.target.value})}
                    >
                      <option value="">All Work Types</option>
                      <option value="remote">Remote</option>
                      <option value="on-site">On-site</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Experience Level</label>
                    <select 
                      className="form-control form-select"
                      value={filterOptions.jobLevel}
                      onChange={(e) => setFilterOptions({...filterOptions, jobLevel: e.target.value})}
                    >
                      <option value="">All Levels</option>
                      <option value="entry">Entry Level</option>
                      <option value="mid">Mid Level</option>
                      <option value="senior">Senior Level</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Location</label>
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="Location..."
                      value={filterOptions.location}
                      onChange={(e) => setFilterOptions({...filterOptions, location: e.target.value})}
                    />
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <button className="btn btn-primary me-2" onClick={applyFilters}>
                    🔍 Apply Filters
                  </button>
                  <button className="btn btn-secondary" onClick={clearFilters}>
                    ✨ Clear All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="job-card" onClick={() => handleJobClick(currentJob)}>
            <div style={{background: 'linear-gradient(135deg, var(--primary-50), var(--accent-50))', padding: 'var(--space-1)'}}>
              <div style={{background: 'white', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)'}}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="flex-grow-1">
                    <h3 className="mb-2" style={{color: 'var(--gray-900)', fontSize: '1.5rem', fontWeight: '700'}}>{currentJob.title}</h3>
                    <div className="mb-3">
                      <h5 className="text-primary mb-1" style={{fontSize: '1.125rem', fontWeight: '600'}}>{currentJob.companyName}</h5>
                      <p className="text-muted mb-1" style={{fontSize: '0.95rem'}}>📍 {currentJob.location}</p>
                      {currentJob.postedBy && (
                        <small className="text-muted">Posted by {currentJob.postedBy.name}</small>
                      )}
                    </div>
                  </div>
                  {currentJob.salary?.min && (
                    <div className="text-right">
                      <div style={{
                        background: 'linear-gradient(135deg, var(--secondary-100), var(--secondary-200))',
                        color: 'var(--secondary-800)',
                        padding: 'var(--space-2) var(--space-4)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        💰 ${currentJob.salary.min.toLocaleString()}
                        {currentJob.salary.max && ` - $${currentJob.salary.max.toLocaleString()}`}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="d-flex gap-2 flex-wrap">
                      <span style={{
                        background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
                        color: 'var(--primary-800)',
                        padding: 'var(--space-1) var(--space-3)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        {currentJob.jobType}
                      </span>
                      <span style={{
                        background: 'linear-gradient(135deg, var(--accent-100), var(--accent-200))',
                        color: 'var(--accent-800)',
                        padding: 'var(--space-1) var(--space-3)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        {currentJob.workType}
                      </span>
                      <span style={{
                        background: 'linear-gradient(135deg, var(--secondary-100), var(--secondary-200))',
                        color: 'var(--secondary-800)',
                        padding: 'var(--space-1) var(--space-3)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        {currentJob.jobLevel}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <strong style={{color: 'var(--gray-700)', fontSize: '0.95rem'}}>🛠️ Required Skills:</strong>
                  <div className="mt-2">
                    {currentJob.requiredSkills.map((skill, index) => (
                      <span key={index} style={{
                        background: 'var(--gray-100)',
                        color: 'var(--gray-700)',
                        padding: 'var(--space-1) var(--space-3)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        marginRight: 'var(--space-2)',
                        marginBottom: 'var(--space-2)',
                        display: 'inline-block'
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mb-3">
                  <p style={{color: 'var(--gray-600)', lineHeight: '1.6', fontSize: '0.95rem'}}>
                    {currentJob.description.substring(0, 200)}...
                  </p>
                </div>
                
                <div className="text-center">
                  <small style={{
                    color: 'var(--primary-600)',
                    fontWeight: '500',
                    fontSize: '0.875rem'
                  }}>
                    👆 Click to view full description
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="job-card-actions">
            <button 
              className="btn btn-secondary"
              onClick={handleSkip}
              disabled={applying}
              style={{
                background: 'linear-gradient(135deg, var(--gray-200), var(--gray-300))',
                color: 'var(--gray-700)',
                border: 'none',
                fontWeight: '600'
              }}
            >
              {user?.role === 'job_seeker' ? '⏭️ Skip' : '➡️ Next'}
            </button>
            {user?.role === 'job_seeker' && (
              <button 
                className="btn btn-success"
                onClick={handleApply}
                disabled={applying}
                style={{
                  background: 'linear-gradient(135deg, var(--secondary-500), var(--secondary-600))',
                  border: 'none',
                  fontWeight: '600'
                }}
              >
                {applying ? '⏳ Applying...' : '🚀 Apply Now'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="modal-overlay" onClick={closeJobModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedJob.title}</h3>
              <button className="btn btn-sm btn-secondary" onClick={closeJobModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <h5 className="text-primary">{selectedJob.companyName}</h5>
                <p className="text-muted">{selectedJob.location}</p>
                {selectedJob.postedBy && (
                  <small className="text-muted">Posted by: {selectedJob.postedBy.name}</small>
                )}
              </div>
              
              <div className="mb-3">
                <span className="badge badge-primary me-2">
                  {selectedJob.jobType}
                </span>
                <span className="badge badge-secondary me-2">
                  {selectedJob.workType}
                </span>
                <span className="badge badge-success">
                  {selectedJob.jobLevel}
                </span>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobBrowse;