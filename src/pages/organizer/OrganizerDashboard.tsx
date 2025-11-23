import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { organizerService, type OrganizerEvent } from '../../services/organizerService';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../contexts/AuthContext';
import './OrganizerDashboard.css';

interface EventStats {
  total: number;
  upcoming: number;
  ongoing: number;
  completed: number;
  totalBookings: number;
  totalRevenue: number;
}

interface EventFeedback {
  feedbackId: number;
  comments: string;
  createdAt: string;
}

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<EventStats>({
    total: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>({});
  const [selectedEventId, setSelectedEventId] = useState<number>(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedEventForFeedback, setSelectedEventForFeedback] = useState<OrganizerEvent | null>(null);
  const [eventFeedbacks, setEventFeedbacks] = useState<EventFeedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [venues, setVenues] = useState<any[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();

  useEffect(() => {
    loadEvents();
    loadVenues();
    loadBookingSummary();
    startPolling();

    return () => {
      stopPolling();
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, selectedStatus, searchTerm]);

  const startPolling = () => {
    pollingIntervalRef.current = setInterval(() => {
      loadBookingSummary();
    }, 5000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await organizerService.getOrganizerEvents();
      setEvents(data);
      calculateEventStats(data);
      updateAllStatuses(data);
    } catch (error: any) {
      console.error('Error loading organizer events:', error);
      toast.error('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadVenues = async () => {
    try {
      const data = await eventService.getAllVenues();
      setVenues(data);
    } catch (error) {
      console.error('Error loading venues:', error);
    }
  };

  const loadBookingSummary = async () => {
    try {
      const data = await organizerService.getBookingSummary();
      setStats(prev => ({
        ...prev,
        totalBookings: data.totalActiveTickets || 0,
        totalRevenue: data.totalRevenue || 0,
      }));
    } catch (error) {
      console.error('Error loading booking summary:', error);
    }
  };

  const calculateEventStats = (eventsList: OrganizerEvent[]) => {
    const now = new Date();
    let upcoming = 0;
    let ongoing = 0;
    let completed = 0;

    eventsList.forEach((event) => {
      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime);

      if (event.approvalStatus === 'CANCELLED') {
        return;
      }

      if (now < startTime) {
        upcoming++;
      } else if (now >= startTime && now <= endTime) {
        ongoing++;
      } else {
        completed++;
      }
    });

    setStats(prev => ({
      ...prev,
      total: eventsList.length,
      upcoming,
      ongoing,
      completed,
    }));
  };

  const getCalculatedStatus = (event: OrganizerEvent): 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' => {
    const now = new Date();
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    if (event.approvalStatus === 'CANCELLED') {
      return 'CANCELLED';
    }

    if (now < startTime) {
      return 'UPCOMING';
    } else if (now >= startTime && now <= endTime) {
      return 'ONGOING';
    } else {
      return 'COMPLETED';
    }
  };

  const updateAllStatuses = (eventsList: OrganizerEvent[]) => {
    const updated = eventsList.map(ev => ({
      ...ev,
      status: getCalculatedStatus(ev),
    }));
    setEvents(updated);
  };

  const applyFilters = () => {
    let filtered = [...events];

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((event) => {
        const calculatedStatus = getCalculatedStatus(event);
        return calculatedStatus === selectedStatus;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.eventName.toLowerCase().includes(term) ||
          event.venueName.toLowerCase().includes(term) ||
          event.description.toLowerCase().includes(term)
      );
    }

    setFilteredEvents(filtered);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openEditModal = (event: OrganizerEvent) => {
    setSelectedEventId(event.eventId);
    const venue = venues.find(v => v.name === event.venueName);
    const startDateTime = new Date(event.startTime);
    const endDateTime = new Date(event.endTime);

    setEditingEvent({
      eventName: event.eventName,
      description: event.description,
      rulesAndRestrictions: event.rulesAndRestrictions,
      type: event.type,
      venueId: venue?.venueId || 1,
      ticketsProvided: event.ticketsProvided,
      maxTicketsPerUser: event.maxTicketsPerUser,
      ticketPrice: event.ticketPrice,
      startTime: formatDateTimeLocal(startDateTime),
      endTime: formatDateTimeLocal(endDateTime),
    });

    setValue('eventName', event.eventName);
    setValue('description', event.description);
    setValue('rulesAndRestrictions', event.rulesAndRestrictions);
    setValue('type', event.type);
    setValue('venueId', venue?.venueId || 1);
    setValue('ticketsProvided', event.ticketsProvided);
    setValue('maxTicketsPerUser', event.maxTicketsPerUser);
    setValue('ticketPrice', event.ticketPrice);
    setValue('startTime', formatDateTimeLocal(startDateTime));
    setValue('endTime', formatDateTimeLocal(endDateTime));

    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingEvent({});
    setSelectedEventId(0);
    reset();
  };

  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const saveEvent = async (data: any) => {
    if (!selectedEventId) {
      toast.error('Invalid event ID', { type: 'error' });
      return;
    }

    // Validation
    if (!data.eventName || data.eventName.trim().length < 3) {
      toast.error('Event name is required and must be at least 3 characters long', { type: 'error' });
      return;
    }

    if (!data.description || data.description.trim().length < 10) {
      toast.error('Description is required and must be at least 10 characters long', { type: 'error' });
      return;
    }

    if (!data.rulesAndRestrictions || data.rulesAndRestrictions.trim().length === 0) {
      toast.error('Rules and restrictions are required', { type: 'error' });
      return;
    }

    if (!data.type) {
      toast.error('Event type is required', { type: 'error' });
      return;
    }

    if (!data.venueId || data.venueId <= 0) {
      toast.error('Valid venue ID is required', { type: 'error' });
      return;
    }

    if (!data.ticketsProvided || data.ticketsProvided <= 0) {
      toast.error('Total tickets must be greater than 0', { type: 'error' });
      return;
    }

    if (!data.maxTicketsPerUser || data.maxTicketsPerUser <= 0) {
      toast.error('Max tickets per user must be greater than 0', { type: 'error' });
      return;
    }

    if (data.maxTicketsPerUser > data.ticketsProvided) {
      toast.error('Max tickets per user cannot exceed total tickets provided', { type: 'error' });
      return;
    }

    if (data.ticketPrice < 0) {
      toast.error('Ticket price cannot be negative', { type: 'error' });
      return;
    }

    if (!data.startTime || !data.endTime) {
      toast.error('Start time and end time are required', { type: 'error' });
      return;
    }

    const startDateTime = new Date(data.startTime);
    const endDateTime = new Date(data.endTime);
    const now = new Date();

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      toast.error('Invalid date/time format', { type: 'error' });
      return;
    }

    if (startDateTime <= now) {
      toast.error('Start time must be in the future', { type: 'error' });
      return;
    }

    if (endDateTime <= startDateTime) {
      toast.error('End time must be after start time', { type: 'error' });
      return;
    }

    const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
    if (durationMinutes < 30) {
      toast.error('Event duration must be at least 30 minutes', { type: 'error' });
      return;
    }

    try {
      const updateRequest = {
        eventName: data.eventName.trim(),
        description: data.description.trim(),
        rulesAndRestrictions: data.rulesAndRestrictions.trim(),
        type: data.type,
        venueId: Number(data.venueId),
        ticketsProvided: Number(data.ticketsProvided),
        maxTicketsPerUser: Number(data.maxTicketsPerUser),
        ticketPrice: Number(data.ticketPrice),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      };

      await organizerService.updateEvent(selectedEventId, updateRequest);
      toast.success('Event updated successfully!');
      closeEditModal();
      loadEvents();
      loadBookingSummary();
    } catch (error: any) {
      console.error('Error updating event:', error);
      const errorMessage = error.response?.data?.message || 'Please try again.';
      toast.error(`Failed to update event: ${errorMessage}`);
    }
  };

  const cancelEvent = async (eventId: number) => {
    if (!window.confirm('Are you sure you want to cancel this event?')) {
      return;
    }

    try {
      const response = await organizerService.cancelEvent(eventId);
      toast.success(response.message || 'Event cancelled successfully!');
      loadEvents();
      loadBookingSummary();
    } catch (error: any) {
      console.error('Error cancelling event:', error);
      const errorMessage = error.response?.data?.message || 'Please try again.';
      toast.error(`Failed to cancel event: ${errorMessage}`);
    }
  };

  const openFeedbackModal = async (event: OrganizerEvent) => {
    setSelectedEventForFeedback(event);
    setShowFeedbackModal(true);
    setEventFeedbacks([]);
    setFeedbackLoading(true);

    try {
      const feedbacks = await organizerService.getEventFeedback(event.eventId);
      setEventFeedbacks(feedbacks || []);
    } catch (error) {
      console.error('Error loading feedback:', error);
      setEventFeedbacks([]);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setSelectedEventForFeedback(null);
    setEventFeedbacks([]);
    setFeedbackLoading(false);
  };

  const isEventCompleted = (event: OrganizerEvent): boolean => {
    return getCalculatedStatus(event) === 'COMPLETED';
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadEvents(),
        loadVenues(),
        loadBookingSummary(),
      ]);
      toast.success('Data refreshed successfully!', { position: 'top-right' });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="organizer-container">
      <header className="dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>My Events Dashboard</h1>
            <p>Manage and track your events</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: isRefreshing ? '#999' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
            }}
          >
            <span className="material-icons" style={{ fontSize: '20px', animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}>refresh</span>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Events</div>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.upcoming}</div>
            <div className="stat-label">Upcoming Events</div>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalBookings}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">${Math.round(stats.totalRevenue)}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search events by title or venue..."
            className="search-input"
          />
        </div>

        <div className="status-filter">
          <button
            className={`filter-btn ${selectedStatus === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('all')}
          >
            All Events
          </button>
          <button
            className={`filter-btn filter-upcoming ${selectedStatus === 'UPCOMING' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('UPCOMING')}
          >
            Upcoming
          </button>
          <button
            className={`filter-btn filter-ongoing ${selectedStatus === 'ONGOING' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('ONGOING')}
          >
            Ongoing
          </button>
          <button
            className={`filter-btn filter-completed ${selectedStatus === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('COMPLETED')}
          >
            Completed
          </button>
          <button
            className={`filter-btn filter-completed ${selectedStatus === 'CANCELLED' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('CANCELLED')}
          >
            Cancelled
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your events...</p>
        </div>
      )}

      {!loading && filteredEvents.length > 0 && (
        <div className="events-list">
          {filteredEvents.map((event) => (
            <div key={event.eventId} className="event-card-organizer">
              <div className="event-image-section">
                <span className={`event-status-badge status-${getCalculatedStatus(event).toLowerCase()}`}>
                  {getCalculatedStatus(event)}
                </span>
              </div>

              <div className="event-info-section">
                <div className="event-header">
                  <div>
                    <span className="event-type-badge">{event.type}</span>
                    <h3 className="event-title">{event.eventName}</h3>
                    <p className="event-description">{event.description}</p>
                  </div>
                </div>

                <div className="event-details-grid">
                  <div className="detail-item">
                    <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <div>
                      <div className="detail-label">Date</div>
                      <div className="detail-value">{formatDate(event.startTime)}</div>
                    </div>
                  </div>

                  <div className="detail-item">
                    <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <div>
                      <div className="detail-label">Time</div>
                      <div className="detail-value">{formatTime(event.startTime)}</div>
                    </div>
                  </div>

                  <div className="detail-item">
                    <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <div>
                      <div className="detail-label">Venue</div>
                      <div className="detail-value">{event.venueName}</div>
                    </div>
                  </div>

                  <div className="detail-item">
                    <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <polyline points="17 11 19 13 23 9"></polyline>
                    </svg>
                    <div>
                      <div className="detail-label">Tickets</div>
                      <div className="detail-value">{event.ticketsProvided} seats</div>
                    </div>
                  </div>
                </div>

                {event.approvalStatus && (
                  <div className="approval-status">
                    <span className={`approval-badge approval-${event.approvalStatus.toLowerCase()}`}>
                      {event.approvalStatus}
                    </span>
                  </div>
                )}
              </div>

              <div className="event-actions">
                {!isEventCompleted(event) && (
                  <button className="action-btn btn-edit" onClick={() => openEditModal(event)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                  </button>
                )}
                {isEventCompleted(event) && (
                  <button className="action-btn btn-feedback" onClick={() => openFeedbackModal(event)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Feedbacks
                  </button>
                )}
                {!isEventCompleted(event) && (
                  <button className="action-btn btn-cancel" onClick={() => cancelEvent(event.eventId)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredEvents.length === 0 && (
        <div className="no-events">
          <svg className="no-events-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <h3>No Events Found</h3>
          <p>{searchTerm || selectedStatus !== 'all' ? 'Try adjusting your filters' : 'Start by creating your first event'}</p>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Event</h2>
              <button className="modal-close" onClick={closeEditModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit(saveEvent)}>
              <div className="form-group">
                <label>Event Title</label>
                <input
                  type="text"
                  {...register('eventName', { required: true, minLength: 3 })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  {...register('description', { required: true, minLength: 10 })}
                  rows={3}
                  className="form-input"
                ></textarea>
              </div>

              <div className="form-group">
                <label>Rules and Restrictions</label>
                <textarea
                  {...register('rulesAndRestrictions', { required: true })}
                  rows={2}
                  className="form-input"
                ></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Event Type</label>
                  <select {...register('type', { required: true })} className="form-input">
                    <option value="">Select Event Type</option>
                    {eventTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Venue ID</label>
                  <input
                    type="number"
                    {...register('venueId', { required: true, min: 1 })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date & Time</label>
                  <input
                    type="datetime-local"
                    {...register('startTime', { required: true })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>End Date & Time</label>
                  <input
                    type="datetime-local"
                    {...register('endTime', { required: true })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Total Tickets</label>
                  <input
                    type="number"
                    {...register('ticketsProvided', { required: true, min: 1 })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Max Per User</label>
                  <input
                    type="number"
                    {...register('maxTicketsPerUser', { required: true, min: 1 })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Ticket Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('ticketPrice', { required: true, min: 0 })}
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFeedbackModal && selectedEventForFeedback && (
        <div className="modal-overlay" onClick={closeFeedbackModal}>
          <div className="modal-content feedback-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Event Feedbacks</h2>
              <button className="modal-close" onClick={closeFeedbackModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="feedback-event-info">
                <h3>{selectedEventForFeedback.eventName}</h3>
                <div className="feedback-meta">
                  <span className="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {eventFeedbacks.length} {eventFeedbacks.length === 1 ? 'Feedback' : 'Feedbacks'}
                  </span>
                  <span className="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {formatDate(selectedEventForFeedback.startTime)}
                  </span>
                </div>
              </div>

              {feedbackLoading && (
                <div className="feedback-loading">
                  <div className="spinner"></div>
                  <p>Loading feedbacks...</p>
                </div>
              )}

              {!feedbackLoading && eventFeedbacks.length === 0 && (
                <div className="no-feedback">
                  <svg className="no-feedback-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    <line x1="9" y1="10" x2="9" y2="10"></line>
                    <line x1="15" y1="10" x2="15" y2="10"></line>
                  </svg>
                  <h4>No Feedback Yet</h4>
                  <p>No users have submitted feedback for this event yet.</p>
                </div>
              )}

              {!feedbackLoading && eventFeedbacks.length > 0 && (
                <div className="feedback-list">
                  {eventFeedbacks.map((feedback, index) => (
                    <div key={feedback.feedbackId || index} className="feedback-item">
                      <div className="feedback-header">
                        <div className="feedback-number">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          Feedback #{index + 1}
                        </div>
                      </div>
                      <div className="feedback-comment">{feedback.comments}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-close-modal" onClick={closeFeedbackModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;
