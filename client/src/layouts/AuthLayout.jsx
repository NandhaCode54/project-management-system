import { FolderKanban } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2 text-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Project Management</h1>
            <p className="text-xs text-slate-500">Organize work, ship faster</p>
          </div>
        </div>
        <Outlet />
        <p className="mt-6 text-center text-xs text-slate-400">
          <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-500">
            Back to app
          </Link>
        </p>
      </div>
    </div>
  );
}