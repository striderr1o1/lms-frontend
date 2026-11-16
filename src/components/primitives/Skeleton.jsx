function Bone({ className = '' }) {
  return <span className={['skeleton-bone', className].filter(Boolean).join(' ')} />;
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <Bone className="skeleton-mast" />
      <div className="skeleton-body">
        <Bone className="skeleton-line skeleton-line-lg" />
        <Bone className="skeleton-line" />
        <Bone className="skeleton-line skeleton-line-sm" />
      </div>
    </div>
  );
}

export function SkeletonSyllabus() {
  return (
    <div className="skeleton-syllabus" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <Bone key={index} className="skeleton-row" />
      ))}
    </div>
  );
}

export function SkeletonKpi() {
  return (
    <div className="skeleton-kpi" aria-hidden="true">
      <Bone className="skeleton-line skeleton-line-sm" />
      <Bone className="skeleton-line skeleton-line-lg" />
    </div>
  );
}

export default function Skeleton({ variant = 'card' }) {
  if (variant === 'syllabus') return <SkeletonSyllabus />;
  if (variant === 'kpi') return <SkeletonKpi />;
  return <SkeletonCard />;
}
