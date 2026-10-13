import { useStore } from '../../store/StoreContext';
import { visibleComplaints } from '../../store/selectors';
import { Card, PageHeader } from '../../components/ui/Card';

const DAY = 86400000;

export default function WardenPerformance() {
  const { db, user } = useStore();
  const complaints = visibleComplaints(db, user);
  const wardens = db.users.filter((u) => u.role === 'warden').sort((a, b) => a.block.localeCompare(b.block));

  const rows = wardens.map((w) => {
    const mine = complaints.filter((c) => c.route === 'warden' && c.block === w.block);
    const resolved = mine.filter((c) => c.status === 'resolved');
    const firstAction = mine
      .map((c) => c.history.find((h) => h.status !== 'pending'))
      .filter(Boolean);
    const responseDays = mine.length
      ? mine.reduce((s, c) => {
          const act = c.history.find((h) => h.status !== 'pending');
          return act ? s + (new Date(act.at) - new Date(c.createdAt)) / DAY : s;
        }, 0) / (firstAction.length || 1)
      : 0;
    const resolveDays = resolved.length
      ? resolved.reduce((s, c) => s + (new Date(c.updatedAt) - new Date(c.createdAt)) / DAY, 0) / resolved.length
      : null;
    const stale = mine.filter((c) => c.status === 'pending' && Date.now() - new Date(c.createdAt) > 3 * DAY).length;
    const against = complaints.filter((c) => c.route === 'bypass' && c.againstWardenId === w.id).length;
    const rate = mine.length ? Math.round((resolved.length / mine.length) * 100) : 0;
    return { w, total: mine.length, resolved: resolved.length, rate, responseDays: firstAction.length ? responseDays : null, resolveDays, stale, against };
  });

  const fmt = (d) => (d === null ? 'None yet' : `${d.toFixed(1)} days`);

  return (
    <>
      <PageHeader title="Warden performance" subtitle="How quickly each block's routine complaints are handled. Complaints against a Warden are counted separately." />
      <Card pad={false} className="card-table">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Warden</th><th>Complaints</th><th>Resolution rate</th><th>First response</th><th>Time to resolve</th><th>Pending over 3 days</th><th>Complaints against</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.w.id}>
                  <td data-label="Warden" className="cell-nowrap"><span className="row-title">Block {r.w.block}</span><span className="muted small">{r.w.name}</span></td>
                  <td data-label="Complaints">{r.total} <span className="muted small">({r.resolved} resolved)</span></td>
                  <td data-label="Resolution rate">
                    <div className="rate">
                      <div className="rate-track" aria-hidden="true"><div className="rate-fill" style={{ width: `${r.rate}%` }} /></div>
                      <span>{r.rate}%</span>
                    </div>
                  </td>
                  <td data-label="First response">{fmt(r.responseDays)}</td>
                  <td data-label="Time to resolve">{fmt(r.resolveDays)}</td>
                  <td data-label="Pending over 3 days">{r.stale > 0 ? <strong className="text-wine">{r.stale}</strong> : 0}</td>
                  <td data-label="Complaints against">{r.against > 0 ? <span className="tag tag-strong">{r.against}</span> : <span className="muted">0</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
