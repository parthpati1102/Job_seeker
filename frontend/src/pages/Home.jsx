import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Find Your Dream Job or Hire Top Talent
              </h1>
              <p className="hero-subtitle">
                The modern job platform that connects exceptional talent with innovative companies. 
                Experience seamless hiring with AI-powered matching, instant applications, and real-time analytics.
              </p>
              
              {!user ? (
                <div className="hero-actions">
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Start Your Journey
                  </Link>
                  <Link to="/login" className="btn btn-secondary btn-lg">
                    Welcome Back
                  </Link>
                </div>
              ) : (
                <div className="hero-actions">
                  <Link to="/dashboard" className="btn btn-primary btn-lg">
                    Go to Dashboard
                  </Link>
                  {user.role === 'job_seeker' ? (
                    <Link to="/browse-jobs" className="btn btn-success btn-lg">
                      Browse Jobs
                    </Link>
                  ) : (
                    <Link to="/create-job" className="btn btn-success btn-lg">
                      Post a Job
                    </Link>
                  )}
                </div>
              )}
            </div>
            
            <div className="hero-image">
              <div className="hero-card">
                <div className="hero-card-content">
                  <div className="hero-stats">
                    <div className="stat-item">
                      <div className="stat-number">25K+</div>
                      <div className="stat-label">Active Jobs</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">100K+</div>
                      <div className="stat-label">Job Seekers</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">15K+</div>
                      <div className="stat-label">Companies</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose JobPortal?</h2>
            <p>Experience the future of hiring with our cutting-edge platform designed for modern professionals</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Smart Matching</h3>
              <p>Advanced AI algorithms analyze skills, experience, and cultural fit to deliver perfect job matches with 95% accuracy.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Instant Applications</h3>
              <p>One-click applications with smart profile sharing. Apply to your dream job in seconds, not minutes.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Powerful Analytics</h3>
              <p>Real-time insights into your job search performance with actionable recommendations to boost your success rate.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Enterprise Security</h3>
              <p>Bank-level encryption and privacy controls ensure your data is always protected and under your control.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>Global Network</h3>
              <p>Connect with opportunities worldwide. From startups to Fortune 500 companies, find your perfect match anywhere.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Direct Connect</h3>
              <p>Skip the middleman. Connect directly with decision-makers and build meaningful professional relationships.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Your journey to success starts here - simple, fast, and effective</p>
          </div>
          
          <div className="process-tabs">
            <div className="tab-buttons">
              <button className="tab-btn active" data-tab="job-seekers">
                For Job Seekers
              </button>
              <button className="tab-btn" data-tab="employers">
                For Employers
              </button>
            </div>
            
            <div className="tab-content">
              <div className="tab-pane active" id="job-seekers">
                <div className="process-steps">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h4>Build Your Profile</h4>
                      <p>Create a compelling profile that showcases your skills, experience, and career aspirations in minutes.</p>
                    </div>
                  </div>
                  
                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h4>Set Preferences</h4>
                      <p>Tell us what you're looking for - job type, location, salary range, and company culture preferences.</p>
                    </div>
                  </div>
                  
                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h4>Discover & Apply</h4>
                      <p>Browse curated job matches and apply instantly. Our smart system handles the rest.</p>
                    </div>
                  </div>
                  
                  <div className="step">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <h4>Get Hired</h4>
                      <p>Track applications, receive real-time updates, and land your dream job faster than ever.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="tab-pane" id="employers">
                <div className="process-steps">
                  <div className="step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h4>Create Job Listings</h4>
                      <p>Post detailed job descriptions with smart templates that attract the right candidates.</p>
                    </div>
                  </div>
                  
                  <div className="step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h4>Smart Matching</h4>
                      <p>Our AI pre-screens candidates and delivers only the most qualified applicants to your inbox.</p>
                    </div>
                  </div>
                  
                  <div className="step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h4>Review & Interview</h4>
                      <p>Use our comprehensive candidate profiles and built-in tools to make informed hiring decisions.</p>
                    </div>
                  </div>
                  
                  <div className="step">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <h4>Build Your Team</h4>
                      <p>Hire confidently with our streamlined process and build the team that drives your success.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>What Our Users Say</h2>
            <p>Join thousands of professionals who've transformed their careers with JobPortal</p>
          </div>
          
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>JobPortal's AI matching is incredible. I found my dream role at a top tech company in just 10 days. The personalized recommendations were exactly what I was looking for.</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">👩‍💻</div>
                <div className="author-info">
                  <div className="author-name">Sarah Chen</div>
                  <div className="author-title">Senior Software Engineer at Google</div>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>We've hired 15 exceptional engineers through JobPortal this year. The quality of candidates and speed of hiring has transformed our recruitment process completely.</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">👨‍💼</div>
                <div className="author-info">
                  <div className="author-name">Michael Rodriguez</div>
                  <div className="author-title">CTO at Stripe</div>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>The career insights and profile optimization suggestions were game-changing. I went from 2 interviews a month to 2 interviews a week!</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">👨‍🎨</div>
                <div className="author-info">
                  <div className="author-name">David Kim</div>
                  <div className="author-title">Lead UX Designer at Airbnb</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Take the Next Step?</h2>
            <p>Join over 100,000 professionals who've accelerated their careers with JobPortal</p>
            
            {!user ? (
              <div className="cta-actions">
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started Free
                </Link>
                <Link to="/login" className="btn btn-outline-primary btn-lg">
                  I Have an Account
                </Link>
              </div>
            ) : (
              <div className="cta-actions">
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  Go to Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;