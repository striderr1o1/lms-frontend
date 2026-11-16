import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { withUnsplashUtm } from '../../api/covers.js';
import { getCourse } from '../../api/student.js';
import MarkdownReader from '../../components/patterns/MarkdownReader.jsx';
import CourseCover from '../../components/patterns/CourseCover.jsx';
import SyllabusSplitView from '../../components/patterns/SyllabusSplitView.jsx';
import VideoStage from '../../components/patterns/VideoStage.jsx';
import Badge, { statusLabel, statusTone } from '../../components/primitives/Badge.jsx';
import Button from '../../components/primitives/Button.jsx';
import EmptyState from '../../components/primitives/EmptyState.jsx';
import { SkeletonCard, SkeletonSyllabus } from '../../components/primitives/Skeleton.jsx';
import { rememberOpenedCourse } from '../../utils/lastCourse.js';
import { prefersReducedMotion } from '../../utils/motion.js';

function sortLessons(lessons) {
  return [...(Array.isArray(lessons) ? lessons : [])].sort(
    (left, right) => left.lesson_number - right.lesson_number,
  );
}

function isTypingTarget(target) {
  if (!target || typeof target !== 'object') return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return Boolean(target.isContentEditable);
}

export default function StudentCoursePage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setCourse(null);
    setSelectedId(null);
    setError('');
    getCourse(id)
      .then((data) => {
        if (cancelled) return;
        const lessons = sortLessons(data?.lessons);
        setCourse({ ...data, lessons });
        setSelectedId(lessons[0]?.id ?? null);
        rememberOpenedCourse(data?.id ?? id);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not open this course');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    function onKey(event) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (event.key === '[') {
        event.preventDefault();
        setCollapsed((current) => !current);
        return;
      }
      if (!course?.lessons?.length) return;
      if (event.key !== 'j' && event.key !== 'k') return;
      event.preventDefault();
      setSelectedId((current) => {
        const lessons = course.lessons;
        const index = lessons.findIndex((lesson) => lesson.id === current);
        if (event.key === 'j') return lessons[Math.min(index + 1, lessons.length - 1)]?.id ?? current;
        return lessons[Math.max(index - 1, 0)]?.id ?? current;
      });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [course]);

  if (error) {
    return (
      <>
        <Link className="back-link" to="/courses">← Back to courses</Link>
        <p className="alert" role="alert"><span className="badge-dot" aria-hidden="true" /><span>{error}</span></p>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Link className="back-link" to="/courses">← Back to courses</Link>
        <p className="muted">Loading…</p>
        <SkeletonCard />
        <SkeletonSyllabus />
      </>
    );
  }

  const lessons = course.lessons;
  const selected = lessons.find((lesson) => lesson.id === selectedId) ?? null;
  const selectedIndex = selected ? lessons.findIndex((lesson) => lesson.id === selected.id) : -1;
  const teacher = typeof course.teacher_username === 'string' ? course.teacher_username.trim() : '';
  const status = statusLabel(course.status);
  const cover = course.cover;
  const showCredit = cover?.source === 'unsplash' && (cover.credit_name || cover.image_url);

  function onContinue() {
    const stage = document.getElementById('lesson-stage');
    if (!stage) return;
    stage.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
    stage.focus({ preventScroll: true });
  }

  function selectOffset(step) {
    if (selectedIndex < 0) return;
    const next = lessons[selectedIndex + step];
    if (next) setSelectedId(next.id);
  }

  let workspace = (
    <EmptyState
      title="This course has no lessons yet."
      subtitle="Lessons will show up here when the teacher adds them."
    />
  );
  if (selected) {
    const hasNotes = Boolean(selected.body && selected.body.trim());
    const hasVideo = Boolean(selected.playback_id || selected.youtube_video_id);
    workspace = (
      <>
        <h2 className="lesson-title">
          <span className="lesson-kicker tabular">{String(selected.lesson_number).padStart(2, '0')}</span>
          {selected.title}
        </h2>
        <VideoStage lesson={selected} />
        <div className="lesson-nav">
          <Button variant="secondary" disabled={selectedIndex <= 0} onClick={() => selectOffset(-1)}>Previous</Button>
          <Button variant="secondary" disabled={selectedIndex >= lessons.length - 1} onClick={() => selectOffset(1)}>Next</Button>
        </div>
        {hasNotes ? <MarkdownReader markdown={selected.body} /> : null}
        {!hasNotes && !hasVideo ? <p className="muted">This lesson has no notes yet.</p> : null}
      </>
    );
  }

  return (
    <>
      <Link className="back-link" to="/courses">← Back to courses</Link>
      <header className="course-hero">
        <div className="course-hero-bg" aria-hidden="true">
          <CourseCover course={course} size="hero" priority />
        </div>
        <div className="course-hero-scrim" aria-hidden="true" />
        <div className="course-hero-content">
          <h1 className="page-title">{course.name}</h1>
          {teacher ? <p className="course-hero-teacher">Taught by {teacher}.</p> : null}
          <div className="fact-row course-hero-facts">
            <span className="tabular">{lessons.length} Lessons</span>
            {status ? <Badge tone={statusTone(course.status)}>{status}</Badge> : null}
            <Badge tone="enrolled">Enrolled</Badge>
          </div>
          {selected ? <Button arrow onClick={onContinue}>Continue</Button> : null}
          {showCredit ? (
            <p className="unsplash-credit">
              Photo by{' '}
              <a href={withUnsplashUtm(cover.credit_url)} target="_blank" rel="noreferrer">
                {cover.credit_name || 'the photographer'}
              </a>
              {' '}on{' '}
              <a href={withUnsplashUtm('https://unsplash.com/')} target="_blank" rel="noreferrer">Unsplash</a>
            </p>
          ) : null}
        </div>
      </header>
      <SyllabusSplitView
        lessons={lessons}
        activeId={selected?.id ?? null}
        onSelect={setSelectedId}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
        playerFirst
        workspace={workspace}
      />
    </>
  );
}
