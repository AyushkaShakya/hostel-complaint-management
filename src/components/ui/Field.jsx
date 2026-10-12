import { useId } from 'react';

function Wrap({ id, label, hint, error, required, children, className = '' }) {
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
          {!required && <span className="field-optional"> (optional)</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="field-error" id={`${id}-err`}>{error}</p>
      ) : (
        hint && <p className="field-hint" id={`${id}-hint`}>{hint}</p>
      )}
    </div>
  );
}

const describedBy = (id, error, hint) => (error ? `${id}-err` : hint ? `${id}-hint` : undefined);

export function Input({ label, hint, error, required = true, className, ...rest }) {
  const id = useId();
  return (
    <Wrap id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <input id={id} className="input" aria-invalid={Boolean(error)} aria-describedby={describedBy(id, error, hint)} {...rest} />
    </Wrap>
  );
}

export function Textarea({ label, hint, error, required = true, className, ...rest }) {
  const id = useId();
  return (
    <Wrap id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <textarea id={id} className="input textarea" aria-invalid={Boolean(error)} aria-describedby={describedBy(id, error, hint)} {...rest} />
    </Wrap>
  );
}

export function Select({ label, hint, error, required = true, className, children, ...rest }) {
  const id = useId();
  return (
    <Wrap id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <div className="select-wrap">
        <select id={id} className="input select" aria-invalid={Boolean(error)} aria-describedby={describedBy(id, error, hint)} {...rest}>
          {children}
        </select>
      </div>
    </Wrap>
  );
}

export function Checkbox({ label, description, ...rest }) {
  const id = useId();
  return (
    <label className="checkbox" htmlFor={id}>
      <input id={id} type="checkbox" {...rest} />
      <span className="checkbox-box" aria-hidden="true" />
      <span>
        <span className="checkbox-label">{label}</span>
        {description && <span className="checkbox-desc">{description}</span>}
      </span>
    </label>
  );
}
