import { useEffect, useRef, useState } from 'react';
import { deleteCourse, listCourses, updateCourse } from '../api/teacher.js';
import CourseCard from '../components/CourseCard.jsx';
import CourseForm from '../components/CourseForm.jsx';

export default function TeacherHomePage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState({ id: null, message: '' });
  const busyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    listCourses()
      .then((data) => {
        if (!cancelled) setCourses(Array.isArray(data) ? data : []);
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

  function onCreated(course) {
    setCourses((current) => [course, ...current.filter((item) => item.id !== course.id)]);
  }

  async function onToggle(course) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyId(course.id);
    setActionError({ id: null, message: '' });
    const status = course.status === 'active' ? 'inactive' : 'active';
    try {
      const updated = await updateCourse(course.id, { status });
      setCourses((current) => current.map((item) => (
        item.id === course.id ? { ...item, ...updated } : item
      )));
    } catch (err) {
      setActionError({ id: course.id, message: err.message || 'Could not update the course' });
    } finally {
      busyRef.current = false;
      setBusyId(null);
    }
  }

  async function onDelete(course) {
    if (!window.confirm(`Delete "${course.name}"?`)) return;
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyId(course.id);
    setActionError({ id: null, message: '' });
    try {
      await deleteCourse(course.id);
      setCourses((current) => current.filter((item) => item.id !== course.id));
    } catch (err) {
      setActionError({ id: course.id, message: err.message || 'Could not delete the course' });
    } finally {
      busyRef.current = false;
      setBusyId(null);
    }
  }

  return (
    <>
      <h1>Courses</h1>
      <CourseForm onCreated={onCreated} />
      {loading ? <p className="muted">Loading…</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {!loading && !error && courses.length === 0 ? (
        <p className="muted empty-copy">You have not created a course yet.</p>
      ) : null}
      <div className="course-list">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            mode="teacher"
            busy={busyId === course.id}
            disabled={busyId !== null}
            onToggle={onToggle}
            onDelete={onDelete}
            error={actionError.id === course.id ? actionError.message : ''}
          />
        ))}
      </div>
    </>
  );
}
