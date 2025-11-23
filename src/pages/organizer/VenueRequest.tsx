import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { organizerService } from '../../services/organizerService';
import './VenueRequest.css';

interface VenueRequest {
  requestId: number;
  name?: string;
  locationName?: string;
  address?: string;
  capacity?: number;
  latitude?: number;
  longitude?: number;
  reason: string;
  status?: string;
  approvalStatus?: string;
  organizerName?: string;
  organizerEmail?: string;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
}

const VenueRequest = () => {
  const [venueRequests, setVenueRequests] = useState<VenueRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredRequests, setFilteredRequests] = useState<VenueRequest[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  useEffect(() => {
    loadVenueRequests();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [venueRequests, selectedFilter]);

  const loadVenueRequests = async () => {
    setIsLoading(true);
    try {
      const data = await organizerService.getVenueRequests();
      setVenueRequests(data);
    } catch (error) {
      console.error('Error loading venue requests:', error);
      toast.error('Failed to load venue requests');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await organizerService.submitVenueRequest(data);
      toast.success('Venue request submitted successfully!');
      reset();
      loadVenueRequests();
    } catch (error: any) {
      console.error('Error submitting venue request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit request. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyFilter = () => {
    if (selectedFilter === 'All') {
      setFilteredRequests(venueRequests);
    } else {
      setFilteredRequests(
        venueRequests.filter((request) => {
          const status = request.status || request.approvalStatus || 'Pending';
          return status === selectedFilter;
        })
      );
    }
  };

  const getStatusClass = (status: string | undefined): string => {
    if (!status) return 'status-pending';
    switch (status.toLowerCase()) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'pending':
        return 'status-pending';
      default:
        return 'status-pending';
    }
  };

  const getStatusIcon = (status: string | undefined): string => {
    if (!status) return 'schedule';
    switch (status.toLowerCase()) {
      case 'approved':
        return 'check_circle';
      case 'rejected':
        return 'cancel';
      case 'pending':
        return 'schedule';
      default:
        return 'info';
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
    <div className="venue-request-container">
      <div className="page-header">
        <h1 className="page-title">
          <span className="material-icons">location_city</span>
          Venue Requests
        </h1>
        <p className="page-subtitle">Request new venues and track your submissions</p>
      </div>

      <div className="form-card">
        <h2 className="card-title">
          <span className="material-icons">add_location</span>
          Request New Venue
        </h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="locationName">
              Location Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="locationName"
              {...register('locationName', { required: true, minLength: 3 })}
              className="form-control"
              placeholder="Enter venue location name"
            />
            {errors.locationName && (
              <small className="form-error">Location name must be at least 3 characters</small>
            )}
            <small className="form-hint">Enter the specific location you want to request</small>
          </div>

          <div className="form-group">
            <label htmlFor="reason">
              Reason for Request <span className="required">*</span>
            </label>
            <textarea
              id="reason"
              {...register('reason', { required: true, minLength: 10 })}
              className="form-control"
              rows={4}
              placeholder="Explain why you need this venue..."
            ></textarea>
            {errors.reason && (
              <small className="form-error">Reason must be at least 10 characters</small>
            )}
            <small className="form-hint">Provide detailed reasons to help with approval</small>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {!isSubmitting ? (
                <>
                  <span className="material-icons">send</span>
                  Submit Request
                </>
              ) : (
                'Submitting...'
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => reset()}
            >
              <span className="material-icons">refresh</span>
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="requests-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="material-icons">list_alt</span>
            My Venue Requests
          </h2>

          <div className="filter-buttons">
            <button
              className={`filter-btn ${selectedFilter === 'All' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('All')}
            >
              All ({venueRequests.length})
            </button>
            <button
              className={`filter-btn status-pending ${selectedFilter === 'Pending' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('Pending')}
            >
              Pending
            </button>
            <button
              className={`filter-btn status-approved ${selectedFilter === 'Approved' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('Approved')}
            >
              Approved
            </button>
            <button
              className={`filter-btn status-rejected ${selectedFilter === 'Rejected' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('Rejected')}
            >
              Rejected
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="loading-state">
            <span className="material-icons spin">refresh</span>
            <p>Loading requests...</p>
          </div>
        )}

        {!isLoading && filteredRequests.length === 0 && (
          <div className="empty-state">
            <span className="material-icons">inbox</span>
            <h3>No requests found</h3>
            <p>
              {selectedFilter === 'All'
                ? "You haven't submitted any venue requests yet."
                : `No ${selectedFilter.toLowerCase()} requests found.`}
            </p>
          </div>
        )}

        {!isLoading && filteredRequests.length > 0 && (
          <div className="requests-grid">
            {filteredRequests.map((request) => (
              <div key={request.requestId} className="request-card">
                <div className="card-header">
                  <div className={`status-badge ${getStatusClass(request.status || request.approvalStatus)}`}>
                    <span className="material-icons">{getStatusIcon(request.status || request.approvalStatus)}</span>
                    <span>{request.status || request.approvalStatus || 'Pending'}</span>
                  </div>
                  <span className="request-id">#{request.requestId}</span>
                </div>

                <div className="card-body">
                  <h3 className="location-name">
                    <span className="material-icons">place</span>
                    {request.name || request.locationName || 'Venue Request'}
                  </h3>

                  <div className="request-reason">
                    <strong>Reason:</strong>
                    <p>{request.reason}</p>
                  </div>

                  {(request.status === 'Rejected' || request.approvalStatus === 'Rejected') && request.rejectionReason && (
                    <div className="rejection-reason">
                      <div className="reason-header">
                        <span className="material-icons">error_outline</span>
                        <strong>Rejection Reason</strong>
                      </div>
                      <p>{request.rejectionReason}</p>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <div className="footer-info">
                    <span className="material-icons">schedule</span>
                    <small>{formatDate(request.createdAt)}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueRequest;
