import { useLayoutEffect, useRef, useState } from 'react';
import SyllabusItem from './SyllabusItem.jsx';

export default function SyllabusSplitView({
  lessons,
  activeId,
  onSelect,
  railAction,
  workspace,
  collapsed = false,
  onToggleCollapsed,
  playerFirst = false,
}) {
  const listRef = useRef(null);
  const activeRef = useRef(null);
  const [indicator, setIndicator] = useState({ top: 0, height: 0, visible: false });

  useLayoutEffect(() => {
    function measure() {
      const list = listRef.current;
      const active = activeRef.current;
      if (!list || !active) {
        setIndicator((current) => (current.visible ? { ...current, visible: false } : current));
        return;
      }
      const listRect = list.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      setIndicator({
        top: activeRect.top - listRect.top + list.scrollTop,
        height: activeRect.height,
        visible: true,
      });
    }

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeId, lessons, collapsed]);

  return (
    <div className={['syllabus-split', collapsed ? 'is-focus' : '', playerFirst ? 'is-player-first' : ''].filter(Boolean).join(' ')}>
      <div className="syllabus-rail-wrap">
        <aside className="syllabus-rail" aria-label="Syllabus">
          {railAction}
          <div className="syllabus-list" ref={listRef}>
            {indicator.visible ? (
              <span
                className="syllabus-indicator"
                style={{
                  transform: `translateY(${indicator.top}px)`,
                  height: `${indicator.height}px`,
                }}
                aria-hidden="true"
              />
            ) : null}
            {lessons.map((lesson) => (
              <SyllabusItem
                key={lesson.id}
                lesson={lesson}
                active={lesson.id === activeId}
                onSelect={() => onSelect(lesson.id)}
                itemRef={lesson.id === activeId ? activeRef : undefined}
              />
            ))}
          </div>
        </aside>
      </div>
      <div className="syllabus-workspace">
        {onToggleCollapsed ? (
          <div className="workspace-toolbar">
            <button
              type="button"
              className="button button-secondary"
              aria-pressed={collapsed}
              title={collapsed ? 'Show the syllabus' : 'Hide the syllabus'}
              onClick={onToggleCollapsed}
            >
              {collapsed ? 'Focus' : 'Theater'}
              <kbd className="kbd kbd-inline">[</kbd>
            </button>
          </div>
        ) : null}
        <div key={activeId ?? 'workspace'} className="workspace-enter" id="lesson-stage" tabIndex={-1}>
          {workspace}
        </div>
      </div>
    </div>
  );
}
