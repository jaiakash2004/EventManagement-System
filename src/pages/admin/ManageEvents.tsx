import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { adminService } from '../../services/adminService';
import { eventService } from '../../services/eventService';
import type { Event, Venue } from '../../services/eventService';
import './ManageEvents.css';

const ManageEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const eventTypes = [
    'Music Concert',
    'Dance Performance',
    'Comedy Show',
    'Theatre',
    'Workshop',
    'Conference',
    'Seminar',
    'Exhibition',
    'Sports Event',
    'Festival',
    'Food & Beverage',
    'Networking Event',
    'Charity Event',
    'Award Ceremony',
    'Product Launch',
    'Other',
  ];

  const searchForm = useForm();
  const updateEventForm = useForm();

  useEffect(() => {
    loadEvents();
    loadVenues();
  }, []);

  useEffect(() => {
    setFilteredEvents(events);
    updateActiveFilters();
  }, [events]);

  const loadVenues = async () => {
    try {
      const data = await eventService.getAllVenues();
      const available = data.filter((v: Venue) => v.availabilityStatus === 'Available');
      setVenues(available);
    } catch (error: any) {
      console.error('Error loading venues:', error);
      if (error.response?.status === 404) {
        toast.warning('Venues endpoint not implemented in backend yet');
      } else {
        toast.error('Failed to load venues');
      }
    }
  };

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const filters = searchForm.getValues();
      const params: any = {};

      if (filters.eventName) params.eventName = filters.eventName;
      if (filters.venueId) params.venueId = filters.venueId;
      if (filters.type) params.type = filters.type;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      if (filters.approvalStatus) params.approvalStatus = filters.approvalStatus;

      const data = await adminService.getAllEvents();
      setEvents(data);
    } catch (error: any) {
      console.error('Error loading events:', error);
      if (error.response?.status === 404) {
        toast.warning('Admin events endpoint not implemented in backend yet');
      } else {
        toast.error('Failed to load events');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateActiveFilters = () => {
    const filters = searchForm.getValues();
    const active: string[] = [];

    if (filters.eventName) active.push(`Event: ${filters.eventName}`);
    if (filters.venueId) {
      const venue = venues.find((v) => v.venueId === parseInt(filters.venueId));
      if (venue) active.push(`Venue: ${venue.name}`);
    }
    if (filters.type) active.push(`Type: ${filters.type}`);
    if (filters.fromDate) active.push(`From: ${filters.fromDate}`);
    if (filters.toDate) active.push(`To: ${filters.toDate}`);
    if (filters.approvalStatus) active.push(`Status: ${filters.approvalStatus}`);

    setActiveFilters(active);
  };

  const applyFilters = () => {
    loadEvents();
  };

  const clearFilters = () => {
    searchForm.reset();
    loadEvents();
  };

  const openUpdateModal = (event: Event) => {
    setSelectedEvent(event);
    setShowUpdateModal(true);

    const startDateTime = new Date(event.startTime);
    const endDateTime = new Date(event.endTime);
    const venue = venues.find((v) => v.name === event.venueName);

    updateEventForm.reset({
      eventName: event.eventName,
      description: event.description,
      rulesAndRestrictions: event.rulesAndRestrictions,
      type: event.type,
      ticketsProvided: event.ticketsProvided,
      maxTicketsPerUser: event.maxTicketsPerUser,
      ticketPrice: event.ticketPrice,
      startDate: startDateTime.toISOString().split('T')[0],
      startTime: startDateTime.toTimeString().slice(0, 5),
      endDate: endDateTime.toISOString().split('T')[0],
      endTime: endDateTime.toTimeString().slice(0, 5),
      venueId: venue?.venueId || '',
      status: event.status,
      approvalStatus: event.approvalStatus,
    });
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedEvent(null);
  };

  const updateEvent = async (data: any) => {
    if (!selectedEvent) return;

    try {
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`).toISOString();
      const endDateTime = new Date(`${data.endDate}T${data.endTime}`).toISOString();

      const requestBody = {
        eventName: data.eventName,
        description: data.description,
        rulesAndRestrictions: data.rulesAndRestrictions,
        type: data.type,
        ticketsProvided: parseInt(data.ticketsProvided),
        maxTicketsPerUser: parseInt(data.maxTicketsPerUser),
        ticketPrice: parseFloat(data.ticketPrice),
        startTime: startDateTime,
        endTime: endDateTime,
        venueId: parseInt(data.venueId),
        status: data.status,
        approvalStatus: data.approvalStatus,
      };

      await adminService.updateEvent(selectedEvent.eventId, requestBody);
      toast.success('Event updated successfully!');
      closeUpdateModal();
      loadEvents();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update event';
      toast.error(errorMessage);
    }
  };

  const quickApprove = async (event: Event) => {
    await quickUpdateApprovalStatus(event, 'APPROVED');
  };

  const quickReject = async (event: Event) => {
    await quickUpdateApprovalStatus(event, 'REJECTED');
  };

  const quickUpdateApprovalStatus = async (event: Event, status: string) => {
    try {
      const startDateTime = new Date(event.startTime).toISOString();
      const endDateTime = new Date(event.endTime).toISOString();
      const venue = venues.find((v) => v.name === event.venueName);

      const properCaseStatus =
        event.status.charAt(0).toUpperCase() + event.status.slice(1).toLowerCase();

      const requestBody = {
        eventName: event.eventName,
        description: event.description,
        rulesAndRestrictions: event.rulesAndRestrictions,
        type: event.type,
        ticketsProvided: event.ticketsProvided,
        maxTicketsPerUser: event.maxTicketsPerUser,
        ticketPrice: event.ticketPrice,
        startTime: startDateTime,
        endTime: endDateTime,
        venueId: venue?.venueId || 1,
        status: properCaseStatus,
        approvalStatus: status,
      };

      await adminService.updateEvent(event.eventId, requestBody);
      toast.success(`Event ${status.toLowerCase()} successfully!`);
      loadEvents();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update approval status';
      toast.error(errorMessage);
    }
  };

  const confirmCancel = (event: Event) => {
    setSelectedEvent(event);
    setShowCancelConfirm(true);
  };

  const cancelEvent = async () => {
    if (!selectedEvent) return;

    try {
      await adminService.cancelEvent(selectedEvent.eventId);
      toast.success('Event cancelled successfully!');
      setShowCancelConfirm(false);
      loadEvents();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to cancel event';
      toast.error(errorMessage);
    }
  };

  const confirmDelete = (event: Event) => {
    setSelectedEvent(event);
    setShowDeleteConfirm(true);
  };

  const deleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      await adminService.deleteEvent(selectedEvent.eventId);
      toast.success('Event deleted successfully!');
      setShowDeleteConfirm(false);
      loadEvents();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete event';
      toast.error(errorMessage);
    }
  };

  const getStatusClass = (status: string): string => {
    switch (status.toUpperCase()) {
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

  const getEventStatusClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'event-upcoming';
      case 'ongoing':
        return 'event-ongoing';
      case 'completed':
        return 'event-completed';
      case 'cancelled':
        return 'event-cancelled';
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

  return (
    <div className="manage-events-container">
      <div className="page-header">
        <h1 className="page-title">
          <span className="material-icons">event_available</span>
          Manage Events
        </h1>
        <p className="page-subtitle">View, filter, and manage all events in the system</p>
      </div>

      <div className="filters-card">
        <form onSubmit={searchForm.handleSubmit(applyFilters)}>
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="eventName">
                <span className="material-icons">search</span>
                Event Name
              </label>
              <input
                type="text"
                id="eventName"
                {...searchForm.register('eventName')}
                className="form-control"
                placeholder="Search by name"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="type">
                <span className="material-icons">category</span>
                Event Type
              </label>
              <select id="type" {...searchForm.register('type')} className="form-control">
                <option value="">All Types</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="venueId">
                <span className="material-icons">location_on</span>
                Venue
              </label>
              <select id="venueId" {...searchForm.register('venueId')} className="form-control">
                <option value="">All Venues</option>
                {venues.map((venue) => (
                  <option key={venue.venueId} value={venue.venueId}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="approvalStatus">
                <span className="material-icons">check_circle</span>
                Approval Status
              </label>
              <select
                id="approvalStatus"
                {...searchForm.register('approvalStatus')}
                className="form-control"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="fromDate">
                <span className="material-icons">date_range</span>
                From Date
              </label>
              <input
                type="date"
                id="fromDate"
                {...searchForm.register('fromDate')}
                className="form-control"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="toDate">
                <span className="material-icons">date_range</span>
                To Date
              </label>
              <input
                type="date"
                id="toDate"
                {...searchForm.register('toDate')}
                className="form-control"
              />
            </div>
          </div>

          <div className="filter-actions">
            <button type="submit" className="btn btn-primary">
              <span className="material-icons">filter_list</span>
              Apply Filters
            </button>
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>
              <span className="material-icons">clear</span>
              Clear All
            </button>
          </div>
        </form>

        {activeFilters.length > 0 && (
          <div className="active-filters">
            <span className="filters-label">Active Filters:</span>
            <div className="filter-chips">
              {activeFilters.map((filter, index) => (
                <span key={index} className="filter-chip">
                  {filter}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="loading-state">
          <span className="material-icons spin">refresh</span>
          <p>Loading events...</p>
        </div>
      )}

      {!isLoading && filteredEvents.length === 0 && (
        <div className="empty-state">
          <span className="material-icons">event_busy</span>
          <h3>No events found</h3>
          <p>Try adjusting your filters or check back later</p>
        </div>
      )}

      {!isLoading && filteredEvents.length > 0 && (
        <div className="events-grid">
          {filteredEvents.map((event) => (
            <div key={event.eventId} className="event-card">
              <div className="card-header">
                <div className="header-badges">
                  <span className={`badge ${getStatusClass(event.approvalStatus)}`}>
                    {event.approvalStatus}
                  </span>
                  <span className={`badge ${getEventStatusClass(event.status)}`}>
                    {event.status}
                  </span>
                </div>
                <span className="event-id">#{event.eventId}</span>
              </div>

              <div className="card-body">
                <h3 className="event-name">{event.eventName}</h3>
                <p className="event-type">
                  <span className="material-icons">category</span>
                  {event.type}
                </p>

                <div className="event-details">
                  <div className="detail-item">
                    <span className="material-icons">place</span>
                    <div>
                      <strong>{event.venueName}</strong>
                      <small>{event.venueAddress}</small>
                    </div>
                  </div>

                  <div className="detail-item">
                    <span className="material-icons">schedule</span>
                    <div>
                      <strong>{formatDate(event.startTime)}</strong>
                      <small>to {formatDate(event.endTime)}</small>
                    </div>
                  </div>

                  <div className="detail-item">
                    <span className="material-icons">business</span>
                    <div>
                      <strong>{event.organizerName}</strong>
                      <small>{event.organizerType}</small>
                    </div>
                  </div>

                  <div className="detail-row">
                    <div className="detail-item">
                      <span className="material-icons">confirmation_number</span>
                      <span>{event.ticketsProvided} tickets</span>
                    </div>
                    <div className="detail-item">
                      <span className="material-icons">attach_money</span>
                      <span>${event.ticketPrice}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <button 
                  className="btn-quick btn-approve" 
                  onClick={() => quickApprove(event)}
                  disabled={event.approvalStatus === 'APPROVED'}
                >
                  <span className="material-icons">check_circle</span>
                  Approve
                </button>
                <button 
                  className="btn-quick btn-reject" 
                  onClick={() => quickReject(event)}
                  disabled={event.approvalStatus === 'REJECTED'}
                >
                  <span className="material-icons">cancel</span>
                  Reject
                </button>
              </div>

              <div className="card-footer">
                <button className="action-btn btn-update" onClick={() => openUpdateModal(event)}>
                  <span className="material-icons">edit</span>
                  Update
                </button>
                <button className="action-btn btn-cancel" onClick={() => confirmCancel(event)}>
                  <span className="material-icons">event_busy</span>
                  Cancel
                </button>
                <button className="action-btn btn-delete" onClick={() => confirmDelete(event)}>
                  <span className="material-icons">delete</span>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpdateModal && selectedEvent && (
        <div className="modal-overlay" onClick={closeUpdateModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <span className="material-icons">edit</span>
                Update Event
              </h2>
              <button className="close-btn" onClick={closeUpdateModal}>
                <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={updateEventForm.handleSubmit(updateEvent)}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="eventName">
                      Event Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="eventName"
                      {...updateEventForm.register('eventName', { required: true, minLength: 3 })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="type">Event Type <span className="required">*</span></label>
                    <select
                      id="type"
                      {...updateEventForm.register('type', { required: true })}
                      className="form-control"
                    >
                      {eventTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="ticketPrice">
                      Ticket Price ($) <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="ticketPrice"
                      {...updateEventForm.register('ticketPrice', { required: true, min: 0 })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="description">
                      Description <span className="required">*</span>
                    </label>
                    <textarea
                      id="description"
                      {...updateEventForm.register('description', { required: true, minLength: 10 })}
                      className="form-control"
                      rows={3}
                    ></textarea>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="rulesAndRestrictions">
                      Rules and Restrictions <span className="required">*</span>
                    </label>
                    <textarea
                      id="rulesAndRestrictions"
                      {...updateEventForm.register('rulesAndRestrictions', { required: true })}
                      className="form-control"
                      rows={3}
                    ></textarea>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="venueId">Venue <span className="required">*</span></label>
                    <select
                      id="venueId"
                      {...updateEventForm.register('venueId', { required: true })}
                      className="form-control"
                    >
                      {venues.map((venue) => (
                        <option key={venue.venueId} value={venue.venueId}>
                          {venue.name} ({venue.capacity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="ticketsProvided">
                      Total Tickets <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="ticketsProvided"
                      {...updateEventForm.register('ticketsProvided', { required: true, min: 1 })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="maxTicketsPerUser">
                      Max Tickets Per User <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="maxTicketsPerUser"
                      {...updateEventForm.register('maxTicketsPerUser', { required: true, min: 1 })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">
                      Event Status <span className="required">*</span>
                    </label>
                    <select
                      id="status"
                      {...updateEventForm.register('status', { required: true })}
                      className="form-control"
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="approvalStatus">
                      Approval Status <span className="required">*</span>
                    </label>
                    <select
                      id="approvalStatus"
                      {...updateEventForm.register('approvalStatus', { required: true })}
                      className="form-control"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startDate">
                      Start Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      {...updateEventForm.register('startDate', { required: true })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="startTime">
                      Start Time <span className="required">*</span>
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      {...updateEventForm.register('startTime', { required: true })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="endDate">
                      End Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      {...updateEventForm.register('endDate', { required: true })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="endTime">
                      End Time <span className="required">*</span>
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      {...updateEventForm.register('endTime', { required: true })}
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeUpdateModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!updateEventForm.formState.isValid}
                >
                  <span className="material-icons">save</span>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCancelConfirm && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowCancelConfirm(false)}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon warning">
              <span className="material-icons">event_busy</span>
            </div>
            <h3>Cancel Event?</h3>
            <p>
              Are you sure you want to cancel
              <strong> {selectedEvent.eventName}</strong>?
            </p>
            <p className="warning-text">This action cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setShowCancelConfirm(false)}>
                No, Keep It
              </button>
              <button className="btn btn-danger" onClick={cancelEvent}>
                <span className="material-icons">event_busy</span>
                Yes, Cancel Event
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon danger">
              <span className="material-icons">delete_forever</span>
            </div>
            <h3>Delete Event?</h3>
            <p>
              Are you sure you want to permanently delete
              <strong> {selectedEvent.eventName}</strong>?
            </p>
            <p className="warning-text">
              This action cannot be undone and all associated data will be lost.
            </p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                No, Keep It
              </button>
              <button className="btn btn-danger" onClick={deleteEvent}>
                <span className="material-icons">delete</span>
                Yes, Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEvents;
