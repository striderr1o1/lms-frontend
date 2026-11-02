import { api } from './client.js';

export function getOverview() {
  return api('/api/admin/overview');
}

export function listPendingAdmins() {
  return api('/api/admin/admins?status=pending');
}

export function approveAdmin(adminId) {
  return api(`/api/admin/admins/${encodeURIComponent(adminId)}/approve`, {
    method: 'POST',
  });
}
