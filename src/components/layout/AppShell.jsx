import { LayoutDashboard, Library, Users } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { homePath } from '../../auth/session.js';
import PageTransition from '../motion/PageTransition.jsx';
import Badge from '../primitives/Badge.jsx';
import ThemeToggle from '../primitives/ThemeToggle.jsx';
import CompassMark from '../brand/CompassMark.jsx';
import AvatarMenu from './AvatarMenu.jsx';

function roleLabel(role) {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

const ADMIN_LINKS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/courses', label: 'Courses', icon: Library, end: false },
  { to: '/admin/people', label: 'People', icon: Users, end: false },
];

function SideLink({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => (isActive ? 'side-link is-active' : 'side-link')}
    >
      <Icon size={18} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function AppShell({ children }) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const role = profile?.role;

  function onLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  let navigation = null;
  if (role === 'student') {
    navigation = <NavLink className="nav-link is-active" to="/courses">Courses</NavLink>;
  } else if (role === 'teacher') {
    navigation = <NavLink className="nav-link is-active" to="/teacher">Courses</NavLink>;
  }

  return (
    <div className={role === 'admin' ? 'app-shell app-shell-admin' : 'app-shell'}>
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink className="brand" to={homePath(role)}>
            <CompassMark />
            <span>Northstar</span>
          </NavLink>
          {role !== 'admin' ? (
            <nav className="topbar-nav" aria-label="Section">
              {navigation}
            </nav>
          ) : <span className="topbar-spacer" />}
          <div className="topbar-user">
            <ThemeToggle />
            {role ? <Badge tone="role">{roleLabel(role)}</Badge> : null}
            <AvatarMenu name={profile?.username} role={role} onLogout={onLogout} />
          </div>
        </div>
      </header>
      {role === 'admin' ? (
        <div className="admin-frame">
          <aside className="admin-side" aria-label="Admin">
            {ADMIN_LINKS.map((link) => <SideLink key={link.to} {...link} />)}
          </aside>
          <main className="shell-main">
            <PageTransition>{children}</PageTransition>
          </main>
          <nav className="admin-tabs" aria-label="Admin">
            {ADMIN_LINKS.map((link) => <SideLink key={link.to} {...link} />)}
          </nav>
        </div>
      ) : (
        <main className="shell-main">
          <PageTransition>{children}</PageTransition>
        </main>
      )}
    </div>
  );
}
