import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { userService } from '../../services/userService';
import api from '../../services/api';
import './MyRegistrations.css';

interface RegisteredEvent {
  eventId: number;
  eventName: string;
  type: string;
  status: string;
  venueName: string;
  venueAddress: string;
  startTime: string;
  endTime: string;
  registrationDate: string;
  ticketCount: number;
  totalAmountPaid: number;
  tickets: any[];
  showDetails?: boolean;
}

interface Feedback {
  eventId: number;
  userId: number;
  comments: string;
}

const MyRegistrations = () => {
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<RegisteredEvent | null>(null);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState('');
  const [feedbackErrorMsg, setFeedbackErrorMsg] = useState('');
  const [existingFeedback, setExistingFeedback] = useState<Feedback | null>(null);
  const [isFeedbackReadOnly, setIsFeedbackReadOnly] = useState(false);

  useEffect(() => {
    fetchRegisteredEvents();
  }, []);

  const fetchRegisteredEvents = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await userService.getUserRegisteredEvents();
      setRegisteredEvents(
        (data || []).map((e: any) => ({
          ...e,
          showDetails: false,
        }))
      );
    } catch (error: any) {
      console.error('Error fetching registered events', error);
      setErrorMsg('Failed to load registered events. Try again later.');
      toast.error('Failed to load registered events', { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  const toggleDetails = (event: RegisteredEvent) => {
    setRegisteredEvents((prev) =>
      prev.map((e) =>
        e.eventId === event.eventId ? { ...e, showDetails: !e.showDetails } : e
      )
    );
  };

  const isEventEnded = (event: RegisteredEvent): boolean => {
    if (!event.endTime) return false;
    const endDate = new Date(event.endTime);
    const now = new Date();
    return endDate < now;
  };

  const openFeedbackModal = async (event: RegisteredEvent) => {
    setSelectedEvent(event);
    setShowFeedbackModal(true);
    setFeedbackComments('');
    setFeedbackSuccessMsg('');
    setFeedbackErrorMsg('');
    setExistingFeedback(null);
    setIsFeedbackReadOnly(false);
    setFeedbackLoading(true);

    try {
      const response = await api.get<any[]>(`/feedback/${event.eventId}`);
      const feedbackList = response.data || [];
      const currentUserId = sessionStorage.getItem('userId');

      if (currentUserId && feedbackList.length > 0) {
        const userFeedback = feedbackList.find(
          (fb: any) => fb.userId === parseInt(currentUserId)
        );

        if (userFeedback) {
          setExistingFeedback(userFeedback);
          setFeedbackComments(userFeedback.comments);
          setIsFeedbackReadOnly(true);
        } else {
          setIsFeedbackReadOnly(false);
        }
      } else {
        setIsFeedbackReadOnly(false);
      }
    } catch (error) {
      console.error('Error fetching feedback', error);
      setIsFeedbackReadOnly(false);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setSelectedEvent(null);
    setFeedbackComments('');
    setFeedbackSuccessMsg('');
    setFeedbackErrorMsg('');
    setFeedbackLoading(false);
    setExistingFeedback(null);
    setIsFeedbackReadOnly(false);
  };

  const submitFeedback = async () => {
    if (!selectedEvent || !feedbackComments.trim()) {
      setFeedbackErrorMsg('Please enter your feedback comments');
      return;
    }

    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      setFeedbackErrorMsg('User not authenticated');
      return;
    }

    setFeedbackLoading(true);
    setFeedbackSuccessMsg('');
    setFeedbackErrorMsg('');

    try {
      const response = await api.post('/feedback/update', {
        eventId: selectedEvent.eventId,
        userId: parseInt(userId),
        comments: feedbackComments,
      });

      if (response.data.success) {
        setFeedbackSuccessMsg(
          response.data.message || 'Feedback submitted successfully!'
        );
        toast.success('Feedback submitted successfully!', { position: 'top-right' });
        setTimeout(() => {
          closeFeedbackModal();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Feedback error', error);
      setFeedbackErrorMsg(
        error.response?.data?.message || 'Failed to submit feedback. Please try again.'
      );
      toast.error('Failed to submit feedback', { position: 'top-right' });
    } finally {
      setFeedbackLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="regs-container">
      <h3 className="page-title">My Registered Events</h3>

      {loading && (
        <div className="center">
          <div className="spinner-border" role="status"></div>
          <div className="muted">Loading your registrations...</div>
        </div>
      )}

      {!loading && errorMsg && (
        <div className="alert alert-danger text-center">{errorMsg}</div>
      )}

      {!loading && registeredEvents.length === 0 && (
        <div className="alert alert-info text-center">
          You haven't registered for any events yet.
        </div>
      )}

      {!loading && registeredEvents.length > 0 && (
        <div className="events-grid">
          {registeredEvents.map((event) => (
            <div key={event.eventId} className="event-card">
              <div className="card-body">
                <div className="mb-2">
                  <h5 className="event-title">{event.eventName}</h5>
                  <div className="muted small">
                    {event.type} • {event.status}
                  </div>
                </div>

                <div className="mt-2 mb-2 small text-muted">
                  <div>
                    <strong>Venue:</strong> {event.venueName}
                    {event.venueAddress && <span> — {event.venueAddress}</span>}
                  </div>
                  <div>
                    <strong>When:</strong> {formatDate(event.startTime)} —{' '}
                    {formatDate(event.endTime)}
                  </div>
                  <div>
                    <strong>Registered:</strong> {formatDate(event.registrationDate)}
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="small">
                      <strong>Tickets:</strong> {event.ticketCount ?? 0}
                    </div>
                    <div className="small">
                      <strong>Total:</strong> ₹{event.totalAmountPaid ?? 0}
                    </div>
                  </div>

                  <div className="button-group">
                    <button
                      className="btn btn-outline-primary btn-sm me-2"
                      onClick={() => toggleDetails(event)}
                    >
                      {event.showDetails ? 'Hide Details' : 'View Tickets'}
                    </button>

                    {isEventEnded(event) && (
                      <button
                        className="btn btn-outline-success btn-sm"
                        onClick={() => openFeedbackModal(event)}
                      >
                        Feedback
                      </button>
                    )}
                  </div>

                  {event.showDetails && (
                    <div className="details mt-3">
                      <hr />
                      <h6 className="mb-2">Your Tickets</h6>
                      <ul className="list-group list-group-flush">
                        {event.tickets && event.tickets.length > 0 ? (
                          event.tickets.map((t: any, index: number) => (
                            <li key={index} className="list-group-item">
                              <div className="d-flex justify-content-between">
                                <div>
                                  🎟️ <strong>{t.ticketCode}</strong>
                                  <div className="small text-muted">
                                    Seat: {t.seatNumber || 'N/A'}
                                  </div>
                                </div>
                                <div className="small text-muted">—</div>
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="list-group-item">No tickets found</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedEvent && (
        <div className="modal-overlay" onClick={closeFeedbackModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Event Feedback</h4>
              <button className="close-btn" onClick={closeFeedbackModal}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="event-info">
                <strong>Event:</strong> {selectedEvent.eventName}
                <br />
                <strong>Venue:</strong> {selectedEvent.venueName}
                <br />
                <strong>Date:</strong> {formatDate(selectedEvent.startTime)}
              </div>

              {feedbackLoading && !feedbackSuccessMsg && (
                <div className="text-center my-3">
                  <div className="spinner-border" role="status"></div>
                  <div className="muted mt-2">Loading feedback...</div>
                </div>
              )}

              {feedbackSuccessMsg && (
                <div className="alert alert-success">{feedbackSuccessMsg}</div>
              )}

              {feedbackErrorMsg && (
                <div className="alert alert-danger">{feedbackErrorMsg}</div>
              )}

              {/* Read-only view for existing feedback */}
              {!feedbackLoading && isFeedbackReadOnly && (
                <div className="existing-feedback">
                  <div className="alert alert-info">
                    <strong>ℹ️ You have already submitted feedback for this event.</strong>
                  </div>

                  <div className="form-group">
                    <label>
                      <strong>Your Feedback:</strong>
                    </label>
                    <div className="feedback-display">{feedbackComments}</div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={closeFeedbackModal}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Editable form for new feedback */}
              {!feedbackLoading && !isFeedbackReadOnly && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  submitFeedback();
                }}>
                  <div className="form-group">
                    <label htmlFor="comments">Your Feedback *</label>
                    <textarea
                      id="comments"
                      className="form-control"
                      value={feedbackComments}
                      onChange={(e) => setFeedbackComments(e.target.value)}
                      rows={5}
                      placeholder="Share your experience about this event..."
                      required
                    />
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={closeFeedbackModal}
                      disabled={feedbackLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={feedbackLoading || !feedbackComments.trim()}
                    >
                      {feedbackLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm mr-2"></span>
                          Submitting...
                        </>
                      ) : (
                        'Submit Feedback'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRegistrations;
