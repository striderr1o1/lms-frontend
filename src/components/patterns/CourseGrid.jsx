import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../utils/motion.js';
import EmptyState from '../primitives/EmptyState.jsx';
import { SkeletonCard } from '../primitives/Skeleton.jsx';

export default function CourseGrid({
  courses,
  loading = false,
  emptyTitle,
  emptySubtitle,
  renderCourse,
}) {
  const reduced = usePrefersReducedMotion();
  const gridRef = useRef(null);
  const rectsRef = useRef(new Map());
  const previousRef = useRef([]);
  const [ghosts, setGhosts] = useState([]);
  const signature = courses.map((course) => String(course.id)).join('|');

  useLayoutEffect(() => {
    if (loading) return undefined;
    const grid = gridRef.current;
    if (!grid) return undefined;

    const previous = previousRef.current;
    const nextIds = new Set(courses.map((course) => String(course.id)));
    if (!reduced) {
      const gridRect = grid.getBoundingClientRect();
      const removed = previous.filter((course) => !nextIds.has(String(course.id)));
      const nextGhosts = [];
      removed.forEach((course) => {
        const rect = rectsRef.current.get(String(course.id));
        if (!rect) return;
        nextGhosts.push({
          id: String(course.id),
          course,
          style: {
            position: 'absolute',
            left: `${rect.left - gridRect.left}px`,
            top: `${rect.top - gridRect.top}px`,
            width: `${rect.width}px`,
          },
        });
      });
      if (nextGhosts.length) setGhosts(nextGhosts);

      grid.querySelectorAll('[data-course-id]').forEach((node) => {
        const prev = rectsRef.current.get(node.dataset.courseId);
        if (!prev) return;
        const next = node.getBoundingClientRect();
        const dx = prev.left - next.left;
        const dy = prev.top - next.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        node.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
          { duration: 240, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        );
      });
    }

    const nextRects = new Map();
    grid.querySelectorAll('[data-course-id]').forEach((node) => {
      nextRects.set(node.dataset.courseId, node.getBoundingClientRect());
    });
    rectsRef.current = nextRects;
    previousRef.current = courses;
    return undefined;
  }, [courses, loading, reduced, signature]);

  useEffect(() => {
    if (!ghosts.length || reduced) return undefined;
    const timer = window.setTimeout(() => setGhosts([]), 180);
    return () => window.clearTimeout(timer);
  }, [ghosts, reduced]);

  if (loading) {
    return (
      <div>
        <p className="muted">Loading…</p>
        <div className="course-grid" aria-hidden="true">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!courses.length) {
    return <EmptyState title={emptyTitle} subtitle={emptySubtitle} />;
  }

  return (
    <div className="course-grid" ref={gridRef}>
      {courses.map((course) => (
        <div key={course.id} className="course-grid-item" data-course-id={String(course.id)}>
          {renderCourse(course)}
        </div>
      ))}
      {ghosts.map((ghost) => (
        <div key={`leaving-${ghost.id}`} className="course-grid-ghost" style={ghost.style} inert="" aria-hidden="true">
          {renderCourse(ghost.course)}
        </div>
      ))}
    </div>
  );
}
