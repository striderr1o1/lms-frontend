import { api } from './client.js';

export function getCourse(courseId) {
  return api(`/api/student/courses/${encodeURIComponent(courseId)}`);
}

export function listEnrollments() {
  return api('/api/student/enrollments');
}
