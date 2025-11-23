import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import eventRoutes from './routes/events.js';
import venueRoutes from './routes/venues.js';
import organizerRoutes from './routes/organizer.js';
import organizersRoutes from './routes/organizers.js';
import adminRoutes from './routes/admin.js';
import { readDB, writeDB, getNextId } from './utils/db.js';
import { hashPassword } from './utils/password.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize default admin user
async function initializeAdmin() {
  const users = readDB('users');
  const adminExists = users.find((u) => u.email === 'admin@example.com');
  
  if (!adminExists) {
    const adminPassword = await hashPassword('admin123');
    const admin = {
      userId: getNextId('users'),
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      phone: '1234567890',
      gender: 'Other',
      dob: '1990-01-01',
      profilePicture: '',
      role: 'admin',
      approvalStatus: 'Approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
    };
    users.push(admin);
    writeDB('users', users);
    console.log('Default admin user created: admin@example.com / admin123');
  }
}

// Initialize sample venues
function initializeVenues() {
  const venues = readDB('venues');
  if (venues.length === 0) {
    const sampleVenues = [
      {
        venueId: 1,
        name: 'Grand Convention Center',
        address: '123 Main Street, City Center',
        capacity: 1000,
        latitude: 40.7128,
        longitude: -74.0060,
        availabilityStatus: 'Available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deleted: false,
      },
      {
        venueId: 2,
        name: 'Riverside Auditorium',
        address: '456 River Road, Riverside',
        capacity: 500,
        latitude: 40.7580,
        longitude: -73.9855,
        availabilityStatus: 'Available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deleted: false,
      },
      {
        venueId: 3,
        name: 'City Park Amphitheater',
        address: '789 Park Avenue, Downtown',
        capacity: 2000,
        latitude: 40.7505,
        longitude: -73.9934,
        availabilityStatus: 'Available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deleted: false,
      },
    ];
    writeDB('venues', sampleVenues);
    console.log('Sample venues initialized');
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/organizers', organizersRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Initialize and start server
async function startServer() {
  try {
    await initializeAdmin();
    initializeVenues();
    
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`API base URL: http://localhost:${PORT}/api`);
      console.log('\nDefault Admin Credentials:');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

