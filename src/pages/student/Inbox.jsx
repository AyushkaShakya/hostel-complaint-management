import { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { Card, PageHeader } from '../../components/ui/Card';
import { Alert, EmptyState } from '../../components/ui/States';
import Icon from '../../components/ui/Icon';
import { formatDateTime } from '../../services/format';
import { IS_LIVE } from '../../config/env';

const KIND_LABEL = { status: 'Status update', fine: 'Fine issued', payment: 'Payment' };

export default function Inbox() {
  const { db, user, markEmailRead } = useStore();
  const emails = db.emails.filter((e) => e.to === user.id);
  const [openId, setOpenId] = useState(null);

  const toggle = (e) => {
    setOpenId(openId === e.id ? null : e.id);
    if (!e.read) markEmailRead(e.id);
  };

  return (
    <>
      <PageHeader title="Email inbox" subtitle={`Emails sent to ${user.email}`} />
      <Alert>
        {IS_LIVE
          ? 'Notifications are created automatically on every status change, fine and payment. Sending them as real emails (Resend) is the next step.'
          : 'Demo outbox. In the live system these emails are sent automatically by a Supabase Edge Function through Resend or Gmail SMTP.'}
      </Alert>
      <Card pad={false}>
        {emails.length === 0 ? (
          <EmptyState icon="mail" title="No emails yet">You will get an email when a complaint changes status, a fine is issued, or a payment succeeds.</EmptyState>
        ) : (
          <ul className="inbox">
            {emails.map((e) => (
              <li key={e.id} className={`inbox-item ${e.read ? '' : 'is-unread'} ${openId === e.id ? 'is-open' : ''}`}>
                <button className="inbox-head" onClick={() => toggle(e)} aria-expanded={openId === e.id}>
                  <span className={`inbox-kind kind-${e.kind}`}>{KIND_LABEL[e.kind]}</span>
                  <span className="inbox-subject">{e.subject}</span>
                  <span className="inbox-date">{formatDateTime(e.at)}</span>
                  <Icon name="back" size={16} className="inbox-chev" />
                </button>
                {openId === e.id && (
                  <div className="inbox-body">
                    <p className="muted small">From: Hostel Desk &lt;no-reply@hostel.edu&gt;</p>
                    {e.body.split('\n').map((line, i) => (line ? <p key={i}>{line}</p> : <br key={i} />))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
