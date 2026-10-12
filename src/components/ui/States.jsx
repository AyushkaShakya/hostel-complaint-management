import Icon from './Icon';
import Spinner from './Spinner';
import Button from './Button';

export function EmptyState({ icon = 'list', title, children, action }) {
  return (
    <div className="empty">
      <span className="empty-icon"><Icon name={icon} size={26} /></span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', children, onRetry }) {
  return (
    <div className="empty empty-error" role="alert">
      <span className="empty-icon"><Icon name="alert" size={26} /></span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function PageLoader({ label = 'Loading' }) {
  return (
    <div className="page-loader">
      <Spinner size={30} label={label} />
      <p>{label}</p>
    </div>
  );
}

export function Alert({ tone = 'info', children }) {
  return (
    <div className={`alert alert-${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <Icon name={tone === 'error' ? 'alert' : tone === 'private' ? 'eyeOff' : 'shield'} size={18} />
      <div>{children}</div>
    </div>
  );
}
