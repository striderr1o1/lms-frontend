import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  addCourseStudent,
  createCourse,
  deleteCourse,
  getOverview,
  listStudents,
  listTeachers,
  removeCourseStudent,
  updateCourse,
} from '../../api/admin.js';
import { generatedCover } from '../../api/covers.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import CoverPicker from '../../components/patterns/CoverPicker.jsx';
import CourseCover from '../../components/patterns/CourseCover.jsx';
import Badge, { statusLabel, statusTone } from '../../components/primitives/Badge.jsx';
import Button from '../../components/primitives/Button.jsx';
import Combobox from '../../components/primitives/Combobox.jsx';
import ConfirmDialog from '../../components/primitives/ConfirmDialog.jsx';
import Dialog from '../../components/primitives/Dialog.jsx';
import EmptyState from '../../components/primitives/EmptyState.jsx';
import Input from '../../components/primitives/Input.jsx';
import SegmentedControl from '../../components/primitives/SegmentedControl.jsx';
import { useToast } from '../../components/primitives/Toast.jsx';
import { flattenCourses, normalizeStudents, normalizeTeachers, rosterOf } from './adminShared.js';

export default function AdminCoursesPage() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [overview, setOverview] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');
  const [teachersError, setTeachersError] = useState('');
  const [studentsError, setStudentsError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState('cards');
  const [busyKey, setBusyKey] = useState('');
  const [courseError, setCourseError] = useState({ id: '', message: '' });
  const [dialog, setDialog] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const directoryRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getOverview(), listTeachers(), listStudents()])
      .then(([overviewResult, teachersResult, studentsResult]) => {
        if (cancelled) return;
        if (overviewResult.status === 'fulfilled') setOverview(overviewResult.value);
        else setOverviewError(overviewResult.reason?.message || 'Could not load courses');
        if (teachersResult.status === 'fulfilled') setTeachers(normalizeTeachers(teachersResult.value));
        else setTeachersError(teachersResult.reason?.message || 'Could not load teachers');
        if (studentsResult.status === 'fulfilled') setStudents(normalizeStudents(studentsResult.value));
        else setStudentsError(studentsResult.reason?.message || 'Could not load students');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading || params.get('new') !== '1') return;
    setDialog({
      mode: 'create',
      teacherId: '',
      name: '',
      studentIds: [],
      cover: generatedCover(''),
      error: '',
    });
    const next = new URLSearchParams(params);
    next.delete('new');
    setParams(next, { replace: true });
  }, [loading, params, setParams]);

  async function refreshDirectory() {
    const [overviewData, teacherRows, studentRows] = await Promise.all([
      getOverview(),
      listTeachers(),
      listStudents(),
    ]);
    setOverview(overviewData);
    setTeachers(normalizeTeachers(teacherRows));
    setStudents(normalizeStudents(studentRows));
    setOverviewError('');
    setTeachersError('');
    setStudentsError('');
  }

  async function runMutation(key, task) {
    if (directoryRef.current) return false;
    directoryRef.current = true;
    setBusyKey(key);
    setCourseError({ id: '', message: '' });
    try {
      await task();
    } catch (err) {
      directoryRef.current = false;
      setBusyKey('');
      throw err;
    }
    try {
      await refreshDirectory();
    } catch (err) {
      setOverviewError(err.message || 'Could not refresh courses');
    } finally {
      directoryRef.current = false;
      setBusyKey('');
    }
    return true;
  }

  function openEdit(course) {
    setDialog({
      mode: 'edit',
      course,
      teacherId: course.teacher_id,
      name: course.name ?? '',
      studentIds: rosterOf(course).map((student) => student.id),
      cover: course.cover?.image_url ? course.cover : generatedCover(course.name),
      error: '',
    });
  }

  async function onSaveDialog(event) {
    event.preventDefault();
    if (!dialog) return;
    const name = dialog.name.trim();
    if (!name) {
      setDialog((current) => ({ ...current, error: 'Enter a course name.' }));
      return;
    }
    if (dialog.mode === 'create' && !dialog.teacherId) {
      setDialog((current) => ({ ...current, error: 'Choose a teacher.' }));
      return;
    }
    const allowed = new Set(students.map((student) => student.id));
    const studentIds = dialog.studentIds.filter((id) => allowed.has(id));
    const cover = dialog.cover?.source ? dialog.cover : generatedCover(name);
    try {
      if (dialog.mode === 'create') {
        await runMutation('create', () => createCourse({
          teacher_id: dialog.teacherId,
          name,
          student_ids: studentIds,
          cover,
        }));
      } else {
        const course = dialog.course;
        await runMutation(`${course.id}:edit`, async () => {
          await updateCourse(course.id, { name, cover });
          const previous = rosterOf(course).map((student) => student.id);
          const additions = studentIds.filter((id) => !previous.includes(id));
          const removals = previous.filter((id) => !studentIds.includes(id));
          await Promise.all(additions.map((id) => addCourseStudent(course.id, id)));
          await Promise.all(removals.map((id) => removeCourseStudent(course.id, id)));
        });
      }
      setDialog(null);
      toast({ message: dialog.mode === 'create' ? 'Course created' : 'Course saved' });
    } catch (err) {
      setDialog((current) => current && ({
        ...current,
        error: err.message || 'Could not save the course',
      }));
    }
  }

  async function onStatus(course, status) {
    try {
      await runMutation(`${course.id}:status`, () => updateCourse(course.id, { status }));
      setConfirm(null);
    } catch (err) {
      setCourseError({ id: course.id, message: err.message || 'Could not update the course' });
      setConfirm(null);
    }
  }

  async function onDelete(course) {
    try {
      await runMutation(`${course.id}:delete`, () => deleteCourse(course.id));
      setConfirm(null);
      toast({ message: 'Course deleted' });
    } catch (err) {
      setCourseError({ id: course.id, message: err.message || 'Could not delete the course' });
      setConfirm(null);
    }
  }

  async function onAdd(course, studentId) {
    try {
      await runMutation(`${course.id}:add`, () => addCourseStudent(course.id, studentId));
    } catch (err) {
      setCourseError({ id: course.id, message: err.message || 'Could not add this student' });
    }
  }

  async function onRemove(course, student) {
    try {
      await runMutation(
        `${course.id}:remove:${student.id}`,
        () => removeCourseStudent(course.id, student.id),
      );
      toast({
        message: `Removed ${student.username}`,
        action: {
          label: 'Undo',
          onClick: () => {
            addCourseStudent(course.id, student.id)
              .then(() => refreshDirectory())
              .catch((err) => {
                setCourseError({ id: course.id, message: err.message || 'Could not undo that removal' });
              });
          },
        },
      });
    } catch (err) {
      setCourseError({ id: course.id, message: err.message || 'Could not remove this student' });
    }
  }

  const courses = flattenCourses(overview);
  const needle = query.trim().toLowerCase();
  const visible = courses.filter((course) => {
    if (statusFilter !== 'all' && course.status !== statusFilter) return false;
    if (!needle) return true;
    return String(course.name || '').toLowerCase().includes(needle)
      || String(course.teacher_username || '').toLowerCase().includes(needle);
  });
  const locked = busyKey !== '';
  const teacherOptions = teachers.map((teacher) => ({ value: teacher.teacher_id, label: teacher.username }));
  const studentOptions = students.map((student) => ({ value: student.id, label: student.username }));

  function renderActions(course) {
    const roster = rosterOf(course);
    const assigned = new Set(roster.map((student) => student.id));
    const candidates = students.filter((student) => !assigned.has(student.id));
    return (
      <div className="course-admin-actions stack">
        <div className="card-actions">
          <Button variant="secondary" disabled={locked} onClick={() => openEdit(course)}>Edit</Button>
          {course.status === 'active' ? (
            <Button
              variant="secondary"
              disabled={locked}
              onClick={() => setConfirm({ type: 'deactivate', course })}
            >
              {busyKey === `${course.id}:status` ? 'Deactivating…' : 'Deactivate'}
            </Button>
          ) : (
            <Button variant="secondary" disabled={locked} onClick={() => onStatus(course, 'active')}>
              {busyKey === `${course.id}:status` ? 'Activating…' : 'Activate'}
            </Button>
          )}
          <Button variant="danger" disabled={locked} onClick={() => setConfirm({ type: 'delete', course })}>
            Delete
          </Button>
        </div>
        <div className="pill-row">
          {roster.length ? roster.map((student) => (
            <span className="pill" key={student.id}>
              {student.username}
              <button
                type="button"
                className="chip-remove"
                aria-label={`Remove ${student.username}`}
                disabled={locked}
                onClick={() => onRemove(course, student)}
              >
                ×
              </button>
            </span>
          )) : <span className="muted">No students yet</span>}
        </div>
        {candidates.length ? (
          <Combobox
            label={`Add a student to ${course.name}`}
            options={candidates.map((student) => ({ value: student.id, label: student.username }))}
            value=""
            placeholder="Add a student"
            disabled={locked}
            onChange={(studentId) => {
              if (studentId) onAdd(course, studentId);
            }}
          />
        ) : null}
        {courseError.id === course.id ? <p className="form-error" role="alert">{courseError.message}</p> : null}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Courses"
        context="Create a course, assign students, and choose a cover."
        action={(
          <Button
            disabled={locked}
            onClick={() => setDialog({
              mode: 'create',
              teacherId: '',
              name: '',
              studentIds: [],
              cover: generatedCover(''),
              error: '',
            })}
          >
            New course
          </Button>
        )}
      />
      {overviewError ? <p className="alert" role="alert"><span className="badge-dot" aria-hidden="true" /><span>{overviewError}</span></p> : null}
      {teachersError ? <p className="alert" role="alert"><span className="badge-dot" aria-hidden="true" /><span>{teachersError}</span></p> : null}
      {studentsError ? <p className="alert" role="alert"><span className="badge-dot" aria-hidden="true" /><span>{studentsError}</span></p> : null}
      <div className="toolbar">
        <Input
          search
          label="Search courses"
          placeholder="Search by course or teacher"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <SegmentedControl
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
        <SegmentedControl
          label="Layout"
          value={view}
          onChange={setView}
          options={[
            { value: 'cards', label: 'Cards' },
            { value: 'table', label: 'Table' },
          ]}
        />
      </div>
      {loading ? <p className="muted">Loading…</p> : null}
      {!loading && !overviewError && visible.length === 0 ? (
        <EmptyState
          title={needle || statusFilter !== 'all' ? 'No courses match that filter.' : 'No courses yet.'}
          subtitle={needle || statusFilter !== 'all' ? undefined : 'Create one and assign it to a teacher.'}
        />
      ) : null}
      {view === 'cards' ? (
        <div className="course-grid">
          {visible.map((course) => {
            const label = statusLabel(course.status);
            const roster = rosterOf(course);
            return (
              <article className="course-card" key={course.id}>
                <CourseCover course={course} size="card" />
                <div className="course-card-body">
                  <h3 className="card-title">{course.name}</h3>
                  <p className="card-meta">{course.teacher_username} · {roster.length} {roster.length === 1 ? 'student' : 'students'}</p>
                  {label ? <div className="card-status"><Badge tone={statusTone(course.status)}>{label}</Badge></div> : null}
                  {renderActions(course)}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Teacher</th>
                <th>Students</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((course) => {
                const label = statusLabel(course.status);
                return (
                  <tr key={course.id}>
                    <td>
                      <div className="table-course">
                        <CourseCover course={course} size="thumb" />
                        <span>{course.name}</span>
                      </div>
                    </td>
                    <td>{course.teacher_username}</td>
                    <td className="tabular">{rosterOf(course).length}</td>
                    <td>{label ? <Badge tone={statusTone(course.status)}>{label}</Badge> : null}</td>
                    <td>{renderActions(course)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={Boolean(dialog)}
        title={dialog?.mode === 'edit' ? 'Edit course' : 'New course'}
        onClose={() => {
          if (busyKey === 'create' || (dialog?.course && busyKey.startsWith(dialog.course.id))) return;
          setDialog(null);
        }}
      >
        {dialog ? (
          <form className="stack" onSubmit={onSaveDialog}>
            <Input
              label="Course name"
              value={dialog.name}
              maxLength={120}
              required
              disabled={locked}
              onChange={(event) => setDialog((current) => ({ ...current, name: event.target.value }))}
            />
            {dialog.mode === 'create' ? (
              <Combobox
                label="Teacher"
                options={teacherOptions}
                value={dialog.teacherId}
                placeholder="Search teachers"
                disabled={locked}
                onChange={(teacherId) => setDialog((current) => ({ ...current, teacherId }))}
              />
            ) : (
              <p className="muted">Teacher: {dialog.course.teacher_username}</p>
            )}
            <Combobox
              label="Students"
              multiple
              options={studentOptions}
              value={dialog.studentIds}
              placeholder="Search students"
              disabled={locked}
              onChange={(studentIds) => setDialog((current) => ({ ...current, studentIds }))}
            />
            <CoverPicker
              key={dialog.course?.id || 'new-course'}
              courseId={dialog.course?.id}
              courseName={dialog.name}
              value={dialog.cover}
              onChange={(cover) => setDialog((current) => ({ ...current, cover }))}
            />
            {dialog.error ? <p className="form-error" role="alert">{dialog.error}</p> : null}
            <div className="dialog-actions">
              <Button variant="secondary" disabled={locked} onClick={() => setDialog(null)}>Cancel</Button>
              <Button type="submit" loading={locked && (busyKey === 'create' || busyKey.endsWith(':edit'))}>
                {dialog.mode === 'create' ? 'Create course' : 'Save'}
              </Button>
            </div>
          </form>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={confirm?.type === 'deactivate'}
        title="Deactivate this course?"
        description={confirm?.course ? `${confirm.course.name} stays assigned, and it will show as inactive.` : ''}
        confirmLabel="Deactivate"
        busy={locked}
        onClose={() => setConfirm(null)}
        onConfirm={() => onStatus(confirm.course, 'inactive')}
      />
      <ConfirmDialog
        open={confirm?.type === 'delete'}
        title="Delete this course?"
        description="This removes the course and its lessons. Type the course name to confirm."
        confirmLabel="Delete course"
        tone="danger"
        matchText={confirm?.course?.name || ''}
        busy={locked}
        onClose={() => setConfirm(null)}
        onConfirm={() => onDelete(confirm.course)}
      />
    </>
  );
}
