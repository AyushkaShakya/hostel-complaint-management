// Supabase Edge Function: verify-payment
// Checks Razorpay's signature, then marks the fine as paid.
// A database trigger then adds the "Payment received" notification.
// Secrets needed: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

async function hmacSha256Hex(secret: string, message: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) return json({ error: 'Razorpay keys are not set on the server.' }, 500);

    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Log in again to finish this payment.' }, 401);

    const { fineId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!fineId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: 'Payment details are missing.' }, 400);
    }

    const { data: fine } = await userClient
      .from('fines')
      .select('id, student_id, status, razorpay_order_id')
      .eq('id', fineId)
      .maybeSingle();
    if (!fine || fine.student_id !== user.id) return json({ error: 'This fine was not found on your account.' }, 404);
    if (fine.status === 'paid') return json({ ok: true, alreadyPaid: true });
    if (fine.razorpay_order_id !== razorpay_order_id) return json({ error: 'This payment does not match the fine.' }, 400);

    const expected = await hmacSha256Hex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);
    if (expected !== razorpay_signature) return json({ error: 'Payment signature is invalid.' }, 400);

    // Look up the payment method for the receipt (not critical if it fails).
    let method: string | null = null;
    try {
      const pr = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
        headers: { Authorization: 'Basic ' + btoa(`${keyId}:${keySecret}`) },
      });
      if (pr.ok) method = (await pr.json()).method ?? null;
    } catch { /* ignore */ }

    const d = new Date();
    const receiptNo = `RCPT-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${razorpay_payment_id.slice(-6).toUpperCase()}`;

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error } = await admin
      .from('fines')
      .update({
        status: 'paid',
        paid_at: d.toISOString(),
        razorpay_payment_id,
        receipt_no: receiptNo,
        method,
      })
      .eq('id', fine.id)
      .eq('status', 'unpaid');
    if (error) return json({ error: 'Payment was received but could not be saved. Contact the hostel office.' }, 500);

    return json({ ok: true, receiptNo });
  } catch (e) {
    return json({ error: (e as Error).message ?? 'Unexpected error.' }, 500);
  }
});
