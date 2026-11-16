export function hashString(value) {
  const text = String(value ?? '');
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function coverGradientIndex(seed) {
  return hashString(seed) % 6;
}

export function courseInitial(name) {
  const letter = String(name ?? '').trim().charAt(0).toUpperCase();
  return letter || 'N';
}

export function teacherName(course) {
  const value = course?.teacher_username || course?.teacher_display_name || '';
  return typeof value === 'string' ? value.trim() : '';
}

export function lessonCount(course) {
  const count = course?.lesson_count;
  if (typeof count === 'number' && Number.isFinite(count)) return Math.max(0, Math.trunc(count));
  if (Array.isArray(course?.lessons)) return course.lessons.length;
  return null;
}
