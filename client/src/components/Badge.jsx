export function Badge({ className = '', children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ config }) {
  return (
    <Badge className={config.color}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot || 'bg-current opacity-60'}`} />
      {config.label}
    </Badge>
  );
}