import { useEffect, useId, useMemo, useRef, useState } from 'react';

export default function Combobox({
  label,
  options,
  value,
  onChange,
  multiple = false,
  placeholder = 'Search',
  disabled = false,
  emptyLabel = 'No matches',
}) {
  const generatedId = useId();
  const listId = `${generatedId}-list`;
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedValues = multiple ? (Array.isArray(value) ? value : []) : [];
  const selectedSingle = multiple ? '' : String(value ?? '');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return options.filter((option) => {
      if (multiple && selectedValues.includes(option.value)) return false;
      if (!needle) return true;
      return option.label.toLowerCase().includes(needle);
    });
  }, [options, query, multiple, selectedValues]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    function onDoc(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function choose(option) {
    if (!option) return;
    if (multiple) {
      onChange([...selectedValues, option.value]);
      setQuery('');
    } else {
      onChange(option.value);
      setQuery('');
      setOpen(false);
    }
  }

  function remove(optionValue) {
    onChange(selectedValues.filter((item) => item !== optionValue));
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, Math.max(filtered.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      if (!open) return;
      event.preventDefault();
      choose(filtered[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    } else if (event.key === 'Backspace' && multiple && !query && selectedValues.length) {
      onChange(selectedValues.slice(0, -1));
    }
  }

  const selectedOption = options.find((option) => option.value === selectedSingle);
  const activeId = filtered[activeIndex] ? `${generatedId}-opt-${filtered[activeIndex].value}` : undefined;

  return (
    <div className="combobox" ref={rootRef}>
      <span className="field-label" id={`${generatedId}-label`}>{label}</span>
      {multiple && selectedValues.length ? (
        <div className="pill-row combobox-chips">
          {selectedValues.map((optionValue) => {
            const option = options.find((item) => item.value === optionValue);
            const name = option?.label || optionValue;
            return (
              <span className="pill" key={optionValue}>
                {name}
                <button
                  type="button"
                  className="chip-remove"
                  aria-label={`Remove ${name}`}
                  disabled={disabled}
                  onClick={() => remove(optionValue)}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      ) : null}
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open ? activeId : undefined}
        aria-labelledby={`${generatedId}-label`}
        placeholder={multiple ? placeholder : (selectedOption?.label || placeholder)}
        value={query}
        disabled={disabled}
        autoComplete="off"
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open ? (
        <ul className="combobox-list" id={listId} role="listbox" aria-multiselectable={multiple || undefined}>
          {filtered.length ? filtered.map((option, index) => {
            const selected = !multiple && option.value === selectedSingle;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  id={`${generatedId}-opt-${option.value}`}
                  role="option"
                  aria-selected={selected || (multiple && selectedValues.includes(option.value))}
                  className={index === activeIndex ? 'combobox-option is-active' : 'combobox-option'}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(option)}
                >
                  {option.label}
                </button>
              </li>
            );
          }) : <li className="combobox-empty">{emptyLabel}</li>}
        </ul>
      ) : null}
    </div>
  );
}
