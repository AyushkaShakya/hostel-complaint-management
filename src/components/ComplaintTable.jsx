import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES, STATUSES, STATUS_LABEL, categoryLabel } from '../config/constants';
import { StatusBadge, RouteBadge } from './ui/Badge';
import { EmptyState } from './ui/States';
import Icon from './ui/Icon';
import Tabs from './ui/Tabs';
import { formatDate } from '../services/format';
import { studentDisplayName } from '../services/routing';

export default function ComplaintTable({
  complaints,
  db,
  viewer,
  basePath,
  showStudent = false,
  showRouteTabs = false,
  initialStatus = 'all',
  emptyAction,
  compact = false,
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [category, setCategory] = useState('all');
  const [route, setRoute] = useState('all');

  const routeCounts = useMemo(() => {
    const c = { all: complaints.length, warden: 0, bypass: 0, dean: 0 };
    complaints.forEach((x) => { c[x.route] += 1; });
    return c;
  }, [complaints]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return complaints.filter((c) => {
      if (status !== 'all' && c.status !== status) return false;
      if (category !== 'all' && c.category !== category) return false;
      if (route !== 'all' && c.route !== route) return false;
      if (!q) return true;
      const student = db.users.find((u) => u.id === c.studentId);
      return [c.code, c.title, categoryLabel(c.category), showStudent ? student?.nickname : '']
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [complaints, query, status, category, route, db.users, showStudent]);

  const filtered = query || status !== 'all' || category !== 'all' || route !== 'all';
  const clear = () => { setQuery(''); setStatus('all'); setCategory('all'); setRoute('all'); };

  return (
    <div className="ctable">
      {showRouteTabs && (
        <Tabs
          label="Complaint type"
          value={route}
          onChange={setRoute}
          tabs={[
            { value: 'all', label: 'All', count: routeCounts.all },
            { value: 'warden', label: 'Routine', count: routeCounts.warden },
            { value: 'bypass', label: 'Against Warden', count: routeCounts.bypass },
            { value: 'dean', label: 'Ragging / Harassment', count: routeCounts.dean },
          ]}
        />
      )}
      {!compact && (
        <div className="filters">
          <label className="search">
            <Icon name="search" size={18} />
            <span className="sr-only">Search complaints</span>
            <input
              type="search"
              placeholder={showStudent ? 'Search by code, title or nickname' : 'Search by code or title'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="select-wrap select-inline">
            <select className="input select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              <option value="all">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div className="select-wrap select-inline">
            <select className="input select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        filtered ? (
          <EmptyState icon="search" title="No complaints match these filters" action={<button className="link-btn" onClick={clear}>Clear filters</button>} />
        ) : (
          <EmptyState title="No complaints yet" action={emptyAction}>
            {viewer.role === 'student' ? 'When you raise a complaint, it will appear here with its status.' : 'Complaints routed to you will appear here.'}
          </EmptyState>
        )
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Complaint</th>
                <th>Category</th>
                {showStudent && <th>Filed by</th>}
                {showStudent && <th>Block</th>}
                {showRouteTabs && <th>Route</th>}
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const student = db.users.find((u) => u.id === c.studentId);
                return (
                  <tr key={c.id}>
                    <td data-label="Complaint">
                      <Link to={`${basePath}/complaints/${c.id}`} className="row-link">
                        <span className="row-code">{c.code}</span>
                        <span className="row-title">{c.title}</span>
                      </Link>
                    </td>
                    <td data-label="Category">{categoryLabel(c.category)}</td>
                    {showStudent && <td data-label="Filed by"><span className="nick">{studentDisplayName(viewer, student)}</span></td>}
                    {showStudent && <td data-label="Block">{c.block}</td>}
                    {showRouteTabs && <td data-label="Route"><RouteBadge route={c.route} /></td>}
                    <td data-label="Status"><StatusBadge status={c.status} /></td>
                    <td data-label="Updated" className="muted">{formatDate(c.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
