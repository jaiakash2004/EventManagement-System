import express from 'express';
import { readDB, writeDB, getNextId } from '../utils/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get organizer events
router.get('/events/', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const { userId } = req.user;
    const events = readDB('events');
    const venues = readDB('venues');

    const organizerEvents = events
      .filter((e) => e.organizerId === userId && !e.deleted)
      .map((event) => {
        const venue = venues.find((v) => v.venueId === event.venueId);
        return {
          ...event,
          venueName: venue?.name || '',
          venueAddress: venue?.address || '',
          venueCapacity: venue?.capacity || 0,
          venueLatitude: venue?.latitude || 0,
          venueLongitude: venue?.longitude || 0,
        };
      });

    res.json({
      success: true,
      data: organizerEvents,
    });
  } catch (error) {
    console.error('Get organizer events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get event details
router.get('/events/:eventId', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const { userId } = req.user;
    const { eventId } = req.params;
    const events = readDB('events');
    const venues = readDB('venues');

    const event = events.find(
      (e) => e.eventId === parseInt(eventId) && e.organizerId === userId && !e.deleted
    );
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const venue = venues.find((v) => v.venueId === event.venueId);

    res.json({
      success: true,
      data: {
        ...event,
        venueName: venue?.name || '',
        venueAddress: venue?.address || '',
        venueCapacity: venue?.capacity || 0,
        venueLatitude: venue?.latitude || 0,
        venueLongitude: venue?.longitude || 0,
      },
    });
  } catch (error) {
    console.error('Get event details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Create event
router.post('/events', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      eventName,
      description,
      rulesAndRestrictions,
      type,
      venueId,
      ticketsProvided,
      maxTicketsPerUser,
      ticketPrice,
      startTime,
      endTime,
    } = req.body;

    if (
      !eventName ||
      !description ||
      !rulesAndRestrictions ||
      !type ||
      !venueId ||
      !ticketsProvided ||
      !maxTicketsPerUser ||
      ticketPrice === undefined ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const venues = readDB('venues');
    const venue = venues.find((v) => v.venueId === venueId && !v.deleted);
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found',
      });
    }

    if (ticketsProvided > venue.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Tickets provided cannot exceed venue capacity',
      });
    }

    const events = readDB('events');
    const newEvent = {
      eventId: getNextId('events'),
      organizerId: userId,
      eventName,
      description,
      rulesAndRestrictions,
      type,
      venueId,
      ticketsProvided,
      maxTicketsPerUser,
      ticketPrice,
      startTime,
      endTime,
      status: 'Active',
      approvalStatus: 'Pending',
      adminComment: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
    };

    events.push(newEvent);
    writeDB('events', events);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: newEvent,
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get organizer profile
router.get('/profile', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const { userId } = req.user;
    const organizers = readDB('organizers');
    const organizer = organizers.find((o) => o.organizerId === userId && !o.deleted);
    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    res.json({
      success: true,
      data: organizer,
    });
  } catch (error) {
    console.error('Get organizer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update organizer profile
router.put('/profile', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const { userId } = req.user;
    const { organizerName, phone, address, organizerType } = req.body;

    const organizers = readDB('organizers');
    const organizerIndex = organizers.findIndex((o) => o.organizerId === userId && !o.deleted);
    if (organizerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    if (organizerName) organizers[organizerIndex].organizerName = organizerName;
    if (phone) organizers[organizerIndex].phone = phone;
    if (address) organizers[organizerIndex].address = address;
    if (organizerType) organizers[organizerIndex].organizerType = organizerType;
    organizers[organizerIndex].updatedAt = new Date().toISOString();

    writeDB('organizers', organizers);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: organizers[organizerIndex],
    });
  } catch (error) {
    console.error('Update organizer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get event feedback
router.get('/events/:eventId/feedback', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const { userId } = req.user;
    const { eventId } = req.params;
    const events = readDB('events');
    const feedback = readDB('feedback');

    const event = events.find(
      (e) => e.eventId === parseInt(eventId) && e.organizerId === userId && !e.deleted
    );
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const eventFeedback = feedback.filter((f) => f.eventId === parseInt(eventId) && !f.deleted);

    res.json({
      success: true,
      data: eventFeedback,
    });
  } catch (error) {
    console.error('Get event feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get booking summary
router.get('/events/bookings/summary', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const { userId } = req.user;
    const events = readDB('events');
    const tickets = readDB('tickets');

    const organizerEvents = events.filter((e) => e.organizerId === userId && !e.deleted);
    let totalActiveTickets = 0;
    let totalRevenue = 0;

    organizerEvents.forEach((event) => {
      const eventTickets = tickets.filter((t) => t.eventId === event.eventId && !t.deleted);
      const eventTicketCount = eventTickets.reduce((sum, t) => sum + t.quantity, 0);
      const eventRevenue = eventTickets.reduce((sum, t) => sum + t.totalPrice, 0);
      totalActiveTickets += eventTicketCount;
      totalRevenue += eventRevenue;
    });

    res.json({
      success: true,
      data: {
        totalActiveTickets,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error('Get booking summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;

