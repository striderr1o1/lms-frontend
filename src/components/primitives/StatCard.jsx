import CountUp from './CountUp.jsx';

export default function StatCard({ label, value, icon, hint }) {
  return (
    <article className="stat-card">
      <div className="stat-card-head">
        <span className="kpi-label">{label}</span>
        {icon ? <span className="stat-icon" aria-hidden="true">{icon}</span> : null}
      </div>
      <strong className="kpi-value tabular">
        {typeof value === 'number' ? <CountUp value={value} /> : value}
      </strong>
      {hint ? <p className="muted stat-hint">{hint}</p> : null}
    </article>
  );
}
