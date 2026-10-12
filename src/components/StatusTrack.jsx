import { STATUSES, STATUS_LABEL } from '../config/constants';
import { formatDateTime } from '../services/format';

// Overlapping pills, one per stage, filled as the complaint progresses.
export default function StatusTrack({ complaint }) {
  const reachedIndex = STATUSES.indexOf(complaint.status);
  const lastAt = (s) => [...complaint.history].reverse().find((h) => h.status === s)?.at;
  return (
    <ol className="track" aria-label="Complaint status">
      {STATUSES.map((s, i) => {
        const reached = i <= reachedIndex;
        const current = i === reachedIndex;
        const at = reached ? lastAt(s) : null;
        return (
          <li
            key={s}
            className={`track-pill ${reached ? 'is-reached' : ''} ${current ? 'is-current' : ''} track-${s}`}
            aria-current={current ? 'step' : undefined}
          >
            <span className="track-name">{STATUS_LABEL[s]}</span>
            <span className="track-time">{at ? formatDateTime(at) : 'Not yet'}</span>
          </li>
        );
      })}
    </ol>
  );
}
