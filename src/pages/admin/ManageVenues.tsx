import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { adminService } from '../../services/adminService';
import { eventService } from '../../services/eventService';
import type { Venue } from '../../services/eventService';
import './ManageVenues.css';

interface VenueRequest {
  requestId: number;
  locationName: string;
  reason: string;
  approvalStatus: string;
  organizerName: string;
  organizerEmail: string;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

const ManageVenues = () => {
  const [activeTab, setActiveTab] = useState<string>('venues');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueRequests, setVenueRequests] = useState<VenueRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VenueRequest | null>(null);

  const availabilityStatuses = ['Available', 'Under Maintenance', 'Booked'];

  const createVenueForm = useForm();
  const updateVenueForm = useForm();
  const reviewRequestForm = useForm({ defaultValues: { approved: true } });

  useEffect(() => {
    loadVenues();
    loadPendingRequests();
  }, []);

  const loadVenues = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAllVenues();
      setVenues(data);
    } catch (error: any) {
      console.error('Error loading venues:', error);
      if (error.response?.status === 404) {
        toast.warning('Admin venues endpoint not implemented in backend yet');
      } else {
        toast.error('Failed to load venues');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const data = await adminService.getPendingVenueRequests();
      setVenueRequests(data);
    } catch (error: any) {
      console.error('Error loading venue requests:', error);
      if (error.response?.status === 404) {
        toast.warning('Venue requests endpoint not implemented in backend yet');
      } else {
        toast.error('Failed to load venue requests');
      }
    }
  };

  const createVenue = async (data: any) => {
    setIsSubmitting(true);
    try {
      const requestBody = {
        name: data.name,
        address: data.address,
        capacity: parseInt(data.capacity),
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        availabilityStatus: data.availabilityStatus,
      };

      await adminService.createVenue(requestBody);
      toast.success('Venue created successfully!');
      createVenueForm.reset({
        capacity: 0,
        latitude: -90,
        longitude: -180,
        availabilityStatus: 'Available',
      });
      loadVenues();
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('Admin venues endpoint not implemented in backend yet');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to create venue';
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openUpdateModal = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowUpdateModal(true);
    updateVenueForm.reset({
      name: venue.name,
      address: venue.address,
      capacity: venue.capacity,
      latitude: venue.latitude,
      longitude: venue.longitude,
      availabilityStatus: venue.availabilityStatus,
    });
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedVenue(null);
  };

  const updateVenue = async (data: any) => {
    if (!selectedVenue) return;

    try {
      const requestBody = {
        name: data.name,
        address: data.address,
        capacity: parseInt(data.capacity),
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        availabilityStatus: data.availabilityStatus,
      };

      await adminService.updateVenue(selectedVenue.venueId, requestBody);
      toast.success('Venue updated successfully!');
      closeUpdateModal();
      loadVenues();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        'As the event is available for this Venue, You cannot Update this Venue';
      toast.error(errorMessage);
    }
  };

  const confirmDelete = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowDeleteConfirm(true);
  };

  const deleteVenue = async () => {
    if (!selectedVenue) return;

    try {
      await adminService.deleteVenue(selectedVenue.venueId);
      toast.success('Venue deleted successfully!');
      setShowDeleteConfirm(false);
      setSelectedVenue(null);
      loadVenues();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete venue';
      toast.error(errorMessage);
    }
  };

  const openReviewModal = (request: VenueRequest) => {
    setSelectedRequest(request);
    setShowReviewModal(true);
    reviewRequestForm.reset({
      approved: true,
      rejectionReason: '',
      name: request.locationName,
      address: '',
      capacity: 0,
      latitude: -90,
      longitude: -180,
      availabilityStatus: 'Available',
    });
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedRequest(null);
  };

  const reviewRequest = async (data: any) => {
    if (!selectedRequest) return;

    try {
      const isApproved = data.approved;
      const requestBody: any = {
        approved: isApproved,
        rejectionReason: isApproved ? null : data.rejectionReason,
      };

      if (isApproved) {
        requestBody.venueDetails = {
          name: data.name,
          address: data.address,
          capacity: parseInt(data.capacity),
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          availabilityStatus: data.availabilityStatus,
        };
      }

      await adminService.reviewVenueRequest(selectedRequest.requestId, requestBody);
      toast.success(
        isApproved
          ? 'Request approved and venue created!'
          : 'Request rejected successfully'
      );
      closeReviewModal();
      loadPendingRequests();
      loadVenues();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to review request';
      toast.error(errorMessage);
    }
  };

  const quickApprove = async (request: VenueRequest) => {
    try {
      const requestBody = {
        approved: true,
        rejectionReason: null,
        venueDetails: {
          name: request.locationName,
          address: 'To be updated',
          capacity: 100,
          latitude: -90,
          longitude: -180,
          availabilityStatus: 'Available',
        },
      };

      await adminService.reviewVenueRequest(request.requestId, requestBody);
      toast.success('Request approved! Please update venue details.');
      loadPendingRequests();
      loadVenues();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to approve request';
      toast.error(errorMessage);
    }
  };

  const quickReject = async (request: VenueRequest) => {
    const reason = window.prompt('Please enter rejection reason:');
    if (!reason) {
      toast.warning('Rejection reason is required');
      return;
    }

    try {
      const requestBody = {
        approved: false,
        rejectionReason: reason,
      };

      await adminService.reviewVenueRequest(request.requestId, requestBody);
      toast.success('Request rejected successfully');
      loadPendingRequests();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reject request';
      toast.error(errorMessage);
    }
  };

  const getStatusClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'status-available';
      case 'under maintenance':
        return 'status-maintenance';
      case 'unavailable':
      case 'booked':
        return 'status-unavailable';
      default:
        return '';
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

  const isApproved = reviewRequestForm.watch('approved');

  return (
    <div className="manage-venues-container">
      <div className="page-header">
        <h1 className="page-title">
          <span className="material-icons">location_city</span>
          Manage Venues
        </h1>
        <p className="page-subtitle">Create, update, and manage venues and review requests</p>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'venues' ? 'active' : ''}`}
          onClick={() => setActiveTab('venues')}
        >
          <span className="material-icons">location_on</span>
          All Venues ({venues.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <span className="material-icons">pending_actions</span>
          Pending Venue Requests ({venueRequests.length})
        </button>
      </div>

      {activeTab === 'venues' && (
        <div className="tab-content">
          <div className="form-card">
            <h2 className="card-title">
              <span className="material-icons">add_location</span>
              Create New Venue
            </h2>

            <form onSubmit={createVenueForm.handleSubmit(createVenue)}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">
                    Venue Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    {...createVenueForm.register('name', { required: true, minLength: 3 })}
                    className="form-control"
                    placeholder="Enter venue name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="capacity">
                    Capacity <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    {...createVenueForm.register('capacity', { required: true, min: 1 })}
                    className="form-control"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="address">
                    Address <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="address"
                    {...createVenueForm.register('address', { required: true, minLength: 5 })}
                    className="form-control"
                    placeholder="Enter complete address"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="latitude">
                    Latitude <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="latitude"
                    {...createVenueForm.register('latitude', {
                      required: true,
                      min: -90,
                      max: 90,
                      valueAsNumber: true,
                    })}
                    className="form-control"
                    step="any"
                    defaultValue={-90}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="longitude">
                    Longitude <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="longitude"
                    {...createVenueForm.register('longitude', {
                      required: true,
                      min: -180,
                      max: 180,
                      valueAsNumber: true,
                    })}
                    className="form-control"
                    step="any"
                    defaultValue={-180}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="availabilityStatus">
                    Availability Status <span className="required">*</span>
                  </label>
                  <select
                    id="availabilityStatus"
                    {...createVenueForm.register('availabilityStatus', { required: true })}
                    className="form-control"
                  >
                    {availabilityStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || !createVenueForm.formState.isValid}
                >
                  <span className="material-icons">add</span>
                  {isSubmitting ? 'Creating...' : 'Create Venue'}
                </button>
              </div>
            </form>
          </div>

          {isLoading && (
            <div className="loading-state">
              <span className="material-icons spin">refresh</span>
              <p>Loading venues...</p>
            </div>
          )}

          {!isLoading && venues.length === 0 && (
            <div className="empty-state">
              <span className="material-icons">location_off</span>
              <h3>No venues found</h3>
              <p>Create your first venue to get started</p>
            </div>
          )}

          {!isLoading && venues.length > 0 && (
            <div className="venues-grid">
              {venues.map((venue) => (
                <div key={venue.venueId} className="venue-card">
                  <div className="card-header">
                    <h3 className="venue-name">
                      <span className="material-icons">place</span>
                      {venue.name}
                    </h3>
                    <span className={`status-badge ${getStatusClass(venue.availabilityStatus)}`}>
                      {venue.availabilityStatus}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="venue-detail">
                      <span className="material-icons">location_on</span>
                      <div>
                        <strong>Address</strong>
                        <p>{venue.address}</p>
                      </div>
                    </div>

                    <div className="venue-detail">
                      <span className="material-icons">groups</span>
                      <div>
                        <strong>Capacity</strong>
                        <p>{venue.capacity.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="venue-detail">
                      <span className="material-icons">map</span>
                      <div>
                        <strong>Coordinates</strong>
                        <p>
                          {venue.latitude}, {venue.longitude}
                        </p>
                      </div>
                    </div>

                    <div className="venue-detail">
                      <span className="material-icons">schedule</span>
                      <div>
                        <strong>Created</strong>
                        <p>{formatDate(venue.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="card-footer">
                    <button className="action-btn btn-update" onClick={() => openUpdateModal(venue)}>
                      <span className="material-icons">edit</span>
                      Update
                    </button>
                    <button className="action-btn btn-delete" onClick={() => confirmDelete(venue)}>
                      <span className="material-icons">delete</span>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {activeTab === 'requests' && (
        <div className="tab-content">
          {isLoading && (
            <div className="loading-state">
              <span className="material-icons spin">refresh</span>
              <p>Loading requests...</p>
            </div>
          )}

          {!isLoading && venueRequests.length === 0 && (
            <div className="empty-state">
              <span className="material-icons">done_all</span>
              <h3>No pending requests</h3>
              <p>All venue requests have been reviewed</p>
            </div>
          )}

          {!isLoading && venueRequests.length > 0 && (
            <div className="requests-grid">
              {venueRequests.map((request) => (
                <div key={request.requestId} className="request-card">
                  <div className="card-header">
                    <h3 className="request-name">{request.locationName}</h3>
                    <span className="badge status-pending">Pending</span>
                  </div>

                  <div className="card-body">
                    <div className="request-detail">
                      <span className="material-icons">business</span>
                      <div>
                        <strong>Organizer</strong>
                        <p>{request.organizerName}</p>
                      </div>
                    </div>

                    <div className="request-detail">
                      <span className="material-icons">email</span>
                      <div>
                        <strong>Email</strong>
                        <p>{request.organizerEmail}</p>
                      </div>
                    </div>

                    <div className="request-detail">
                      <span className="material-icons">description</span>
                      <div>
                        <strong>Reason</strong>
                        <p>{request.reason}</p>
                      </div>
                    </div>

                    <div className="request-detail">
                      <span className="material-icons">schedule</span>
                      <div>
                        <strong>Submitted</strong>
                        <p>{formatDate(request.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="card-footer">
                    <button className="action-btn btn-review" onClick={() => openReviewModal(request)}>
                      <span className="material-icons">rate_review</span>
                      Review
                    </button>
                    <button className="action-btn btn-approve" onClick={() => quickApprove(request)}>
                      <span className="material-icons">check_circle</span>
                      Quick Approve
                    </button>
                    <button className="action-btn btn-reject" onClick={() => quickReject(request)}>
                      <span className="material-icons">cancel</span>
                      Quick Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}



      {showUpdateModal && selectedVenue && (
        <div className="modal-overlay" onClick={closeUpdateModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <span className="material-icons">edit</span>
                Update Venue
              </h2>
              <button className="close-btn" onClick={closeUpdateModal}>
                <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={updateVenueForm.handleSubmit(updateVenue)}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="update-name">
                      Venue Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="update-name"
                      {...updateVenueForm.register('name', { required: true, minLength: 3 })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="update-capacity">
                      Capacity <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="update-capacity"
                      {...updateVenueForm.register('capacity', { required: true, min: 1 })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="update-address">
                      Address <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="update-address"
                      {...updateVenueForm.register('address', { required: true, minLength: 5 })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="update-latitude">
                      Latitude <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="update-latitude"
                      {...updateVenueForm.register('latitude', {
                        required: true,
                        min: -90,
                        max: 90,
                        valueAsNumber: true,
                      })}
                      className="form-control"
                      step="any"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="update-longitude">
                      Longitude <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="update-longitude"
                      {...updateVenueForm.register('longitude', {
                        required: true,
                        min: -180,
                        max: 180,
                        valueAsNumber: true,
                      })}
                      className="form-control"
                      step="any"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="update-availabilityStatus">
                      Availability Status <span className="required">*</span>
                    </label>
                    <select
                      id="update-availabilityStatus"
                      {...updateVenueForm.register('availabilityStatus', { required: true })}
                      className="form-control"
                    >
                      {availabilityStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeUpdateModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!updateVenueForm.formState.isValid}
                >
                  <span className="material-icons">save</span>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && selectedVenue && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon danger">
              <span className="material-icons">delete_forever</span>
            </div>
            <h3>Delete Venue?</h3>
            <p>
              Are you sure you want to permanently delete
              <strong> {selectedVenue.name}</strong>?
            </p>
            <p className="warning-text">This action cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                No, Keep It
              </button>
              <button className="btn btn-danger" onClick={deleteVenue}>
                <span className="material-icons">delete</span>
                Yes, Delete Venue
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && selectedRequest && (
        <div className="modal-overlay" onClick={closeReviewModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <span className="material-icons">rate_review</span>
                Review Venue Request
              </h2>
              <button className="close-btn" onClick={closeReviewModal}>
                <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={reviewRequestForm.handleSubmit(reviewRequest)}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      {...reviewRequestForm.register('approved')}
                      onChange={(e) => {
                        reviewRequestForm.setValue('approved', e.target.checked);
                      }}
                    />
                    <span>Approve Request</span>
                  </label>
                </div>

                {!isApproved && (
                  <div className="form-group">
                    <label htmlFor="rejectionReason">
                      Rejection Reason <span className="required">*</span>
                    </label>
                    <textarea
                      id="rejectionReason"
                      {...reviewRequestForm.register('rejectionReason', {
                        required: !isApproved,
                      })}
                      className="form-control"
                      rows={3}
                    ></textarea>
                  </div>
                )}

                {isApproved && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="review-name">
                          Venue Name <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          id="review-name"
                          {...reviewRequestForm.register('name', {
                            required: isApproved,
                            minLength: 3,
                          })}
                          className="form-control"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="review-capacity">
                          Capacity <span className="required">*</span>
                        </label>
                        <input
                          type="number"
                          id="review-capacity"
                          {...reviewRequestForm.register('capacity', {
                            required: isApproved,
                            min: 1,
                          })}
                          className="form-control"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group full-width">
                        <label htmlFor="review-address">
                          Address <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          id="review-address"
                          {...reviewRequestForm.register('address', {
                            required: isApproved,
                            minLength: 5,
                          })}
                          className="form-control"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="review-latitude">
                          Latitude <span className="required">*</span>
                        </label>
                        <input
                          type="number"
                          id="review-latitude"
                          {...reviewRequestForm.register('latitude', {
                            required: isApproved,
                            min: -90,
                            max: 90,
                            valueAsNumber: true,
                          })}
                          className="form-control"
                          step="any"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="review-longitude">
                          Longitude <span className="required">*</span>
                        </label>
                        <input
                          type="number"
                          id="review-longitude"
                          {...reviewRequestForm.register('longitude', {
                            required: isApproved,
                            min: -180,
                            max: 180,
                            valueAsNumber: true,
                          })}
                          className="form-control"
                          step="any"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="review-availabilityStatus">
                          Availability Status <span className="required">*</span>
                        </label>
                        <select
                          id="review-availabilityStatus"
                          {...reviewRequestForm.register('availabilityStatus', {
                            required: isApproved,
                          })}
                          className="form-control"
                        >
                          {availabilityStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeReviewModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!reviewRequestForm.formState.isValid}
                >
                  <span className="material-icons">check_circle</span>
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageVenues;
