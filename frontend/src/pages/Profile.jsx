import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Profile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/users/profile');
      setProfileData(response.data.user);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-3">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <h2>Profile not found</h2>
          <p className="text-muted">Unable to load profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Profile Header */}
      <div className="profile-header">
        <div className="container">
          <div className="profile-avatar">
            {profileData.profilePhoto ? (
              <img 
                src={profileData.profilePhoto.startsWith('http') ? profileData.profilePhoto : `http://localhost:5000${profileData.profilePhoto}`}
                alt="Profile" 
                className="profile-avatar-img"
              />
            ) : (
              getInitials(profileData.name)
            )}
          </div>
          <h1>{profileData.name}</h1>
          <p className="text-muted">
            {profileData.role === 'job_seeker' ? 'Job Seeker' : 'Job Poster'}
            {profileData.companyName && ` at ${profileData.companyName}`}
          </p>
          <div className="mt-3">
            <a href="/edit-profile" className="btn btn-primary">
              Edit Profile
            </a>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container profile-info">
        {/* Basic Information */}
        <div className="profile-section">
          <h3>Basic Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Full Name</div>
              <div className="info-value">{profileData.name}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Email</div>
              <div className="info-value">{profileData.email}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Phone</div>
              <div className="info-value">{profileData.phone}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Role</div>
              <div className="info-value">
                {profileData.role === 'job_seeker' ? 'Job Seeker' : 'Job Poster'}
              </div>
            </div>
            {profileData.companyName && (
              <div className="info-item">
                <div className="info-label">Company</div>
                <div className="info-value">{profileData.companyName}</div>
              </div>
            )}
            <div className="info-item">
              <div className="info-label">Member Since</div>
              <div className="info-value">{formatDate(profileData.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Job Seeker Specific Information */}
        {profileData.role === 'job_seeker' && (
          <>
            {/* Job Preferences */}
            {profileData.preferences && (
              <div className="profile-section">
                <h3>Job Preferences</h3>
                <div className="info-grid">
                  {profileData.preferences.jobRoles && profileData.preferences.jobRoles.length > 0 && (
                    <div className="info-item">
                      <div className="info-label">Job Roles of Interest</div>
                      <div className="info-value">
                        <div className="skills-list">
                          {profileData.preferences.jobRoles.map((role, index) => (
                            <span key={index} className="skill-tag">{role}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {profileData.preferences.jobType && (
                    <div className="info-item">
                      <div className="info-label">Preferred Work Type</div>
                      <div className="info-value">
                        {profileData.preferences.jobType.charAt(0).toUpperCase() + 
                         profileData.preferences.jobType.slice(1)}
                      </div>
                    </div>
                  )}
                  {profileData.preferences.jobLevel && (
                    <div className="info-item">
                      <div className="info-label">Job Level</div>
                      <div className="info-value">
                        {profileData.preferences.jobLevel.charAt(0).toUpperCase() + 
                         profileData.preferences.jobLevel.slice(1)} Level
                      </div>
                    </div>
                  )}
                  {profileData.preferences.preferredLocations && profileData.preferences.preferredLocations.length > 0 && (
                    <div className="info-item">
                      <div className="info-label">Preferred Locations</div>
                      <div className="info-value">
                        <div className="skills-list">
                          {profileData.preferences.preferredLocations.map((location, index) => (
                            <span key={index} className="skill-tag">{location}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {profileData.preferences.skills && profileData.preferences.skills.length > 0 && (
                    <div className="info-item">
                      <div className="info-label">Skills</div>
                      <div className="info-value">
                        <div className="skills-list">
                          {profileData.preferences.skills.map((skill, index) => (
                            <span key={index} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resume Information */}
            {profileData.resume && (
              <div className="profile-section">
                <h3>Resume</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">File Name</div>
                    <div className="info-value">{profileData.resume.filename}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Upload Date</div>
                    <div className="info-value">{formatDate(profileData.resume.uploadDate)}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <a 
                    href={`http://localhost:5000${profileData.resume.path}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    View Resume
                  </a>
                </div>
              </div>
            )}
          </>
        )}

        {/* Account Status */}
        <div className="profile-section">
          <h3>Account Status</h3>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Account Status</div>
              <div className="info-value">
                <span className={`badge ${profileData.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {profileData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Last Updated</div>
              <div className="info-value">{formatDate(profileData.updatedAt)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;