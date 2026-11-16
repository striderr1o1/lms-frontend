import { useEffect, useState } from 'react';
import { listCourses } from '../../api/teacher.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import CourseCard from '../../components/patterns/CourseCard.jsx';
import CourseGrid from '../../components/patterns/CourseGrid.jsx';

export default function TeacherHomePage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <>
      <PageHeader title="Courses" />
      {error ? <p className="alert" role="alert"><span className="badge-dot" aria-hidden="true" /><span>{error}</span></p> : null}
      {!error ? (
        <div className="page-section">
          <CourseGrid
            courses={courses}
            loading={loading}
            emptyTitle="No course has been assigned to you."
            renderCourse={(course) => (
              <CourseCard course={course} mode="teacher" />
            )}
          />
        </div>
      ) : null}
    </>
  );
}
