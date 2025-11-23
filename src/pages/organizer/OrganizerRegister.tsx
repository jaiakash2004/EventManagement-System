import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { organizerService } from '../../services/organizerService';
import './OrganizerRegister.css';

const OrganizerRegister = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingToken, setTrackingToken] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submittedAt, setSubmittedAt] = useState('');
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = async (data: any) => {
    try {
      const response = await organizerService.registerOrganizer(data);
      setTrackingToken(response.trackingToken);
      setSuccessMessage(response.message);
      setSubmittedAt(response.submittedAt);
      setIsSubmitted(true);
      toast.success('Registration request submitted successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    }
  };

  const navigateToLogin = () => {
    navigate('/login');
  };

  const navigateToTrackRequest = () => {
    navigate('/organizer/track-request');
  };

  const copyTrackingToken = () => {
    navigator.clipboard.writeText(trackingToken);
    toast.success('Tracking token copied to clipboard!');
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="register-container">
      <div className="brand-panel">
        <h1 className="brand-title">Organizer Portal</h1>
        <p className="brand-subtitle">Register as an event organizer and start creating amazing events</p>
      </div>

      <div className="card">
        {!isSubmitted ? (
          <>
            <h2 className="card-title">Organizer Registration</h2>
            <p className="card-subtitle">Submit your request to become an event organizer</p>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label htmlFor="organizerType">Organizer Type</label>
                <select
                  id="organizerType"
                  {...register('organizerType', { required: true })}
                  className="form-control"
                >
                  <option value="">Select Type</option>
                  <option value="Individual">Individual</option>
                  <option value="Company">Company</option>
                  <option value="Non-Profit">Non-Profit Organization</option>
                  <option value="Educational">Educational Institution</option>
                </select>
                {errors.organizerType && (
                  <small className="form-error">Organizer type is required</small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="organizerName">Organizer Name</label>
                <input
                  type="text"
                  id="organizerName"
                  {...register('organizerName', { required: true })}
                  className="form-control"
                  placeholder="Your name or company name"
                />
                {errors.organizerName && (
                  <small className="form-error">Organizer name is required</small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  {...register('email', { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })}
                  className="form-control"
                  placeholder="organizer@example.com"
                />
                {errors.email && (
                  <small className="form-error">Valid email is required</small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  {...register('phone', { required: true, minLength: 10 })}
                  className="form-control"
                  placeholder="+1 (555) 000-0000"
                />
                {errors.phone && (
                  <small className="form-error">Phone number must be at least 10 digits</small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  {...register('address', { required: true })}
                  className="form-control"
                  rows={3}
                  placeholder="Your complete address"
                ></textarea>
                {errors.address && (
                  <small className="form-error">Address is required</small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  {...register('password', {
                    required: true,
                    minLength: 8,
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*$/,
                  })}
                  className="form-control"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <small className="form-error">
                    Password must be at least 8 characters with uppercase, lowercase, and number
                  </small>
                )}
              </div>

              <button type="submit" className="btn btn-primary">
                Submit Registration Request
              </button>

              <div className="form-footer">
                <a className="link" onClick={navigateToTrackRequest}>
                  Track Request
                </a>
                <span className="separator">|</span>
                <a className="link" onClick={navigateToLogin}>
                  Login
                </a>
              </div>
            </form>
          </>
        ) : (
          <div className="success-card">
            <div className="success-icon">
              <span className="material-icons">check_circle</span>
            </div>

            <h2 className="success-title">Registration Request Submitted!</h2>
            <p className="success-message">{successMessage}</p>

            <div className="tracking-token-container">
              <label className="token-label">Your Tracking Token</label>
              <div className="token-display">
                <span className="token-text">{trackingToken}</span>
                <button className="copy-btn" onClick={copyTrackingToken}>
                  <span className="material-icons">content_copy</span>
                </button>
              </div>
              <p className="token-info">
                <span className="material-icons">info</span>
                Save this token to track your registration status
              </p>
            </div>

            <div className="submitted-time">Submitted at: {formatDate(submittedAt)}</div>

            <div className="success-actions">
              <button className="btn btn-primary" onClick={navigateToTrackRequest}>
                Track My Request
              </button>
              <button className="btn btn-secondary" onClick={navigateToLogin}>
                Go to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerRegister;
