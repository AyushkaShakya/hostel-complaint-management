// Supabase Edge Function: create-order
// Creates a Razorpay order for one unpaid fine that belongs to the caller.
// Secrets needed: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) return json({ error: 'Razorpay keys are not set on the server.' }, 500);

    // Client acting as the logged-in user, so Row-Level Security applies.
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Log in again to pay this fine.' }, 401);

    const { fineId } = await req.json();
    const { data: fine } = await userClient
      .from('fines')
      .select('id, student_id, amount, status')
      .eq('id', fineId)
      .maybeSingle();
    if (!fine || fine.student_id !== user.id) return json({ error: 'This fine was not found on your account.' }, 404);
    if (fine.status === 'paid') return json({ error: 'This fine is already paid.' }, 400);

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount: fine.amount * 100, // rupees to paise
        currency: 'INR',
        receipt: `fine_${fine.id.slice(0, 30)}`,
        notes: { fine_id: fine.id },
      }),
    });
    const order = await res.json();
    if (!res.ok) return json({ error: order?.error?.description ?? 'Razorpay could not create the order.' }, 502);

    // Remember the order so verify-payment can check it matches.
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error: saveError } = await admin.from('fines').update({ razorpay_order_id: order.id }).eq('id', fine.id);
    if (saveError) return json({ error: 'Could not save the order.' }, 500);

    return json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId });
  } catch (e) {
    return json({ error: (e as Error).message ?? 'Unexpected error.' }, 500);
  }
});
