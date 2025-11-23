import express from 'express';
import { readDB } from '../utils/db.js';

const router = express.Router();

// Get all venues
router.get('/', (req, res) => {
  try {
    const venues = readDB('venues');
    const availableVenues = venues.filter((v) => !v.deleted && v.availabilityStatus === 'Available');

    res.json({
      success: true,
      data: availableVenues,
    });
  } catch (error) {
    console.error('Get venues error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;

