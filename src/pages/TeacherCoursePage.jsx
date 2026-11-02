import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCourse, updateCourse } from '../api/teacher.js';
import LessonEditor from '../components/LessonEditor.jsx';

export default function TeacherCoursePage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [renameError, setRenameError] = useState('');
  const [busy, setBusy] = useState(false);
  const [draftKey, setDraftKey] = useState(0);
  const busyRef = useRef(false);

  const loadCourse = useCallback(async () => {
    const data = await getCourse(id);
    setCourse(data);
    setName(data.name ?? '');
    return data;
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    setCourse(null);
    getCourse(id)
      .then((data) => {
        if (cancelled) return;
        setCourse(data);
        setName(data.name ?? '');
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || 'Could not open this course');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function onRename(event) {
    event.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setRenameError('');
    try {
      const updated = await updateCourse(id, { name: name.trim() });
      setCourse((current) => ({
        ...current,
        ...updated,
        lessons: updated.lessons ?? current?.lessons ?? [],
      }));
      setName(updated.name ?? name.trim());
    } catch (err) {
      setRenameError(err.message || 'Could not rename the course');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function refreshLessons() {
    try {
      await loadCourse();
    } catch (err) {
      setLoadError(err.message || 'Could not refresh lessons');
    }
  }

  function onLessonCreated() {
    setDraftKey((key) => key + 1);
    refreshLessons();
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (loadError && !course) {
    return (
      <>
        <Link to="/teacher">Back to courses</Link>
        <p className="form-error" role="alert">{loadError}</p>
      </>
    );
  }
  if (!course) return null;

  const lessons = [...(course.lessons ?? [])].sort(
    (left, right) => left.lesson_number - right.lesson_number,
  );

  return (
    <>
      <Link to="/teacher">Back to courses</Link>
      <h1>{course.name}</h1>
      <form className="panel stack rename-form" onSubmit={onRename}>
        <label>
          Course name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={120}
            required
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Rename'}
        </button>
        {renameError ? <p className="form-error" role="alert">{renameError}</p> : null}
      </form>
      {loadError ? <p className="form-error" role="alert">{loadError}</p> : null}

      <h2>Lessons</h2>
      <LessonEditor key={draftKey} courseId={id} onSaved={onLessonCreated} />
      {lessons.length === 0 ? <p className="muted">No lessons yet.</p> : null}
      {lessons.map((lesson) => (
        <LessonEditor
          key={lesson.id}
          courseId={id}
          lesson={lesson}
          onSaved={refreshLessons}
          onDeleted={refreshLessons}
        />
      ))}
    </>
  );
}
