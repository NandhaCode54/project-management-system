import { Loader2 } from 'lucide-react';

export function Spinner({ className = '' }) {
  return <Loader2 className={`h-5 w-5 animate-spin ${className}`} aria-label="Loading" />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <Spinner className="h-7 w-7 text-indigo-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <Spinner className="h-8 w-8 text-indigo-600" />
        <p className="text-sm">Loading…</p>
      </div>
    </div>
  );
}