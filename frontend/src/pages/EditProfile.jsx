import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import md5 from 'md5';

const EditProfile = () => {
  const { user, updatePreferences, uploadResume, uploadProfilePhoto } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: ''
  });

  const [preferences, setPreferences] = useState({
    jobRoles: '',
    jobType: '',
    jobLevel: '',
    preferredLocations: '',
    skills: ''
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [useGravatar, setUseGravatar] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/users/profile');
      const userData = response.data.user;

      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        companyName: userData.companyName || ''
      });

      if (userData.preferences) {
        setPreferences({
          jobRoles: userData.preferences.jobRoles?.join(', ') || '',
          jobType: userData.preferences.jobType || '',
          jobLevel: userData.preferences.jobLevel || '',
          preferredLocations: userData.preferences.preferredLocations?.join(', ') || '',
          skills: userData.preferences.skills?.join(', ') || ''
        });
      }

      if (userData.profilePhoto) {
        setPhotoUrl(userData.profilePhoto);
      } else {
        generateRandomAvatar();
      }

    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePreferenceChange = (e) => {
    setPreferences({ ...preferences, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  const handleProfilePhotoChange = (e) => {
    setProfilePhotoFile(e.target.files[0]);
  };

  const generateGravatar = () => {
    const emailHash = md5(formData.email.trim().toLowerCase());
    setPhotoUrl(`https://www.gravatar.com/avatar/${emailHash}?d=identicon`);
    setUseGravatar(true);
  };

  const generateRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(2, 15);
    setPhotoUrl(`https://api.dicebear.com/6.x/thumbs/svg?seed=${seed}`);
    setUseGravatar(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.put('/users/profile', { ...formData, profilePhoto: photoUrl });

      if (user?.role === 'job_seeker') {
        const preferencesData = {
          jobRoles: preferences.jobRoles.split(',').map(role => role.trim()).filter(Boolean),
          jobType: preferences.jobType,
          jobLevel: preferences.jobLevel,
          preferredLocations: preferences.preferredLocations.split(',').map(loc => loc.trim()).filter(Boolean),
          skills: preferences.skills.split(',').map(skill => skill.trim()).filter(Boolean)
        };

        const prefsResult = await updatePreferences(preferencesData);
        if (!prefsResult.success) throw new Error(prefsResult.error);

        if (resumeFile) {
          const resumeResult = await uploadResume(resumeFile);
          if (!resumeResult.success) throw new Error(resumeResult.error);
        }
      }

      if (profilePhotoFile) {
        const photoResult = await uploadProfilePhoto(profilePhotoFile);
        if (!photoResult.success) throw new Error(photoResult.error);
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => navigate('/profile'), 2000);

    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-sm py-5">
      <div className="card">
        <div className="card-header">
          <h2>Edit Profile</h2>
          <p className="text-muted">Update your personal information and preferences</p>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            {/* Basic Info */}
            <div className="mb-4">
              <h4>Basic Information</h4>

              <div className="text-center mb-3">
                <img
                  src={photoUrl}
                  alt="Profile"
                  className="rounded-circle"
                  width="120"
                  height="120"
                />
              </div>

              <div className="d-flex gap-2 mb-3">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={generateGravatar}
                >
                  Use Gravatar
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={generateRandomAvatar}
                >
                  Use Random Avatar
                </button>
              </div>

              <div className="form-group mb-3">
                <label htmlFor="photo" className="form-label">Upload Profile Photo</label>
                <input
                  type="file"
                  className="form-control"
                  id="photo"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              {user?.role === 'job_poster' && (
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
              )}
            </div>

            {/* Preferences */}
            {user?.role === 'job_seeker' && (
              <div className="mb-4">
                <h4>Job Preferences</h4>

                <div className="form-group">
                  <label className="form-label">Job Roles of Interest</label>
                  <input
                    type="text"
                    name="jobRoles"
                    className="form-control"
                    value={preferences.jobRoles}
                    onChange={handlePreferenceChange}
                    placeholder="e.g., Frontend Developer, QA"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Work Type</label>
                  <select
                    name="jobType"
                    className="form-control"
                    value={preferences.jobType}
                    onChange={handlePreferenceChange}
                  >
                    <option value="">Select</option>
                    <option value="remote">Remote</option>
                    <option value="on-site">On-site</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Job Level</label>
                  <select
                    name="jobLevel"
                    className="form-control"
                    value={preferences.jobLevel}
                    onChange={handlePreferenceChange}
                  >
                    <option value="">Select</option>
                    <option value="entry">Entry</option>
                    <option value="mid">Mid</option>
                    <option value="senior">Senior</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Preferred Locations</label>
                  <input
                    type="text"
                    name="preferredLocations"
                    className="form-control"
                    value={preferences.preferredLocations}
                    onChange={handlePreferenceChange}
                    placeholder="e.g., Indore, Pune"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Skills</label>
                  <input
                    type="text"
                    name="skills"
                    className="form-control"
                    value={preferences.skills}
                    onChange={handlePreferenceChange}
                    placeholder="e.g., React, Node.js"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Upload Resume</label>
                  <input
                    type="file"
                    className="form-control"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            )}

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/profile')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
