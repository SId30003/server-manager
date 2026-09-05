import { useEffect } from 'react';
import './Modal.css';

export default function Modal({ title, onClose, children, width = 480 }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sm-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sm-modal" style={{ maxWidth: width }}>
        <div className="sm-modal__header">
          <h2>{title}</h2>
          <button className="sm-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="sm-modal__body">{children}</div>
      </div>
    </div>
  );
}
