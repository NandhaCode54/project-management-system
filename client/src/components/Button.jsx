export function Button({ variant = 'primary', type = 'button', loading, className = '', children, ...props }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    dangerGhost: 'btn-danger-ghost',
  };

  return (
    <button type={type} disabled={loading || props.disabled} className={`${variants[variant]} ${className}`} {...props}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

export { Spinner } from './Spinner';