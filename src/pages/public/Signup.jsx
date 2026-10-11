import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { Input, Select } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { Alert, PageLoader } from '../../components/ui/States';
import { useStore } from '../../store/StoreContext';
import { BLOCKS, ROLES, roleFromPath } from '../../config/constants';
import { IS_LIVE } from '../../config/env';

const EMPTY = { name: '', email: '', password: '', confirm: '', rollNo: '', block: '', room: '', nickname: '', employeeId: '', staffCode: '' };

export default function Signup() {
  const { rolePath } = useParams();
  const role = roleFromPath(rolePath);
  const { ready, user, signup } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  if (!role) return <Navigate to="/portals" replace />;
  if (!ready) return <div className="center-screen"><PageLoader /></div>;
  if (user) return <Navigate to={`/${ROLES[user.role].path}`} replace />;

  const isStudent = role.key === 'student';
  const needsBlock = isStudent || role.key === 'warden';
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const v = {};
    if (form.name.trim().length < 3) v.name = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) v.email = 'Enter a valid email address.';
    if (form.password.length < 6) v.password = 'Use at least 6 characters.';
    if (form.confirm !== form.password) v.confirm = 'Passwords do not match.';
    if (needsBlock && !form.block) v.block = 'Choose a block.';
    if (isStudent) {
      if (!form.rollNo.trim()) v.rollNo = 'Enter your roll number.';
      if (!form.room.trim()) v.room = 'Enter your room number.';
      if (!/^[A-Za-z0-9_]{3,20}$/.test(form.nickname.trim())) v.nickname = 'Use 3 to 20 letters, numbers or underscores.';
      else if (form.nickname.trim().toLowerCase() === form.name.trim().split(' ')[0].toLowerCase()) v.nickname = 'Pick a nickname that is not your real name.';
    } else {
      if (!form.employeeId.trim()) v.employeeId = 'Enter your employee ID.';
      if (IS_LIVE && !form.staffCode.trim()) v.staffCode = 'Enter the staff access code from the hostel office.';
    }
    setErrors(v);
    return Object.keys(v).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    const data = { name: form.name.trim(), email: form.email, password: form.password };
    if (needsBlock) data.block = form.block;
    if (isStudent) Object.assign(data, { rollNo: form.rollNo.trim(), room: form.room.trim(), nickname: form.nickname.trim() });
    else Object.assign(data, { employeeId: form.employeeId.trim(), staffCode: form.staffCode.trim() });
    try {
      const result = await signup(role.key, data);
      if (result?.needsConfirmation) {
        setConfirmSent(true);
        setLoading(false);
        return;
      }
      navigate(`/${role.path}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (confirmSent) {
    return (
      <AuthLayout role={role} mode="signup">
        <h1 className="page-title">Check your email</h1>
        <p className="page-sub">
          We sent a confirmation link to <strong>{form.email}</strong>. Open it, then come back and log in.
        </p>
        <Button to={`/login/${role.path}`} size="lg">Go to log in</Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout role={role} mode="signup">
      <h1 className="page-title">Create a {role.label} account</h1>
      <p className="page-sub">
        Already registered? <Link to={`/login/${role.path}`}>Log in</Link>
      </p>
      <form onSubmit={submit} noValidate className="form-stack">
        <Input label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name}
          hint={isStudent ? 'Only you can see your real name.' : undefined} />
        <Input label={isStudent ? 'College email' : 'Official email'} type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        {isStudent ? (
          <>
            <div className="form-row">
              <Input label="Roll number" value={form.rollNo} onChange={set('rollNo')} error={errors.rollNo} />
              <Select label="Block" value={form.block} onChange={set('block')} error={errors.block}>
                <option value="">Choose</option>
                {BLOCKS.map((b) => <option key={b} value={b}>Block {b}</option>)}
              </Select>
            </div>
            <Input label="Room number" placeholder="e.g. A-204" value={form.room} onChange={set('room')} error={errors.room} />
            <Input label="Nickname" value={form.nickname} onChange={set('nickname')} error={errors.nickname}
              hint="Staff will see this instead of your name. You can change it later." />
          </>
        ) : (
          <div className="form-row">
            <Input label="Employee ID" value={form.employeeId} onChange={set('employeeId')} error={errors.employeeId} />
            {needsBlock && (
              <Select label="Block you manage" value={form.block} onChange={set('block')} error={errors.block}>
                <option value="">Choose</option>
                {BLOCKS.map((b) => <option key={b} value={b}>Block {b}</option>)}
              </Select>
            )}
          </div>
        )}
        {!isStudent && IS_LIVE && (
          <Input label="Staff access code" value={form.staffCode} onChange={set('staffCode')} error={errors.staffCode}
            hint="Given by the hostel office. It stops students from signing up as staff." />
        )}
        <div className="form-row">
          <Input label="Password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} />
          <Input label="Confirm password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" size="lg" loading={loading} className="btn-block">Create account</Button>
      </form>
    </AuthLayout>
  );
}
