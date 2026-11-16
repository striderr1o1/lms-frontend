import { withOptionalCover } from './covers.js';
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

export function listTeachers() {
  return api('/api/admin/teachers');
}

export function listStudents() {
  return api('/api/admin/students');
}

export function createCourse(body) {
  return api('/api/admin/courses', {
    method: 'POST',
    body: withOptionalCover(body),
  });
}

export function updateCourse(courseId, body) {
  return api(`/api/admin/courses/${encodeURIComponent(courseId)}`, {
    method: 'PATCH',
    body: withOptionalCover(body),
  });
}

export function searchUnsplash(query, page = 1, perPage = 12) {
  const params = new URLSearchParams({
    query,
    page: String(page),
    per_page: String(perPage),
  });
  return api(`/api/images/unsplash/search?${params.toString()}`);
}

export function deleteCourse(courseId) {
  return api(`/api/admin/courses/${encodeURIComponent(courseId)}`, {
    method: 'DELETE',
  });
}

export function addCourseStudent(courseId, studentId) {
  return api(`/api/admin/courses/${encodeURIComponent(courseId)}/students`, {
    method: 'POST',
    body: { student_id: studentId },
  });
}

export function removeCourseStudent(courseId, studentId) {
  return api(
    `/api/admin/courses/${encodeURIComponent(courseId)}/students/${encodeURIComponent(studentId)}`,
    { method: 'DELETE' },
  );
}
