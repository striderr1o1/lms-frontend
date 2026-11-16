export function filterCourses(courses, query) {
  const list = Array.isArray(courses) ? courses : [];
  const needle = String(query ?? '').trim().toLowerCase();
  if (!needle) return list;
  return list.filter((course) => {
    const name = String(course?.name ?? '').toLowerCase();
    const teacher = String(course?.teacher_username ?? course?.teacher_display_name ?? '').toLowerCase();
    return name.includes(needle) || teacher.includes(needle);
  });
}
