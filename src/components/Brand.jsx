import { Link } from 'react-router-dom';

// The stacked-pill mark echoes the palette reference.
export function BrandMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="brand-mark">
      <rect x="6" y="8" width="52" height="20" rx="10" fill="#561C24" stroke="#E8D8C4" strokeOpacity=".25" />
      <rect x="6" y="22" width="52" height="20" rx="10" fill="#6D2932" stroke="#E8D8C4" strokeOpacity=".25" />
      <rect x="6" y="36" width="52" height="20" rx="10" fill="#E8D8C4" stroke="#C7B7A3" strokeWidth="2" />
    </svg>
  );
}

export default function Brand({ to = '/', light = false }) {
  return (
    <Link to={to} className={`brand ${light ? 'brand-light' : ''}`}>
      <BrandMark />
      <span className="brand-text">
        <span className="brand-name">Hostel Desk</span>
        <span className="brand-sub">Complaint Management</span>
      </span>
    </Link>
  );
}
