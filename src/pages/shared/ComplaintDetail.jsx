import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../store/ToastContext';
import { Card, PageHeader } from '../../components/ui/Card';
import { StatusBadge, RouteBadge } from '../../components/ui/Badge';
import { Select, Textarea } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import { Alert, EmptyState } from '../../components/ui/States';
import StatusTrack from '../../components/StatusTrack';
import AudienceStack from '../../components/AudienceStack';
import IssueFineModal from '../../components/IssueFineModal';
import { ROLES, STATUSES, STATUS_LABEL, categoryLabel } from '../../config/constants';
import { audienceFor, canUpdateComplaint, canViewComplaint, studentDisplayName } from '../../services/routing';
import { formatDateTime } from '../../services/format';
import { rupees } from '../../services/format';
import { NOTIFIED_NOTE } from '../../config/env';

export default function ComplaintDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { db, user, updateStatus } = useStore();
  const toast = useToast();
  const base = `/${ROLES[user.role].path}`;
  const c = db.complaints.find((x) => x.id === id);

  const [status, setStatus] = useState(c?.status ?? 'pending');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fineOpen, setFineOpen] = useState(false);

  const back = (
    <Link to={`${base}/complaints`} className="back-link">
      <Icon name="back" size={16} /> {user.role === 'student' ? 'My complaints' : 'Complaints'}
    </Link>
  );

  // Same outcome as RLS: a complaint you cannot see simply does not exist for you.
  if (!c || !canViewComplaint(user, c)) {
    return (
      <>
        <PageHeader title="Complaint not found" back={back} />
        <Card>
          <EmptyState icon="lock" title="This complaint is not available to you" action={<Button to={`${base}/complaints`}>Back to complaints</Button>}>
            It may not exist, or it is routed to a different authority.
          </EmptyState>
        </Card>
      </>
    );
  }

  const student = db.users.find((u) => u.id === c.studentId);
  const isStaff = user.role !== 'student';
  const canUpdate = canUpdateComplaint(user, c);
  const againstWarden = c.againstWardenId ? db.users.find((u) => u.id === c.againstWardenId) : null;
  const linkedFines = db.fines.filter((f) => f.complaintId === c.id && (isStaff || f.studentId === user.id));
  const hidden = [];
  if (c.route === 'bypass' && againstWarden) hidden.push(`Warden, Block ${againstWarden.block}`);
  if (c.route === 'dean' && c.hideFromChief) hidden.push('Chief Warden');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (status === c.status && !note.trim()) {
      setError('Choose a different status or add a note for the student.');
      return;
    }
    setSaving(true);
    try {
      await updateStatus(c.id, status, note);
      setNote('');
      toast(`Marked ${STATUS_LABEL[status]}`, { detail: NOTIFIED_NOTE });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const facts = [
    ['Category', categoryLabel(c.category)],
    ['Filed by', <span className="nick" key="n">{studentDisplayName(user, student)}</span>],
    ['Block', `Block ${c.block}`],
    c.location && ['Location', c.location],
    againstWarden && ['About', `Warden, Block ${againstWarden.block}`],
    ['Filed on', formatDateTime(c.createdAt)],
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        back={back}
        title={c.title}
        subtitle={<span className="detail-meta"><span className="row-code">{c.code}</span><StatusBadge status={c.status} />{isStaff && <RouteBadge route={c.route} />}</span>}
        actions={isStaff && <Button variant="secondary" onClick={() => setFineOpen(true)}>Issue fine</Button>}
      />

      {location.state?.justCreated && user.role === 'student' && (
        <Alert>Complaint {c.code} submitted. It has been routed to the people listed under "Who can see this".</Alert>
      )}
      {user.role === 'dean' && c.hideFromChief && (
        <Alert tone="private">The student asked to keep this complaint hidden from the Chief Warden. Only you can see it.</Alert>
      )}

      <div className="grid-2-1">
        <div className="stack">
          <Card title="Details">
            <p className="prose">{c.description}</p>
            <dl className="dl dl-grid">
              {facts.map(([k, v]) => (
                <div className="dl-row" key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </Card>

          <Card title="Status">
            <StatusTrack complaint={c} />
            <ol className="timeline">
              {[...c.history].reverse().map((h, i) => (
                <li key={i} className="timeline-item">
                  <div className="timeline-head">
                    <StatusBadge status={h.status} />
                    <span className="muted small">{h.by}, {formatDateTime(h.at)}</span>
                  </div>
                  {h.note && <p className="timeline-note">{h.note}</p>}
                  {i === c.history.length - 1 && !h.note && <p className="timeline-note muted">Complaint filed.</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="stack">
          {canUpdate && (
            <Card title="Update status">
              <form onSubmit={submit} className="form-stack" noValidate>
                <Select label="New status" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </Select>
                <Textarea label="Note to student" required={false} rows={3} value={note} onChange={(e) => setNote(e.target.value)}
                  hint="Included in the email the student receives." />
                {error && <Alert tone="error">{error}</Alert>}
                <Button type="submit" loading={saving} className="btn-block">Update status</Button>
              </form>
            </Card>
          )}
          <Card title="Who can see this">
            <AudienceStack audience={audienceFor(c)} hidden={hidden} />
            {isStaff && <p className="muted small">Shown to staff by nickname only.</p>}
          </Card>
          {linkedFines.length > 0 && (
            <Card title="Related fines">
              <ul className="mini-list">
                {linkedFines.map((f) => (
                  <li key={f.id} className="mini-item">
                    <span className="mini-title">{rupees(f.amount)}: {f.reason}</span>
                    <span className="muted small">{f.status === 'paid' ? 'Paid' : 'Unpaid'}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
      {fineOpen && <IssueFineModal open presetComplaintId={c.id} onClose={() => setFineOpen(false)} />}
    </>
  );
}
