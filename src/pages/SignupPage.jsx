import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { homePath } from '../auth/session.js';

export default function SignupPage() {
  const { ready, profile, register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  if (!ready) return <p className="status-page">Loading…</p>;
  if (profile) return <Navigate to={homePath(profile.role)} replace />;

  async function onSubmit(event) {
    event.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      const next = await register({
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      navigate(homePath(next.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Could not create the account');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="panel auth-card stack" onSubmit={onSubmit}>
        <h1>Create an account</h1>
        <label>
          Username
          <input
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            minLength={3}
            maxLength={32}
            required
          />
        </label>
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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            maxLength={72}
            required
          />
        </label>
        <label>
          Role
          <select name="role" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Sign up'}
        </button>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <p className="muted">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
