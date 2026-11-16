import { BookOpen, GraduationCap, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOverview, listPendingAdmins } from '../../api/admin.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Button from '../../components/primitives/Button.jsx';
import StatCard from '../../components/primitives/StatCard.jsx';
import { SkeletonKpi } from '../../components/primitives/Skeleton.jsx';

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState(null);
  const [pendingCount, setPendingCount] = useState(null);
  const [overviewError, setOverviewError] = useState('');
  const [pendingError, setPendingError] = useState('');
  const [loading, setLoading] = useState(true);

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
          setPendingCount(Array.isArray(rows) ? rows.length : 0);
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

  return (
    <>
      <PageHeader
        title="Overview"
        context="A snapshot of people, courses, and accounts waiting for approval."
        action={<Button to="/admin/courses?new=1">New course</Button>}
      />
      {overviewError ? (
        <p className="alert" role="alert"><span className="badge-dot" aria-hidden="true" /><span>{overviewError}</span></p>
      ) : null}
      {loading && !overview ? (
        <div className="kpi-row" aria-hidden="true">
          <SkeletonKpi />
          <SkeletonKpi />
          <SkeletonKpi />
        </div>
      ) : null}
      {overview ? (
        <div className="kpi-row">
          <StatCard label="Students" value={overview.student_count} icon={<GraduationCap size={18} />} />
          <StatCard label="Teachers" value={overview.teacher_count} icon={<Users size={18} />} />
          <StatCard label="Courses" value={overview.course_count} icon={<BookOpen size={18} />} />
        </div>
      ) : null}
      <section className="page-section">
        <h2 className="section-title">Pending admins</h2>
        {pendingError ? (
          <p className="alert" role="alert"><span className="badge-dot" aria-hidden="true" /><span>{pendingError}</span></p>
        ) : null}
        {!loading && !pendingError && pendingCount === 0 ? (
          <p className="muted">No one is waiting for approval.</p>
        ) : null}
        {!pendingError && pendingCount > 0 ? (
          <p className="muted">
            {pendingCount} {pendingCount === 1 ? 'account is' : 'accounts are'} waiting.
            {' '}
            <Link to="/admin/people#pending">Review on People</Link>
          </p>
        ) : null}
      </section>
    </>
  );
}
