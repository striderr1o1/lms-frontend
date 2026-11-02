import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveSession,
} from '../auth/session.js';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let refreshPromise = null;

function baseUrl() {
  const configured = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  return configured.replace(/\/$/, '');
}

function redirectToLogin() {
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

function detailMessage(detail, fallback) {
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item.msg === 'string') {
          const loc = Array.isArray(item.loc)
            ? item.loc.filter((part) => part !== 'body' && part !== 'query').join('.')
            : '';
          return loc ? `${loc}: ${item.msg}` : item.msg;
        }
        return '';
      })
      .filter(Boolean);
    if (parts.length) return parts.join('; ');
  }
  return fallback;
}

async function errorMessage(response) {
  const fallback = response.statusText || 'Request failed';
  try {
    const data = await response.json();
    return detailMessage(data?.detail, fallback);
  } catch {
    return fallback;
  }
}

async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearSession();
    redirectToLogin();
    throw new ApiError('Session expired', 401);
  }

  let response;
  try {
    response = await fetch(`${baseUrl()}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch (err) {
    throw new ApiError(err.message || 'Network error', 0);
  }

  if (!response.ok) {
    const message = await errorMessage(response);
    clearSession();
    redirectToLogin();
    throw new ApiError(message, response.status);
  }

  const payload = await response.json();
  try {
    saveSession(payload);
  } catch (err) {
    clearSession();
    redirectToLogin();
    throw new ApiError(err.message || 'Session expired', response.status);
  }
  return payload.access_token;
}

function refreshOnce() {
  if (!refreshPromise) {
    refreshPromise = refreshSession().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function request(path, { method, body, auth, retry }) {
  const headers = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(err.message || 'Network error', 0);
  }

  if (response.status === 401 && auth) {
    if (retry && getRefreshToken()) {
      await refreshOnce();
      return request(path, { method, body, auth, retry: false });
    }
    const message = await errorMessage(response);
    clearSession();
    redirectToLogin();
    throw new ApiError(message, 401);
  }

  if (response.status === 204) return null;

  if (!response.ok) {
    throw new ApiError(await errorMessage(response), response.status);
  }

  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
}

export function api(path, options = {}) {
  const { method = 'GET', body, auth = true, retry = true } = options;
  return request(path, { method, body, auth, retry });
}
