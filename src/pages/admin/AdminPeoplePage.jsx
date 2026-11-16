import { useEffect, useRef, useState } from 'react';
import { approveAdmin, getOverview, listPendingAdmins, listStudents } from '../../api/admin.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/primitives/Button.jsx';
import Card from '../../components/primitives/Card.jsx';
import EmptyState from '../../components/primitives/EmptyState.jsx';
import Input from '../../components/primitives/Input.jsx';
import Tabs from '../../components/primitives/Tabs.jsx';
import { prefersReducedMotion } from '../../utils/motion.js';
import { normalizeStudents } from './adminShared.js';

export default function AdminPeoplePage() {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [pending, setPending] = useState([]);
  const [teachersError, setTeachersError] = useState('');
  const [studentsError, setStudentsError] = useState('');
  const [pendingError, setPendingError] = useState('');
  const [loading, setLoading] = useState(true);
  const [teacherQuery, setTeacherQuery] = useState('');
  const [studentQuery, setStudentQuery] = useState('');
  const [tab, setTab] = useState('teachers');
  const [busyId, setBusyId] = useState(null);
  const [exit, setExit] = useState(null);
  const [approveError, setApproveError] = useState({ id: null, message: '' });
  const busyRef = useRef(false);
  const timersRef = useRef([]);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      getOverview(),
      listStudents(),
      listPendingAdmins(),
    ])
      .then(([overviewResult, studentsResult, pendingResult]) => {
        if (cancelled) return;
        if (overviewResult.status === 'fulfilled') {
          const rows = overviewResult.value?.teachers;
          setTeachers(Array.isArray(rows) ? rows : []);
        } else {
          setTeachersError(overviewResult.reason?.message || 'Could not load teachers');
        }
        if (studentsResult.status === 'fulfilled') {
          setStudents(normalizeStudents(studentsResult.value));
        } else {
          setStudentsError(studentsResult.reason?.message || 'Could not load students');
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

  function finishExit(adminId) {
    setPending((current) => current.filter((item) => item.id !== adminId));
    setExit(null);
    setBusyId(null);
    busyRef.current = false;
  }

  async function onApprove(admin) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyId(admin.id);
    setApproveError({ id: null, message: '' });
    try {
      await approveAdmin(admin.id);
      if (prefersReducedMotion()) {
        finishExit(admin.id);
        return;
      }
      setExit({ id: admin.id, phase: 'approved' });
      const leaveTimer = window.setTimeout(() => {
        setExit({ id: admin.id, phase: 'leaving' });
      }, 200);
      const doneTimer = window.setTimeout(() => finishExit(admin.id), 480);
      timersRef.current.push(leaveTimer, doneTimer);
    } catch (err) {
      setApproveError({ id: admin.id, message: err.message || 'Could not approve this admin' });
      busyRef.current = false;
      setBusyId(null);
    }
  }

  const teacherNeedle = teacherQuery.trim().toLowerCase();
  const visibleTeachers = teachers.filter((teacher) => {
    if (!teacherNeedle) return true;
    const username = String(teacher.username || '').toLowerCase();
    const courses = Array.isArray(teacher.courses) ? teacher.courses : [];
    return username.includes(teacherNeedle)
      || courses.some((course) => String(course.name || '').toLowerCase().includes(teacherNeedle));
  });
  const studentNeedle = studentQuery.trim().toLowerCase();
  const visibleStudents = students.filter((student) => {
    if (!studentNeedle) return true;
    return student.username.toLowerCase().includes(studentNeedle)
      || student.email.toLowerCase().includes(studentNeedle);
  });

  const teacherPanel = (
    <div className="stack">
      <Input
        search
        label="Search teachers"
        placeholder="Search by teacher or course"
        value={teacherQuery}
        onChange={(event) => setTeacherQuery(event.target.value)}
      />
      {teachersError ? <p className="alert" role="alert"><span className="badge-dot" aria-hidden="true" /><span>{teachersError}</span></p> : null}
      {!loading && !teachersError && visibleTeachers.length === 0 ? (
        <EmptyState title={teacherNeedle ? 'No teachers match that search.' : 'No teachers yet.'} />
      ) : null}
      <div className="directory-list">
        {visibleTeachers.map((teacher) => {
          const courses = Array.isArray(teacher.courses) ? teacher.courses : [];
          return (
            <Card key={teacher.teacher_id}>
              <h3 className="card-title">{teacher.username}</h3>
              {courses.length ? (
                <div className="pill-row">
                  {courses.map((course) => (
                    <span className="pill" key={course.id}>
                      {course.name}
                      {course.status === 'inactive' ? ' · Inactive' : ''}
                    </span>
                  ))}
                </div>
              ) : <p className="muted">No courses.</p>}
            </Card>
          );
        })}
      </div>
    </div>
  );

  const studentPanel = (
    <div className="stack">
      <Input
        search
        label="Search students"
        placeholder="Search by name or email"
        value={studentQuery}
        onChange={(event) => setStudentQuery(event.target.value)}
      />
      {studentsError ? <p className="alert" role="alert"><span className="badge-dot" aria-hidden="true" /><span>{studentsError}</span></p> : null}
      {!loading && !studentsError && visibleStudents.length === 0 ? (
        <EmptyState title={studentNeedle ? 'No students match that search.' : 'No students yet.'} />
      ) : null}
      <div className="directory-list">
        {visibleStudents.map((student) => (
          <Card key={student.id} className="person-row">
            <div>
              <h3 className="card-title">{student.username}</h3>
              {student.email ? <p className="muted">{student.email}</p> : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <PageHeader title="People" context="Teachers, students, and admin accounts waiting for approval." />
      <section className="page-section" id="pending">
        <h2 className="section-title">Pending admins</h2>
        {pendingError ? (
          <p className="alert" role="alert"><span className="badge-dot" aria-hidden="true" /><span>{pendingError}</span></p>
        ) : null}
        {!loading && !pendingError && pending.length === 0 ? (
          <EmptyState title="No one is waiting for approval." />
        ) : null}
        {pending.length ? (
          <Card>
            {pending.map((admin) => {
              const phase = exit?.id === admin.id ? exit.phase : '';
              return (
                <article
                  key={admin.id}
                  className={phase === 'leaving' ? 'pending-row is-leaving' : 'pending-row'}
                >
                  <div>
                    <h3 className="pending-name">{admin.username}</h3>
                    <p className="muted pending-email">{admin.email}</p>
                  </div>
                  <div className="pending-action">
                    {phase === 'approved' || phase === 'leaving' ? (
                      <span className="approve-check" aria-hidden="true">✓</span>
                    ) : (
                      <Button disabled={busyId !== null} onClick={() => onApprove(admin)}>
                        {busyId === admin.id ? 'Approving…' : 'Approve'}
                      </Button>
                    )}
                  </div>
                  {approveError.id === admin.id ? (
                    <p className="form-error pending-error" role="alert">{approveError.message}</p>
                  ) : null}
                </article>
              );
            })}
          </Card>
        ) : null}
      </section>
      <section className="page-section">
        <Tabs
          label="People"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'teachers', label: 'Teachers', content: teacherPanel },
            { value: 'students', label: 'Students', content: studentPanel },
          ]}
        />
        {loading ? <p className="muted">Loading…</p> : null}
      </section>
    </>
  );
}
