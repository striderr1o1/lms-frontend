import { Link } from 'react-router-dom';
import { lessonCount, teacherName } from '../../utils/courseVisuals.js';
import Badge, { statusLabel, statusTone } from '../primitives/Badge.jsx';
import Button from '../primitives/Button.jsx';
import Avatar from '../primitives/Avatar.jsx';
import CourseCover from './CourseCover.jsx';

function lessonLabel(count) {
  if (count == null) return null;
  return `${count} ${count === 1 ? 'Lesson' : 'Lessons'}`;
}

export default function CourseCard({ course, mode }) {
  const teacher = teacherName(course);
  const count = lessonCount(course);
  const lessons = lessonLabel(count);
  const studentPath = `/courses/${course.id}`;
  const teacherPath = `/teacher/courses/${course.id}`;

  if (mode === 'teacher') {
    const label = statusLabel(course.status);
    return (
      <article className="course-card">
        <Link to={teacherPath} className="course-cover-link" tabIndex={-1} aria-hidden="true">
          <CourseCover course={course} size="card" />
        </Link>
        <div className="course-card-body">
          <h3 className="card-title">
            <Link to={teacherPath}>{course.name}</Link>
          </h3>
          {lessons ? <p className="card-meta">{lessons}</p> : null}
          {label ? <div className="card-status"><Badge tone={statusTone(course.status)}>{label}</Badge></div> : null}
          <div className="card-actions">
            <Button variant="secondary" to={teacherPath}>Open</Button>
          </div>
        </div>
      </article>
    );
  }

  const quiet = count === 0;
  return (
    <article className="course-card">
      <Link to={studentPath} className="course-cover-link" tabIndex={-1} aria-hidden="true">
        <CourseCover course={course} size="card" />
      </Link>
      <div className="course-card-body">
        <h3 className="card-title">
          <Link to={studentPath}>{course.name}</Link>
        </h3>
        {teacher ? (
          <p className="card-teacher">
            <Avatar name={teacher} size="sm" />
            <span>{teacher}</span>
          </p>
        ) : null}
        {lessons ? <p className="card-meta">{lessons}</p> : null}
        <div className="card-actions">
          {quiet ? (
            <span className="lesson-chip" aria-disabled="true">No lessons yet</span>
          ) : (
            <Button to={studentPath} arrow>Continue</Button>
          )}
        </div>
      </div>
    </article>
  );
}
