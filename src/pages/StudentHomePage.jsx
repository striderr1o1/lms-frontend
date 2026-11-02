import { useEffect, useRef, useState } from 'react';
import { enroll, listCourses, listEnrollments } from '../api/student.js';
import CourseCard from '../components/CourseCard.jsx';

export default function StudentHomePage() {
  const [enrollments, setEnrollments] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [enrollError, setEnrollError] = useState({ id: null, message: '' });
  const busyRef = useRef(false);

  async function load() {
    const [enrolled, courses] = await Promise.all([listEnrollments(), listCourses()]);
    setEnrollments(Array.isArray(enrolled) ? enrolled : []);
    setCatalog(Array.isArray(courses) ? courses : []);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([listEnrollments(), listCourses()])
      .then(([enrolled, courses]) => {
        if (cancelled) return;
        setEnrollments(Array.isArray(enrolled) ? enrolled : []);
        setCatalog(Array.isArray(courses) ? courses : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load courses');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onEnroll(course) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyId(course.id);
    setEnrollError({ id: null, message: '' });
    try {
      await enroll(course.id);
      await load();
    } catch (err) {
      setEnrollError({ id: course.id, message: err.message || 'Could not enroll' });
    } finally {
      busyRef.current = false;
      setBusyId(null);
    }
  }

  return (
    <>
      <h1>Your courses</h1>
      {loading ? <p className="muted">Loading…</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {!loading && !error && enrollments.length === 0 ? (
        <p className="muted">You are not enrolled in any courses.</p>
      ) : null}
      <div className="course-list">
        {enrollments.map((course) => (
          <CourseCard key={course.id} course={course} mode="enrolled" />
        ))}
      </div>

      <h2>Catalog</h2>
      {!loading && !error && catalog.length === 0 ? (
        <p className="muted">No courses are available.</p>
      ) : null}
      <div className="course-list">
        {catalog.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            mode="catalog"
            busy={busyId === course.id}
            disabled={busyId !== null}
            onEnroll={onEnroll}
            error={enrollError.id === course.id ? enrollError.message : ''}
          />
        ))}
      </div>
    </>
  );
}
