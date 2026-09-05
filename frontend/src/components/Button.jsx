import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      className={`sm-btn sm-btn--${variant} sm-btn--${size}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="sm-btn__spinner" aria-hidden="true" /> : icon}
      <span>{children}</span>
    </button>
  );
}
