import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../store/ToastContext';
import { CATEGORIES, categoryOf } from '../../config/constants';
import { Card, PageHeader } from '../../components/ui/Card';
import { Input, Select, Textarea, Checkbox } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { Alert } from '../../components/ui/States';
import AudienceStack from '../../components/AudienceStack';
import { audienceFor, buildRouting } from '../../services/routing';

const EMPTY = { category: '', title: '', description: '', location: '', againstWardenId: '', hideFromChief: false };

export default function NewComplaint() {
  const { db, user, createComplaint } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const wardens = db.users.filter((u) => u.role === 'warden').sort((a, b) => a.block.localeCompare(b.block));
  const route = categoryOf(form.category)?.route;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const pickCategory = (e) => {
    const category = e.target.value;
    const ownWarden = wardens.find((w) => w.block === user.block);
    setForm((f) => ({
      ...f,
      category,
      againstWardenId: categoryOf(category)?.route === 'bypass' ? f.againstWardenId || ownWarden?.id || '' : '',
      hideFromChief: categoryOf(category)?.route === 'dean' ? f.hideFromChief : false,
    }));
  };

  const preview = useMemo(() => {
    if (!form.category) return null;
    const r = buildRouting({ ...form, student: user });
    const audience = audienceFor(r);
    const hidden = [];
    if (r.route === 'bypass') {
      const w = wardens.find((x) => x.id === form.againstWardenId);
      hidden.push(w ? `Warden, Block ${w.block}` : 'The Warden concerned');
    }
    if (r.route === 'warden') hidden.push('Wardens of other blocks');
    if (r.route === 'dean') {
      if (r.hideFromChief) hidden.push('Chief Warden');
      hidden.push('All Wardens');
    }
    return { audience, hidden };
  }, [form, user, wardens]);

  const validate = () => {
    const v = {};
    if (!form.category) v.category = 'Choose a category.';
    if (form.title.trim().length < 5) v.title = 'Write a short title of at least 5 characters.';
    if (form.description.trim().length < 20) v.description = 'Describe the issue in at least 20 characters.';
    if (route === 'bypass' && !form.againstWardenId) v.againstWardenId = 'Choose the Warden this complaint is about.';
    setErrors(v);
    return Object.keys(v).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSaving(true);
    try {
      const id = await createComplaint(form);
      const c = db.complaints.find((x) => x.id === id);
      toast('Complaint submitted', { detail: 'You will get an email whenever its status changes.' });
      navigate(`/student/complaints/${id}`, { state: { justCreated: c?.code ?? true } });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Raise a complaint" subtitle="Your complaint is filed under your nickname and routed automatically." />
      <div className="grid-form">
        <Card>
          <form onSubmit={submit} noValidate className="form-stack">
            <Select label="Category" value={form.category} onChange={pickCategory} error={errors.category}>
              <option value="">Choose a category</option>
              <optgroup label="Facility issues">
                {CATEGORIES.filter((c) => c.route === 'warden').map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </optgroup>
              <optgroup label="Sensitive">
                {CATEGORIES.filter((c) => c.route !== 'warden').map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </optgroup>
            </Select>

            {route === 'bypass' && (
              <Select label="Which Warden is this about?" value={form.againstWardenId} onChange={set('againstWardenId')} error={errors.againstWardenId}
                hint="This Warden will not be able to see the complaint.">
                <option value="">Choose a Warden</option>
                {wardens.map((w) => <option key={w.id} value={w.id}>Block {w.block} Warden ({w.name})</option>)}
              </Select>
            )}

            {route === 'dean' && (
              <div className="sensitive-box">
                <Checkbox
                  label="Keep this complaint hidden from the Chief Warden"
                  description="Only the Dean will be able to see it."
                  checked={form.hideFromChief}
                  onChange={set('hideFromChief')}
                />
              </div>
            )}

            <Input label="Title" maxLength={90} value={form.title} onChange={set('title')} error={errors.title} placeholder="For example: No water in second-floor washroom" />
            <Textarea label="Description" rows={5} value={form.description} onChange={set('description')} error={errors.description}
              hint="Say what is wrong, since when, and anything already tried." />
            {route !== 'dean' && route !== 'bypass' && (
              <Input label="Location" required={false} value={form.location} onChange={set('location')} placeholder={`For example: Block ${user.block}, 2nd floor washroom`} />
            )}
            {error && <Alert tone="error">{error}</Alert>}
            <div className="form-actions">
              <Button variant="ghost" type="button" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" loading={saving}>Submit complaint</Button>
            </div>
          </form>
        </Card>

        <aside className="routing-preview" aria-live="polite">
          <Card title="Who will see this">
            {preview ? (
              <>
                <AudienceStack audience={preview.audience} hidden={preview.hidden} />
                <p className="muted small">
                  Everyone listed sees your nickname, <strong className="nick">{user.nickname}</strong>, not your name.
                </p>
              </>
            ) : (
              <p className="muted">Choose a category to see exactly who your complaint goes to.</p>
            )}
          </Card>
          <p className="muted small preview-foot">
            Need to report something else? <Link to="/student/complaints">See your existing complaints</Link>.
          </p>
        </aside>
      </div>
    </>
  );
}
