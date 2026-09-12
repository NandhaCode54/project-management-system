import { useEffect, useState } from 'react';
import { ShieldCheck, Users, ScrollText } from 'lucide-react';

import api from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useDataVersion, notifyDataChanged } from '../utils/events';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { SearchInput } from '../components/SearchInput';
import { Select } from '../components/Input';
import { Pagination } from '../components/Pagination';
import { PageLoader } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { formatDateTime } from '../utils/format';

const PER_PAGE = 10;

const ROLE_META = {
  ADMIN: { label: 'Admin', color: 'bg-violet-50 text-violet-700' },
  MEMBER: { label: 'Member', color: 'bg-slate-100 text-slate-600' },
};

const AUDIT_ACTION_META = {
  AUTH_REGISTER: { label: 'Register', color: 'bg-indigo-50 text-indigo-700' },
  AUTH_REGISTER_FAILED: { label: 'Register failed', color: 'bg-rose-50 text-rose-700' },
  AUTH_LOGIN: { label: 'Login', color: 'bg-emerald-50 text-emerald-700' },
  AUTH_LOGIN_FAILED: { label: 'Login failed', color: 'bg-rose-50 text-rose-700' },
  AUTH_LOGOUT: { label: 'Logout', color: 'bg-slate-100 text-slate-600' },
  PROJECT_CREATE: { label: 'Project created', color: 'bg-sky-50 text-sky-700' },
  PROJECT_UPDATE: { label: 'Project updated', color: 'bg-sky-50 text-sky-700' },
  PROJECT_DELETE: { label: 'Project deleted', color: 'bg-rose-50 text-rose-700' },
  TASK_CREATE: { label: 'Task created', color: 'bg-amber-50 text-amber-700' },
  TASK_UPDATE: { label: 'Task updated', color: 'bg-amber-50 text-amber-700' },
  TASK_DELETE: { label: 'Task deleted', color: 'bg-rose-50 text-rose-700' },
  TASK_COMPLETE: { label: 'Task completed', color: 'bg-emerald-50 text-emerald-700' },
  USER_ROLE_CHANGED: { label: 'Role changed', color: 'bg-violet-50 text-violet-700' },
};

const RESOURCE_OPTIONS = [
  { value: '', label: 'All resources' },
  { value: 'USER', label: 'User' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'TASK', label: 'Task' },
];

function MetaChips({ meta }) {
  if (!meta || typeof meta !== 'object') return null;
  const entries = Object.entries(meta).filter(([, value]) => value !== undefined && value !== null);
  if (entries.length === 0) return null;

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {entries.map(([key, value]) => (
        <code key={key} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
          {key}: {String(value)}
        </code>
      ))}
    </div>
  );
}

const TAB_STYLES = (active) =>
  `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
    active ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
  }`;

