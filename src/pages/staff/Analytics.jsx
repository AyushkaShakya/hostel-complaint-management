import { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { visibleComplaints, visibleFines, countBy } from '../../store/selectors';
import { Card, PageHeader, StatCard } from '../../components/ui/Card';
import { BarList, Columns, StackedBar } from '../../components/ui/BarChart';
import Tabs from '../../components/ui/Tabs';
import { BLOCKS, CATEGORIES, ROUTE_LABEL } from '../../config/constants';
import { rupees } from '../../services/format';

const DAY = 86400000;

export default function Analytics() {
  const { db, user } = useStore();
  const [range, setRange] = useState('30');
  const all = visibleComplaints(db, user);
  const since = range === 'all' ? 0 : Date.now() - Number(range) * DAY;
  const complaints = all.filter((c) => new Date(c.createdAt).getTime() >= since);
  const fines = visibleFines(db, user).filter((f) => new Date(f.createdAt).getTime() >= since);

  const byStatus = countBy(complaints, 'status');
  const byCat = countBy(complaints, 'category');
  const byBlock = countBy(complaints, 'block');
  const byRoute = countBy(complaints, 'route');
  const resolved = complaints.filter((c) => c.status === 'resolved');
  const avgResolve = resolved.length
    ? resolved.reduce((s, c) => s + (new Date(c.updatedAt) - new Date(c.createdAt)) / DAY, 0) / resolved.length
    : null;

  // Complaints filed per week, last 6 weeks.
  const weeks = Array.from({ length: 6 }, (_, i) => {
    const end = Date.now() - (5 - i) * 7 * DAY;
    const start = end - 7 * DAY;
    return {
      label: i === 5 ? 'This week' : `${5 - i}w ago`,
      value: all.filter((c) => { const t = new Date(c.createdAt).getTime(); return t > start && t <= end; }).length,
    };
  });

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle={user.role === 'chief' ? 'Based on complaints visible to the Chief Warden.' : 'Based on every complaint in the hostel.'}
        actions={<Tabs label="Date range" value={range} onChange={setRange} tabs={[{ value: '7', label: '7 days' }, { value: '30', label: '30 days' }, { value: 'all', label: 'All time' }]} />}
      />
      <div className="stats stats-4">
        <StatCard tone="dark" label="Complaints filed" value={complaints.length} />
        <StatCard label="Resolution rate" value={complaints.length ? `${Math.round((resolved.length / complaints.length) * 100)}%` : 'None'} />
        <StatCard label="Average time to resolve" value={avgResolve === null ? 'None' : `${avgResolve.toFixed(1)} d`} />
        <StatCard label="Fines collected" value={rupees(fines.filter((f) => f.status === 'paid').reduce((s, f) => s + f.amount, 0))} />
      </div>

      <div className="grid-2">
        <Card title="Complaints by category">
          <BarList
            data={CATEGORIES.map((c) => ({ label: c.label, value: byCat[c.key] ?? 0, tone: c.route !== 'warden' ? 'strong' : undefined }))
              .filter((d) => d.value > 0)
              .sort((a, b) => b.value - a.value)}
            emptyText="No complaints in this period."
          />
        </Card>
        <div className="stack">
          <Card title="Filed per week">
            <Columns data={weeks} />
          </Card>
          <Card title="Status">
            <StackedBar parts={[
              { key: 'pending', label: 'Pending', value: byStatus.pending ?? 0 },
              { key: 'in_progress', label: 'In progress', value: byStatus.in_progress ?? 0 },
              { key: 'resolved', label: 'Resolved', value: byStatus.resolved ?? 0 },
            ]} />
          </Card>
        </div>
        <Card title="By block">
          <BarList data={BLOCKS.map((b) => ({ label: `Block ${b}`, value: byBlock[b] ?? 0 }))} />
        </Card>
        <Card title="By route">
          <BarList data={['warden', 'bypass', 'dean'].map((r) => ({ label: ROUTE_LABEL[r], value: byRoute[r] ?? 0, tone: r !== 'warden' ? 'strong' : undefined }))} />
          {user.role === 'chief' && <p className="muted small">Ragging cases the student chose to hide from you are not counted.</p>}
        </Card>
      </div>
    </>
  );
}
