# Event Management System - React Frontend

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout.tsx      # Main layout with sidebar
│   └── ProtectedRoute.tsx
├── contexts/            # React Context
│   └── AuthContext.tsx
├── pages/               # Page components
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── user/           # User role pages
│   ├── organizer/       # Organizer role pages
│   └── admin/          # Admin role pages
└── services/            # API services
    ├── api.ts          # Base axios instance
    ├── authService.ts
    ├── userService.ts
    ├── eventService.ts
    ├── organizerService.ts
    ├── adminService.ts
    └── paymentService.ts
```

## 🔌 Backend Connection

- **Backend URL**: `http://localhost:8080/api`
- **Bank Payment API**: `http://localhost:8081`
- **Authentication**: JWT tokens in `sessionStorage`

## ✅ Fully Migrated Components

- Login & Registration
- Browse Events (with filtering, registration, payment)
- Create Event
- My Tickets (with transfer functionality)
- My Registrations (with feedback)
- User Dashboard

## 📝 See Also

- `MIGRATION_COMPLETE.md` - Full migration status
- `BACKEND_CONNECTION_VERIFICATION.md` - API endpoint verification
