import { Navigate } from 'react-router-dom';
import { CompassSpinner } from '../components/brand/CompassMark.jsx';
import { useAuth } from './AuthContext.jsx';
import { homePath } from './session.js';

export default function ProtectedRoute({ role, children }) {
  const { profile, ready } = useAuth();

  if (!ready) return <p className="status-page"><CompassSpinner /></p>;
  if (!profile) return <Navigate to="/login" replace />;
  if (profile.role !== role) return <Navigate to={homePath(profile.role)} replace />;
  return children;
}
