import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { eventService } from '../../services/eventService';
import type { Event, Venue } from '../../services/eventService';
import { paymentService } from '../../services/paymentService';
import api from '../../services/api';
import './BrowseEvents.css';

interface RegistrationResponse {
  paymentId: number;
  eventId: number;
  eventName: string;
  ticketQuantity: number;
  totalAmount: number;
  paymentStatus: string;
  message: string;
}

interface Ticket {
  ticketId: number;
  ticketCode: string;
  eventName: string;
  eventStartTime: string;
  status: string;
  seatNumber: string | null;
  ticketType: string;
  venueName: string;
  venueAddress: string;
}

interface FilterFormData {
  eventName: string;
  venueId: string;
  type: string;
  fromDate: string;
  toDate: string;
}

interface RegistrationFormData {
  ticketQuantity: number;
  ticketType: string;
  accountNumber: string;
}

const BrowseEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTicketsModal, setShowTicketsModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [registrationData, setRegistrationData] = useState<RegistrationResponse | null>(null);
  const [generatedTickets, setGeneratedTickets] = useState<Ticket[] | null>(null);

  const filterForm = useForm<FilterFormData>({
    defaultValues: {
      eventName: '',
      venueId: '',
      type: '',
      fromDate: '',
      toDate: '',
    },
  });

  const registrationForm = useForm<RegistrationFormData>({
    defaultValues: {
      ticketQuantity: 1,
      ticketType: 'Regular',
      accountNumber: '',
    },
  });

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

  const ticketTypes = ['Regular'];

  useEffect(() => {
    loadEvents();
    loadVenues();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await eventService.getAllEvents();
      const currentDate = new Date();
      const filtered = data.filter(
        (event: Event) =>
          event.approvalStatus === 'APPROVED' &&
          new Date(event.startTime) > currentDate
      );
      setEvents(filtered);
    } catch (error: any) {
      toast.error('Failed to load events', { position: 'top-right' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadVenues = async () => {
    try {
      const data = await eventService.getAllVenues();
      setVenues(data);
    } catch (error) {
      console.error('Failed to load venues', error);
    }
  };

  const applyFilters = async () => {
    const filters = filterForm.getValues();
    const params: any = {};

    if (filters.eventName) params.eventName = filters.eventName;
    if (filters.venueId) params.venueId = filters.venueId;
    if (filters.type) params.type = filters.type;

    if (filters.fromDate) {
      const fromDate = new Date(filters.fromDate);
      fromDate.setHours(0, 0, 0, 0);
      params.fromDate = fromDate.toISOString().slice(0, 19);
    }
    if (filters.toDate) {
      const toDate = new Date(filters.toDate);
      toDate.setHours(23, 59, 59, 999);
      params.toDate = toDate.toISOString().slice(0, 19);
    }

    if (Object.keys(params).length === 0) {
      loadEvents();
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get<any>('/events/filter', { params });
      if (response.data.success) {
        const currentDate = new Date();
        const filtered = response.data.data.filter(
          (event: Event) =>
            event.approvalStatus === 'APPROVED' &&
            new Date(event.startTime) > currentDate
        );
        setEvents(filtered);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to filter events';
      toast.error(errorMessage, { position: 'top-right' });
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    filterForm.reset();
    loadEvents();
  };

  const openEventDetails = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetailsModal(true);
  };

  const closeEventDetails = () => {
    setShowEventDetailsModal(false);
    setSelectedEvent(null);
  };

  const openRegistrationModal = () => {
    if (selectedEvent) {
      setShowEventDetailsModal(false);
      setShowRegistrationModal(true);
      registrationForm.reset({
        ticketQuantity: 1,
        ticketType: 'Regular',
        accountNumber: '',
      });
    }
  };

  const closeRegistrationModal = () => {
    setShowRegistrationModal(false);
    registrationForm.reset({ ticketQuantity: 1, ticketType: 'Regular', accountNumber: '' });
  };

  const getTotalPrice = (): number => {
    if (!selectedEvent) return 0;
    const quantity = registrationForm.watch('ticketQuantity') || 0;
    return quantity * selectedEvent.ticketPrice;
  };

  const registerForEvent = async () => {
    if (!selectedEvent) return;

    const ticketQuantity = registrationForm.getValues('ticketQuantity');
    const ticketType = registrationForm.getValues('ticketType');

    if (
      ticketQuantity < 1 ||
      ticketQuantity > selectedEvent.maxTicketsPerUser
    ) {
      toast.warning(
        `Ticket quantity must be between 1 and ${selectedEvent.maxTicketsPerUser}`,
        { position: 'top-right' }
      );
      return;
    }

    const token = sessionStorage.getItem('token');
    if (!token) {
      toast.error('Please login to register for events', { position: 'top-right' });
      navigate('/login');
      return;
    }

    try {
      const response = await api.post<any>('/users/events/register', {
        eventId: selectedEvent.eventId,
        ticketQuantity: ticketQuantity,
        ticketType: ticketType,
        seatNumber: '',
      });

      if (response.data.success) {
        setRegistrationData(response.data.data);
        toast.success('Registration initiated successfully!', { position: 'top-right' });
        closeRegistrationModal();
        setShowPaymentModal(true);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Failed to register for event';
      toast.error(errorMessage, { position: 'top-right' });
    }
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setRegistrationData(null);
    registrationForm.setValue('accountNumber', '');
  };

  const completePayment = async () => {
    if (!registrationData) return;

    setIsProcessingPayment(true);

    const accountNumber = registrationForm.getValues('accountNumber');
    if (!accountNumber || accountNumber.trim() === '') {
      toast.error('Account number is required', { position: 'top-right' });
      setIsProcessingPayment(false);
      return;
    }

    // Step 1: Call external bank payment API
    const bankPaymentRequest = {
      fromAccountNumber: accountNumber.trim(),
      toAccountNumber: 341234,
      amount: registrationData.totalAmount,
      remarks: 'Event Ticket Purchase',
    };

    const externalBankResult = await paymentService.processBankPayment(bankPaymentRequest);

    if (!externalBankResult.success) {
      toast.error(externalBankResult.message, { position: 'top-right' });
      setIsProcessingPayment(false);
      return;
    }

    toast.success(externalBankResult.message, { position: 'top-right' });

    // Step 2: Simulate payment with backend
    try {
      const response = await api.post<any>('/users/payments/simulate', {
        paymentId: registrationData.paymentId,
        success: true,
        seatNumber: '',
      });

      if (response.data.success) {
        setGeneratedTickets(response.data.data.tickets);
        toast.success(response.data.data.message, { position: 'top-right' });
        closePaymentModal();
        setShowTicketsModal(true);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Payment simulation failed';
      toast.error(errorMessage, { position: 'top-right' });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const closeTicketsModal = () => {
    setShowTicketsModal(false);
    setGeneratedTickets(null);
    setSelectedEvent(null);
    loadEvents();
  };

  const downloadTickets = () => {
    if (!generatedTickets) return;

    let ticketContent = '=== EVENT TICKETS ===\n\n';
    generatedTickets.forEach((ticket, index) => {
      ticketContent += `Ticket ${index + 1}\n`;
      ticketContent += `------------------\n`;
      ticketContent += `Ticket Code: ${ticket.ticketCode}\n`;
      ticketContent += `Event: ${ticket.eventName}\n`;
      ticketContent += `Type: ${ticket.ticketType}\n`;
      ticketContent += `Date: ${new Date(ticket.eventStartTime).toLocaleString()}\n`;
      ticketContent += `Venue: ${ticket.venueName}\n`;
      ticketContent += `Address: ${ticket.venueAddress}\n`;
      ticketContent += `Status: ${ticket.status}\n`;
      ticketContent += `\n`;
    });

    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `event-tickets-${Date.now()}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast.success('Tickets downloaded successfully', { position: 'top-right' });
  };

  const viewAllTickets = () => {
    closeTicketsModal();
    navigate('/user/myTickets');
  };

  const getStatusClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'status-upcoming';
      case 'ongoing':
        return 'status-ongoing';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const isEventUpcoming = (event: Event): boolean => {
    return event.status.toLowerCase() === 'upcoming';
  };

  const formatDate = (dateString: string, format: 'short' | 'full' = 'short'): string => {
    const date = new Date(dateString);
    if (format === 'full') {
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      });
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' at ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="browse-events-container">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">
          <span className="material-icons">event_available</span>
          Browse Events
        </h1>
        <p className="page-subtitle">Discover and register for upcoming events</p>
      </div>

      {/* Filter Section */}
      <div className="filter-card">
        <h2 className="filter-title">
          <span className="material-icons">filter_list</span>
          Filter Events
        </h2>
        <form onSubmit={filterForm.handleSubmit(applyFilters)}>
          <div className="filter-row">
            <div className="form-group">
              <label htmlFor="eventName">Event Name</label>
              <input
                type="text"
                id="eventName"
                {...filterForm.register('eventName')}
                className="form-control"
                placeholder="Search by event name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="venueId">Venue</label>
              <select id="venueId" {...filterForm.register('venueId')} className="form-control">
                <option value="">All Venues</option>
                {venues.map((venue) => (
                  <option key={venue.venueId} value={venue.venueId}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="type">Event Type</label>
              <select id="type" {...filterForm.register('type')} className="form-control">
                <option value="">All Types</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="fromDate">From Date</label>
              <input
                type="date"
                id="fromDate"
                {...filterForm.register('fromDate')}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="toDate">To Date</label>
              <input
                type="date"
                id="toDate"
                {...filterForm.register('toDate')}
                className="form-control"
              />
            </div>
          </div>

          <div className="filter-actions">
            <button type="submit" className="btn btn-primary">
              <span className="material-icons">search</span>
              Apply Filters
            </button>
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>
              <span className="material-icons">clear</span>
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <span className="material-icons spin">hourglass_empty</span>
          <p>Loading events...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && events.length === 0 && (
        <div className="empty-state">
          <span className="material-icons">event_busy</span>
          <h3>No Events Found</h3>
          <p>There are no approved events available at the moment.</p>
        </div>
      )}

      {/* Events Grid */}
      {!isLoading && events.length > 0 && (
        <div className="events-grid">
          {events.map((event) => (
            <div key={event.eventId} className="event-card">
              <div className="card-header">
                <h3 className="event-name">{event.eventName}</h3>
                <div className={`status-badge ${getStatusClass(event.status)}`}>
                  {event.status}
                </div>
              </div>

              <div className="card-body">
                <p className="event-type">
                  <span className="material-icons">category</span>
                  {event.type}
                </p>

                <div className="event-info">
                  <div className="info-item">
                    <span className="material-icons">schedule</span>
                    <span>{formatDate(event.startTime)}</span>
                  </div>
                  <div className="info-item">
                    <span className="material-icons">location_on</span>
                    <span>{event.venueName}</span>
                  </div>
                  <div className="info-item">
                    <span className="material-icons">confirmation_number</span>
                    <span>{event.ticketsProvided} tickets available</span>
                  </div>
                  <div className="info-item price">
                    <span className="material-icons">currency_rupee</span>
                    <span className="price-value">{event.ticketPrice}</span>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <button
                  className="btn btn-primary"
                  onClick={() => openEventDetails(event)}
                >
                  <span className="material-icons">info</span>
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event Details Modal */}
      {showEventDetailsModal && selectedEvent && (
        <div className="modal-overlay" onClick={closeEventDetails}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <span className="material-icons">event</span>
                Event Details
              </h2>
              <button className="close-btn" onClick={closeEventDetails}>
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="modal-body">
              <div className="event-details-grid">
                <div className="detail-section">
                  <h3>
                    <span className="material-icons">info</span>
                    Basic Information
                  </h3>
                  <div className="detail-item">
                    <strong>Event Name:</strong>
                    <p>{selectedEvent.eventName}</p>
                  </div>
                  <div className="detail-item">
                    <strong>Type:</strong>
                    <p>{selectedEvent.type}</p>
                  </div>
                  <div className="detail-item">
                    <strong>Status:</strong>
                    <p>
                      <span className={`status-badge ${getStatusClass(selectedEvent.status)}`}>
                        {selectedEvent.status}
                      </span>
                    </p>
                  </div>
                  <div className="detail-item">
                    <strong>Description:</strong>
                    <p>{selectedEvent.description}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>
                    <span className="material-icons">schedule</span>
                    Schedule
                  </h3>
                  <div className="detail-item">
                    <strong>Start Time:</strong>
                    <p>{formatDate(selectedEvent.startTime, 'full')}</p>
                  </div>
                  <div className="detail-item">
                    <strong>End Time:</strong>
                    <p>{formatDate(selectedEvent.endTime, 'full')}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>
                    <span className="material-icons">location_on</span>
                    Venue Information
                  </h3>
                  <div className="detail-item">
                    <strong>Venue Name:</strong>
                    <p>{selectedEvent.venueName}</p>
                  </div>
                  <div className="detail-item">
                    <strong>Address:</strong>
                    <p>{selectedEvent.venueAddress}</p>
                  </div>
                  <div className="detail-item">
                    <strong>Capacity:</strong>
                    <p>{selectedEvent.venueCapacity} people</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>
                    <span className="material-icons">confirmation_number</span>
                    Ticket Information
                  </h3>
                  <div className="detail-item">
                    <strong>Ticket Price:</strong>
                    <p className="price-highlight">₹{selectedEvent.ticketPrice}</p>
                  </div>
                  <div className="detail-item">
                    <strong>Available Tickets:</strong>
                    <p>{selectedEvent.ticketsProvided}</p>
                  </div>
                  <div className="detail-item">
                    <strong>Max Tickets Per User:</strong>
                    <p>{selectedEvent.maxTicketsPerUser}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>
                    <span className="material-icons">business</span>
                    Organizer Information
                  </h3>
                  <div className="detail-item">
                    <strong>Organizer:</strong>
                    <p>{selectedEvent.organizerName || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <strong>Type:</strong>
                    <p>{selectedEvent.organizerType || 'N/A'}</p>
                  </div>
                </div>

                <div className="detail-section full-width">
                  <h3>
                    <span className="material-icons">rule</span>
                    Rules & Restrictions
                  </h3>
                  <div className="detail-item">
                    <p className="rules-text">{selectedEvent.rulesAndRestrictions}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeEventDetails}>
                Close
              </button>
              {isEventUpcoming(selectedEvent) && (
                <button className="btn btn-primary" onClick={openRegistrationModal}>
                  <span className="material-icons">app_registration</span>
                  Register Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegistrationModal && selectedEvent && (
        <div className="modal-overlay" onClick={closeRegistrationModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <span className="material-icons">app_registration</span>
                Register for Event
              </h2>
              <button className="close-btn" onClick={closeRegistrationModal}>
                <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={registrationForm.handleSubmit(registerForEvent)}>
              <div className="modal-body">
                <div className="registration-summary">
                  <h3>{selectedEvent.eventName}</h3>
                  <p>
                    <span className="material-icons">schedule</span>
                    {formatDate(selectedEvent.startTime)}
                  </p>
                  <p>
                    <span className="material-icons">location_on</span>
                    {selectedEvent.venueName}
                  </p>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="ticketQuantity">
                      Ticket Quantity <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="ticketQuantity"
                      {...registrationForm.register('ticketQuantity', {
                        valueAsNumber: true,
                        min: 1,
                        max: selectedEvent.maxTicketsPerUser,
                      })}
                      className="form-control"
                      min={1}
                      max={selectedEvent.maxTicketsPerUser}
                    />
                    <span className="form-hint">
                      Maximum {selectedEvent.maxTicketsPerUser} tickets per user
                    </span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="ticketType">
                      Ticket Type <span className="required">*</span>
                    </label>
                    <select
                      id="ticketType"
                      {...registrationForm.register('ticketType')}
                      className="form-control"
                    >
                      {ticketTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="price-summary">
                  <div className="price-row">
                    <span>Price per ticket:</span>
                    <span className="price-value">₹{selectedEvent.ticketPrice}</span>
                  </div>
                  <div className="price-row">
                    <span>Quantity:</span>
                    <span>{registrationForm.watch('ticketQuantity')}</span>
                  </div>
                  <div className="price-row total">
                    <span>Total Amount:</span>
                    <span className="price-value">₹{getTotalPrice()}</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeRegistrationModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <span className="material-icons">payment</span>
                  Proceed to Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && registrationData && (
        <div className="modal-overlay" onClick={closePaymentModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <span className="material-icons">payment</span>
                Complete Payment
              </h2>
              <button className="close-btn" onClick={closePaymentModal}>
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="modal-body">
              <div className="payment-info">
                <div className="payment-icon">
                  <span className="material-icons">receipt_long</span>
                </div>
                <h3>Payment Details</h3>

                <div className="payment-detail">
                  <strong>Payment ID:</strong>
                  <p className="highlight">{registrationData.paymentId}</p>
                </div>

                <div className="payment-detail">
                  <strong>Event Name:</strong>
                  <p>{registrationData.eventName}</p>
                </div>

                <div className="payment-detail">
                  <strong>Ticket Quantity:</strong>
                  <p>{registrationData.ticketQuantity}</p>
                </div>

                <div className="form-group payment-account">
                  <label htmlFor="accountNumber">
                    Account Number <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="accountNumber"
                    {...registrationForm.register('accountNumber', { required: true })}
                    className="form-control"
                    placeholder="Enter your account number"
                  />
                </div>

                <div className="payment-detail total-amount">
                  <strong>Total Amount:</strong>
                  <p className="amount-value">₹{registrationData.totalAmount}</p>
                </div>

                <div className="payment-detail">
                  <strong>Status:</strong>
                  <p>
                    <span className="status-badge status-pending">
                      {registrationData.paymentStatus}
                    </span>
                  </p>
                </div>

                <div className="payment-notice">
                  <span className="material-icons">info</span>
                  <p>
                    Enter your account number and click "Complete Payment" to process
                    payment through our secure payment gateway.
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closePaymentModal}
                disabled={isProcessingPayment}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={completePayment}
                disabled={isProcessingPayment}
              >
                {!isProcessingPayment ? (
                  <span className="material-icons">check_circle</span>
                ) : (
                  <span className="material-icons spin">hourglass_empty</span>
                )}
                {isProcessingPayment ? 'Processing...' : 'Complete Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tickets Display Modal */}
      {showTicketsModal && generatedTickets && (
        <div className="modal-overlay" onClick={closeTicketsModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <span className="material-icons">confirmation_number</span>
                Your Tickets
              </h2>
              <button className="close-btn" onClick={closeTicketsModal}>
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="modal-body">
              <div className="success-message">
                <div className="success-icon">
                  <span className="material-icons">check_circle</span>
                </div>
                <h3>Payment Successful!</h3>
                <p>
                  Your tickets have been generated. Please save your ticket codes for
                  entry.
                </p>
              </div>

              <div className="tickets-grid">
                {generatedTickets.map((ticket, index) => (
                  <div key={ticket.ticketId} className="ticket-card">
                    <div className="ticket-header">
                      <h4>Ticket {index + 1}</h4>
                      <span
                        className={`ticket-status ${ticket.status === 'ACTIVE' ? 'active' : ''}`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <div className="ticket-code-section">
                      <span className="material-icons">qr_code_2</span>
                      <div className="ticket-code">{ticket.ticketCode}</div>
                    </div>

                    <div className="ticket-details">
                      <div className="ticket-detail">
                        <span className="material-icons">event</span>
                        <div>
                          <strong>Event</strong>
                          <p>{ticket.eventName}</p>
                        </div>
                      </div>

                      <div className="ticket-detail">
                        <span className="material-icons">schedule</span>
                        <div>
                          <strong>Date & Time</strong>
                          <p>{formatDate(ticket.eventStartTime, 'full')}</p>
                        </div>
                      </div>

                      <div className="ticket-detail">
                        <span className="material-icons">location_on</span>
                        <div>
                          <strong>Venue</strong>
                          <p>{ticket.venueName}</p>
                          <p className="venue-address">{ticket.venueAddress}</p>
                        </div>
                      </div>

                      <div className="ticket-detail">
                        <span className="material-icons">style</span>
                        <div>
                          <strong>Ticket Type</strong>
                          <p>{ticket.ticketType}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={downloadTickets}>
                <span className="material-icons">download</span>
                Download Tickets
              </button>
              <button className="btn btn-primary" onClick={viewAllTickets}>
                <span className="material-icons">library_books</span>
                View All My Tickets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseEvents;
