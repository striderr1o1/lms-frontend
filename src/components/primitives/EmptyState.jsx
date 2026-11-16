import CompassMark from '../brand/CompassMark.jsx';

export default function EmptyState({ title, subtitle, action }) {
  return (
    <div className="empty-state">
      <CompassMark className="compass compass-lg" />
      <h3 className="empty-title">{title}</h3>
      {subtitle ? <p className="muted">{subtitle}</p> : null}
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}
