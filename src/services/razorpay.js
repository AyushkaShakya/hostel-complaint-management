// RAZORPAY
// ---------------------------------------------------------------------------
// simulateCheckout(): demo mode only. Imitates test mode, charges nothing.
// openCheckout():     live mode. Asks the create-order Edge Function for an
//                     order, then opens the real Razorpay Checkout window.
//                     The Key Secret never reaches the browser.
import { uid } from './format';
import { supabase, functionErrorMessage } from './supabaseClient';

export async function simulateCheckout({ amount, method, shouldFail = false }) {
  await new Promise((r) => setTimeout(r, 1600));
  if (shouldFail) {
    throw new Error('The bank declined this test payment. Try again or choose another method.');
  }
  const rand = uid('').slice(1).toUpperCase();
  return {
    paymentId: `pay_DEMO${rand}`,
    orderId: `order_DEMO${rand.slice(0, 6)}`,
    receiptNo: `RCPT-${Math.floor(10000 + Math.random() * 89999)}`,
    method,
    amount,
  };
}

let scriptPromise = null;
function loadCheckoutScript() {
  if (window.Razorpay) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve;
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error('Razorpay could not be loaded. Check your internet connection and try again.'));
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/** Resolves with { razorpay_order_id, razorpay_payment_id, razorpay_signature }. */
export async function openCheckout({ fine, user }) {
  await loadCheckoutScript();
  const { data, error } = await supabase.functions.invoke('create-order', { body: { fineId: fine.id } });
  if (error) throw new Error(await functionErrorMessage(error, 'Could not start the payment.'));

  return new Promise((resolve, reject) => {
    let lastFailure = '';
    const rzp = new window.Razorpay({
      key: data.keyId,
      order_id: data.orderId,
      amount: data.amount,
      currency: data.currency,
      name: 'Hostel Desk',
      description: fine.reason.slice(0, 200),
      prefill: { name: user.name, email: user.email },
      notes: { fine_id: fine.id },
      theme: { color: '#561C24' },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error(lastFailure || 'Payment was cancelled. You can try again any time.')),
      },
    });
    // Razorpay keeps its window open after a failure so the student can retry.
    rzp.on('payment.failed', (r) => {
      lastFailure = `Payment failed: ${r.error?.description || 'the bank declined it.'}`;
    });
    rzp.open();
  });
}
