function hasVideo(lesson) {
  const blocks = Array.isArray(lesson?.blocks) ? lesson.blocks : [];
  return blocks.some((block) => (
    block?.kind === 'video' && Boolean(block.playback_id || block.youtube_video_id)
  ));
}

function MediaIcon({ video }) {
  if (video) {
    return (
      <svg className="syllabus-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6.5 6.2v3.6L10 8 6.5 6.2Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg className="syllabus-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 2.5h5.2L12.5 5.8V13.5H4V2.5Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 2.8V6h3.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function lessonIndex(number) {
  const value = Number(number);
  if (!Number.isFinite(value)) return '–';
  return String(Math.trunc(value)).padStart(2, '0');
}

export default function SyllabusItem({ lesson, active = false, onSelect, itemRef }) {
  const video = hasVideo(lesson);
  return (
    <button
      type="button"
      ref={itemRef}
      className={active ? 'syllabus-item is-active' : 'syllabus-item'}
      aria-current={active ? 'true' : undefined}
      onClick={onSelect}
    >
      <span className="syllabus-index tabular">{lessonIndex(lesson.lesson_number)}</span>
      <span className="syllabus-copy">
        <span className="syllabus-title">{lesson.title}</span>
        <span className="syllabus-kind">{video ? 'Video' : 'Notes'}</span>
      </span>
      <MediaIcon video={video} />
    </button>
  );
}
