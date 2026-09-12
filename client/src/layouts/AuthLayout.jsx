import { FolderKanban } from 'lucide-react';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="auth-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-slate-950/50" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/25 backdrop-blur sm:h-11 sm:w-11">
            <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-white sm:text-xl">Project Management</h1>
            <p className="text-xs text-indigo-200 sm:text-sm">Organize work, ship faster</p>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}