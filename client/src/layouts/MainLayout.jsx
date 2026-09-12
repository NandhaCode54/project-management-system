import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FolderKanban, LayoutDashboard, ListTodo, LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, adminOnly: true },
];

function initials(fullName) {
  if (!fullName) return '?';
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function MainLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow">
          <FolderKanban className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight text-white">Project Mgmt</h1>
          <p className="text-[11px] text-slate-400">Workspace</p>
        </div>
      </div>
      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'ADMIN').map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-300">
            {initials(user?.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.fullName}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
          <button onClick={logout} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400" aria-label="Log out" title="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-slate-900 lg:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-slate-900 shadow-xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-slate-800">Project Mgmt</span>
          <button onClick={() => setMobileOpen(false)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </header>
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}