import { Link } from 'react-router-dom';
import Brand from '../Brand';
import { useStore } from '../../store/StoreContext';
import { ROLES } from '../../config/constants';

export default function PublicHeader() {
  const { user } = useStore();
  return (
    <header className="pub-header">
      <div className="container pub-header-inner">
        <Brand />
        <nav className="pub-nav" aria-label="Site">
          <Link to="/" state={{ scrollTo: 'routing' }} className="pub-link hide-sm">How routing works</Link>
          {user ? (
            <Link to={`/${ROLES[user.role].path}`} className="btn btn-primary btn-sm">Open my dashboard</Link>
          ) : (
            <Link to="/portals" className="btn btn-primary btn-sm">Log in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
