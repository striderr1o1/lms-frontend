export function statusTone(status) {
  if (status === 'active') return 'active';
  if (status === 'inactive') return 'inactive';
  if (status === 'pending') return 'pending';
  return 'inactive';
}

export function statusLabel(status) {
  if (status === 'active') return 'Active';
  if (status === 'inactive') return 'Inactive';
  if (status === 'pending') return 'Pending';
  if (typeof status === 'string' && status.trim()) return status.trim();
  return '';
}

export default function Badge({ tone = 'inactive', children }) {
  return (
    <span className={`badge badge-${tone}`}>
      <span className="badge-dot" aria-hidden="true" />
      {children}
    </span>
  );
}
