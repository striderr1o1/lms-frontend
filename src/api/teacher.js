import { api } from './client.js';

export function listCourses() {
  return api('/api/teacher/courses');
}

export function getCourse(courseId) {
  return api(`/api/teacher/courses/${encodeURIComponent(courseId)}`);
}

export function createLesson(courseId, body) {
  return api(`/api/teacher/courses/${encodeURIComponent(courseId)}/lessons`, {
    method: 'POST',
    body,
  });
}

export function updateLesson(lessonId, body) {
  return api(`/api/teacher/lessons/${encodeURIComponent(lessonId)}`, {
    method: 'PATCH',
    body,
  });
}

export function deleteLesson(lessonId) {
  return api(`/api/teacher/lessons/${encodeURIComponent(lessonId)}`, {
    method: 'DELETE',
  });
}

export function createVideoUpload() {
  return api('/api/teacher/videos/uploads', { method: 'POST' });
}

export function getVideo(videoId) {
  return api(`/api/teacher/videos/${encodeURIComponent(videoId)}`);
}
