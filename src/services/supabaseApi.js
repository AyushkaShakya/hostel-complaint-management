// LIVE API (Supabase)
// ---------------------------------------------------------------------------
// Same functions and data shapes as demoApi.js, backed by Supabase.
// Row-Level Security (supabase/*.sql) decides which rows each user can
// read, so the queries below simply ask for everything and get only what the
// logged-in role is allowed to see.
import { supabase, functionErrorMessage } from './supabaseClient';

export class ApiError extends Error {}

const empty = () => ({ users: [], complaints: [], fines: [], emails: [] });
let db = empty();
let sessionUserId = null;

const clone = (v) => JSON.parse(JSON.stringify(v));
export const snapshot = () => clone(db);
export const getSessionUserId = () => sessionUserId;

function fail(error, fallback) {
  // Postgres "raise exception" messages are written for users; pass them on.
  throw new ApiError(error?.message || fallback);
}

async function fetchAll() {
  const { data: { session } } = await supabase.auth.getSession();
  sessionUserId = session?.user?.id ?? null;
  if (!sessionUserId) {
    db = empty();
    return;
  }

  const [pp, me, cs, hs, fs, ns] = await Promise.all([
    supabase.from('public_profiles').select('*'),
    supabase.from('profiles').select('*').eq('id', sessionUserId).maybeSingle(),
    supabase.from('complaints').select('*'),
    supabase.from('complaint_history').select('*').order('created_at', { ascending: true }),
    supabase.from('fines').select('*'),
    supabase.from('notifications').select('*').eq('user_id', sessionUserId).order('created_at', { ascending: false }),
  ]);
  const err = [pp, me, cs, hs, fs, ns].find((r) => r.error)?.error;
  if (err) fail(err, 'Could not load your data.');

  const users = pp.data.map((p) => ({
    id: p.id,
    role: p.role,
    block: p.block ?? undefined,
    nickname: p.nickname ?? undefined,
    name: p.staff_name ?? undefined, // students' real names are never sent to staff
  }));
  const self = users.find((u) => u.id === sessionUserId);
  if (self && me.data) {
    Object.assign(self, {
      name: me.data.name,
      email: me.data.email,
      rollNo: me.data.roll_no ?? undefined,
      room: me.data.room ?? undefined,
      employeeId: me.data.employee_id ?? undefined,
    });
  }

  const historyBy = {};
  hs.data.forEach((h) => {
    (historyBy[h.complaint_id] ??= []).push({ status: h.status, at: h.created_at, by: h.by_label, note: h.note ?? '' });
  });

  const roleOf = Object.fromEntries(users.map((u) => [u.id, u.role]));

  db = {
    users,
    complaints: cs.data.map((c) => ({
      id: c.id,
      code: c.code,
      studentId: c.student_id,
      category: c.category,
      title: c.title,
      description: c.description,
      location: c.location ?? '',
      route: c.route,
      block: c.block,
      againstWardenId: c.against_warden_id,
      hideFromChief: c.hide_from_chief,
      status: c.status,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      history: historyBy[c.id] ?? [{ status: 'pending', at: c.created_at, by: 'Student', note: '' }],
    })),
    fines: fs.data.map((f) => ({
      id: f.id,
      studentId: f.student_id,
      issuedById: f.issued_by,
      issuedByRole: roleOf[f.issued_by],
      amount: f.amount,
      reason: f.reason,
      complaintId: f.complaint_id,
      status: f.status,
      createdAt: f.created_at,
      paidAt: f.paid_at,
      payment: f.razorpay_payment_id
        ? { paymentId: f.razorpay_payment_id, orderId: f.razorpay_order_id, receiptNo: f.receipt_no, method: f.method }
        : undefined,
    })),
    emails: ns.data.map((n) => ({
      id: n.id, to: n.user_id, kind: n.kind, subject: n.subject, body: n.body, at: n.created_at, read: n.read,
    })),
  };
}

export async function loadDatabase() {
  await fetchAll();
  return snapshot();
}

