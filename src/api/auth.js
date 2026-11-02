import { api } from './client.js';

export function signUp({ username, email, password, role }) {
  return api('/api/auth/signup', {
    method: 'POST',
    body: { username, email, password, role },
    auth: false,
  });
}

export function signIn({ email, password, role }) {
  return api('/api/auth/signin', {
    method: 'POST',
    body: { email, password, role },
    auth: false,
  });
}

export function getMe() {
  return api('/api/auth/me');
}
