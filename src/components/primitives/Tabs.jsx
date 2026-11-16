import { useId } from 'react';

export default function Tabs({ label, tabs, value, onChange }) {
  const baseId = useId();
  const current = tabs.some((tab) => tab.value === value) ? value : tabs[0]?.value;
  const index = Math.max(0, tabs.findIndex((tab) => tab.value === current));

  function select(next) {
    if (next) onChange(next);
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      select(tabs[(index + 1) % tabs.length]?.value);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      select(tabs[(index - 1 + tabs.length) % tabs.length]?.value);
    } else if (event.key === 'Home') {
      event.preventDefault();
      select(tabs[0]?.value);
    } else if (event.key === 'End') {
      event.preventDefault();
      select(tabs[tabs.length - 1]?.value);
    }
  }

  return (
    <div className="tabs">
      <div className="tablist" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
        {tabs.map((tab) => {
          const selected = tab.value === current;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.value}`}
              className={selected ? 'tab is-active' : 'tab'}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.value}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(tab.value)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.value}
          role="tabpanel"
          id={`${baseId}-panel-${tab.value}`}
          aria-labelledby={`${baseId}-tab-${tab.value}`}
          hidden={tab.value !== current}
          className="tab-panel"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
