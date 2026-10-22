import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading-screen">Loading QueueLess…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) {
    const destination = user.role === 'admin' ? '/admin' : user.role === 'staff' ? '/staff' : '/dashboard';
    return <Navigate to={destination} replace />;
  }
  return children;
}
