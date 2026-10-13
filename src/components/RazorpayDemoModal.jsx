import { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Icon from './ui/Icon';
import { Alert } from './ui/States';
import { Checkbox } from './ui/Field';
import { openCheckout, simulateCheckout } from '../services/razorpay';
import { rupees } from '../services/format';
import { IS_LIVE } from '../config/env';
import { useStore } from '../store/StoreContext';

const METHODS = [
  { key: 'upi', label: 'UPI', hint: 'Any test UPI ID' },
  { key: 'card', label: 'Card', hint: 'Any test card' },
  { key: 'netbanking', label: 'Netbanking', hint: 'Any test bank' },
];

// Demo mode: simulated checkout. Live mode: opens the real Razorpay window.
export default function RazorpayDemoModal({ fine, open, onClose, onPaid }) {
  const { user } = useStore();
  const [method, setMethod] = useState('upi');
  const [fail, setFail] = useState(false);
  const [state, setState] = useState('idle'); // idle | paying | error
  const [error, setError] = useState('');

  const close = () => {
    if (state === 'paying') return;
    setState('idle');
    setError('');
    onClose();
  };

  const pay = async () => {
    setState('paying');
    setError('');
    try {
      const payment = IS_LIVE
        ? await openCheckout({ fine, user })
        : await simulateCheckout({ amount: fine.amount, method, shouldFail: fail });
      await onPaid(payment);
      setState('idle');
    } catch (e) {
      setError(e.message);
      setState('error');
    }
  };

  if (!fine) return null;
  return (
    <Modal open={open} onClose={close} title="Pay fine" dismissable={state !== 'paying'}>
      <div className="rzp">
        <div className="rzp-test">
          <Icon name="lock" size={15} />
          {IS_LIVE ? 'Secure payment through Razorpay.' : 'Razorpay test mode (demo). No money is charged.'}
        </div>
        <div className="rzp-amount">
          <span className="muted">Amount due</span>
          <strong>{rupees(fine.amount)}</strong>
          <span className="rzp-reason">{fine.reason}</span>
        </div>

        {IS_LIVE ? (
          <p className="muted small">
            Razorpay's checkout window will open. You can pay by UPI, card or netbanking there.
          </p>
        ) : (
          <>
            <fieldset className="rzp-methods" disabled={state === 'paying'}>
              <legend className="field-label">Payment method</legend>
              {METHODS.map((m) => (
                <label key={m.key} className={`rzp-method ${method === m.key ? 'is-active' : ''}`}>
                  <input type="radio" name="method" value={m.key} checked={method === m.key} onChange={() => setMethod(m.key)} />
                  <span className="rzp-method-name">{m.label}</span>
                  <span className="rzp-method-hint">{m.hint}</span>
                </label>
              ))}
            </fieldset>
            <Checkbox
              label="Simulate a failed payment"
              description="Use this to see how errors are shown."
              checked={fail}
              onChange={(e) => setFail(e.target.checked)}
              disabled={state === 'paying'}
            />
          </>
        )}

        {state === 'error' && <Alert tone="error">{error}</Alert>}

        <div className="modal-actions">
          <Button variant="ghost" onClick={close} disabled={state === 'paying'}>Cancel</Button>
          <Button onClick={pay} loading={state === 'paying'}>
            {state === 'paying' ? (IS_LIVE ? 'Waiting for Razorpay' : 'Processing payment') : `Pay ${rupees(fine.amount)}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
