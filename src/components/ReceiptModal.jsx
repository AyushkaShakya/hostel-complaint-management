import Modal from './ui/Modal';
import Button from './ui/Button';
import { rupees, formatDateTime } from '../services/format';
import { staffTitle } from '../services/routing';

export default function ReceiptModal({ fine, db, open, onClose }) {
  if (!fine?.payment) return null;
  const issuer = db.users.find((u) => u.id === fine.issuedById);
  const rows = [
    ['Receipt number', fine.payment.receiptNo],
    ['Payment ID', fine.payment.paymentId],
    ['Order ID', fine.payment.orderId],
    ['Paid on', formatDateTime(fine.paidAt)],
    ['Method', (fine.payment.method ?? 'upi').toUpperCase()],
    ['Issued by', staffTitle(issuer)],
    ['Reason', fine.reason],
  ];
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Payment receipt"
      footer={
        <>
          <Button variant="secondary" onClick={() => window.print()}>Print receipt</Button>
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      <div className="receipt">
        <div className="receipt-amount">
          <span className="muted">Amount paid</span>
          <strong>{rupees(fine.amount)}</strong>
        </div>
        <dl className="dl">
          {rows.map(([k, v]) => (
            <div key={k} className="dl-row">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="muted small">Demo receipt generated in Razorpay test mode.</p>
      </div>
    </Modal>
  );
}
