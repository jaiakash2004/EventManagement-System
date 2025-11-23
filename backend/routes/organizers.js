import express from 'express';
import { readDB, writeDB, getNextId } from '../utils/db.js';
import { hashPassword } from '../utils/password.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Register organizer request
router.post('/request', async (req, res) => {
  try {
    const { organizerType, organizerName, email, phone, address, password } = req.body;

    if (!organizerType || !organizerName || !email || !phone || !address || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const organizerRequests = readDB('organizerRequests');
    const existingRequest = organizerRequests.find(
      (r) => r.email === email && r.status === 'Pending'
    );
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request',
      });
    }

    const organizers = readDB('organizers');
    const existingOrganizer = organizers.find((o) => o.email === email && !o.deleted);
    if (existingOrganizer) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const trackingToken = crypto.randomBytes(16).toString('hex');
    const newRequest = {
      requestId: getNextId('organizerRequests'),
      organizerType,
      organizerName,
      email,
      phone,
      address,
      password: await hashPassword(password),
      status: 'Pending',
      trackingToken,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    organizerRequests.push(newRequest);
    writeDB('organizerRequests', organizerRequests);

    res.status(201).json({
      success: true,
      message: 'Registration request submitted successfully',
      trackingToken,
      submittedAt: newRequest.createdAt,
    });
  } catch (error) {
    console.error('Register organizer request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Submit venue request
router.post('/venue-requests', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const { userId } = req.user;
    // Support both old format (locationName, reason) and new format (name, address, capacity, latitude, longitude)
    const { name, locationName, address, capacity, latitude, longitude, reason } = req.body;

    // If using new format with full venue details
    if (name && address && capacity !== undefined && latitude !== undefined && longitude !== undefined) {
      const trackingToken = crypto.randomBytes(16).toString('hex');
      const venueRequests = readDB('venueRequests');
      const newRequest = {
        requestId: getNextId('venueRequests'),
        organizerId: userId,
        name,
        address,
        capacity: parseInt(capacity),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        reason: reason || '',
        status: 'Pending',
        trackingToken,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deleted: false,
      };

      venueRequests.push(newRequest);
      writeDB('venueRequests', venueRequests);

      return res.json({
        success: true,
        message: 'Venue request submitted successfully',
        data: newRequest,
      });
    }

    // If using old format (locationName, reason) - convert to new format with defaults
    if (locationName && reason) {
      const trackingToken = crypto.randomBytes(16).toString('hex');
      const venueRequests = readDB('venueRequests');
      const newRequest = {
        requestId: getNextId('venueRequests'),
        organizerId: userId,
        name: locationName,
        address: locationName, // Use locationName as address if not provided
        capacity: 100, // Default capacity
        latitude: 0, // Default latitude
        longitude: 0, // Default longitude
        reason: reason,
        status: 'Pending',
        trackingToken,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deleted: false,
      };

      venueRequests.push(newRequest);
      writeDB('venueRequests', venueRequests);

      return res.json({
        success: true,
        message: 'Venue request submitted successfully',
        data: newRequest,
      });
    }

    // If neither format is complete
    return res.status(400).json({
      success: false,
      message: 'All required fields are missing. Please provide either (name, address, capacity, latitude, longitude) or (locationName, reason)',
    });

  } catch (error) {
    console.error('Submit venue request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get venue requests
router.get('/venue-requests', authenticateToken, requireRole('organizer'), async (req, res) => {
  try {
    const { userId } = req.user;
    const venueRequests = readDB('venueRequests');
    const requests = venueRequests.filter((r) => r.organizerId === userId && !r.deleted);

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Get venue requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Track request status
router.get('/status/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Validate token format - should be hex string (32 characters for 16 bytes)
    if (!/^[a-f0-9]{32}$/i.test(token)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tracking token format. Token should be a 32-character hexadecimal string.',
      });
    }

    // Check organizer requests
    const organizerRequests = readDB('organizerRequests');
    let request = organizerRequests.find((r) => r.trackingToken === token);

    if (request) {
      return res.json({
        success: true,
        data: {
          type: 'organizer',
          ...request,
        },
      });
    }

    // Check venue requests
    const venueRequests = readDB('venueRequests');
    request = venueRequests.find((r) => r.trackingToken === token && !r.deleted);

    if (request) {
      return res.json({
        success: true,
        data: {
          type: 'venue',
          ...request,
        },
      });
    }


    return res.status(404).json({
      success: false,
      message: 'Request not found with the provided tracking token',
    });
  } catch (error) {
    console.error('Track request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get all organizers (for admin)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
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

export default router;

