import express from 'express';
import crypto from 'crypto';
import { readDB, writeDB, getNextId } from '../utils/db.js';
import { hashPassword } from '../utils/password.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, gender, dob, profilePicture } = req.body;

    if (!name || !email || !password || !phone || !gender || !dob) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const users = readDB('users');
    const existingUser = users.find((u) => u.email === email && !u.deleted);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = {
      userId: getNextId('users'),
      name,
      email,
      password: hashedPassword,
      phone,
      gender,
      dob,
      profilePicture: profilePicture || '',
      approvalStatus: 'Approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
    };

    users.push(newUser);
    writeDB('users', users);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: newUser.userId,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, requireRole('user'), async (req, res) => {
  try {
    const { userId } = req.user;
    const { name, phone, gender, dob, profilePicture } = req.body;

    const users = readDB('users');
    const userIndex = users.findIndex((u) => u.userId === userId && !u.deleted);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (name) users[userIndex].name = name;
    if (phone) users[userIndex].phone = phone;
    if (gender) users[userIndex].gender = gender;
    if (dob) users[userIndex].dob = dob;
    if (profilePicture !== undefined) users[userIndex].profilePicture = profilePicture;
    users[userIndex].updatedAt = new Date().toISOString();

    writeDB('users', users);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: users[userIndex],
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get registered events
router.get('/registered-events', authenticateToken, requireRole('user'), async (req, res) => {
  try {
    const { userId } = req.user;
    const tickets = readDB('tickets');
    const events = readDB('events');
    const venues = readDB('venues');

    const userTickets = tickets.filter((t) => t.userId === userId && !t.deleted);
    const registeredEvents = userTickets.map((ticket) => {
      const event = events.find((e) => e.eventId === ticket.eventId);
      if (!event) return null;
      const venue = venues.find((v) => v.venueId === event.venueId);
      return {
        ...event,
        venueName: venue?.name || '',
        venueAddress: venue?.address || '',
        venueCapacity: venue?.capacity || 0,
        ticketQuantity: ticket.quantity,
        ticketId: ticket.ticketId,
        registeredAt: ticket.createdAt,
      };
    }).filter((e) => e !== null);

    res.json({
      success: true,
      data: registeredEvents,
    });
  } catch (error) {
    console.error('Get registered events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get user tickets
router.get('/tickets', authenticateToken, requireRole('user'), async (req, res) => {
  try {
    const { userId } = req.user;
    const tickets = readDB('tickets');
    const events = readDB('events');
    const venues = readDB('venues');

    const userTickets = tickets.filter((t) => t.userId === userId && !t.deleted);
    const ticketsWithDetails = userTickets.map((ticket) => {
      const event = events.find((e) => e.eventId === ticket.eventId);
      if (!event) return null;
      const venue = venues.find((v) => v.venueId === event.venueId);
      return {
        ticketId: ticket.ticketId,
        eventId: ticket.eventId,
        eventName: event.eventName,
        description: event.description,
        type: event.type,
        startTime: event.startTime,
        endTime: event.endTime,
        venueName: venue?.name || '',
        venueAddress: venue?.address || '',
        ticketQuantity: ticket.quantity,
        ticketType: ticket.ticketType,
        totalPrice: ticket.totalPrice,
        status: ticket.status,
        createdAt: ticket.createdAt,
      };
    }).filter((t) => t !== null);

    res.json({
      success: true,
      data: ticketsWithDetails,
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Transfer ticket
router.post('/tickets/transfer', authenticateToken, requireRole('user'), async (req, res) => {
  try {
    const { userId } = req.user;
    const { ticketId, recipientEmail, reason } = req.body;

    if (!ticketId || !recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID and recipient email are required',
      });
    }

    const tickets = readDB('tickets');
    const ticketIndex = tickets.findIndex(
      (t) => t.ticketId === ticketId && t.userId === userId && !t.deleted
    );

    if (ticketIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    const users = readDB('users');
    const recipient = users.find((u) => u.email === recipientEmail && !u.deleted);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found',
      });
    }

    tickets[ticketIndex].userId = recipient.userId;
    tickets[ticketIndex].transferredAt = new Date().toISOString();
    tickets[ticketIndex].transferReason = reason || '';
    tickets[ticketIndex].updatedAt = new Date().toISOString();

    writeDB('tickets', tickets);

    res.json({
      success: true,
      message: 'Ticket transferred successfully',
      data: tickets[ticketIndex],
    });
  } catch (error) {
    console.error('Transfer ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Register for event
router.post('/events/register', authenticateToken, requireRole('user'), async (req, res) => {
  try {
    const { userId } = req.user;
    const { eventId, ticketQuantity, ticketType } = req.body;

    if (!eventId || !ticketQuantity) {
      return res.status(400).json({
        success: false,
        message: 'Event ID and ticket quantity are required',
      });
    }

    const events = readDB('events');
    const event = events.find((e) => e.eventId === eventId && !e.deleted);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    if (event.status !== 'Active' || event.approvalStatus !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Event is not available for registration',
      });
    }

    // Check available tickets
    const tickets = readDB('tickets');
    const eventTickets = tickets.filter((t) => t.eventId === eventId && !t.deleted);
    const totalSold = eventTickets.reduce((sum, t) => sum + t.quantity, 0);
    const available = event.ticketsProvided - totalSold;

    if (ticketQuantity > available) {
      return res.status(400).json({
        success: false,
        message: `Only ${available} tickets available`,
      });
    }

    if (ticketQuantity > event.maxTicketsPerUser) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${event.maxTicketsPerUser} tickets per user`,
      });
    }

    // Check user's existing tickets for this event
    const userEventTickets = eventTickets.filter((t) => t.userId === userId);
    const userTotalTickets = userEventTickets.reduce((sum, t) => sum + t.quantity, 0);
    if (userTotalTickets + ticketQuantity > event.maxTicketsPerUser) {
      return res.status(400).json({
        success: false,
        message: `You can only purchase ${event.maxTicketsPerUser} tickets for this event`,
      });
    }

    const totalPrice = event.ticketPrice * ticketQuantity;
    const newTicket = {
      ticketId: getNextId('tickets'),
      userId,
      eventId,
      quantity: ticketQuantity,
      ticketType: ticketType || 'Standard',
      totalPrice,
      status: 'Confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
    };

    tickets.push(newTicket);
    writeDB('tickets', tickets);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: newTicket,
    });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Simulate payment
router.post('/payments/simulate', authenticateToken, requireRole('user'), async (req, res) => {
  try {
    const { ticketId } = req.body;

    if (!ticketId) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID is required',
      });
    }

    const tickets = readDB('tickets');
    const ticket = tickets.find((t) => t.ticketId === ticketId && !t.deleted);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Simulate payment processing
    const payments = readDB('payments');
    const payment = {
      paymentId: getNextId('payments'),
      ticketId,
      userId: ticket.userId,
      amount: ticket.totalPrice,
      status: 'Completed',
      paymentMethod: 'Bank Transfer',
      createdAt: new Date().toISOString(),
    };

    payments.push(payment);
    writeDB('payments', payments);

    ticket.status = 'Paid';
    ticket.updatedAt = new Date().toISOString();
    writeDB('tickets', tickets);

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: payment,
    });
  } catch (error) {
    console.error('Payment simulation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;

