import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { listEnrollments } from '../../api/student.js';
import CourseCard from '../../components/patterns/CourseCard.jsx';
import CourseCover from '../../components/patterns/CourseCover.jsx';
import CourseGrid from '../../components/patterns/CourseGrid.jsx';
import Button from '../../components/primitives/Button.jsx';
import Input from '../../components/primitives/Input.jsx';
import { filterCourses } from '../../utils/filterCourses.js';
import { readOpenedCourse } from '../../utils/lastCourse.js';
import { teacherName } from '../../utils/courseVisuals.js';

function isTypingTarget(target) {
  if (!target || typeof target !== 'object') return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return Boolean(target.isContentEditable);
}

export default function StudentHomePage() {
  const { profile } = useAuth();
  const searchRef = useRef(null);
  const [query, setQuery] = useState('');
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastId, setLastId] = useState(() => readOpenedCourse());

  useEffect(() => {
    let cancelled = false;
    listEnrollments()
      .then((enrolled) => {
        if (!cancelled) setEnrollments(Array.isArray(enrolled) ? enrolled : []);
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

  useEffect(() => {
    function onKey(event) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    function onFocus() {
      setLastId(readOpenedCourse());
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const myLearning = filterCourses(enrollments, query);
  const searching = query.trim().length > 0;
  const resume = lastId
    ? enrollments.find((course) => String(course.id) === String(lastId))
    : null;
  const name = profile?.username || 'there';

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Welcome back, {name}</h1>
        <p className="page-context">Search the courses assigned to you.</p>
      </header>
      <Input
        search
        shortcut
        hideLabel
        label="Search courses"
        type="search"
        placeholder="Search by course or teacher"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        inputRef={searchRef}
        autoComplete="off"
      />
      {error ? <p className="alert" role="alert"><span className="badge-dot" aria-hidden="true" /><span>{error}</span></p> : null}
      {!error && resume && !searching ? (
        <section className="continue-hero">
          <CourseCover course={resume} size="hero" priority />
          <div className="continue-hero-copy">
            <p className="kicker">Continue learning</p>
            <h2>{resume.name}</h2>
            {teacherName(resume) ? <p className="muted">Taught by {teacherName(resume)}</p> : null}
            <Button to={`/courses/${resume.id}`} arrow>Resume</Button>
          </div>
        </section>
      ) : null}
      {!error ? (
        <section className="page-section" id="my-learning">
          <h2 className="section-title">My learning</h2>
          <CourseGrid
            courses={myLearning}
            loading={loading}
            emptyTitle={searching ? 'No courses match your search.' : 'No course has been assigned to you.'}
            emptySubtitle={searching ? 'Try another name or teacher.' : undefined}
            renderCourse={(course) => (
              <CourseCard course={course} mode="student-enrolled" />
            )}
          />
        </section>
      ) : null}
    </>
  );
}
