const LAST_COURSE_KEY = 'ns_last_course';

export function rememberOpenedCourse(id) {
  if (id == null) return;
  try {
    localStorage.setItem(LAST_COURSE_KEY, String(id));
  } catch {
    /* ignore private-mode storage failures */
  }
}

export function readOpenedCourse() {
  try {
    return localStorage.getItem(LAST_COURSE_KEY);
  } catch {
    return null;
  }
}
