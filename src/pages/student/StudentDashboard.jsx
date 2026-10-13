import { Link } from 'react-router-dom';
import { useStore } from '../../store/StoreContext';
import { visibleComplaints, visibleFines } from '../../store/selectors';
import { Card, StatCard, PageHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ComplaintTable from '../../components/ComplaintTable';
import { Alert } from '../../components/ui/States';
import { rupees, timeAgo } from '../../services/format';

export default function StudentDashboard() {
  const { db, user } = useStore();
  const complaints = visibleComplaints(db, user);
  const fines = visibleFines(db, user);
  const open = complaints.filter((c) => c.status !== 'resolved').length;
  const resolved = complaints.filter((c) => c.status === 'resolved').length;
  const unpaid = fines.filter((f) => f.status === 'unpaid');
  const dues = unpaid.reduce((s, f) => s + f.amount, 0);
  const emails = db.emails.filter((e) => e.to === user.id).slice(0, 3);

  return (
    <>
      <PageHeader
        title={`Hello, ${user.name.split(' ')[0]}`}
        subtitle={`Block ${user.block}, room ${user.room}`}
        actions={<Button to="/student/new">Raise complaint</Button>}
      />
      <Alert tone="private">
        Staff see you as <strong className="nick">{user.nickname}</strong>. Your real name is never shown to them.{' '}
        <Link to="/student/profile">Change nickname</Link>
      </Alert>

      <div className="stats">
        <StatCard tone="dark" label="Open complaints" value={open} note="Pending or in progress" />
        <StatCard label="Resolved" value={resolved} />
        <StatCard label="Fines due" value={rupees(dues)} note={unpaid.length ? `${unpaid.length} unpaid` : 'Nothing to pay'} />
      </div>

      <div className="grid-2-1">
        <Card title="Recent complaints" action={<Link to="/student/complaints" className="card-link">View all</Link>} pad={false}>
          <ComplaintTable
            complaints={complaints.slice(0, 5)}
            db={db}
            viewer={user}
            basePath="/student"
            compact
            emptyAction={<Button to="/student/new" size="sm">Raise your first complaint</Button>}
          />
        </Card>
        <Card title="Latest emails" action={<Link to="/student/inbox" className="card-link">Inbox</Link>}>
          {emails.length === 0 ? (
            <p className="muted">Status updates and fine notices will arrive here.</p>
          ) : (
            <ul className="mini-list">
              {emails.map((e) => (
                <li key={e.id}>
                  <Link to="/student/inbox" className={`mini-item ${e.read ? '' : 'is-unread'}`}>
                    <span className="mini-title">{e.subject}</span>
                    <span className="muted small">{timeAgo(e.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
