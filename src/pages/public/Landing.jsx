import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PublicHeader from '../../components/layout/PublicHeader';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import { StatusBadge } from '../../components/ui/Badge';
import { ROLE_LIST } from '../../config/constants';

const LADDER = [
  { role: 'Dean', note: 'Sees every complaint. Ragging and harassment cases come here first.' },
  { role: 'Chief Warden', note: 'Sees every block, and complaints filed against a Warden.' },
  { role: 'Warden', note: 'Sees routine complaints from their own block only.' },
  { role: 'Student', note: 'Files under a nickname and gets an email on every change.' },
];

const PATHS = [
  {
    title: 'Routine facility issues',
    body: 'Washroom, electricity, Wi-Fi and the other facility categories go to the Warden of your block. The Chief Warden and Dean can see them too.',
    seen: ['Your block Warden', 'Chief Warden', 'Dean'],
    hidden: [],
  },
  {
    title: 'A complaint against a Warden',
    body: 'The Warden you name never sees it. It goes straight to the Chief Warden and the Dean.',
    seen: ['Chief Warden', 'Dean'],
    hidden: ['The Warden concerned'],
  },
  {
    title: 'Ragging or harassment',
    body: 'Goes directly to the Dean. You can choose to keep it hidden from the Chief Warden as well.',
    seen: ['Dean'],
    hidden: ['Chief Warden, if you choose'],
  },
];

export default function Landing() {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo) {
      document.getElementById(location.state.scrollTo)?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.state]);

  return (
    <div className="public">
      <PublicHeader />

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <h1 className="display">Hostel complaints, heard by the right person.</h1>
            <p className="lead">
              Report washroom, electricity, Wi-Fi and other hostel issues under a nickname. Each complaint
              goes to the authority responsible for it, and you get an email every time its status changes.
            </p>
            <div className="hero-actions">
              <Button to="/login/student" size="lg">Raise a complaint</Button>
              <Button to="/portals" variant="secondary" size="lg">Staff log in</Button>
            </div>
          </div>

          <ol className="ladder" aria-label="Who sees what">
            {LADDER.map((l, i) => (
              <li key={l.role} className={`ladder-pill ladder-${i}`} style={{ '--i': i }}>
                <span className="ladder-role">{l.role}</span>
                <span className="ladder-note">{l.note}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="routing" className="section">
        <div className="container">
          <div className="section-head">
            <h2 className="h2">The category you choose decides who reads it</h2>
            <p className="muted">Routing happens automatically when you submit. Nobody forwards complaints by hand.</p>
          </div>
          <div className="paths">
            {PATHS.map((p) => (
              <article key={p.title} className="path">
                <h3 className="h3">{p.title}</h3>
                <p>{p.body}</p>
                <ul className="path-aud">
                  {p.seen.map((s) => <li key={s} className="aud-yes"><Icon name="check" size={15} /> {s}</li>)}
                  {p.hidden.map((s) => <li key={s} className="aud-no"><Icon name="eyeOff" size={15} /> {s}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container split">
          <div>
            <h2 className="h2">Staff see your nickname, never your name</h2>
            <p className="lead-sm">
              You pick a nickname when you sign up. Wardens, the Chief Warden and the Dean only ever see that
              nickname on your complaints and fines. The rule is enforced in the database, not just hidden on screen.
            </p>
            <ul className="ticks">
              <li><Icon name="check" size={18} /> Status shown as Pending, In Progress or Resolved</li>
              <li><Icon name="check" size={18} /> Email on every status change, fine and payment</li>
              <li><Icon name="check" size={18} /> Fines paid online through Razorpay, with a receipt</li>
            </ul>
          </div>
          <figure className="peek" aria-label="Example of what a Warden sees">
            <figcaption className="peek-cap">What the Block A Warden sees</figcaption>
            <div className="peek-row">
              <div>
                <span className="row-code">HC-1001</span>
                <span className="row-title">Shower not draining on second floor</span>
              </div>
              <StatusBadge status="pending" />
            </div>
            <div className="peek-meta">
              <span>Filed by <strong className="nick">QuietOwl</strong></span>
              <span>Washroom</span>
            </div>
            <div className="peek-row">
              <div>
                <span className="row-code">HC-1002</span>
                <span className="row-title">Wi-Fi drops every evening</span>
              </div>
              <StatusBadge status="in_progress" />
            </div>
            <div className="peek-meta">
              <span>Filed by <strong className="nick">QuietOwl</strong></span>
              <span>Wi-Fi</span>
            </div>
          </figure>
        </div>
      </section>

      <section className="section" id="portals">
        <div className="container">
          <div className="section-head">
            <h2 className="h2">Four portals, one for each role</h2>
          </div>
          <ul className="portal-list">
            {ROLE_LIST.map((r) => (
              <li key={r.key} className="portal-row">
                <div>
                  <h3 className="h3">{r.label}</h3>
                  <p className="muted">{r.blurb}</p>
                </div>
                <div className="portal-actions">
                  <Button to={`/login/${r.path}`} size="sm">Log in</Button>
                  <Button to={`/signup/${r.path}`} variant="ghost" size="sm">Sign up</Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="pub-footer">
        <div className="container pub-footer-inner">
          <span>Hostel Complaint Management System</span>
          <Link to="/portals">All portals</Link>
        </div>
      </footer>
    </div>
  );
}
