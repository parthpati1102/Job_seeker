import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const JobPreferences = () => {
  const { user, updatePreferences, uploadResume } = useAuth();
  const [preferences, setPreferences] = useState({
    jobRoles: [],
    jobType: '',
    jobLevel: '',
    preferredLocations: [],
    skills: []
  });
  const [formData, setFormData] = useState({
    jobRoles: '',
    jobType: '',
    jobLevel: '',
    preferredLocations: '',
    skills: ''
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.preferences) {
      const userPrefs = user.preferences;
      setPreferences(userPrefs);
      setFormData({
        jobRoles: userPrefs.jobRoles?.join(', ') || '',
        jobType: userPrefs.jobType || '',
        jobLevel: userPrefs.jobLevel || '',
        preferredLocations: userPrefs.preferredLocations?.join(', ') || '',
        skills: userPrefs.skills?.join(', ') || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare preferences data
      const preferencesData = {
        jobRoles: formData.jobRoles.split(',').map(role => role.trim()).filter(role => role),
        jobType: formData.jobType,
        jobLevel: formData.jobLevel,
        preferredLocations: formData.preferredLocations.split(',').map(loc => loc.trim()).filter(loc => loc),
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill)
      };

      // Update preferences
      const prefsResult = await updatePreferences(preferencesData);
      if (!prefsResult.success) {
        throw new Error(prefsResult.error);
      }

      // Upload resume if provided
      if (resumeFile) {
        const resumeResult = await uploadResume(resumeFile);
        if (!resumeResult.success) {
          throw new Error(resumeResult.error);
        }
      }

      setSuccess('Preferences updated successfully!');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Preferences update error:', error);
      setError(error.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-sm py-5">
      <div className="card">
        <div className="card-header">
          <h2>Job Preferences</h2>
          <p className="text-muted">
            Help us find the perfect jobs for you by setting your preferences
          </p>
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
              <label htmlFor="jobRoles" className="form-label">Job Roles of Interest</label>
              <input
                type="text"
                id="jobRoles"
                name="jobRoles"
                className="form-control"
                value={formData.jobRoles}
                onChange={handleChange}
                placeholder="e.g., Software Engineer, Frontend Developer, Product Manager"
                required
              />
              <small className="text-muted">Separate multiple roles with commas</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="jobType" className="form-label">Preferred Work Type</label>
              <select
                id="jobType"
                name="jobType"
                className="form-control form-select"
                value={formData.jobType}
                onChange={handleChange}
                required
              >
                <option value="">Select work type</option>
                <option value="remote">Remote</option>
                <option value="on-site">On-site</option>
                <option value="hybrid">Hybrid</option>
              </select>
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
              <label htmlFor="preferredLocations" className="form-label">Preferred Locations</label>
              <input
                type="text"
                id="preferredLocations"
                name="preferredLocations"
                className="form-control"
                value={formData.preferredLocations}
                onChange={handleChange}
                placeholder="e.g., New York, San Francisco, Remote"
                required
              />
              <small className="text-muted">Separate multiple locations with commas</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="skills" className="form-label">Skills</label>
              <input
                type="text"
                id="skills"
                name="skills"
                className="form-control"
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g., JavaScript, Python, React, Node.js"
                required
              />
              <small className="text-muted">Separate multiple skills with commas</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="resume" className="form-label">Upload Resume</label>
              <input
                type="file"
                id="resume"
                name="resume"
                className="form-control"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
              <small className="text-muted">
                {user?.resume ? 
                  `Current resume: ${user.resume.filename}` : 
                  'Accepted formats: PDF, DOC, DOCX (Max 5MB)'
                }
              </small>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Save Preferences'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JobPreferences;