export async function login(roleKey, email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    if (/confirm/i.test(error.message)) throw new ApiError('Confirm your email first: open the link we sent you, then log in.');
    throw new ApiError('That email and password combination is not recognised.');
  }
  const { data: prof } = await supabase.from('public_profiles').select('role').eq('id', data.user.id).maybeSingle();
  if (!prof) {
    await supabase.auth.signOut();
    throw new ApiError('Your account has no profile yet. Sign up again or contact the administrator.');
  }
  if (prof.role !== roleKey) {
    await supabase.auth.signOut();
    throw new ApiError('This account is registered on a different portal. Switch portals above and try again.');
  }
  await fetchAll();
  return data.user.id;
}

export async function logout() {
  await supabase.auth.signOut();
  sessionUserId = null;
  db = empty();
}

export async function signup(roleKey, data) {
  if (roleKey === 'student') {
    const { data: ok, error } = await supabase.rpc('nickname_available', { p_nickname: data.nickname });
    if (error) fail(error, 'Could not check the nickname.');
    if (!ok) throw new ApiError('That nickname is taken. Choose another one.');
  } else {
    const { data: ok, error } = await supabase.rpc('check_staff_code', { p_code: data.staffCode ?? '' });
    if (error) fail(error, 'Could not check the staff access code.');
    if (!ok) throw new ApiError('That staff access code is not correct. Ask the hostel administrator for it.');
  }

  const { data: res, error } = await supabase.auth.signUp({
    email: data.email.trim().toLowerCase(),
    password: data.password,
    options: {
      data: {
        role: roleKey,
        name: data.name,
        block: data.block ?? null,
        nickname: data.nickname ?? null,
        roll_no: data.rollNo ?? null,
        room: data.room ?? null,
        employee_id: data.employeeId ?? null,
        staff_code: data.staffCode ?? null,
      },
    },
  });
  if (error) {
    if (/already registered|already exists/i.test(error.message)) throw new ApiError('An account with this email already exists. Log in instead.');
    if (/database error/i.test(error.message)) throw new ApiError('Sign-up was rejected. Check your block, nickname and access code, then try again.');
    fail(error, 'Sign-up failed.');
  }
  // Supabase returns no session when "Confirm email" is switched on.
  if (!res.session) return { needsConfirmation: true };
  await fetchAll();
  return res.user.id;
}

export async function updateNickname(_userId, nickname) {
  const { error } = await supabase.rpc('update_nickname', { p_nickname: nickname.trim() });
  if (error) fail(error, 'Could not update the nickname.');
  await fetchAll();
}

export async function createComplaint(_userId, input) {
  // Routing (route, block, visibility) is decided by a database trigger,
  // so a student cannot pick who sees the complaint by editing requests.
  const { data, error } = await supabase
    .from('complaints')
    .insert({
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      location: input.location?.trim() ?? '',
      against_warden_id: input.againstWardenId || null,
      hide_from_chief: Boolean(input.hideFromChief),
    })
    .select('id')
    .single();
  if (error) fail(error, 'Could not submit the complaint.');
  await fetchAll();
  return data.id;
}

export async function updateComplaintStatus(_userId, complaintId, status, note) {
  const { error } = await supabase.rpc('update_complaint_status', {
    p_complaint: complaintId, p_status: status, p_note: note?.trim() ?? '',
  });
  if (error) fail(error, 'Could not update the status.');
  await fetchAll();
}

export async function issueFine(_userId, input) {
  const { data, error } = await supabase.rpc('issue_fine', {
    p_student: input.studentId,
    p_amount: Number(input.amount),
    p_reason: input.reason.trim(),
    p_complaint: input.complaintId || null,
  });
  if (error) fail(error, 'Could not issue the fine.');
  await fetchAll();
  return data;
}

/** Called after Razorpay Checkout succeeds; the server verifies the signature. */
export async function recordFinePayment(_userId, fineId, payment) {
  const { error } = await supabase.functions.invoke('verify-payment', {
    body: {
      fineId,
      razorpay_order_id: payment.razorpay_order_id,
      razorpay_payment_id: payment.razorpay_payment_id,
      razorpay_signature: payment.razorpay_signature,
    },
  });
  if (error) throw new ApiError(await functionErrorMessage(error, 'The payment could not be verified.'));
  await fetchAll();
}

export async function markEmailRead(emailId) {
  const e = db.emails.find((x) => x.id === emailId);
  if (!e || e.read) return;
  e.read = true;
  await supabase.from('notifications').update({ read: true }).eq('id', emailId);
}

export async function resetDemo() {
  /* Not available in live mode. */
}
