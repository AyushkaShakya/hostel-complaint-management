import { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../store/ToastContext';
import { Card, PageHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { Alert } from '../../components/ui/States';

export default function Profile() {
  const { user, updateNickname } = useStore();
  const toast = useToast();
  const [nickname, setNickname] = useState(user.nickname);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    const clean = nickname.trim();
    if (!/^[A-Za-z0-9_]{3,20}$/.test(clean)) return setError('Use 3 to 20 letters, numbers or underscores.');
    if (clean === user.nickname) return setError('This is already your nickname.');
    setError('');
    setSaving(true);
    try {
      await updateNickname(clean);
      toast('Nickname updated', { detail: `Staff now see you as ${clean}.` });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const rows = [
    ['Full name', user.name],
    ['Email', user.email],
    ['Roll number', user.rollNo],
    ['Block', `Block ${user.block}`],
    ['Room', user.room],
  ];

  return (
    <>
      <PageHeader title="Profile" subtitle="Your account details and the nickname staff see." />
      <div className="grid-2">
        <Card title="Nickname">
          <form onSubmit={save} noValidate className="form-stack">
            <Alert tone="private">Wardens, the Chief Warden and the Dean only ever see this nickname.</Alert>
            <Input label="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} error={error} hint="Changing it updates every complaint and fine you have." />
            <div className="form-actions">
              <Button type="submit" loading={saving}>Save nickname</Button>
            </div>
          </form>
        </Card>
        <Card title="Account details">
          <dl className="dl">
            {rows.map(([k, v]) => (
              <div className="dl-row" key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          <p className="muted small">Visible only to you.</p>
        </Card>
      </div>
    </>
  );
}
