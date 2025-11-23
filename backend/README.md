# Event Management System - Backend API

A Node.js backend API for the Event Management System using Express and JSON file-based database.

## Features

- User authentication and authorization (JWT)
- User registration and profile management
- Event browsing and filtering
- Event registration and ticket management
- Organizer event management
- Admin dashboard and management
- Venue management
- Payment simulation
- Request tracking system

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults are provided):
```bash
cp .env.example .env
```

Edit `.env` and set your configuration:
```
PORT=8080
JWT_SECRET=your-secret-key-change-in-production
```

## Running the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:8080`

## Default Admin Account

After first run, a default admin account is created:
- **Email**: `admin@example.com`
- **Password**: `admin123`

**Important**: Change the admin password in production!

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile

### Users
- `POST /api/users/register` - Register new user
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/registered-events` - Get user's registered events
- `GET /api/users/tickets` - Get user's tickets
- `POST /api/users/tickets/transfer` - Transfer ticket to another user
- `POST /api/users/events/register` - Register for an event
- `POST /api/users/payments/simulate` - Simulate payment

### Events
- `GET /api/events/` - Get all approved events
- `GET /api/events/filter` - Filter events (query params: type, minPrice, maxPrice, startDate, endDate, search)
- `GET /api/events/:eventId` - Get event details

### Venues
- `GET /api/venues/` - Get all available venues

### Organizer
- `GET /api/organizer/events/` - Get organizer's events
- `GET /api/organizer/events/:eventId` - Get event details
- `POST /api/organizer/events` - Create new event
- `GET /api/organizer/profile` - Get organizer profile
- `PUT /api/organizer/profile` - Update organizer profile
- `GET /api/organizer/events/:eventId/feedback` - Get event feedback
- `GET /api/organizer/events/bookings/summary` - Get booking summary

### Organizers
- `POST /api/organizers/request` - Register as organizer (request)
- `POST /api/organizers/venue-requests` - Submit venue request
- `GET /api/organizers/venue-requests` - Get venue requests
- `GET /api/organizers/status/:token` - Track request status
- `GET /api/organizers` - Get all organizers (admin only)

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/organizers` - Get all organizers
- `GET /api/admin/events` - Get all events
- `GET /api/admin/venues` - Get all venues
- `PUT /api/admin/events/:eventId/approve` - Approve event
- `PUT /api/admin/events/:eventId/reject` - Reject event
- `PUT /api/admin/events/:eventId` - Update event
- `PUT /api/admin/events/:eventId/cancel` - Cancel event
- `DELETE /api/admin/events/:eventId` - Delete event
- `POST /api/admin/venues` - Create venue
- `PUT /api/admin/venues/:venueId` - Update venue
- `DELETE /api/admin/venues/:venueId` - Delete venue
- `PUT /api/admin/venues/:venueId/approve` - Approve venue
- `PUT /api/admin/venues/:venueId/reject` - Reject venue
- `GET /api/admin/organizer-requests` - Get organizer requests
- `POST /api/admin/organizer-requests/:requestId/approve` - Approve organizer request
- `POST /api/admin/organizer-requests/:requestId/reject` - Reject organizer request
- `GET /api/admin/venue-requests/pending` - Get pending venue requests
- `POST /api/admin/venue-requests/:requestId/review` - Review venue request
- `DELETE /api/admin/users/:userId` - Deactivate user
- `POST /api/admin/users/:userId/reactivate` - Reactivate user

## Database Structure

The backend uses JSON files stored in the `data/` directory:
- `users.json` - User accounts
- `organizers.json` - Organizer accounts
- `events.json` - Events
- `venues.json` - Venues
- `tickets.json` - Tickets
- `venueRequests.json` - Venue requests
- `organizerRequests.json` - Organizer registration requests
- `payments.json` - Payment records
- `feedback.json` - Event feedback

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error message"
}
```

## Success Responses

Most success responses follow this format:
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

## Notes

- The database is file-based JSON, so data persists between server restarts
- All passwords are hashed using bcrypt
- JWT tokens expire after 7 days
- Soft delete is implemented (deleted flag) for most entities
- Sample venues are automatically created on first run

## Troubleshooting

1. **Port already in use**: Change the PORT in `.env` file
2. **Database errors**: Ensure the `data/` directory exists and is writable
3. **Authentication errors**: Check that JWT_SECRET is set correctly
4. **CORS errors**: Ensure the frontend URL is allowed in CORS settings

## License

ISC

