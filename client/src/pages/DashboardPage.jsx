import { useMemo } from 'react';
import { FolderKanban, ListTodo, CheckCircle2, Hourglass, TrendingUp, ChartColumn } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

import api from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useDataVersion } from '../utils/events';
import { PROJECT_STATUS, TASK_STATUS, TASK_PRIORITY } from '../utils/constants';
import { PageLoader, Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

const STAT_CARDS = [
  { key: 'totalProjects', label: 'Total Projects', icon: FolderKanban, color: 'text-indigo-600 bg-indigo-50' },
  { key: 'totalTasks', label: 'Total Tasks', icon: ListTodo, color: 'text-blue-600 bg-blue-50' },
  { key: 'completedTasks', label: 'Completed Tasks', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
  { key: 'pendingTasks', label: 'Pending Tasks', icon: Hourglass, color: 'text-amber-600 bg-amber-50' },
  { key: 'projectsInProgress', label: 'Projects In Progress', icon: TrendingUp, color: 'text-rose-600 bg-rose-50' },
];

function toChartData(distribution, meta) {
  return Object.entries(distribution || {}).map(([key, value]) => ({
    name: meta[key]?.label || key,
    value,
    fill: meta[key]?.chart || '#94a3b8',
  }));
}

export default function DashboardPage() {
  const { user } = useAuth();
  const version = useDataVersion();

  const { data: stats, loading, error, refetch } = useAsync(
    () => api.get('/dashboard/stats').then((r) => r.data),
    [version],
  );

  const projectStatusData = useMemo(() => toChartData(stats?.distributions?.projectStatus, PROJECT_STATUS), [stats]);
  const taskStatusData = useMemo(() => toChartData(stats?.distributions?.taskStatus, TASK_STATUS), [stats]);
  const taskPriorityData = useMemo(() => toChartData(stats?.distributions?.taskPriority, TASK_PRIORITY), [stats]);

  const tasksEmpty = useMemo(
    () => (stats?.totalTasks ?? 0) === 0,
    [stats],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Welcome back, <span className="font-medium text-slate-700">{user?.fullName}</span>. Here’s what’s happening.
          </p>
        </div>
        <button onClick={refetch} className="btn-secondary" disabled={loading}>
          {loading ? <Spinner className="h-4 w-4" /> : <ChartColumn className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {error ? (
        <EmptyState title="Failed to load statistics" description={error.message} />
      ) : loading && !stats ? (
        <PageLoader label="Loading statistics…" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="card p-4">
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{stats?.[key] ?? 0}</p>
                <p className="text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard title="Task status distribution" empty={tasksEmpty}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={taskStatusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {taskStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Project status distribution">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={projectStatusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {projectStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Task priority distribution">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={taskPriorityData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                  <Bar dataKey="value" name="Tasks">
                    {taskPriorityData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}

function ChartCard({ title, children, empty = false }) {
  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <div className="mt-3">
        {empty ? (
          <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400">
            No data yet
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}