import { NavLink } from 'react-router-dom';
import Brand from '../../components/Brand';
import { ROLE_LIST } from '../../config/constants';

// Two-panel layout shared by every login and signup page.
export default function AuthLayout({ role, mode, children }) {
  return (
    <div className="auth">
      <aside className="auth-side">
        <Brand light />
        <div className="auth-side-body">
          <p className="auth-side-portal">{role.label} portal</p>
          <p className="auth-side-blurb">{role.blurb}</p>
        </div>
        <div className="auth-pills" aria-hidden="true">
          <span /><span /><span />
        </div>
      </aside>
      <main className="auth-main">
        <nav className="portal-switch" aria-label="Switch portal">
          {ROLE_LIST.map((r) => (
            <NavLink key={r.key} to={`/${mode}/${r.path}`} className="portal-switch-link">
              {r.label}
            </NavLink>
          ))}
        </nav>
        <div className="auth-form-wrap">{children}</div>
      </main>
    </div>
  );
}
