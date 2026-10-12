import { STATUS_LABEL, ROUTE_LABEL } from '../../config/constants';

export function StatusBadge({ status }) {
  return (
    <span className={`badge status-${status}`}>
      <span className="badge-dot" aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function RouteBadge({ route }) {
  if (route === 'warden') return <span className="tag">{ROUTE_LABEL.warden}</span>;
  return <span className={`tag tag-strong`}>{ROUTE_LABEL[route]}</span>;
}

export function FineBadge({ status }) {
  return (
    <span className={`badge fine-${status}`}>
      <span className="badge-dot" aria-hidden="true" />
      {status === 'paid' ? 'Paid' : 'Unpaid'}
    </span>
  );
}
