// Lightweight horizontal bar chart with no chart library.
export function BarList({ data, max, formatValue = (v) => v, emptyText = 'No data yet.' }) {
  const top = max ?? Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <p className="muted">{emptyText}</p>;
  return (
    <ul className="barlist">
      {data.map((d) => (
        <li key={d.label}>
          <div className="barlist-row">
            <span className="barlist-label">{d.label}</span>
            <span className="barlist-value">{formatValue(d.value)}</span>
          </div>
          <div className="barlist-track" aria-hidden="true">
            <div className={`barlist-fill ${d.tone ? `fill-${d.tone}` : ''}`} style={{ width: `${(d.value / top) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

// Vertical column chart for a time series.
export function Columns({ data }) {
  const top = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="columns" role="img" aria-label={data.map((d) => `${d.label}: ${d.value}`).join(', ')}>
      {data.map((d) => (
        <div className="col" key={d.label}>
          <span className="col-value">{d.value}</span>
          <div className="col-bar" style={{ height: `${Math.max(4, (d.value / top) * 100)}%` }} />
          <span className="col-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Single stacked bar for status distribution.
export function StackedBar({ parts }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <div>
      <div className="stacked" aria-hidden="true">
        {parts.map((p) => (
          <div key={p.label} className={`stacked-seg seg-${p.key}`} style={{ width: `${(p.value / total) * 100}%` }} />
        ))}
      </div>
      <ul className="legend">
        {parts.map((p) => (
          <li key={p.label}>
            <span className={`legend-swatch seg-${p.key}`} />
            {p.label} <strong>{p.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
