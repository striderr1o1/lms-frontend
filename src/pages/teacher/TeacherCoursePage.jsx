import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCourse } from '../../api/teacher.js';
import LessonEditor from '../../components/LessonEditor.jsx';
import PageHeader from '../../components/layout/PageHeader.jsx';
import SyllabusSplitView from '../../components/patterns/SyllabusSplitView.jsx';
import Badge, { statusLabel, statusTone } from '../../components/primitives/Badge.jsx';
import Button from '../../components/primitives/Button.jsx';
import { SkeletonSyllabus } from '../../components/primitives/Skeleton.jsx';

function assignedStudents(course) {
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

function sortLessons(lessons) {
  return [...(Array.isArray(lessons) ? lessons : [])].sort(
    (left, right) => left.lesson_number - right.lesson_number,
  );
}

function mergeSavedLesson(data, saved) {
  if (!saved?.id) return data;
  const lessons = Array.isArray(data?.lessons) ? [...data.lessons] : [];
  const index = lessons.findIndex((lesson) => lesson.id === saved.id);
  if (index === -1) lessons.push(saved);
  else lessons[index] = { ...lessons[index], ...saved };
  return { ...data, lessons: sortLessons(lessons) };
}

export default function TeacherCoursePage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draftKey, setDraftKey] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  const loadCourse = useCallback(async () => {
    const data = await getCourse(id);
    const lessons = sortLessons(data?.lessons);
    const next = { ...data, lessons };
    setCourse(next);
    return next;
  }, [id]);

  useEffect(() => {
    function isTypingTarget(target) {
      if (!target || typeof target !== 'object') return false;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      return Boolean(target.isContentEditable);
    }
    function onKey(event) {
      if (event.key !== '[') return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      setCollapsed((current) => !current);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    setCourse(null);
    setSelectedId(null);
    getCourse(id)
      .then((data) => {
        if (cancelled) return;
        const lessons = sortLessons(data?.lessons);
        setCourse({ ...data, lessons });
        setSelectedId(lessons[0]?.id ?? null);
        setAdding(lessons.length === 0);
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

  async function onLessonSaved(saved) {
    try {
      const data = await loadCourse();
      const merged = mergeSavedLesson(data, saved);
      setCourse(merged);
      if (saved?.id) {
        setSelectedId(saved.id);
        setAdding(false);
      }
      setLoadError('');
    } catch (err) {
      setLoadError(err.message || 'Could not refresh lessons');
    }
  }

  async function onLessonDeleted() {
    try {
      const data = await loadCourse();
      const lessons = data?.lessons ?? [];
      setSelectedId(lessons[0]?.id ?? null);
      setAdding(lessons.length === 0);
      setLoadError('');
    } catch (err) {
      setLoadError(err.message || 'Could not refresh lessons');
    }
  }

  function onAdd() {
    setAdding(true);
    setSelectedId(null);
    setDraftKey((key) => key + 1);
  }

  if (loading) {
    return (
      <>
        <p className="muted">Loading…</p>
        <SkeletonSyllabus />
      </>
    );
  }

  if (loadError && !course) {
    return (
      <>
        <Link className="back-link" to="/teacher">← Back to courses</Link>
        <p className="alert" role="alert"><span className="badge-dot" aria-hidden="true" /><span>{loadError}</span></p>
      </>
    );
  }

  if (!course) return null;

  const lessons = course.lessons ?? [];
  const assigned = assignedStudents(course);
  const selected = lessons.find((lesson) => lesson.id === selectedId) ?? null;
  const showDraft = adding || !selected;
  const status = statusLabel(course.status);

  return (
    <>
      <PageHeader
        backTo="/teacher"
        backLabel="← Back to courses"
        title={course.name}
        facts={(
          <>
            {status ? <Badge tone={statusTone(course.status)}>{status}</Badge> : null}
            <span className="tabular">{lessons.length} Lessons</span>
          </>
        )}
      />
      {loadError ? <p className="alert" role="alert"><span className="badge-dot" aria-hidden="true" /><span>{loadError}</span></p> : null}
      <section className="page-section">
        <h2 className="section-title">Students</h2>
        {assigned.length ? (
          <div className="pill-row">
            {assigned.map((student) => (
              <span className="pill" key={student.id}>{student.username}</span>
            ))}
          </div>
        ) : (
          <p className="muted">An admin assigns students to this course.</p>
        )}
      </section>
      <SyllabusSplitView
        lessons={lessons}
        activeId={showDraft ? null : selected.id}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
        onSelect={(lessonId) => {
          setAdding(false);
          setSelectedId(lessonId);
        }}
        railAction={(
          <Button className="syllabus-add" aria-pressed={showDraft} onClick={onAdd}>
            + Add Lesson
          </Button>
        )}
        workspace={(
          <LessonEditor
            key={showDraft ? `new-${draftKey}` : selected.id}
            courseId={id}
            lesson={showDraft ? undefined : selected}
            onSaved={onLessonSaved}
            onDeleted={onLessonDeleted}
          />
        )}
      />
    </>
  );
}
