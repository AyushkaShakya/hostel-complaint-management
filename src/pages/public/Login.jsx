import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { Input } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { Alert, PageLoader } from '../../components/ui/States';
import { useStore } from '../../store/StoreContext';
import { ROLES, roleFromPath } from '../../config/constants';
import { IS_LIVE } from '../../config/env';

export default function Login() {
  const { rolePath } = useParams();
  const role = roleFromPath(rolePath);
  const { ready, user, db, login } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!role) return <Navigate to="/portals" replace />;
  if (!ready) return <div className="center-screen"><PageLoader /></div>;
  if (user) return <Navigate to={`/${ROLES[user.role].path}`} replace />;

  const demoAccounts = db.users.filter((u) => u.role === role.key).slice(0, role.key === 'student' ? 2 : 4);

  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) v.email = 'Enter a valid email address.';
    if (!password) v.password = 'Enter your password.';
    setErrors(v);
    setError('');
    if (Object.keys(v).length) return;
    setLoading(true);
    try {
      await login(role.key, email, password);
      const from = location.state?.from;
      navigate(from?.startsWith(`/${role.path}`) ? from : `/${role.path}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <AuthLayout role={role} mode="login">
      <h1 className="page-title">Log in as {role.label}</h1>
      <p className="page-sub">
        New here? <Link to={`/signup/${role.path}`}>Create a {role.label} account</Link>
      </p>
      <form onSubmit={submit} noValidate className="form-stack">
        <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" size="lg" loading={loading} className="btn-block">Log in</Button>
      </form>

      {!IS_LIVE && <div className="demo-accounts">
        <p className="demo-accounts-title">Demo accounts (password: demo123)</p>
        <ul>
          {demoAccounts.map((u) => (
            <li key={u.id}>
              <button type="button" className="demo-account" onClick={() => { setEmail(u.email); setPassword('demo123'); setErrors({}); setError(''); }}>
                <span>{u.role === 'warden' ? `Block ${u.block}` : u.name}</span>
                <span className="muted">{u.email}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>}
    </AuthLayout>
  );
}
