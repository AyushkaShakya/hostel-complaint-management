// DEMO API
// ---------------------------------------------------------------------------
// Every screen talks to the backend only through these functions. Right now
// they read and write a local demo database (seed.js + localStorage) with a
// short artificial delay so loading states are visible.
//
// To go live, replace each function body with the Supabase equivalent, e.g.
//   login     -> supabase.auth.signInWithPassword(...) + read profiles.role
//   complaints-> supabase.from('complaints').select('*')   (RLS filters rows)
//   updateStatus -> update row; an Edge Function on UPDATE sends the email
//   payFine   -> Edge Function creates a Razorpay order, Checkout pays it,
//               webhook verifies signature and marks the fine paid
// The function names and return shapes can stay the same.
import { createSeed } from '../data/seed';
import { readJSON, writeJSON } from './storage';
import { buildRouting, canFineStudent, canUpdateComplaint, staffTitle } from './routing';
import { STATUS_LABEL, categoryLabel } from '../config/constants';
import { rupees, uid } from './format';

const DB_KEY = 'hcms-demo-db-v1';
const SESSION_KEY = 'hcms-demo-session';

const wait = (ms = 500) => new Promise((r) => setTimeout(r, ms));
const clone = (v) => JSON.parse(JSON.stringify(v));
const now = () => new Date().toISOString();

let db = null;

function save() {
  writeJSON(DB_KEY, db);
}

export class ApiError extends Error {}

function pushEmail(toId, kind, subject, body) {
  db.emails.unshift({ id: uid('e'), to: toId, kind, subject, body, at: now(), read: false });
}

function requireUser(userId) {
  const u = db.users.find((x) => x.id === userId);
  if (!u) throw new ApiError('Your session has expired. Log in again.');
  return u;
}

export async function loadDatabase() {
  await wait(450);
  db = readJSON(DB_KEY) ?? createSeed();
  save();
  return clone(db);
}

export const snapshot = () => clone(db);

export const getSessionUserId = () => readJSON(SESSION_KEY);

export async function login(roleKey, email, password) {
  await wait(600);
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.password !== password) {
    throw new ApiError('That email and password combination is not recognised.');
  }
  if (user.role !== roleKey) {
    throw new ApiError('This account is registered on a different portal. Switch portals above and try again.');
  }
  writeJSON(SESSION_KEY, user.id);
  return user.id;
}

export function logout() {
  writeJSON(SESSION_KEY, null);
}

export async function signup(roleKey, data) {
  await wait(700);
  const email = data.email.trim().toLowerCase();
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    throw new ApiError('An account with this email already exists. Log in instead.');
  }
  if (roleKey === 'student' && db.users.some((u) => u.nickname?.toLowerCase() === data.nickname.trim().toLowerCase())) {
    throw new ApiError('That nickname is taken. Choose another one.');
  }
  const user = { id: uid('u'), role: roleKey, ...data, email };
  if (user.nickname) user.nickname = user.nickname.trim();
  db.users.push(user);
  save();
  writeJSON(SESSION_KEY, user.id);
  return user.id;
}

export async function updateNickname(userId, nickname) {
  await wait(500);
  const user = requireUser(userId);
  const clean = nickname.trim();
  if (db.users.some((u) => u.id !== userId && u.nickname?.toLowerCase() === clean.toLowerCase())) {
    throw new ApiError('That nickname is taken. Choose another one.');
  }
  user.nickname = clean;
  save();
}

export async function createComplaint(userId, input) {
  await wait(700);
  const student = requireUser(userId);
  const routing = buildRouting({ ...input, student });
  const n = db.nextComplaintNo++;
  const at = now();
  const complaint = {
    id: uid('c'),
    code: `HC-${1000 + n}`,
    studentId: student.id,
    category: input.category,
    title: input.title.trim(),
    description: input.description.trim(),
    location: input.location?.trim() ?? '',
    ...routing,
    status: 'pending',
    createdAt: at,
    updatedAt: at,
    history: [{ status: 'pending', at, by: 'Student', note: '' }],
  };
  db.complaints.unshift(complaint);
  save();
  return complaint.id;
}

export async function updateComplaintStatus(userId, complaintId, status, note) {
  await wait(600);
  const user = requireUser(userId);
  const c = db.complaints.find((x) => x.id === complaintId);
  if (!c || !canUpdateComplaint(user, c)) throw new ApiError('You do not have permission to update this complaint.');
  if (c.status === status && !note) throw new ApiError('Choose a different status or add a note.');
  const at = now();
  const by = staffTitle(user);
  c.status = status;
  c.updatedAt = at;
  c.history.push({ status, at, by, note: note?.trim() ?? '' });
  pushEmail(
    c.studentId,
    'status',
    `${c.code} is now ${STATUS_LABEL[status]}`,
    `Your complaint "${c.title}" was moved to ${STATUS_LABEL[status]} by ${by}.${note ? `\n\nNote: ${note.trim()}` : ''}`,
  );
  save();
}

export async function issueFine(userId, input) {
  await wait(600);
  const user = requireUser(userId);
  const student = db.users.find((u) => u.id === input.studentId);
  if (!canFineStudent(user, student)) throw new ApiError('You can only fine students you are responsible for.');
  const fine = {
    id: uid('f'),
    studentId: student.id,
    issuedById: user.id,
    issuedByRole: user.role,
    amount: Number(input.amount),
    reason: input.reason.trim(),
    complaintId: input.complaintId || null,
    status: 'unpaid',
    createdAt: now(),
  };
  db.fines.unshift(fine);
  const linked = fine.complaintId ? db.complaints.find((c) => c.id === fine.complaintId) : null;
  pushEmail(
    student.id,
    'fine',
    `Fine issued: ${rupees(fine.amount)}`,
    `A fine of ${rupees(fine.amount)} has been issued by ${staffTitle(user)}.\n\nReason: ${fine.reason}${linked ? `\nRelated complaint: ${linked.code} (${categoryLabel(linked.category)})` : ''}\n\nYou can pay it from the Fines page.`,
  );
  save();
  return fine.id;
}

export async function recordFinePayment(userId, fineId, payment) {
  await wait(300);
  const fine = db.fines.find((f) => f.id === fineId);
  if (!fine || fine.studentId !== userId) throw new ApiError('This fine was not found on your account.');
  if (fine.status === 'paid') throw new ApiError('This fine is already paid.');
  fine.status = 'paid';
  fine.paidAt = now();
  fine.payment = payment;
  pushEmail(
    userId,
    'payment',
    `Payment received: ${rupees(fine.amount)}`,
    `We received your payment of ${rupees(fine.amount)} for "${fine.reason}".\n\nReceipt: ${payment.receiptNo}\nPayment ID: ${payment.paymentId}`,
  );
  save();
}

export async function markEmailRead(emailId) {
  const e = db.emails.find((x) => x.id === emailId);
  if (e && !e.read) {
    e.read = true;
    save();
  }
}

export async function resetDemo() {
  await wait(400);
  db = createSeed();
  save();
}
