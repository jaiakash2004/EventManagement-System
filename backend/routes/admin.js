import express from 'express';
import { readDB, writeDB, getNextId } from '../utils/db.js';
import { hashPassword } from '../utils/password.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all users
router.get('/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { role, includeDeleted } = req.query;
    let users = readDB('users');

    if (role) {
      users = users.filter((u) => u.role === role);
    }

    if (includeDeleted !== 'true') {
      users = users.filter((u) => !u.deleted);
    }

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get users with filters
router.get('/users/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { role, includeDeleted } = req.query;
    let users = readDB('users');

    if (role) {
      users = users.filter((u) => u.role === role);
    }

    if (includeDeleted !== 'true') {
      users = users.filter((u) => !u.deleted);
    }

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Deactivate user
router.delete('/users/:userId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const users = readDB('users');
    const userIndex = users.findIndex((u) => u.userId === parseInt(userId));
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    users[userIndex].deleted = true;
    users[userIndex].updatedAt = new Date().toISOString();
    writeDB('users', users);

    res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Reactivate user
router.post('/users/:userId/reactivate', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const users = readDB('users');
    const userIndex = users.findIndex((u) => u.userId === parseInt(userId));
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    users[userIndex].deleted = false;
    users[userIndex].updatedAt = new Date().toISOString();
    writeDB('users', users);

    res.json({
      success: true,
      message: 'User reactivated successfully',
    });
  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get all organizers
router.get('/organizers', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const organizers = readDB('organizers');
    const activeOrganizers = organizers.filter((o) => !o.deleted);

    res.json({
      success: true,
      data: activeOrganizers,
    });
  } catch (error) {
    console.error('Get organizers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Approve organizer
router.post('/organizers/:organizerId/approve', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { organizerId } = req.params;
    const organizers = readDB('organizers');
    const organizerIndex = organizers.findIndex((o) => o.organizerId === parseInt(organizerId) && !o.deleted);
    if (organizerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    organizers[organizerIndex].status = 'Approved';
    organizers[organizerIndex].updatedAt = new Date().toISOString();
    writeDB('organizers', organizers);

    res.json({
      success: true,
      message: 'Organizer approved successfully',
      data: organizers[organizerIndex],
    });
  } catch (error) {
    console.error('Approve organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Reject organizer
router.post('/organizers/:organizerId/reject', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { organizerId } = req.params;
    const { rejectionReason } = req.body;
    const organizers = readDB('organizers');
    const organizerIndex = organizers.findIndex((o) => o.organizerId === parseInt(organizerId) && !o.deleted);
    if (organizerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    organizers[organizerIndex].status = 'Rejected';
    if (rejectionReason) {
      organizers[organizerIndex].rejectionReason = rejectionReason;
    }
    organizers[organizerIndex].updatedAt = new Date().toISOString();
    writeDB('organizers', organizers);

    res.json({
      success: true,
      message: 'Organizer rejected successfully',
      data: organizers[organizerIndex],
    });
  } catch (error) {
    console.error('Reject organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Approve user
router.post('/users/:userId/approve', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const users = readDB('users');
    const userIndex = users.findIndex((u) => u.userId === parseInt(userId) && !u.deleted);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    users[userIndex].approvalStatus = 'Approved';
    users[userIndex].updatedAt = new Date().toISOString();
    writeDB('users', users);

    res.json({
      success: true,
      message: 'User approved successfully',
      data: users[userIndex],
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Reject user
router.post('/users/:userId/reject', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { rejectionReason } = req.body;
    const users = readDB('users');
    const userIndex = users.findIndex((u) => u.userId === parseInt(userId) && !u.deleted);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    users[userIndex].approvalStatus = 'Rejected';
    if (rejectionReason) {
      users[userIndex].rejectionReason = rejectionReason;
    }
    users[userIndex].updatedAt = new Date().toISOString();
    writeDB('users', users);

    res.json({
      success: true,
      message: 'User rejected successfully',
      data: users[userIndex],
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get all events
router.get('/events', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const events = readDB('events');
    const venues = readDB('venues');
    const organizers = readDB('organizers');

    const eventsWithDetails = events
      .filter((e) => !e.deleted)
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

// Approve event
router.put('/events/:eventId/approve', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { comment } = req.body;
    const events = readDB('events');
    const eventIndex = events.findIndex((e) => e.eventId === parseInt(eventId) && !e.deleted);
    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    events[eventIndex].approvalStatus = 'Approved';
    events[eventIndex].adminComment = comment || null;
    events[eventIndex].updatedAt = new Date().toISOString();
    writeDB('events', events);

    res.json({
      success: true,
      message: 'Event approved successfully',
      data: events[eventIndex],
    });
  } catch (error) {
    console.error('Approve event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Reject event
router.put('/events/:eventId/reject', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { comment } = req.body;
    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Rejection comment is required',
      });
    }

    const events = readDB('events');
    const eventIndex = events.findIndex((e) => e.eventId === parseInt(eventId) && !e.deleted);
    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    events[eventIndex].approvalStatus = 'Rejected';
    events[eventIndex].adminComment = comment;
    events[eventIndex].updatedAt = new Date().toISOString();
    writeDB('events', events);

    res.json({
      success: true,
      message: 'Event rejected successfully',
      data: events[eventIndex],
    });
  } catch (error) {
    console.error('Reject event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update event
router.put('/events/:eventId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const events = readDB('events');
    const eventIndex = events.findIndex((e) => e.eventId === parseInt(eventId) && !e.deleted);
    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

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

    if (eventName) events[eventIndex].eventName = eventName;
    if (description) events[eventIndex].description = description;
    if (rulesAndRestrictions) events[eventIndex].rulesAndRestrictions = rulesAndRestrictions;
    if (type) events[eventIndex].type = type;
    if (venueId) events[eventIndex].venueId = venueId;
    if (ticketsProvided !== undefined) events[eventIndex].ticketsProvided = ticketsProvided;
    if (maxTicketsPerUser !== undefined) events[eventIndex].maxTicketsPerUser = maxTicketsPerUser;
    if (ticketPrice !== undefined) events[eventIndex].ticketPrice = ticketPrice;
    if (startTime) events[eventIndex].startTime = startTime;
    if (endTime) events[eventIndex].endTime = endTime;
    events[eventIndex].updatedAt = new Date().toISOString();

    writeDB('events', events);

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: events[eventIndex],
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Cancel event
router.put('/events/:eventId/cancel', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const events = readDB('events');
    const eventIndex = events.findIndex((e) => e.eventId === parseInt(eventId) && !e.deleted);
    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    events[eventIndex].status = 'Cancelled';
    events[eventIndex].updatedAt = new Date().toISOString();
    writeDB('events', events);

    res.json({
      success: true,
      message: 'Event cancelled successfully',
      data: events[eventIndex],
    });
  } catch (error) {
    console.error('Cancel event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Delete event
router.delete('/events/:eventId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const events = readDB('events');
    const eventIndex = events.findIndex((e) => e.eventId === parseInt(eventId) && !e.deleted);
    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    events[eventIndex].deleted = true;
    events[eventIndex].updatedAt = new Date().toISOString();
    writeDB('events', events);

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get all venues
router.get('/venues', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const venues = readDB('venues');
    const activeVenues = venues.filter((v) => !v.deleted);

    res.json({
      success: true,
      data: activeVenues,
    });
  } catch (error) {
    console.error('Get venues error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Create venue
router.post('/venues', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, address, capacity, latitude, longitude } = req.body;

    if (!name || !address || !capacity || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const venues = readDB('venues');
    const newVenue = {
      venueId: getNextId('venues'),
      name,
      address,
      capacity: parseInt(capacity),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      availabilityStatus: 'Available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
    };

    venues.push(newVenue);
    writeDB('venues', venues);

    res.status(201).json({
      success: true,
      message: 'Venue created successfully',
      data: newVenue,
    });
  } catch (error) {
    console.error('Create venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update venue
router.put('/venues/:venueId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { venueId } = req.params;
    const venues = readDB('venues');
    const venueIndex = venues.findIndex((v) => v.venueId === parseInt(venueId) && !v.deleted);
    if (venueIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found',
      });
    }

    const { name, address, capacity, latitude, longitude, availabilityStatus } = req.body;

    if (name) venues[venueIndex].name = name;
    if (address) venues[venueIndex].address = address;
    if (capacity !== undefined) venues[venueIndex].capacity = parseInt(capacity);
    if (latitude !== undefined) venues[venueIndex].latitude = parseFloat(latitude);
    if (longitude !== undefined) venues[venueIndex].longitude = parseFloat(longitude);
    if (availabilityStatus) venues[venueIndex].availabilityStatus = availabilityStatus;
    venues[venueIndex].updatedAt = new Date().toISOString();

    writeDB('venues', venues);

    res.json({
      success: true,
      message: 'Venue updated successfully',
      data: venues[venueIndex],
    });
  } catch (error) {
    console.error('Update venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Delete venue
router.delete('/venues/:venueId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { venueId } = req.params;
    const venues = readDB('venues');
    const venueIndex = venues.findIndex((v) => v.venueId === parseInt(venueId) && !v.deleted);
    if (venueIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found',
      });
    }

    venues[venueIndex].deleted = true;
    venues[venueIndex].updatedAt = new Date().toISOString();
    writeDB('venues', venues);

    res.json({
      success: true,
      message: 'Venue deleted successfully',
    });
  } catch (error) {
    console.error('Delete venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Approve venue
router.put('/venues/:venueId/approve', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { venueId } = req.params;
    const venues = readDB('venues');
    const venueIndex = venues.findIndex((v) => v.venueId === parseInt(venueId) && !v.deleted);
    if (venueIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found',
      });
    }

    venues[venueIndex].availabilityStatus = 'Available';
    venues[venueIndex].updatedAt = new Date().toISOString();
    writeDB('venues', venues);

    res.json({
      success: true,
      message: 'Venue approved successfully',
      data: venues[venueIndex],
    });
  } catch (error) {
    console.error('Approve venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Reject venue
router.put('/venues/:venueId/reject', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { venueId } = req.params;
    const { comment } = req.body;
    const venues = readDB('venues');
    const venueIndex = venues.findIndex((v) => v.venueId === parseInt(venueId) && !v.deleted);
    if (venueIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found',
      });
    }

    venues[venueIndex].availabilityStatus = 'Unavailable';
    venues[venueIndex].updatedAt = new Date().toISOString();
    writeDB('venues', venues);

    res.json({
      success: true,
      message: 'Venue rejected successfully',
      data: venues[venueIndex],
    });
  } catch (error) {
    console.error('Reject venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get organizer requests
router.get('/organizer-requests', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const organizerRequests = readDB('organizerRequests');
    const pendingRequests = organizerRequests.filter((r) => r.status === 'Pending');

    res.json({
      success: true,
      data: pendingRequests,
    });
  } catch (error) {
    console.error('Get organizer requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get pending venue requests
router.get('/user-requests', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const userRequests = readDB('userRequests');
    const pendingRequests = userRequests.filter((r) => r.status === 'Pending');

    res.json({
      success: true,
      data: pendingRequests,
    });
  } catch (error) {
    console.error('Get user requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Approve user request
router.post('/user-requests/:requestId/approve', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { requestId } = req.params;
    const userRequests = readDB('userRequests');
    const requestIndex = userRequests.findIndex((r) => r.requestId === parseInt(requestId));
    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    const request = userRequests[requestIndex];
    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Request is not pending',
      });
    }

    // Create user account
    const users = readDB('users');
    const newUser = {
      userId: getNextId('users'),
      name: request.name,
      email: request.email,
      password: request.password,
      phone: request.phone,
      gender: request.gender,
      dob: request.dob,
      profilePicture: request.profilePicture || '',
      approvalStatus: 'Approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
    };

    users.push(newUser);
    writeDB('users', users);

    // Update request status
    userRequests[requestIndex].status = 'Approved';
    userRequests[requestIndex].updatedAt = new Date().toISOString();
    writeDB('userRequests', userRequests);

    res.json({
      success: true,
      message: 'User request approved successfully',
      data: newUser,
    });
  } catch (error) {
    console.error('Approve user request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Reject user request
router.post('/user-requests/:requestId/reject', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;
    const userRequests = readDB('userRequests');
    const requestIndex = userRequests.findIndex((r) => r.requestId === parseInt(requestId));
    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    userRequests[requestIndex].status = 'Rejected';
    userRequests[requestIndex].rejectionReason = rejectionReason || '';
    userRequests[requestIndex].updatedAt = new Date().toISOString();
    writeDB('userRequests', userRequests);

    res.json({
      success: true,
      message: 'User request rejected successfully',
    });
  } catch (error) {
    console.error('Reject user request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Approve organizer request
router.post('/organizer-requests/:requestId/approve', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { requestId } = req.params;
    const organizerRequests = readDB('organizerRequests');
    const requestIndex = organizerRequests.findIndex((r) => r.requestId === parseInt(requestId));
    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    const request = organizerRequests[requestIndex];
    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Request is not pending',
      });
    }

    // Create organizer account
    const organizers = readDB('organizers');
    const newOrganizer = {
      organizerId: getNextId('organizers'),
      organizerType: request.organizerType,
      organizerName: request.organizerName,
      email: request.email,
      phone: request.phone,
      address: request.address,
      password: request.password,
      status: 'Approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
    };

    organizers.push(newOrganizer);
    writeDB('organizers', organizers);

    // Update request status
    organizerRequests[requestIndex].status = 'Approved';
    organizerRequests[requestIndex].updatedAt = new Date().toISOString();
    writeDB('organizerRequests', organizerRequests);

    res.json({
      success: true,
      message: 'Organizer request approved successfully',
      data: newOrganizer,
    });
  } catch (error) {
    console.error('Approve organizer request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Reject organizer request
router.post('/organizer-requests/:requestId/reject', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;
    const organizerRequests = readDB('organizerRequests');
    const requestIndex = organizerRequests.findIndex((r) => r.requestId === parseInt(requestId));
    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    organizerRequests[requestIndex].status = 'Rejected';
    organizerRequests[requestIndex].rejectionReason = rejectionReason || '';
    organizerRequests[requestIndex].updatedAt = new Date().toISOString();
    writeDB('organizerRequests', organizerRequests);

    res.json({
      success: true,
      message: 'Organizer request rejected successfully',
    });
  } catch (error) {
    console.error('Reject organizer request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get pending venue requests
router.get('/venue-requests/pending', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const venueRequests = readDB('venueRequests');
    const pendingRequests = venueRequests.filter((r) => r.status === 'Pending' && !r.deleted);

    res.json({
      success: true,
      data: pendingRequests,
    });
  } catch (error) {
    console.error('Get pending venue requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Review venue request
router.post('/venue-requests/:requestId/review', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, comment } = req.body; // action: 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be "approve" or "reject"',
      });
    }

    const venueRequests = readDB('venueRequests');
    const requestIndex = venueRequests.findIndex((r) => r.requestId === parseInt(requestId) && !r.deleted);
    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    const request = venueRequests[requestIndex];

    if (action === 'approve') {
      // Create venue from request
      const venues = readDB('venues');
      const newVenue = {
        venueId: getNextId('venues'),
        name: request.name,
        address: request.address,
        capacity: request.capacity,
        latitude: request.latitude,
        longitude: request.longitude,
        availabilityStatus: 'Available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deleted: false,
      };

      venues.push(newVenue);
      writeDB('venues', venues);

      venueRequests[requestIndex].status = 'Approved';
      venueRequests[requestIndex].adminComment = comment || '';
    } else {
      venueRequests[requestIndex].status = 'Rejected';
      venueRequests[requestIndex].adminComment = comment || '';
    }

    venueRequests[requestIndex].updatedAt = new Date().toISOString();
    writeDB('venueRequests', venueRequests);

    res.json({
      success: true,
      message: `Venue request ${action}d successfully`,
      data: venueRequests[requestIndex],
    });
  } catch (error) {
    console.error('Review venue request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;

