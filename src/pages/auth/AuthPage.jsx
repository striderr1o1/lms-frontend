import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { homePath } from '../../auth/session.js';
import CompassMark, { CompassSpinner } from '../../components/brand/CompassMark.jsx';
import Starfield from '../../components/brand/Starfield.jsx';
import CourseCover from '../../components/patterns/CourseCover.jsx';
import Button from '../../components/primitives/Button.jsx';
import Input from '../../components/primitives/Input.jsx';
import PasswordInput from '../../components/primitives/PasswordInput.jsx';
import SegmentedControl from '../../components/primitives/SegmentedControl.jsx';

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'admin', label: 'Admin' },
];

const FLOATING = [
  { id: 'auth-cover-a', name: 'Focus' },
  { id: 'auth-cover-b', name: 'Notes' },
  { id: 'auth-cover-c', name: 'Studio' },
];

const USERNAME_PATTERN = /^[a-z0-9_]{3,32}$/;

export default function AuthPage({ mode = 'login' }) {
  const isSignup = mode === 'signup';
  const { ready, profile, login, register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const busyRef = useRef(false);

  if (!ready) {
    return (
      <div className="status-page surface-night">
        <CompassSpinner />
      </div>
    );
  }
  if (profile) return <Navigate to={homePath(profile.role)} replace />;

  const passwordRules = [
    { ok: password.length >= 8, label: 'At least 8 characters' },
    { ok: password.length > 0 && password.length <= 72, label: 'At most 72 characters' },
  ];

  function fail(message, fields = {}) {
    setError(message);
    setFieldErrors(fields);
    setShake(false);
    window.requestAnimationFrame(() => setShake(true));
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (busyRef.current) return;
    const nextFields = {};
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) nextFields.email = 'Enter the email for this account.';
    if (!password) nextFields.password = 'Enter a password.';
    if (isSignup && !USERNAME_PATTERN.test(username.trim().toLowerCase())) {
      nextFields.username = 'Use 3–32 lowercase letters, digits, or underscores.';
    }
    if (isSignup && (password.length < 8 || password.length > 72)) {
      nextFields.password = 'Use 8–72 characters.';
    }
    if (Object.keys(nextFields).length) {
      fail(isSignup ? 'Check the highlighted fields.' : 'Enter your email and password.', nextFields);
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setError('');
    setFieldErrors({});
    try {
      const next = isSignup
        ? await register({
          username: username.trim().toLowerCase(),
          email: trimmedEmail,
          password,
          role,
        })
        : await login(trimmedEmail, password, role);
      navigate(homePath(next.role), { replace: true });
    } catch (err) {
      fail(err.message || (isSignup ? 'Could not create the account' : 'Could not sign in'));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen surface-night">
      <aside className="auth-brand-panel">
        <Starfield />
        <div className="aurora aurora-a" />
        <div className="aurora aurora-b" />
        <div className="auth-brand-copy">
          <Link className="brand" to="/">
            <CompassMark />
            <span>Northstar</span>
          </Link>
          <h2>Learn with direction.</h2>
          <p>Courses, lessons, and the people assigned to them — in one calm place.</p>
        </div>
        <div className="auth-float-stack" aria-hidden="true">
          {FLOATING.map((course) => (
            <div className="auth-float-card" key={course.id}>
              <CourseCover course={course} size="thumb" />
              <span>{course.name}</span>
            </div>
          ))}
        </div>
      </aside>
      <div className="auth-form-pane">
        <div className="auth-mobile-brand">
          <Link className="brand" to="/">
            <CompassMark />
            <span>Northstar</span>
          </Link>
        </div>
        <form className={shake ? 'auth-card stack is-shake' : 'auth-card stack'} onSubmit={onSubmit} noValidate>
          <h1 className="page-title">{isSignup ? 'Create an account' : 'Sign in'}</h1>
          <p className="page-context">
            {isSignup
              ? 'Choose the role for this account.'
              : 'Sign in with the portal your account belongs to.'}
          </p>
          {isSignup ? (
            <Input
              label="Username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value.toLowerCase())}
              minLength={3}
              maxLength={32}
              pattern="[a-z0-9_]{3,32}"
              hint="Lowercase letters, digits, and underscores. 3–32 characters."
              error={fieldErrors.username}
              required
            />
          ) : null}
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
            required
          />
          <PasswordInput
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password}
            error={fieldErrors.password}
            required
            onChange={(event) => setPassword(event.target.value)}
          />
          {isSignup ? (
            <ul className="rule-list" aria-label="Password rules">
              {passwordRules.map((rule) => (
                <li key={rule.label} className={rule.ok ? 'is-met' : ''}>
                  <span aria-hidden="true">{rule.ok ? '✓' : '○'}</span>
                  {rule.label}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="field">
            <span className="field-label">Role</span>
            <SegmentedControl
              label="Role"
              value={role}
              onChange={setRole}
              options={ROLES}
              disabled={busy}
            />
            <span className="field-hint">Sign in with the portal your account belongs to.</span>
          </div>
          <Button type="submit" loading={busy}>
            {busy ? (isSignup ? 'Creating…' : 'Signing in…') : (isSignup ? 'Create account' : 'Sign in')}
          </Button>
          {error ? (
            <p className="alert" role="alert">
              <span className="badge-dot" aria-hidden="true" />
              <span>{error}</span>
            </p>
          ) : null}
          <p className="muted auth-switch">
            {isSignup ? (
              <>Already have an account? <Link to="/login">Sign in</Link></>
            ) : (
              <>No account? <Link to="/signup">Sign up</Link></>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
