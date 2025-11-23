import express from 'express';
import { readDB, writeDB, getNextId } from '../utils/db.js';
import { generateToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Check users
    const users = readDB('users');
    let user = users.find((u) => u.email === email && !u.deleted);

    // Check organizers if not found in users
    if (!user) {
      const organizers = readDB('organizers');
      user = organizers.find((o) => o.email === email && !o.deleted);
      if (user) {
        user.role = 'organizer';
        // Check if organizer is approved
        if (user.status && user.status !== 'Approved') {
          return res.status(403).json({
            success: false,
            message: 'Your organizer account is not approved yet. Please wait for admin approval.',
          });
        }
      }
    } else {
      // Use existing role if set (for admin), otherwise default to 'user'
      user.role = user.role || 'user';
      // Users are automatically approved, no need to check approval status
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken({
      userId: user.userId || user.organizerId,
      email: user.email,
      role: user.role,
      name: user.name || user.organizerName,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        email: user.email,
        role: user.role,
        name: user.name || user.organizerName,
        userId: user.userId || user.organizerId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { userId, role } = req.user;

    if (role === 'organizer') {
      const organizers = readDB('organizers');
      const organizer = organizers.find((o) => o.organizerId === userId && !o.deleted);
      if (!organizer) {
        return res.status(404).json({
          success: false,
          message: 'Organizer not found',
        });
      }
      return res.json({
        success: true,
        data: {
          ...organizer,
          role: 'organizer',
        },
      });
    } else {
      const users = readDB('users');
      const user = users.find((u) => u.userId === userId && !u.deleted);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
      return res.json({
        success: true,
        data: {
          ...user,
          role: user.role || 'user',
        },
      });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;

