import { api } from './client.js';

export function listCourses() {
  return api('/api/student/courses');
}

export function getCourse(courseId) {
  return api(`/api/student/courses/${encodeURIComponent(courseId)}`);
}

export function enroll(courseId) {
  return api(`/api/student/courses/${encodeURIComponent(courseId)}/enroll`, {
    method: 'POST',
  });
}

export function listEnrollments() {
  return api('/api/student/enrollments');
}
