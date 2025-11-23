import express from 'express';
import { readDB } from '../utils/db.js';

const router = express.Router();

// Get all events
router.get('/', (req, res) => {
  try {
    const events = readDB('events');
    const venues = readDB('venues');
    const organizers = readDB('organizers');

    const eventsWithDetails = events
      .filter((e) => !e.deleted && e.approvalStatus === 'Approved' && e.status === 'Active')
      .map((event) => {
        const venue = venues.find((v) => v.venueId === event.venueId);
        const organizer = organizers.find((o) => o.organizerId === event.organizerId);
        return {
          ...event,
          venueName: venue?.name || '',
          venueAddress: venue?.address || '',
          venueCapacity: venue?.capacity || 0,
          organizerName: organizer?.organizerName || '',
          organizerType: organizer?.organizerType || '',
        };
      });

    res.json({
      success: true,
      data: eventsWithDetails,
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Filter events
router.get('/filter', (req, res) => {
  try {
    const { type, minPrice, maxPrice, startDate, endDate, search } = req.query;
    let events = readDB('events');
    const venues = readDB('venues');
    const organizers = readDB('organizers');

    // Filter by deleted and approval status
    events = events.filter((e) => !e.deleted && e.approvalStatus === 'Approved' && e.status === 'Active');

    // Apply filters
    if (type) {
      events = events.filter((e) => e.type === type);
    }

    if (minPrice) {
      events = events.filter((e) => e.ticketPrice >= parseFloat(minPrice));
    }

    if (maxPrice) {
      events = events.filter((e) => e.ticketPrice <= parseFloat(maxPrice));
    }

    if (startDate) {
      events = events.filter((e) => new Date(e.startTime) >= new Date(startDate));
    }

    if (endDate) {
      events = events.filter((e) => new Date(e.endTime) <= new Date(endDate));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      events = events.filter(
        (e) =>
          e.eventName.toLowerCase().includes(searchLower) ||
          e.description.toLowerCase().includes(searchLower)
      );
    }

    const eventsWithDetails = events.map((event) => {
      const venue = venues.find((v) => v.venueId === event.venueId);
      const organizer = organizers.find((o) => o.organizerId === event.organizerId);
      return {
        ...event,
        venueName: venue?.name || '',
        venueAddress: venue?.address || '',
        venueCapacity: venue?.capacity || 0,
        organizerName: organizer?.organizerName || '',
        organizerType: organizer?.organizerType || '',
      };
    });

    res.json({
      success: true,
      data: eventsWithDetails,
    });
  } catch (error) {
    console.error('Filter events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get event by ID
router.get('/:eventId', (req, res) => {
  try {
    const { eventId } = req.params;
    const events = readDB('events');
    const venues = readDB('venues');
    const organizers = readDB('organizers');

    const event = events.find((e) => e.eventId === parseInt(eventId) && !e.deleted);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const venue = venues.find((v) => v.venueId === event.venueId);
    const organizer = organizers.find((o) => o.organizerId === event.organizerId);

    res.json({
      success: true,
      data: {
        ...event,
        venueName: venue?.name || '',
        venueAddress: venue?.address || '',
        venueCapacity: venue?.capacity || 0,
        venueLatitude: venue?.latitude || 0,
        venueLongitude: venue?.longitude || 0,
        organizerName: organizer?.organizerName || '',
        organizerType: organizer?.organizerType || '',
      },
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;

