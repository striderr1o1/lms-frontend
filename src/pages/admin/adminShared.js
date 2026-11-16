export function normalizeTeachers(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((teacher) => {
    if (!teacher || typeof teacher !== 'object' || teacher.teacher_id == null) return [];
    const username = typeof teacher.username === 'string' ? teacher.username.trim() : '';
    if (!username) return [];
    return [{ teacher_id: String(teacher.teacher_id), username }];
  });
}

export function normalizeStudents(rows) {
  if (!Array.isArray(rows)) return [];
  const seen = new Set();
  return rows.flatMap((student) => {
    if (!student || typeof student !== 'object' || student.id == null) return [];
    const username = typeof student.username === 'string' ? student.username.trim() : '';
    if (!username) return [];
    const id = String(student.id);
    if (seen.has(id)) return [];
    seen.add(id);
    const email = typeof student.email === 'string' ? student.email.trim() : '';
    return [{ id, username, email }];
  });
}

export function rosterOf(course) {
  const rows = Array.isArray(course?.students) ? course.students : [];
  const seen = new Set();
  return rows.flatMap((student) => {
    if (!student || typeof student !== 'object' || student.id == null) return [];
    const username = typeof student.username === 'string' ? student.username.trim() : '';
    if (!username) return [];
    const id = String(student.id);
    if (seen.has(id)) return [];
    seen.add(id);
    return [{ id, username }];
  });
}

export function flattenCourses(overview) {
  const teachers = Array.isArray(overview?.teachers) ? overview.teachers : [];
  return teachers.flatMap((teacher) => {
    const courses = Array.isArray(teacher.courses) ? teacher.courses : [];
    return courses.map((course) => ({
      ...course,
      id: String(course.id),
      teacher_id: String(teacher.teacher_id),
      teacher_username: teacher.username,
    }));
  });
}
