import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { organizerService } from '../../services/organizerService';
import './TrackRequest.css';

interface StatusResponse {
  trackingToken: string;
  status: string;
  organizerName: string;
  email: string;
  submittedAt: string;
  rejectionReason: string | null;
}

const TrackRequest = () => {
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = async (data: any) => {
    try {
      const response = await organizerService.trackRequest(data.trackingToken);
      setStatusData(response);
      setIsChecked(true);
      toast.success('Status retrieved successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Invalid tracking token. Please try again.';
      toast.error(errorMessage);
      setIsChecked(false);
      setStatusData(null);
    }
  };

  const checkAgain = () => {
    setIsChecked(false);
    setStatusData(null);
    reset();
  };

  const navigateToLogin = () => {
    navigate('/login');
  };

  const navigateToRegister = () => {
    navigate('/organizer/register');
  };

  const getStatusClass = (): string => {
    if (!statusData) return '';
    switch (statusData.status) {
      case 'APPROVED':
        return 'status-approved';
      case 'REJECTED':
        return 'status-rejected';
      case 'PENDING':
        return 'status-pending';
      default:
        return '';
    }
  };

  const getStatusIcon = (): string => {
    if (!statusData) return '';
    switch (statusData.status) {
      case 'APPROVED':
        return 'check_circle';
      case 'REJECTED':
        return 'cancel';
      case 'PENDING':
        return 'schedule';
      default:
        return 'info';
    }
  };

  const getStatusMessage = (): string => {
    if (!statusData) return '';
    switch (statusData.status) {
      case 'APPROVED':
        return 'Congratulations! Your organizer registration has been approved.';
      case 'REJECTED':
        return 'Unfortunately, your registration request has been rejected.';
      case 'PENDING':
        return 'Your registration request is currently under review.';
      default:
        return 'Status information retrieved.';
    }
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
    <div className="track-container">
      <div className="brand-panel">
        <h1 className="brand-title">Track Your Request</h1>
        <p className="brand-subtitle">Check the status of your organizer registration request</p>
      </div>

      <div className="card">
        {!isChecked ? (
          <>
            <h2 className="card-title">Enter Tracking Token</h2>
            <p className="card-subtitle">Enter the tracking token you received during registration</p>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label htmlFor="trackingToken">Tracking Token</label>
                <input
                  type="text"
                  id="trackingToken"
                  {...register('trackingToken', {
                    required: 'Tracking token is required',
                    pattern: {
                      value: /^[a-f0-9]{32}$/i,
                      message: 'Invalid token format. Token should be a 32-character hexadecimal string.',
                    },
                  })}
                  className="form-control"
                  placeholder="Enter your 32-character tracking token"
                />
                {errors.trackingToken && (
                  <small className="form-error">
                    {errors.trackingToken.message || 'Invalid token format'}
                  </small>
                )}
                <small className="form-hint">Enter the 32-character hexadecimal token you received</small>
              </div>

              <button type="submit" className="btn btn-primary" disabled={!!errors.trackingToken}>
                Track Status
              </button>

              <div className="form-footer">
                <a className="link" onClick={navigateToRegister}>
                  Register as Organizer
                </a>
                <span className="separator">|</span>
                <a className="link" onClick={navigateToLogin}>
                  Login
                </a>
              </div>
            </form>
          </>
        ) : statusData ? (
          <div className="status-card">
            <div className={`status-header ${getStatusClass()}`}>
              <div className="status-icon">
                <span className="material-icons">{getStatusIcon()}</span>
              </div>
              <h2 className="status-title">{statusData.status}</h2>
              <p className="status-message">{getStatusMessage()}</p>
            </div>

            <div className="status-details">
              <div className="detail-row">
                <span className="detail-label">
                  <span className="material-icons">confirmation_number</span>
                  Tracking Token
                </span>
                <span className="detail-value">{statusData.trackingToken}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">
                  <span className="material-icons">business</span>
                  Organizer Name
                </span>
                <span className="detail-value">{statusData.organizerName}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">
                  <span className="material-icons">email</span>
                  Email
                </span>
                <span className="detail-value">{statusData.email}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">
                  <span className="material-icons">schedule</span>
                  Submitted At
                </span>
                <span className="detail-value">{formatDate(statusData.submittedAt)}</span>
              </div>

              {statusData.status === 'REJECTED' && statusData.rejectionReason && (
                <div className="rejection-reason">
                  <div className="reason-header">
                    <span className="material-icons">error_outline</span>
                    <strong>Rejection Reason</strong>
                  </div>
                  <p className="reason-text">{statusData.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="status-actions">
              {statusData.status === 'APPROVED' && (
                <button className="btn btn-primary" onClick={navigateToLogin}>
                  Go to Login
                </button>
              )}

              {statusData.status === 'REJECTED' && (
                <button className="btn btn-primary" onClick={navigateToRegister}>
                  Submit New Request
                </button>
              )}

              {statusData.status === 'PENDING' && (
                <button className="btn btn-primary" onClick={checkAgain}>
                  Check Again
                </button>
              )}

              <button className="btn btn-secondary" onClick={checkAgain}>
                Track Another Request
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TrackRequest;
