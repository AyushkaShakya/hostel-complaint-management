import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/StoreContext';
import { visibleFines } from '../../store/selectors';
import { Card, PageHeader, StatCard } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import Icon from '../../components/ui/Icon';
import { FineBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/States';
import IssueFineModal from '../../components/IssueFineModal';
import ReceiptModal from '../../components/ReceiptModal';
import { ROLES } from '../../config/constants';
import { formatDate, rupees } from '../../services/format';
import { staffTitle } from '../../services/routing';

export default function FinesManagement() {
  const { db, user } = useStore();
  const base = `/${ROLES[user.role].path}`;
  const fines = visibleFines(db, user);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [issueOpen, setIssueOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const unpaid = fines.filter((f) => f.status === 'unpaid');
  const paid = fines.filter((f) => f.status === 'paid');
  const sum = (list) => list.reduce((s, f) => s + f.amount, 0);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fines.filter((f) => {
      if (tab !== 'all' && f.status !== tab) return false;
      if (!q) return true;
      const s = db.users.find((u) => u.id === f.studentId);
      return `${s?.nickname} ${f.reason}`.toLowerCase().includes(q);
    });
  }, [fines, tab, query, db.users]);

  const receiptFine = receipt ? db.fines.find((f) => f.id === receipt) : null;

  return (
    <>
      <PageHeader
        title="Fines"
        subtitle={user.role === 'warden' ? `Fines for students in Block ${user.block}.` : 'Fines across all blocks.'}
        actions={<Button onClick={() => setIssueOpen(true)}><Icon name="plus" size={18} /> Issue fine</Button>}
      />
      <div className="stats">
        <StatCard tone="dark" label="Outstanding" value={rupees(sum(unpaid))} note={`${unpaid.length} unpaid`} />
        <StatCard label="Collected online" value={rupees(sum(paid))} note={`${paid.length} paid through Razorpay`} />
        <StatCard label="Total issued" value={rupees(sum(fines))} note={`${fines.length} fines`} />
      </div>

      <Card pad={false} className="card-table">
        <div className="card-tabs card-tabs-split">
          <Tabs label="Fine status" value={tab} onChange={setTab}
            tabs={[{ value: 'all', label: 'All', count: fines.length }, { value: 'unpaid', label: 'Unpaid', count: unpaid.length }, { value: 'paid', label: 'Paid', count: paid.length }]} />
          <label className="search search-sm">
            <Icon name="search" size={17} />
            <span className="sr-only">Search fines</span>
            <input type="search" placeholder="Search nickname or reason" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon="fine" title={fines.length ? 'No fines match' : 'No fines issued yet'}
            action={!fines.length && <Button size="sm" onClick={() => setIssueOpen(true)}>Issue a fine</Button>}>
            {fines.length ? 'Try another tab or search term.' : 'Fines you issue will be listed here with their payment status.'}
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Student</th><th>Reason</th><th>Issued by</th><th>Date</th><th>Amount</th><th>Status</th><th><span className="sr-only">Receipt</span></th></tr>
              </thead>
              <tbody>
                {rows.map((f) => {
                  const s = db.users.find((u) => u.id === f.studentId);
                  const issuer = db.users.find((u) => u.id === f.issuedById);
                  const linked = f.complaintId ? db.complaints.find((c) => c.id === f.complaintId) : null;
                  return (
                    <tr key={f.id}>
                      <td data-label="Student"><span className="nick">{s?.nickname}</span><span className="muted small">Block {s?.block}</span></td>
                      <td data-label="Reason">
                        <span className="row-title">{f.reason}</span>
                        {linked && <Link className="small" to={`${base}/complaints/${linked.id}`}>{linked.code}</Link>}
                      </td>
                      <td data-label="Issued by">{staffTitle(issuer)}</td>
                      <td data-label="Date" className="muted">{formatDate(f.createdAt)}</td>
                      <td data-label="Amount"><strong>{rupees(f.amount)}</strong></td>
                      <td data-label="Status"><FineBadge status={f.status} /></td>
                      <td className="cell-action">
                        {f.status === 'paid' && <Button size="sm" variant="ghost" onClick={() => setReceipt(f.id)}>Receipt</Button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {issueOpen && <IssueFineModal open onClose={() => setIssueOpen(false)} />}
      {receiptFine && <ReceiptModal open fine={receiptFine} db={db} onClose={() => setReceipt(null)} />}
    </>
  );
}
