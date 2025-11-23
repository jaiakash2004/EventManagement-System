# Angular to React Migration - Event Management System

## Migration Status

This React application has been created to migrate the Angular frontend to React.js. The following has been completed:

### ✅ Completed

1. **Project Setup**
   - React + TypeScript + Vite setup
   - React Router for routing
   - Axios for HTTP requests
   - React Hook Form for form handling
   - React Toastify for notifications
   - Material Icons integration

2. **Core Infrastructure**
   - API service layer (`src/services/`)
     - `api.ts` - Base axios configuration with interceptors
     - `authService.ts` - Authentication endpoints
     - `userService.ts` - User profile and registration endpoints
     - `eventService.ts` - Event browsing and registration
     - `organizerService.ts` - Organizer-specific endpoints
     - `adminService.ts` - Admin management endpoints
     - `paymentService.ts` - External bank payment integration

3. **Authentication & Routing**
   - `AuthContext` - Global authentication state management
   - `ProtectedRoute` - Route protection based on user roles
   - `Layout` component - Sidebar navigation with role-based menus
   - Login and Register pages (fully functional)

4. **Components Created**
   - Login page ✅
   - Register page ✅
   - User Dashboard ✅ (basic implementation)
   - Layout with sidebar ✅

### 🚧 In Progress / Placeholders

The following components have placeholder implementations and need full migration:

**User Components:**
- Browse Events (placeholder)
- User Profile (placeholder)
- My Registrations (placeholder)
- My Tickets (placeholder)

**Organizer Components:**
- Organizer Dashboard (placeholder)
- Create Event (placeholder)
- Venue Request (placeholder)
- Organizer Profile (placeholder)
- Track Request (placeholder)
- Organizer Register (placeholder)

**Admin Components:**
- Admin Dashboard (placeholder)
- Manage Events (placeholder)
- Manage Venues (placeholder)
- Manage Users/Organizers (placeholder)

## Backend Connection

The React app is configured to connect to the Node.js backend at:
- **Base URL**: `http://localhost:8080/api`
- **Bank Payment API**: `http://localhost:8081`

All API calls include JWT authentication tokens from sessionStorage.

## Running the Application

1. **Install dependencies:**
   ```bash
   cd react-frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Next Steps for Full Migration

1. **Migrate Browse Events Component**
   - Event filtering and search
   - Event details modal
   - Registration modal
   - Payment processing with external bank API
   - Ticket generation and display

2. **Migrate User Components**
   - User Profile (view/edit)
   - My Registrations (list with filters)
   - My Tickets (list with transfer functionality)

3. **Migrate Organizer Components**
   - Create Event form with venue selection
   - Organizer Events dashboard with stats
   - Venue Request submission and tracking
   - Organizer Profile management
   - Track Request status checking

4. **Migrate Admin Components**
   - Manage Events (approve/reject/cancel)
   - Manage Venues (approve/reject)
   - Manage Users & Organizers (approve/reject organizer requests)

5. **Styling**
   - Migrate all CSS from Angular components
   - Ensure responsive design matches Angular version
   - Add loading states and error handling

## Key Differences from Angular

1. **State Management**: Using React Context API instead of Angular services
2. **Forms**: Using React Hook Form instead of Angular Reactive Forms
3. **HTTP**: Using Axios instead of Angular HttpClient
4. **Routing**: Using React Router instead of Angular Router
5. **Notifications**: Using React Toastify instead of ngx-toastr

## File Structure

```
react-frontend/
├── src/
│   ├── components/        # Reusable components (Layout, ProtectedRoute)
│   ├── contexts/          # React Context (AuthContext)
│   ├── pages/             # Page components
│   │   ├── user/         # User role pages
│   │   ├── organizer/    # Organizer role pages
│   │   └── admin/        # Admin role pages
│   ├── services/          # API service layer
│   ├── App.tsx            # Main app with routing
│   └── main.tsx           # Entry point
```

## Notes

- All authentication tokens are stored in `sessionStorage` (matching Angular implementation)
- The app uses the same backend API endpoints as the Angular version
- Material Icons are loaded via Google Fonts CDN
- Bootstrap is installed but not actively used (can be removed if not needed)

