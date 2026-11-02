import { useEffect, useRef, useState } from 'react';
import { approveAdmin, getOverview, listPendingAdmins } from '../api/admin.js';

export default function AdminPage() {
  const [overview, setOverview] = useState(null);
  const [pending, setPending] = useState([]);
  const [overviewError, setOverviewError] = useState('');
  const [pendingError, setPendingError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [approveError, setApproveError] = useState({ id: null, message: '' });
  const busyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getOverview(), listPendingAdmins()])
      .then(([overviewResult, pendingResult]) => {
        if (cancelled) return;
        if (overviewResult.status === 'fulfilled') {
          setOverview(overviewResult.value);
        } else {
          setOverviewError(overviewResult.reason?.message || 'Could not load the overview');
        }
        if (pendingResult.status === 'fulfilled') {
          const rows = pendingResult.value;
          setPending(Array.isArray(rows) ? rows : []);
        } else {
          setPendingError(pendingResult.reason?.message || 'Could not load pending admins');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onApprove(admin) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyId(admin.id);
    setApproveError({ id: null, message: '' });
    try {
      await approveAdmin(admin.id);
      setPending((current) => current.filter((item) => item.id !== admin.id));
    } catch (err) {
      setApproveError({ id: admin.id, message: err.message || 'Could not approve this admin' });
    } finally {
      busyRef.current = false;
      setBusyId(null);
    }
  }

  const teachers = Array.isArray(overview?.teachers) ? overview.teachers : [];

  return (
    <>
      <h1>Overview</h1>
      {loading ? <p className="muted">Loading…</p> : null}
      {overviewError ? <p className="form-error" role="alert">{overviewError}</p> : null}
      {overview ? (
        <div className="counts">
          <article className="card count">
            <span>Students</span>
            <strong>{overview.student_count}</strong>
          </article>
          <article className="card count">
            <span>Teachers</span>
            <strong>{overview.teacher_count}</strong>
          </article>
          <article className="card count">
            <span>Courses</span>
            <strong>{overview.course_count}</strong>
          </article>
        </div>
      ) : null}

      <h2>Teachers</h2>
      {!loading && !overviewError && teachers.length === 0 ? (
        <p className="muted">No teachers yet.</p>
      ) : null}
      <div className="course-list">
        {teachers.map((teacher) => (
          <section className="card" key={teacher.teacher_id}>
            <h3>{teacher.username}</h3>
            {Array.isArray(teacher.courses) && teacher.courses.length > 0 ? (
              teacher.courses.map((course) => (
                <div className="admin-course" key={course.id}>
                  <h4>
                    {course.name}{' '}
                    <span className="muted">({course.status})</span>
                  </h4>
                  {Array.isArray(course.students) && course.students.length > 0 ? (
                    <ul className="name-list">
                      {course.students.map((username) => (
                        <li key={username}>{username}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">No students enrolled.</p>
                  )}
                </div>
              ))
            ) : (
              <p className="muted">No courses.</p>
            )}
          </section>
        ))}
      </div>

      <h2>Pending admins</h2>
      {pendingError ? <p className="form-error" role="alert">{pendingError}</p> : null}
      {!loading && !pendingError && pending.length === 0 ? (
        <p className="muted">No admins are waiting for approval.</p>
      ) : null}
      <div className="course-list">
        {pending.map((admin) => (
          <article className="card" key={admin.id}>
            <h3>{admin.username}</h3>
            <p className="muted">{admin.email}</p>
            <button
              type="button"
              disabled={busyId !== null}
              onClick={() => onApprove(admin)}
            >
              {busyId === admin.id ? 'Approving…' : 'Approve'}
            </button>
            {approveError.id === admin.id ? (
              <p className="form-error" role="alert">{approveError.message}</p>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}
