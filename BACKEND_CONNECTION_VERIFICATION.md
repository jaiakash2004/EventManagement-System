# Backend Connection Verification Guide

## ✅ Verified API Endpoints

All React frontend API calls are configured to match the Node.js backend endpoints:

### Base Configuration
- **Backend URL**: `http://localhost:8080/api`
- **Bank Payment API**: `http://localhost:8081` (external service)
- **Authentication**: JWT tokens stored in `sessionStorage`

### Authentication Endpoints ✅
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile
- `POST /api/users/register` - User registration

### Event Endpoints ✅
- `GET /api/events/` - Get all events
- `GET /api/events/filter` - Filter events
- `GET /api/venues` - Get all venues

### User Event Registration ✅
- `POST /api/users/events/register` - Register for event
- `POST /api/users/payments/simulate` - Simulate payment
- `GET /api/users/tickets` - Get user tickets
- `GET /api/users/registered-events` - Get registered events

### Organizer Endpoints ✅
- `POST /api/organizer/events/` - Create event
- `GET /api/organizer/events/` - Get organizer events
- `GET /api/organizer/events/:eventId` - Get event details
- `PUT /api/admin/events/:eventId` - Update event
- `PUT /api/admin/events/:eventId/cancel` - Cancel event
- `GET /api/organizer/profile` - Get organizer profile
- `PUT /api/organizer/profile` - Update organizer profile
- `POST /api/organizers/venue-requests` - Submit venue request
- `GET /api/organizers/venue-requests` - Get venue requests
- `GET /api/organizers/status/:token` - Track request status

### Admin Endpoints ✅
- `GET /api/admin/users` - Get all users
- `GET /api/admin/organizers` - Get all organizers
- `GET /api/admin/events` - Get all events
- `GET /api/admin/venues` - Get all venues
- `PUT /api/admin/events/:eventId/approve` - Approve event
- `PUT /api/admin/events/:eventId/reject` - Reject event
- `PUT /api/admin/venues/:venueId/approve` - Approve venue
- `PUT /api/admin/venues/:venueId/reject` - Reject venue

## 🔧 Testing Backend Connection

### 1. Start Backend Server
```bash
cd EventManagement_Backend
node app.js  # or use app.example.js as reference
```

Backend should run on `http://localhost:8080`

### 2. Start React Frontend
```bash
cd EventManagement_Frontend/react-frontend
npm run dev
```

Frontend should run on `http://localhost:5173` (or assigned port)

### 3. Test Authentication Flow
1. Navigate to `/register` - Create a new user account
2. Navigate to `/login` - Login with credentials
3. Verify token is stored in `sessionStorage`
4. Verify redirect to appropriate dashboard based on role

### 4. Test Event Browsing
1. Login as User
2. Navigate to `/user/browse-events`
3. Verify events load from backend
4. Test filtering functionality
5. Test event registration flow

### 5. Test Event Creation
1. Login as Organizer
2. Navigate to `/organizer/create-event`
3. Fill form and submit
4. Verify event is created in backend

### 6. Test Payment Flow
1. Register for an event
2. Complete payment with account number
3. Verify external bank API call (port 8081)
4. Verify payment simulation
5. Verify tickets are generated

## 🔍 API Service Layer Verification

All services are properly configured in:
- `src/services/api.ts` - Base axios instance with interceptors
- `src/services/authService.ts` - Authentication endpoints
- `src/services/userService.ts` - User endpoints
- `src/services/eventService.ts` - Event endpoints
- `src/services/organizerService.ts` - Organizer endpoints
- `src/services/adminService.ts` - Admin endpoints
- `src/services/paymentService.ts` - External bank payment

## ⚠️ Common Issues & Solutions

### CORS Errors
- Backend must have CORS enabled: `app.use(cors())`
- Verify backend is running on port 8080

### Authentication Errors
- Check token is stored in `sessionStorage`
- Verify token format: `Bearer {token}`
- Check token expiration

### Network Errors
- Verify backend server is running
- Check backend port (should be 8080)
- Verify API endpoint URLs match exactly

### Payment API Errors
- External bank API should run on port 8081
- Verify account number format
- Check payment request payload

## ✅ Migration Status

### Fully Migrated & Tested
- ✅ Login/Register pages
- ✅ Browse Events (with filtering, registration, payment)
- ✅ Create Event (with validation)
- ✅ Layout & Navigation
- ✅ Protected Routes
- ✅ API Service Layer

### Ready for Testing
- 🟡 User Profile
- 🟡 My Registrations
- 🟡 My Tickets
- 🟡 Organizer Dashboard
- 🟡 Venue Requests
- 🟡 Admin Management

## 📝 Notes

- All API calls use axios with automatic token injection
- Error handling includes automatic redirect to login on 401
- Toast notifications for user feedback
- Loading states for async operations
- Form validation using React Hook Form

