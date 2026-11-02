import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { homePath } from '../auth/session.js';

function roleLabel(role) {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function Shell({ children }) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" to={homePath(profile?.role)}>Northstar</Link>
        <p className="username">{profile?.username}</p>
        <p className="role">{roleLabel(profile?.role)}</p>
        <button type="button" className="secondary logout" onClick={onLogout}>
          Log out
        </button>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
