import { Link } from 'react-router-dom';
import { useStore } from '../../store/StoreContext';
import { visibleComplaints, visibleFines, countBy } from '../../store/selectors';
import { Card, PageHeader, StatCard } from '../../components/ui/Card';
import ComplaintTable from '../../components/ComplaintTable';
import { BarList, StackedBar } from '../../components/ui/BarChart';
import { Alert } from '../../components/ui/States';
import { ROLES, categoryLabel } from '../../config/constants';
import { rupees } from '../../services/format';
import { staffTitle } from '../../services/routing';

export default function StaffDashboard() {
  const { db, user } = useStore();
  const base = `/${ROLES[user.role].path}`;
  const complaints = visibleComplaints(db, user);
  const fines = visibleFines(db, user);
  const by = countBy(complaints, 'status');
  const outstanding = fines.filter((f) => f.status === 'unpaid').reduce((s, f) => s + f.amount, 0);
  const isOversight = user.role !== 'warden';
  const againstWarden = complaints.filter((c) => c.route === 'bypass' && c.status !== 'resolved').length;
  const sensitive = complaints.filter((c) => c.route === 'dean' && c.status !== 'resolved').length;
  const topCats = Object.entries(countBy(complaints, 'category'))
    .map(([k, v]) => ({ label: categoryLabel(k), value: v }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title={user.role === 'warden' ? `Block ${user.block}` : 'Institution overview'}
        subtitle={`${staffTitle(user)}, ${user.name}`}
      />

      {isOversight && (againstWarden > 0 || (user.role === 'dean' && sensitive > 0)) && (
        <Alert tone="private">
          {againstWarden > 0 && <>{againstWarden} open complaint{againstWarden === 1 ? '' : 's'} against a Warden. </>}
          {user.role === 'dean' && sensitive > 0 && <>{sensitive} open ragging or harassment case{sensitive === 1 ? '' : 's'}. </>}
          <Link to={`${base}/complaints`}>Review complaints</Link>
        </Alert>
      )}

      <div className="stats stats-4">
        <StatCard tone="dark" label="Pending" value={by.pending ?? 0} note="Waiting for action" />
        <StatCard label="In progress" value={by.in_progress ?? 0} />
        <StatCard label="Resolved" value={by.resolved ?? 0} />
        <StatCard label="Fines outstanding" value={rupees(outstanding)} note={`${fines.filter((f) => f.status === 'unpaid').length} unpaid`} />
      </div>

      <div className="grid-2-1">
        <Card title="Needs attention" action={<Link to={`${base}/complaints`} className="card-link">All complaints</Link>} pad={false}>
          <ComplaintTable
            complaints={complaints.filter((c) => c.status !== 'resolved').slice(0, 6)}
            db={db}
            viewer={user}
            basePath={base}
            showStudent
            compact
          />
        </Card>
        <div className="stack">
          <Card title="Status split">
            <StackedBar parts={[
              { key: 'pending', label: 'Pending', value: by.pending ?? 0 },
              { key: 'in_progress', label: 'In progress', value: by.in_progress ?? 0 },
              { key: 'resolved', label: 'Resolved', value: by.resolved ?? 0 },
            ]} />
          </Card>
          <Card title="Top categories">
            <BarList data={topCats} />
          </Card>
        </div>
      </div>
    </>
  );
}
