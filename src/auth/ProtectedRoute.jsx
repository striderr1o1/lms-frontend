import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { homePath } from './session.js';

export default function ProtectedRoute({ role, children }) {
  const { profile, ready } = useAuth();

  if (!ready) return <p className="status-page">Loading…</p>;
  if (!profile) return <Navigate to="/login" replace />;
  if (profile.role !== role) return <Navigate to={homePath(profile.role)} replace />;
  return children;
}
