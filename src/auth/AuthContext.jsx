import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, signIn, signUp } from '../api/auth.js';
import {
  clearSession,
  getAccessToken,
  getStoredProfile,
  saveProfile,
  saveSession,
  subscribeSession,
} from './session.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(() => getStoredProfile());
  const [ready, setReady] = useState(() => !getAccessToken());

  useEffect(() => subscribeSession(setProfile), []);

  useEffect(() => {
    if (!getAccessToken()) {
      setReady(true);
      return undefined;
    }

    let cancelled = false;
    getMe()
      .then((next) => {
        if (!cancelled) saveProfile(next);
      })
      .catch(() => {
        if (!cancelled) setProfile(getStoredProfile());
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({
    profile,
    ready,
    async login(email, password, role) {
      const payload = await signIn({ email, password, role });
      saveSession(payload);
      return payload.profile;
    },
    async register(input) {
      const payload = await signUp(input);
      saveSession(payload);
      return payload.profile;
    },
    logout() {
      clearSession();
    },
  }), [profile, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
