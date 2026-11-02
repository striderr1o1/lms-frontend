import { Link } from 'react-router-dom';

function lessonLabel(count) {
  const value = Number(count) || 0;
  return `${value} ${value === 1 ? 'lesson' : 'lessons'}`;
}

export default function CourseCard({
  course,
  mode,
  busy = false,
  disabled = false,
  onToggle,
  onDelete,
  onEnroll,
  error = '',
}) {
  const locked = disabled || busy;
  const openTo = mode === 'teacher'
    ? `/teacher/courses/${course.id}`
    : `/student/courses/${course.id}`;
  const showOpen = mode === 'teacher' || mode === 'enrolled' || Boolean(course.enrolled);

  return (
    <article className="card">
      <h3>{course.name}</h3>
      <p className="muted">
        {mode !== 'teacher' && course.teacher_username ? `${course.teacher_username} · ` : null}
        {lessonLabel(course.lesson_count)}
        {' · '}
        <span className={`status status-${course.status}`}>{course.status}</span>
      </p>
      <div className="card-actions">
        {showOpen ? (
          <Link className="button secondary" to={openTo}>Open</Link>
        ) : null}
        {mode === 'catalog' && !course.enrolled ? (
          <button type="button" disabled={locked} onClick={() => onEnroll(course)}>
            {busy ? 'Enrolling…' : 'Enroll'}
          </button>
        ) : null}
        {mode === 'teacher' ? (
          <>
            <button
              type="button"
              className="secondary"
              disabled={locked}
              onClick={() => onToggle(course)}
            >
              {course.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
            <button
              type="button"
              className="danger"
              disabled={locked}
              onClick={() => onDelete(course)}
            >
              Delete
            </button>
          </>
        ) : null}
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </article>
  );
}
