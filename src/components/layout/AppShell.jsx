import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../store/ToastContext';
import { NAV } from '../../config/nav';
import { ROLES } from '../../config/constants';
import { staffTitle } from '../../services/routing';
import { IS_LIVE } from '../../config/env';
import { visibleComplaints } from '../../store/selectors';
import Brand from '../Brand';
import Icon from '../ui/Icon';

export default function AppShell() {
  const { db, user, logout, resetDemo } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const role = ROLES[user.role];
  const base = `/${role.path}`;

  useEffect(() => setOpen(false), [location.pathname]);

  const badges = {
    unreadEmails: db.emails.filter((e) => e.to === user.id && !e.read).length,
    pending: user.role === 'student' ? 0 : visibleComplaints(db, user).filter((c) => c.status === 'pending').length,
  };

  const doLogout = async () => {
    await logout();
    navigate(`/login/${role.path}`);
  };

  const doReset = async () => {
    await resetDemo();
    toast('Demo data reset to the original sample set');
  };

  const displayName = user.role === 'student' ? user.name : user.name;
  const subtitle = user.role === 'student' ? `Nickname: ${user.nickname}` : staffTitle(user);

  return (
    <div className={`shell ${open ? 'nav-open' : ''}`}>
      <a href="#main" className="skip-link">Skip to content</a>
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebar-top">
          <Brand to={base} light />
          <button className="icon-btn sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <Icon name="x" />
          </button>
        </div>
        <p className="sidebar-portal">{role.label} portal</p>
        <nav>
          <ul className="nav">
            {NAV[user.role].map((item) => (
              <li key={item.to}>
                <NavLink to={item.to ? `${base}/${item.to}` : base} end={item.end} className="nav-link">
                  <Icon name={item.icon} size={19} />
                  <span>{item.label}</span>
                  {item.badge && badges[item.badge] > 0 && <span className="nav-badge">{badges[item.badge]}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-foot">
          {!IS_LIVE && (
            <div className="demo-chip">
              <span>Demo data</span>
              <button className="link-btn link-on-dark" onClick={doReset}>
                <Icon name="refresh" size={14} /> Reset
              </button>
            </div>
          )}
          <div className="sidebar-user">
            <span className="avatar" aria-hidden="true">{displayName.replace(/^(Dr\.|Prof\.)\s*/, '').charAt(0)}</span>
            <span className="sidebar-user-text">
              <span className="sidebar-user-name">{displayName}</span>
              <span className="sidebar-user-sub">{subtitle}</span>
            </span>
          </div>
          <button className="nav-link nav-logout" onClick={doLogout}>
            <Icon name="logout" size={19} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
      <div className="scrim" onClick={() => setOpen(false)} aria-hidden="true" />

      <div className="main-col">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <span className="topbar-title">{role.label} portal</span>
        </header>
        <main id="main" className="main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
