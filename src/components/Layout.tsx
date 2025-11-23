import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import './Layout.css';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout: logoutAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    if (user) {
      setMenuItems(getMenuItemsForRole(user.role));
    }
  }, [user]);

  const getMenuItemsForRole = (role: string): MenuItem[] => {
    const roleLower = role.toLowerCase();

    switch (roleLower) {
      case 'user':
        return [
          { label: 'Dashboard', icon: 'dashboard', route: '/userDashboard' },
          { label: 'Browse Events', icon: 'event_available', route: '/user/browse-events' },
          { label: 'My Registrations', icon: 'book_online', route: '/user/myRegistrations' },
          { label: 'My Tickets', icon: 'book_online', route: '/user/myTickets' },
          { label: 'Profile', icon: 'person', route: '/user/profile' },
        ];
      case 'organizer':
        return [
          { label: 'Dashboard', icon: 'dashboard', route: '/organizerDashboard' },
          { label: 'Create Event', icon: 'add_circle', route: '/organizer/create-event' },
          { label: 'Venue Requests', icon: 'location_city', route: '/organizer/venue-request' },
          { label: 'Profile', icon: 'person', route: '/organizer/profile' },
        ];
      case 'admin':
        return [
          { label: 'Users & Organizers', icon: 'people', route: '/adminDashboard' },
          { label: 'All Events', icon: 'event_available', route: '/admin/events' },
          { label: 'All Venues', icon: 'location_on', route: '/admin/venues' },
        ];
      default:
        return [];
    }
  };

  const handleLogout = () => {
    logoutAuth();
    toast.success('Logged out successfully', { position: 'top-right' });
    navigate('/login');
  };

  const navigateToProfile = () => {
    const role = user?.role.toLowerCase();
    navigate(`/${role}/profile`);
  };

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!isSidebarCollapsed ? (
            <h2 className="logo">Event Manager</h2>
          ) : (
            <h2 className="logo-small">EM</h2>
          )}
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.route}
              to={item.route}
              className={`nav-item ${location.pathname === item.route ? 'active' : ''}`}
            >
              <span className="material-icons">{item.icon}</span>
              {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="collapse-btn" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            <span className="material-icons">
              {isSidebarCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Navbar */}
        <header className="navbar">
          <div className="navbar-left">
            <button className="menu-toggle" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
              <span className="material-icons">menu</span>
            </button>
            <h1 className="page-title">{user?.role} Dashboard</h1>
          </div>

          <div className="navbar-right">
            <div className="user-info" onClick={navigateToProfile}>
              <div className="user-avatar">
                <span className="material-icons">account_circle</span>
              </div>
              <div className="user-details">
                <p className="user-name">{user?.name}</p>
                <p className="user-role">{user?.role}</p>
              </div>
            </div>

            <button className="logout-btn" onClick={handleLogout}>
              <span className="material-icons">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;

