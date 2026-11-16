import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({
  label = 'Password',
  hint,
  error,
  id,
  value,
  onChange,
  autoComplete,
  required = false,
  disabled = false,
  name = 'password',
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [visible, setVisible] = useState(false);
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="field">
      <label className="field-label" htmlFor={inputId}>{label}</label>
      <span className="field-control">
        <input
          id={inputId}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={onChange}
        />
        <button
          type="button"
          className="button button-ghost password-toggle"
          aria-pressed={visible}
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </span>
      {hint ? <span className="field-hint" id={hintId}>{hint}</span> : null}
      {error ? <span className="form-error" id={errorId} role="alert">{error}</span> : null}
    </div>
  );
}
