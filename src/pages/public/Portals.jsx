import { Link } from 'react-router-dom';
import PublicHeader from '../../components/layout/PublicHeader';
import { ROLE_LIST } from '../../config/constants';

export default function Portals() {
  return (
    <div className="public">
      <PublicHeader />
      <main className="container narrow portals-page">
        <h1 className="page-title">Choose your portal</h1>
        <p className="page-sub">Each role has its own login. Use the one that matches your account.</p>
        <ul className="portal-grid">
          {ROLE_LIST.map((r, i) => (
            <li key={r.key}>
              <Link to={`/login/${r.path}`} className={`portal-card shade-${i}`}>
                <span className="portal-card-role">{r.label}</span>
                <span className="portal-card-blurb">{r.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
