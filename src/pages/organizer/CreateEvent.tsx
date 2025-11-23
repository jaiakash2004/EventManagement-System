import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { organizerService } from '../../services/organizerService';
import { eventService } from '../../services/eventService';
import type { Venue } from '../../services/eventService';
import './CreateEvent.css';

interface CreateEventFormData {
  eventName: string;
  description: string;
  rulesAndRestrictions: string;
  type: string;
  ticketsProvided: number;
  maxTicketsPerUser: number;
  ticketPrice: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  venueId: string;
}

const CreateEvent = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVenueCapacity, setSelectedVenueCapacity] = useState(0);

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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<CreateEventFormData>({
    defaultValues: {
      eventName: '',
      description: '',
      rulesAndRestrictions: '',
      type: '',
      ticketsProvided: 0,
      maxTicketsPerUser: 1,
      ticketPrice: 0,
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      venueId: '',
    },
    mode: 'onChange',
  });

  const selectedVenueId = watch('venueId');

  useEffect(() => {
    loadVenues();
  }, []);

  useEffect(() => {
    if (selectedVenueId) {
      const venue = venues.find((v) => v.venueId === parseInt(selectedVenueId));
      if (venue) {
        setSelectedVenueCapacity(venue.capacity);
        // Update max validator for ticketsProvided
        const currentTickets = watch('ticketsProvided');
        if (currentTickets > venue.capacity) {
          setValue('ticketsProvided', venue.capacity);
        }
      }
    } else {
      setSelectedVenueCapacity(0);
    }
  }, [selectedVenueId, venues]);

  const loadVenues = async () => {
    try {
      const data = await eventService.getAllVenues();
      // Filter only available venues
      const availableVenues = data.filter(
        (venue) => venue.availabilityStatus === 'Available'
      );
      setVenues(availableVenues);
    } catch (error) {
      toast.error('Failed to load venues', { position: 'top-right' });
    }
  };

  const validateDates = (data: CreateEventFormData): boolean => {
    const { startDate, startTime, endDate, endTime } = data;

    if (!startDate || !startTime || !endDate || !endTime) {
      return false;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    const now = new Date();

    // Check if start time is in the future
    if (startDateTime <= now) {
      toast.error('Start time must be in the future', { position: 'top-right' });
      return false;
    }

    // Check if end time is after start time
    if (endDateTime <= startDateTime) {
      toast.error('End time must be after start time', { position: 'top-right' });
      return false;
    }

    return true;
  };

  const formatToISOWithoutTimezone = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
  };

  const onSubmit = async (data: CreateEventFormData) => {
    if (!validateDates(data)) {
      return;
    }

    setIsLoading(true);

    try {
      // Combine date and time into ISO format
      const startDateTime = formatToISOWithoutTimezone(
        new Date(`${data.startDate}T${data.startTime}`).toString()
      );
      const endDateTime = formatToISOWithoutTimezone(
        new Date(`${data.endDate}T${data.endTime}`).toString()
      );

      const requestBody = {
        eventName: data.eventName,
        description: data.description,
        rulesAndRestrictions: data.rulesAndRestrictions,
        type: data.type,
        ticketsProvided: parseInt(data.ticketsProvided.toString()),
        maxTicketsPerUser: parseInt(data.maxTicketsPerUser.toString()),
        ticketPrice: parseFloat(data.ticketPrice.toString()),
        startTime: startDateTime,
        endTime: endDateTime,
        venueId: parseInt(data.venueId),
      };

      await organizerService.createEvent(requestBody);
      toast.success('Event created successfully!', { position: 'top-right' });
      reset({
        eventName: '',
        description: '',
        rulesAndRestrictions: '',
        type: '',
        ticketsProvided: 0,
        maxTicketsPerUser: 1,
        ticketPrice: 0,
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        venueId: '',
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Failed to create event. Please try again.';
      toast.error(errorMessage, { position: 'top-right' });
    } finally {
      setIsLoading(false);
    }
  };

  const getVenueCapacity = (): number => {
    return selectedVenueCapacity;
  };

  return (
    <div className="create-event-container">
      <div className="page-header">
        <h1 className="page-title">Create New Event</h1>
        <p className="page-subtitle">Fill in the details to create your event</p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Event Basic Information */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="material-icons">event</span>
              Event Information
            </h3>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="eventName">
                  Event Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="eventName"
                  {...register('eventName', {
                    required: 'Event name is required',
                    minLength: {
                      value: 3,
                      message: 'Event name must be at least 3 characters',
                    },
                  })}
                  className="form-control"
                  placeholder="Enter event name"
                />
                {errors.eventName && (
                  <span className="error-message">{errors.eventName.message}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">
                  Event Type <span className="required">*</span>
                </label>
                <select
                  id="type"
                  {...register('type', { required: 'Event type is required' })}
                  className="form-control"
                >
                  <option value="">Select Event Type</option>
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <span className="error-message">{errors.type.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="ticketPrice">
                  Ticket Price (₹) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="ticketPrice"
                  {...register('ticketPrice', {
                    required: 'Ticket price is required',
                    min: { value: 0, message: 'Ticket price must be 0 or greater' },
                    valueAsNumber: true,
                  })}
                  className="form-control"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                {errors.ticketPrice && (
                  <span className="error-message">{errors.ticketPrice.message}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="description">
                  Description <span className="required">*</span>
                </label>
                <textarea
                  id="description"
                  {...register('description', {
                    required: 'Description is required',
                    minLength: {
                      value: 10,
                      message: 'Description must be at least 10 characters',
                    },
                  })}
                  className="form-control"
                  rows={4}
                  placeholder="Describe your event..."
                />
                {errors.description && (
                  <span className="error-message">{errors.description.message}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="rulesAndRestrictions">
                  Rules and Restrictions <span className="required">*</span>
                </label>
                <textarea
                  id="rulesAndRestrictions"
                  {...register('rulesAndRestrictions', {
                    required: 'Rules and restrictions are required',
                  })}
                  className="form-control"
                  rows={4}
                  placeholder="Enter event rules and restrictions..."
                />
                {errors.rulesAndRestrictions && (
                  <span className="error-message">
                    {errors.rulesAndRestrictions.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Venue Information */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="material-icons">location_on</span>
              Venue Details
            </h3>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="venueId">
                  Select Venue <span className="required">*</span>
                </label>
                <select
                  id="venueId"
                  {...register('venueId', { required: 'Venue is required' })}
                  className="form-control"
                >
                  <option value="">Choose a venue</option>
                  {venues.map((venue) => (
                    <option key={venue.venueId} value={venue.venueId}>
                      {venue.name} (Capacity: {venue.capacity})
                    </option>
                  ))}
                </select>
                {getVenueCapacity() > 0 && (
                  <small className="form-hint">
                    Maximum capacity: {getVenueCapacity().toLocaleString()}
                  </small>
                )}
                {errors.venueId && (
                  <span className="error-message">{errors.venueId.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* Ticketing Information */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="material-icons">confirmation_number</span>
              Ticketing
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ticketsProvided">
                  Total Tickets <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="ticketsProvided"
                  {...register('ticketsProvided', {
                    required: 'Total tickets is required',
                    min: { value: 1, message: 'Must provide at least 1 ticket' },
                    max: {
                      value: getVenueCapacity() || 999999,
                      message: `Cannot exceed venue capacity of ${getVenueCapacity()}`,
                    },
                    valueAsNumber: true,
                  })}
                  className="form-control"
                  placeholder="0"
                  min="1"
                  max={getVenueCapacity() || undefined}
                />
                {getVenueCapacity() > 0 && (
                  <small className="form-hint">Cannot exceed venue capacity</small>
                )}
                {errors.ticketsProvided && (
                  <span className="error-message">
                    {errors.ticketsProvided.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="maxTicketsPerUser">
                  Max Tickets Per User <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="maxTicketsPerUser"
                  {...register('maxTicketsPerUser', {
                    required: 'Max tickets per user is required',
                    min: { value: 1, message: 'Must be at least 1' },
                    valueAsNumber: true,
                  })}
                  className="form-control"
                  placeholder="1"
                  min="1"
                />
                {errors.maxTicketsPerUser && (
                  <span className="error-message">
                    {errors.maxTicketsPerUser.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="material-icons">schedule</span>
              Schedule
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">
                  Start Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="startDate"
                  {...register('startDate', { required: 'Start date is required' })}
                  className="form-control"
                />
                {errors.startDate && (
                  <span className="error-message">{errors.startDate.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="startTime">
                  Start Time <span className="required">*</span>
                </label>
                <input
                  type="time"
                  id="startTime"
                  {...register('startTime', { required: 'Start time is required' })}
                  className="form-control"
                />
                {errors.startTime && (
                  <span className="error-message">{errors.startTime.message}</span>
                )}
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
                  {...register('endDate', { required: 'End date is required' })}
                  className="form-control"
                />
                {errors.endDate && (
                  <span className="error-message">{errors.endDate.message}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="endTime">
                  End Time <span className="required">*</span>
                </label>
                <input
                  type="time"
                  id="endTime"
                  {...register('endTime', { required: 'End time is required' })}
                  className="form-control"
                />
                {errors.endTime && (
                  <span className="error-message">{errors.endTime.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isValid || isLoading}
            >
              {!isLoading ? (
                <>
                  <span className="material-icons">add_circle</span>
                  Create Event
                </>
              ) : (
                'Creating...'
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => reset()}
            >
              <span className="material-icons">refresh</span>
              Reset Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
