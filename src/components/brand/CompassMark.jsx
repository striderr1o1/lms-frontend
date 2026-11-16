export default function CompassMark({ className = 'compass' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3.4 14.3 12 12 10.1 9.7 12 12 3.4Z" fill="currentColor" />
      <path d="M12 20.6 9.7 12 12 13.9 14.3 12 12 20.6Z" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

export function CompassSpinner({ label = 'Loading' }) {
  return (
    <span className="compass-spin" role="status">
      <CompassMark />
      <span className="sr-only">{label}</span>
    </span>
  );
}
