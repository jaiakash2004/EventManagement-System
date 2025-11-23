import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role.toLowerCase() !== requiredRole.toLowerCase()) {
    // Redirect to appropriate dashboard based on user role
    const role = user?.role.toLowerCase();
    if (role === 'user') return <Navigate to="/userDashboard" replace />;
    if (role === 'organizer') return <Navigate to="/organizerDashboard" replace />;
    if (role === 'admin') return <Navigate to="/adminDashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

