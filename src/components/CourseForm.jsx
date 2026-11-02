import { useRef, useState } from 'react';
import { createCourse } from '../api/teacher.js';

export default function CourseForm({ onCreated }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  async function onSubmit(event) {
    event.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      const course = await createCourse(name.trim());
      setName('');
      onCreated(course);
    } catch (err) {
      setError(err.message || 'Could not create the course');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <form className="panel stack" onSubmit={onSubmit}>
      <label>
        Course name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={120}
          required
        />
      </label>
      <button type="submit" disabled={busy}>
        {busy ? 'Creating…' : 'Create course'}
      </button>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </form>
  );
}
