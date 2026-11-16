import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { homePath } from '../auth/session.js';
import CompassMark from '../components/brand/CompassMark.jsx';

export default function NotFoundPage() {
  const { profile, ready } = useAuth();
  if (!ready) {
    return (
      <div className="status-page surface-night">
        <CompassMark className="compass compass-lg compass-spin" />
      </div>
    );
  }
  const next = profile ? homePath(profile.role) : '/';
  return (
    <div className="status-page not-found surface-night">
      <CompassMark className="compass compass-xl" />
      <h1 className="page-title">This page is not on the map.</h1>
      <p className="muted">The address may be old, or the page may have moved.</p>
      <Link className="button button-primary" to={next}>{profile ? 'Go to dashboard' : 'Back to Northstar'}</Link>
    </div>
  );
}
