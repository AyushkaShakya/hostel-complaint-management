export default function Spinner({ size = 20, label }) {
  return (
    <span className="spinner" style={{ width: size, height: size }} role={label ? 'status' : undefined}>
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
