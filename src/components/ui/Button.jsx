import { Link } from 'react-router-dom';
import Spinner from './Spinner';

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  to,
  className = '',
  children,
  disabled,
  ...rest
}) {
  const cls = `btn btn-${variant} btn-${size} ${loading ? 'is-loading' : ''} ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} disabled={disabled || loading} aria-busy={loading} {...rest}>
      {loading && <Spinner size={16} />}
      <span className="btn-label">{children}</span>
    </button>
  );
}
