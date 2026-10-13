import { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../store/ToastContext';
import { visibleFines } from '../../store/selectors';
import { Card, PageHeader, StatCard } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { FineBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/States';
import Tabs from '../../components/ui/Tabs';
import RazorpayDemoModal from '../../components/RazorpayDemoModal';
import ReceiptModal from '../../components/ReceiptModal';
import { formatDate, rupees } from '../../services/format';
import { staffTitle } from '../../services/routing';

export default function StudentFines() {
  const { db, user, recordPayment } = useStore();
  const toast = useToast();
  const fines = visibleFines(db, user);
  const [tab, setTab] = useState('unpaid');
  const [paying, setPaying] = useState(null);
  const [receipt, setReceipt] = useState(null);

  const unpaid = fines.filter((f) => f.status === 'unpaid');
  const paid = fines.filter((f) => f.status === 'paid');
  const rows = tab === 'unpaid' ? unpaid : paid;

  const onPaid = async (payment) => {
    await recordPayment(paying.id, payment);
    const { id, amount } = paying;
    setPaying(null);
    toast(`Payment of ${rupees(amount)} received`, { detail: 'A confirmation has been added to your inbox.' });
    setReceipt(id);
  };

  const receiptFine = receipt ? db.fines.find((f) => f.id === receipt) : null;

  return (
    <>
      <PageHeader title="Fines" subtitle="Fines issued to you and payments you have made." />
      <div className="stats">
        <StatCard tone="dark" label="Amount due" value={rupees(unpaid.reduce((s, f) => s + f.amount, 0))} note={`${unpaid.length} unpaid`} />
        <StatCard label="Paid so far" value={rupees(paid.reduce((s, f) => s + f.amount, 0))} note={`${paid.length} payments`} />
      </div>
      <Card pad={false} className="card-table">
        <div className="card-tabs">
          <Tabs label="Fine status" value={tab} onChange={setTab}
            tabs={[{ value: 'unpaid', label: 'Unpaid', count: unpaid.length }, { value: 'paid', label: 'Paid', count: paid.length }]} />
        </div>
        {rows.length === 0 ? (
          <EmptyState icon="fine" title={tab === 'unpaid' ? 'You have no unpaid fines' : 'No payments yet'}>
            {tab === 'unpaid' ? 'Any fine issued to you will appear here, and you will get an email.' : 'Fines you pay online will appear here with a receipt.'}
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Reason</th><th>Issued by</th><th>Date</th><th>Amount</th><th>Status</th><th><span className="sr-only">Action</span></th></tr>
              </thead>
              <tbody>
                {rows.map((f) => {
                  const issuer = db.users.find((u) => u.id === f.issuedById);
                  const linked = f.complaintId ? db.complaints.find((c) => c.id === f.complaintId) : null;
                  return (
                    <tr key={f.id}>
                      <td data-label="Reason">
                        <span className="row-title">{f.reason}</span>
                        {linked && <span className="muted small">Related to {linked.code}</span>}
                      </td>
                      <td data-label="Issued by">{staffTitle(issuer)}</td>
                      <td data-label="Date" className="muted">{formatDate(f.status === 'paid' ? f.paidAt : f.createdAt)}</td>
                      <td data-label="Amount"><strong>{rupees(f.amount)}</strong></td>
                      <td data-label="Status"><FineBadge status={f.status} /></td>
                      <td className="cell-action">
                        {f.status === 'unpaid' ? (
                          <Button size="sm" onClick={() => setPaying(f)}>Pay now</Button>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => setReceipt(f.id)}>View receipt</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {paying && <RazorpayDemoModal open fine={paying} onClose={() => setPaying(null)} onPaid={onPaid} />}
      {receiptFine && <ReceiptModal open fine={receiptFine} db={db} onClose={() => setReceipt(null)} />}
    </>
  );
}
