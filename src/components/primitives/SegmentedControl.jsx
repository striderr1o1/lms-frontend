export default function SegmentedControl({
  label,
  value,
  onChange,
  options,
  className = '',
  disabled = false,
}) {
  const index = options.findIndex((option) => option.value === value);

  function move(step) {
    const current = index >= 0 ? index : 0;
    const next = options[(current + step + options.length) % options.length];
    if (next) onChange(next.value);
  }

  return (
    <div
      className={['segmented', className].filter(Boolean).join(' ')}
      role="radiogroup"
      aria-label={label}
      style={{ '--count': options.length }}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          move(1);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          move(-1);
        }
      }}
    >
      {index >= 0 ? (
        <span className="segmented-pill" style={{ '--index': index }} aria-hidden="true" />
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={selected ? 'segmented-option is-active' : 'segmented-option'}
            disabled={disabled}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
