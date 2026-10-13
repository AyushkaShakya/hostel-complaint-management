import { useMemo, useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Input, Select, Textarea } from './ui/Field';
import { Alert } from './ui/States';
import { useStore } from '../store/StoreContext';
import { useToast } from '../store/ToastContext';
import { canFineStudent } from '../services/routing';
import { visibleComplaints } from '../store/selectors';
import { categoryLabel } from '../config/constants';
import { rupees } from '../services/format';
import { NOTIFIED_NOTE } from '../config/env';

export default function IssueFineModal({ open, onClose, presetComplaintId = '' }) {
  const { db, user, issueFine } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ studentId: '', amount: '', reason: '', complaintId: presetComplaintId });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  const students = useMemo(
    () => db.users.filter((u) => canFineStudent(user, u)).sort((a, b) => a.nickname.localeCompare(b.nickname)),
    [db.users, user],
  );
  const complaints = useMemo(() => visibleComplaints(db, user), [db, user]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.studentId) e.studentId = 'Choose the student to fine.';
    const amt = Number(form.amount);
    if (!form.amount || Number.isNaN(amt) || amt < 1) e.amount = 'Enter an amount of at least ₹1.';
    else if (amt > 10000) e.amount = 'Amounts above ₹10,000 are not allowed.';
    if (form.reason.trim().length < 5) e.reason = 'Describe the reason in at least 5 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSaving(true);
    try {
      await issueFine(form);
      const s = students.find((x) => x.id === form.studentId);
      toast(`Fine of ${rupees(Number(form.amount))} issued to ${s.nickname}`, {
        detail: NOTIFIED_NOTE,
      });
      setForm({ studentId: '', amount: '', reason: '', complaintId: '' });
      onClose();
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Issue a fine">
      <form onSubmit={submit} noValidate className="form-stack">
        <Alert tone="private">Students are listed by nickname only. Real names stay private.</Alert>
        <Select label="Student" value={form.studentId} onChange={set('studentId')} error={errors.studentId}>
          <option value="">Choose a student</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.nickname} (Block {s.block})</option>
          ))}
        </Select>
        <Input label="Amount (₹)" type="number" inputMode="numeric" min="1" max="10000" value={form.amount} onChange={set('amount')} error={errors.amount} />
        <Textarea label="Reason" rows={3} value={form.reason} onChange={set('reason')} error={errors.reason} placeholder="For example: damaged mess furniture" />
        <Select label="Related complaint" required={false} value={form.complaintId} onChange={set('complaintId')} hint="Link the fine to a complaint if it arose from one.">
          <option value="">Not linked to a complaint</option>
          {complaints.map((c) => (
            <option key={c.id} value={c.id}>{c.code}: {categoryLabel(c.category)}, {c.title}</option>
          ))}
        </Select>
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <div className="modal-actions">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Issue fine</Button>
        </div>
      </form>
    </Modal>
  );
}
