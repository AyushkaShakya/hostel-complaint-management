import { useEffect, useRef } from 'react';
import Icon from './Icon';

export default function Modal({ open, onClose, title, children, footer, size = 'md', dismissable = true }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape' && dismissable) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const first = ref.current?.querySelector('input, select, textarea, button:not(.modal-close)');
    (first ?? ref.current)?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, onClose, dismissable]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && dismissable && onClose()}>
      <div className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={ref} tabIndex={-1}>
        <header className="modal-head">
          <h2 id="modal-title">{title}</h2>
          {dismissable && (
            <button className="modal-close icon-btn" onClick={onClose} aria-label="Close">
              <Icon name="x" />
            </button>
          )}
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}
