import { Link } from 'react-router-dom';

export default function PageHeader({
  backTo,
  backLabel,
  title,
  context,
  facts,
  action,
  children,
}) {
  return (
    <header className="page-header">
      {backTo ? (
        <Link className="back-link" to={backTo}>{backLabel}</Link>
      ) : null}
      <div className="page-header-row">
        <div className="page-header-copy">
          {typeof title === 'string' || typeof title === 'number' ? (
            <h1 className="page-title">{title}</h1>
          ) : title}
          {context ? <p className="page-context">{context}</p> : null}
          {facts ? <div className="fact-row">{facts}</div> : null}
        </div>
        {action ? <div className="page-header-action">{action}</div> : null}
      </div>
      {children}
    </header>
  );
}
