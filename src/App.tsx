import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// User pages (placeholders - will be implemented)
import UserDashboard from './pages/user/UserDashboard';
import BrowseEvents from './pages/user/BrowseEvents';
import UserProfile from './pages/user/UserProfile';
import MyRegistrations from './pages/user/MyRegistrations';
import MyTickets from './pages/user/MyTickets';

// Organizer pages (placeholders - will be implemented)
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import CreateEvent from './pages/organizer/CreateEvent';
import VenueRequest from './pages/organizer/VenueRequest';
import OrganizerProfile from './pages/organizer/OrganizerProfile';
import TrackRequest from './pages/organizer/TrackRequest';
import OrganizerRegister from './pages/organizer/OrganizerRegister';

// Admin pages (placeholders - will be implemented)
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageEvents from './pages/admin/ManageEvents';
import ManageVenues from './pages/admin/ManageVenues';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Redirect old route to new route */}
          <Route path="/register/organizer" element={<Navigate to="/organizer/register" replace />} />
          <Route path="/organizer/register" element={<OrganizerRegister />} />
          <Route path="/organizer/track-request" element={<TrackRequest />} />

          {/* Protected routes with layout */}
          {/* User routes */}
          <Route
            path="/userDashboard"
            element={
              <ProtectedRoute requiredRole="user">
                <Layout>
                  <UserDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/browse-events"
            element={
              <ProtectedRoute requiredRole="user">
                <Layout>
                  <BrowseEvents />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/profile"
            element={
              <ProtectedRoute requiredRole="user">
                <Layout>
                  <UserProfile />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/myRegistrations"
            element={
              <ProtectedRoute requiredRole="user">
                <Layout>
                  <MyRegistrations />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/myTickets"
            element={
              <ProtectedRoute requiredRole="user">
                <Layout>
                  <MyTickets />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Organizer routes */}
          <Route
            path="/organizerDashboard"
            element={
              <ProtectedRoute requiredRole="organizer">
                <Layout>
                  <OrganizerDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/create-event"
            element={
              <ProtectedRoute requiredRole="organizer">
                <Layout>
                  <CreateEvent />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/venue-request"
            element={
              <ProtectedRoute requiredRole="organizer">
                <Layout>
                  <VenueRequest />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/profile"
            element={
              <ProtectedRoute requiredRole="organizer">
                <Layout>
                  <OrganizerProfile />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/adminDashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <ManageEvents />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/venues"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <ManageVenues />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
