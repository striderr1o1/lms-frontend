import { api } from './client.js';

export function getPublicStats() {
  return api('/api/public/stats', { auth: false });
}

export function getFeaturedCourses() {
  return api('/api/public/courses/featured', { auth: false });
}

export function asCourseList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.courses)) return data.courses;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export function readStat(data, key) {
  const value = Number(data?.[key]);
  return Number.isFinite(value) ? value : 0;
}
