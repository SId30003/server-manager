import './StatusDot.css';

const LABELS = {
  online: 'Online',
  offline: 'Offline',
  unknown: 'Unchecked',
};

export default function StatusDot({ status = 'unknown', showLabel = false }) {
  return (
    <span className="sm-status">
      <span className={`sm-status__dot sm-status__dot--${status}`} />
      {showLabel && <span className="sm-status__label">{LABELS[status] || status}</span>}
    </span>
  );
}
