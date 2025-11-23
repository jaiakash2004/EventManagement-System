# Quick Start Guide

## Installation

1. Navigate to the backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## Default Credentials

After first run, you can login with:

**Admin Account:**
- Email: `admin@example.com`
- Password: `admin123`

## Testing the API

### 1. Health Check
```bash
curl http://localhost:8080/api/health
```

### 2. Register a User
```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test1234",
    "phone": "1234567890",
    "gender": "Male",
    "dob": "1990-01-01"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

Save the token from the response for authenticated requests.

### 4. Get Events (Public)
```bash
curl http://localhost:8080/api/events/
```

### 5. Get Profile (Authenticated)
```bash
curl http://localhost:8080/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Database Files

All data is stored in JSON files in the `data/` directory:
- `users.json` - User accounts
- `organizers.json` - Organizer accounts  
- `events.json` - Events
- `venues.json` - Venues
- `tickets.json` - Tickets
- `venueRequests.json` - Venue requests
- `organizerRequests.json` - Organizer requests
- `payments.json` - Payment records
- `feedback.json` - Event feedback

## Notes

- The server runs on port 8080 by default
- CORS is enabled for all origins (configure in production)
- JWT tokens expire after 7 days
- All passwords are hashed with bcrypt
- Sample venues are created automatically on first run

