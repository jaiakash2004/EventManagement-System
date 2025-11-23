import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { userService } from '../../services/userService';
import './MyTickets.css';

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

interface TransferFormData {
  recipientEmail: string;
  reason: string;
}

const MyTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSuccessMsg, setTransferSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransferFormData>({
    defaultValues: {
      recipientEmail: '',
      reason: '',
    },
  });

  useEffect(() => {
    fetchUserTickets();
  }, []);

  const fetchUserTickets = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await userService.getUserTickets();
      setTickets(data || []);
    } catch (error: any) {
      console.error('Error fetching tickets', error);
      setErrorMsg('Failed to load tickets. Please try again later.');
      toast.error('Failed to load tickets', { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  const openTransferModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowTransferModal(true);
    reset({ recipientEmail: '', reason: '' });
    setTransferSuccessMsg('');
  };

  const closeTransferModal = () => {
    setShowTransferModal(false);
    setSelectedTicket(null);
    reset({ recipientEmail: '', reason: '' });
    setTransferSuccessMsg('');
    setTransferLoading(false);
  };

  const submitTransfer = async (data: TransferFormData) => {
    if (!selectedTicket) return;

    setTransferLoading(true);
    setTransferSuccessMsg('');

    try {
      const response = await userService.transferTicket(
        selectedTicket.ticketId,
        data.recipientEmail,
        data.reason
      );

      if (response.success) {
        setTransferSuccessMsg(response.message || 'Ticket transferred successfully!');
        toast.success(response.message || 'Ticket transferred successfully!', {
          position: 'top-right',
        });
        setTimeout(() => {
          closeTransferModal();
          fetchUserTickets();
        }, 1500);
      } else {
        toast.error(response.message || 'Transfer failed', { position: 'top-right' });
      }
    } catch (error: any) {
      console.error('Transfer error', error);
      const errorMessage =
        error.response?.data?.message || 'Failed to transfer ticket. Please try again.';
      toast.error(errorMessage, { position: 'top-right' });
    } finally {
      setTransferLoading(false);
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
    <div className="tickets-container">
      <h3 className="page-title">My Tickets</h3>

      {loading && (
        <div className="center">
          <div className="spinner-border" role="status"></div>
          <div className="muted">Loading your tickets...</div>
        </div>
      )}

      {!loading && errorMsg && (
        <div className="alert alert-danger text-center">{errorMsg}</div>
      )}

      {!loading && tickets.length === 0 && (
        <div className="alert alert-info text-center">
          You don't have any tickets yet.
        </div>
      )}

      {!loading && tickets.length > 0 && (
        <div className="tickets-grid">
          {tickets.map((ticket) => (
            <div key={ticket.ticketId} className="ticket-card">
              <div className="ticket-header">
                🎟️ <span className="ticket-code">{ticket.ticketCode}</span>
              </div>

              <div className="ticket-body">
                <div>
                  <strong>Event:</strong> {ticket.eventName || 'N/A'}
                </div>
                <div>
                  <strong>Date:</strong> {formatDate(ticket.eventStartTime)}
                </div>
                <div>
                  <strong>Status:</strong> {ticket.status || 'Valid'}
                </div>
                <div>
                  <strong>Venue:</strong> {ticket.venueName || 'TBA'}
                </div>
              </div>

              <div className="ticket-footer">
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => openTransferModal(ticket)}
                >
                  <span className="material-icons">swap_horiz</span> Transfer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedTicket && (
        <div className="modal-overlay" onClick={closeTransferModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Transfer Ticket</h4>
              <button className="close-btn" onClick={closeTransferModal}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="ticket-info">
                <strong>Ticket:</strong> {selectedTicket.ticketCode}
                <br />
                <strong>Event:</strong> {selectedTicket.eventName}
              </div>

              {transferSuccessMsg && (
                <div className="alert alert-success">{transferSuccessMsg}</div>
              )}

              <form onSubmit={handleSubmit(submitTransfer)}>
                <div className="form-group">
                  <label htmlFor="recipientEmail">Recipient Email *</label>
                  <input
                    type="email"
                    id="recipientEmail"
                    {...register('recipientEmail', {
                      required: 'Recipient email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    className={`form-control ${errors.recipientEmail ? 'is-invalid' : ''}`}
                    placeholder="Enter recipient's email"
                  />
                  {errors.recipientEmail && (
                    <div className="invalid-feedback">{errors.recipientEmail.message}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="reason">Reason *</label>
                  <textarea
                    id="reason"
                    {...register('reason', {
                      required: 'Reason is required',
                      minLength: {
                        value: 5,
                        message: 'Reason must be at least 5 characters',
                      },
                    })}
                    className={`form-control ${errors.reason ? 'is-invalid' : ''}`}
                    rows={3}
                    placeholder="Enter reason for transfer"
                  />
                  {errors.reason && (
                    <div className="invalid-feedback">{errors.reason.message}</div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeTransferModal}
                    disabled={transferLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={transferLoading}
                  >
                    {transferLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm mr-2"></span>
                        Transferring...
                      </>
                    ) : (
                      'Transfer Ticket'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTickets;
