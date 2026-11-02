const ACCESS_KEY = 'lms_access_token';
const REFRESH_KEY = 'lms_refresh_token';
const PROFILE_KEY = 'lms_profile';

const listeners = new Set();

export function subscribeSession(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  const profile = getStoredProfile();
  listeners.forEach((listener) => listener(profile));
}

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_KEY);
}

export function getStoredProfile() {
  const raw = sessionStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    const profile = JSON.parse(raw);
    return profile && typeof profile === 'object' ? profile : null;
  } catch {
    return null;
  }
}

export function saveSession(payload) {
  if (!payload?.access_token || !payload?.refresh_token || !payload?.profile?.role) {
    throw new Error('Auth response was missing a session');
  }
  sessionStorage.setItem(ACCESS_KEY, payload.access_token);
  sessionStorage.setItem(REFRESH_KEY, payload.refresh_token);
  sessionStorage.setItem(PROFILE_KEY, JSON.stringify(payload.profile));
  emit();
}

export function saveProfile(profile) {
  if (!profile?.role) {
    throw new Error('Profile response was missing a role');
  }
  sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  emit();
}

export function clearSession() {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(PROFILE_KEY);
  emit();
}

export function homePath(role) {
  if (role === 'teacher') return '/teacher';
  if (role === 'admin') return '/admin';
  return '/student';
}
