import { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export const Input = forwardRef(function Input({ label, error, className = '', ...props }, ref) {
  return (
    <div className={className}>
      {label ? <label className="label">{label}</label> : null}
      <input ref={ref} className={`input-base ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/30' : ''}`} {...props} />
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      ) : null}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, className = '', ...props }, ref) {
  return (
    <div className={className}>
      {label ? <label className="label">{label}</label> : null}
      <textarea
        ref={ref}
        className={`input-base min-h-[90px] resize-y ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/30' : ''}`}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      ) : null}
    </div>
  );
});

export const Select = forwardRef(function Select({ label, error, className = '', children, ...props }, ref) {
  return (
    <div className={className}>
      {label ? <label className="label">{label}</label> : null}
      <select ref={ref} className={`input-base ${error ? 'border-rose-400' : ''}`} {...props}>
        {children}
      </select>
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      ) : null}
    </div>
  );
});