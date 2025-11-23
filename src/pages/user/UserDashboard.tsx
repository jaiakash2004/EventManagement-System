import { useEffect, useState } from 'react';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await eventService.getAllEvents();
      setEvents(data);
      calculateCounts(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
    }
  };

  const calculateCounts = (eventsData: any[]) => {
    const today = new Date();
    setCounts({
      all: eventsData.length,
      upcoming: eventsData.filter((e) => new Date(e.startTime) > today).length,
      ongoing: eventsData.filter(
        (e) => new Date(e.startTime) <= today && new Date(e.endTime) >= today
      ).length,
      completed: eventsData.filter((e) => new Date(e.endTime) < today).length,
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchEvents();
      toast.success('Data refreshed successfully!', { position: 'top-right' });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="user-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Welcome {user?.name || 'User'}</h1>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: isRefreshing ? '#999' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
          }}
        >
          <span className="material-icons" style={{ fontSize: '20px', animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}>refresh</span>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <div className="event-summary">
        <h2>Event Summary</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{counts.all}</h3>
            <p>All Events</p>
          </div>
          <div className="stat-card">
            <h3>{counts.upcoming}</h3>
            <p>Upcoming</p>
          </div>
          <div className="stat-card">
            <h3>{counts.ongoing}</h3>
            <p>Ongoing</p>
          </div>
          <div className="stat-card">
            <h3>{counts.completed}</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

