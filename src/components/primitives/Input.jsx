import { useId } from 'react';

function SearchIcon() {
  return (
    <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="7" cy="7" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.5 10.5 13.5 13.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function Input({
  label,
  hint,
  error,
  search = false,
  shortcut = false,
  hideLabel = false,
  id,
  inputRef,
  className = '',
  ...rest
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <label className={['field', className].filter(Boolean).join(' ')} htmlFor={inputId}>
      {label ? (
        <span className={hideLabel ? 'sr-only' : 'field-label'}>{label}</span>
      ) : null}
      <span className={search ? 'field-control is-search' : 'field-control'}>
        {search ? <SearchIcon /> : null}
        <input
          id={inputId}
          ref={inputRef}
          aria-describedby={describedBy}
          {...rest}
        />
        {shortcut ? <kbd className="kbd">/</kbd> : null}
      </span>
      {hint ? <span className="field-hint" id={hintId}>{hint}</span> : null}
      {error ? <span className="form-error" id={errorId} role="alert">{error}</span> : null}
    </label>
  );
}
