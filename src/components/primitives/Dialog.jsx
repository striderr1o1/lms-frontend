import { useEffect, useId, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not(:disabled), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function Dialog({
  open,
  title,
  onClose,
  children,
  labelledBy,
  className = '',
}) {
  const titleId = useId();
  const panelRef = useRef(null);
  const lastFocus = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    lastFocus.current = document.activeElement;
    const panel = panelRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = panel ? [...panel.querySelectorAll(FOCUSABLE)] : [];
    (focusable[0] || panel)?.focus();

    function onKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const items = [...panel.querySelectorAll(FOCUSABLE)];
      if (!items.length) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      if (lastFocus.current && typeof lastFocus.current.focus === 'function') {
        lastFocus.current.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="dialog-root">
      <button type="button" className="dialog-backdrop" aria-label="Close dialog" onClick={onClose} />
      <div
        ref={panelRef}
        className={['dialog-panel', className].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || titleId}
        tabIndex={-1}
      >
        {title ? <h2 className="dialog-title" id={titleId}>{title}</h2> : null}
        {children}
      </div>
    </div>
  );
}
