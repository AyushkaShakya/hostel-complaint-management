import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../../store/StoreContext';
import { ROLES } from '../../config/constants';
import { PageLoader, ErrorState } from '../ui/States';

export default function RoleGuard({ role, children }) {
  const { ready, user, loadError, retryLoad } = useStore();
  const location = useLocation();
  if (loadError) return <div className="center-screen"><ErrorState onRetry={retryLoad}>{loadError}</ErrorState></div>;
  if (!ready) return <div className="center-screen"><PageLoader label="Loading your workspace" /></div>;
  if (!user) return <Navigate to={`/login/${ROLES[role].path}`} replace state={{ from: location.pathname }} />;
  if (user.role !== role) return <Navigate to={`/${ROLES[user.role].path}`} replace />;
  return children;
}
