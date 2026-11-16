import { useEffect, useRef, useState } from 'react';
import Avatar from '../primitives/Avatar.jsx';
import Badge from '../primitives/Badge.jsx';

function roleLabel(role) {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function AvatarMenu({ name, role, onLogout }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onDoc(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="avatar-menu" ref={rootRef}>
      <button
        type="button"
        className="avatar-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${name || 'user'}`}
        onClick={() => setOpen((current) => !current)}
      >
        <Avatar name={name} />
      </button>
      {open ? (
        <div className="avatar-menu-panel" role="menu">
          <p className="avatar-menu-name">{name}</p>
          {role ? <Badge tone="role">{roleLabel(role)}</Badge> : null}
          <button
            type="button"
            role="menuitem"
            className="button button-secondary avatar-logout"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
