import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCourse } from '../api/student.js';
import LessonView from '../components/LessonView.jsx';

export default function StudentCoursePage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setCourse(null);
    setError('');
    getCourse(id)
      .then((data) => {
        if (!cancelled) setCourse(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not open this course');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <>
        <Link to="/student">Back to your courses</Link>
        <p className="form-error" role="alert">{error}</p>
      </>
    );
  }

  if (!course) return <p className="muted">Loading…</p>;

  const lessons = [...(course.lessons ?? [])].sort(
    (left, right) => left.lesson_number - right.lesson_number,
  );

  return (
    <>
      <Link to="/student">Back to your courses</Link>
      <h1>{course.name}</h1>
      <p className="muted">
        {course.teacher_username} · {course.status}
      </p>
      {lessons.length === 0 ? (
        <p className="muted">This course has no lessons yet.</p>
      ) : (
        lessons.map((lesson) => <LessonView key={lesson.id} lesson={lesson} />)
      )}
    </>
  );
}
