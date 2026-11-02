import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { homePath } from '../auth/session.js';

const PORTALS = [
  { role: 'student', label: 'Student' },
  { role: 'teacher', label: 'Teacher' },
  { role: 'admin', label: 'Admin' },
];

export default function LoginPage() {
  const { ready, profile, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  if (!ready) return <p className="status-page">Loading…</p>;
  if (profile) return <Navigate to={homePath(profile.role)} replace />;

  async function submit(role, event) {
    const form = event.currentTarget.form;
    if (form && !form.reportValidity()) return;
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      const next = await login(email.trim().toLowerCase(), password, role);
      navigate(homePath(next.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Could not sign in');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="panel auth-card stack" onSubmit={(event) => event.preventDefault()}>
        <h1>Northstar</h1>
        <p className="muted">Sign in with the portal this account belongs to.</p>
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            maxLength={72}
            required
          />
        </label>
        <div className="portal-buttons">
          {PORTALS.map((portal) => (
            <button
              key={portal.role}
              type="button"
              disabled={busy}
              onClick={(event) => submit(portal.role, event)}
            >
              {portal.label}
            </button>
          ))}
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <p className="muted">
          No account? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
