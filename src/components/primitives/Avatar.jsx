import { courseInitial } from '../../utils/courseVisuals.js';

export default function Avatar({ name, size = 'md' }) {
  const label = typeof name === 'string' ? name.trim() : '';
  return (
    <span className={`avatar avatar-${size}`} aria-hidden={label ? undefined : true} title={label || undefined}>
      {courseInitial(label)}
    </span>
  );
}
