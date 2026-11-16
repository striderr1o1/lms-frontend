import { useState } from 'react';
import { Link } from 'react-router-dom';

function ArrowIcon() {
  return (
    <svg className="button-arrow" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return <span className="button-spinner" aria-hidden="true" />;
}

export default function Button({
  variant = 'primary',
  type = 'button',
  to,
  children,
  arrow = false,
  confirm = false,
  confirmLabel = 'Confirm Delete?',
  onConfirm,
  onClick,
  disabled = false,
  loading = false,
  className = '',
  ...rest
}) {
  const [armed, setArmed] = useState(false);
  const classes = ['button', `button-${variant}`, className].filter(Boolean).join(' ');
  const isDisabled = disabled || loading;
  const content = (
    <>
      {loading ? <Spinner /> : null}
      {children}
      {arrow && !loading ? <ArrowIcon /> : null}
    </>
  );

  if (confirm && armed) {
    return (
      <span className="confirm-pair">
        <button
          type="button"
          className="button button-danger button-danger-solid"
          disabled={isDisabled}
          onClick={() => {
            setArmed(false);
            onConfirm?.();
          }}
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          className="button button-secondary"
          disabled={isDisabled}
          onClick={() => setArmed(false)}
        >
          Cancel
        </button>
      </span>
    );
  }

  if (to) {
    return (
      <Link to={to} className={classes} aria-disabled={isDisabled || undefined} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onClick={(event) => {
        if (confirm) {
          setArmed(true);
          return;
        }
        onClick?.(event);
      }}
      {...rest}
    >
      {content}
    </button>
  );
}
