import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
        <Compass className="h-7 w-7" />
      </div>
      <h1 className="mt-6 text-4xl font-bold text-slate-900">404</h1>
      <p className="mt-2 text-slate-500">This page could not be found.</p>
      <Link to="/" className="mt-6 btn-primary">
        Go to dashboard
      </Link>
    </div>
  );
}