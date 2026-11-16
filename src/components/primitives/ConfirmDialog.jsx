import { useEffect, useState } from 'react';
import Button from './Button.jsx';
import Dialog from './Dialog.jsx';
import Input from './Input.jsx';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  matchText = '',
  busy = false,
  onConfirm,
  onClose,
}) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (open) setTyped('');
  }, [open, matchText]);

  const matched = matchText ? typed === matchText : true;

  return (
    <Dialog open={open} title={title} onClose={busy ? undefined : onClose}>
      {description ? <p className="dialog-copy">{description}</p> : null}
      {matchText ? (
        <Input
          label={`Type “${matchText}” to confirm`}
          value={typed}
          autoComplete="off"
          onChange={(event) => setTyped(event.target.value)}
        />
      ) : null}
      <div className="dialog-actions">
        <Button variant="secondary" disabled={busy} onClick={onClose}>{cancelLabel}</Button>
        <Button
          variant={tone === 'danger' ? 'danger-solid' : 'primary'}
          disabled={!matched}
          loading={busy}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