export default function AdminPage() {
  const { user } = useAuth();
  const toast = useToast();
  const version = useDataVersion();

  const [tab, setTab] = useState('users');

  const [userSearch, setUserSearch] = useState('');
  const debouncedUserSearch = useDebouncedValue(userSearch);
  const [userPage, setUserPage] = useState(1);

  const { data: users, loading: usersLoading, error: usersError, refetch: refetchUsers } = useAsync(
    () =>
      api
        .get('/admin/users', { params: { search: debouncedUserSearch || undefined, page: userPage, limit: PER_PAGE } })
        .then((r) => r.data),
    [debouncedUserSearch, userPage, version],
  );

  const [resource, setResource] = useState('');
  const [action, setAction] = useState('');
  const [logPage, setLogPage] = useState(1);

  const { data: logs, loading: logsLoading, error: logsError } = useAsync(
    () =>
      api
        .get('/admin/audit-logs', {
          params: { resource: resource || undefined, action: action || undefined, page: logPage, limit: PER_PAGE },
        })
        .then((r) => r.data),
    [resource, action, logPage, version],
  );

  useEffect(() => setUserPage(1), [debouncedUserSearch]);
  useEffect(() => setLogPage(1), [resource, action]);

  const changeRole = async (targetUser, role) => {
    if (role === targetUser.role) return;
    try {
      await api.patch(`/admin/users/${targetUser.id}/role`, { role });
      toast.success(`${targetUser.fullName} is now ${role === 'ADMIN' ? 'an admin' : 'a member'}`);
      notifyDataChanged();
      refetchUsers();
    } catch (err) {
      toast.error(err.message || 'Could not update role');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-semibold text-slate-900">Admin</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">Manage users and review the audit trail.</p>
      </div>

      <div className="flex w-full gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-card sm:w-fit">
        <button onClick={() => setTab('users')} className={TAB_STYLES(tab === 'users')}>
          <Users className="h-4 w-4" /> Users
        </button>
        <button onClick={() => setTab('logs')} className={TAB_STYLES(tab === 'logs')}>
          <ScrollText className="h-4 w-4" /> Audit logs
        </button>
      </div>

      {tab === 'users' ? (
        <div className="space-y-4">
          <div className="card p-4">
            <SearchInput value={userSearch} onChange={setUserSearch} placeholder="Search users by name or email…" />
          </div>

          {usersError ? (
            <div className="card">
              <EmptyState title="Failed to load users" description={usersError.message} />
            </div>
          ) : usersLoading && !users ? (
            <PageLoader label="Loading users…" />
          ) : users?.items?.length === 0 ? (
            <div className="card">
              <EmptyState icon={Users} title="No users found" description={userSearch ? 'Try a different search.' : 'No users registered yet.'} />
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Joined</th>
                      <th className="px-4 py-3 font-medium">Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users?.items.map((u) => (
                      <tr key={u.id} className="transition hover:bg-slate-50">
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-slate-900">{u.fullName}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge className={ROLE_META[u.role]?.color}>{ROLE_META[u.role]?.label || u.role}</Badge>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">{formatDateTime(u.createdAt)}</td>
                        <td className="px-4 py-3.5">
                          <select
                            className="input-base py-1.5"
                            value={u.role}
                            disabled={u.id === user?.id}
                            onChange={(e) => changeRole(u, e.target.value)}
                            aria-label={`Change role for ${u.fullName}`}
                          >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {users && (
                <div className="border-t border-slate-100 px-4 py-3">
                  <Pagination page={users.pagination.page} totalPages={users.pagination.totalPages} onChange={setUserPage} />
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select value={resource} onChange={(e) => setResource(e.target.value)} aria-label="Filter by resource">
                {RESOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <Select value={action} onChange={(e) => setAction(e.target.value)} aria-label="Filter by action">
                <option value="">All actions</option>
                {Object.entries(AUDIT_ACTION_META).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {logsError ? (
            <div className="card">
              <EmptyState title="Failed to load audit logs" description={logsError.message} />
            </div>
          ) : logsLoading && !logs ? (
            <PageLoader label="Loading audit log…" />
          ) : logs?.items?.length === 0 ? (
            <div className="card">
              <EmptyState icon={ScrollText} title="No audit entries" description="Try adjusting the filters." />
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="divide-y divide-slate-100">
                {logs?.items.map((entry) => {
                  const meta = AUDIT_ACTION_META[entry.action] || { label: entry.action, color: 'bg-slate-100 text-slate-600' };
                  return (
                    <div key={entry.id} className="px-4 py-3.5 transition hover:bg-slate-50">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <Badge className={meta.color}>{meta.label}</Badge>
                          <span className="font-medium text-slate-800">
                            {entry.user ? entry.user.fullName : entry.ip ? `Guest (${entry.ip})` : 'System'}
                          </span>
                          <span className="text-xs text-slate-400">· {entry.resource}</span>
                          {entry.resourceId && <code className="text-[11px] text-slate-400">{entry.resourceId}</code>}
                        </div>
                        <span className="text-xs text-slate-400">{formatDateTime(entry.createdAt)}</span>
                      </div>
                      <MetaChips meta={entry.meta} />
                      <p className="mt-1 truncate text-[11px] text-slate-400">
                        IP {entry.ip || '—'} {entry.userAgent ? `· ${entry.userAgent}` : ''}
                      </p>
                    </div>
                  );
                })}
              </div>
              {logs && (
                <div className="border-t border-slate-100 px-4 py-3">
                  <Pagination page={logs.pagination.page} totalPages={logs.pagination.totalPages} onChange={setLogPage} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}