import { useEffect, useState } from 'react';
import { Plus, ListTodo, Pencil, Trash2, CheckCircle2 } from 'lucide-react';

import api from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useDataVersion, notifyDataChanged } from '../utils/events';
import { TASK_STATUS, TASK_PRIORITY, SORT_BY_TASK, PROJECT_STATUS } from '../utils/constants';
import { formatDate } from '../utils/format';
import { SearchInput } from '../components/SearchInput';
import { Select } from '../components/Input';
import { Button } from '../components/Button';
import { StatusBadge, Badge } from '../components/Badge';
import { PageLoader } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { TaskForm } from '../components/TaskForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';

const PER_PAGE = 10;

export default function TasksPage() {
  const toast = useToast();
  const version = useDataVersion();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [projectId, setProjectId] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data: projects } = useAsync(
    () => api.get('/projects', { params: { limit: 100 } }).then((r) => r.data.items),
    [version],
  );

  useEffect(() => setPage(1), [debouncedSearch, status, priority, projectId, sortBy, order]);

  const { data, loading, error, refetch } = useAsync(
    () =>
      api
        .get('/tasks', {
          params: {
            search: debouncedSearch || undefined,
            status: status || undefined,
            priority: priority || undefined,
            projectId: projectId || undefined,
            page,
            limit: PER_PAGE,
            sortBy,
            order,
          },
        })
        .then((r) => r.data),
    [debouncedSearch, status, priority, projectId, page, sortBy, order, version],
  );

  const statusOptions = [
    { value: '', label: 'All statuses' },
    ...Object.entries(TASK_STATUS).map(([value, meta]) => ({ value, label: meta.label })),
  ];
  const priorityOptions = [
    { value: '', label: 'All priorities' },
    ...Object.entries(TASK_PRIORITY).map(([value, meta]) => ({ value, label: meta.label })),
  ];

  const handleComplete = async (task) => {
    try {
      if (task.status === 'COMPLETED') return;
      await api.patch(`/tasks/${task.id}/complete`);
      notifyDataChanged();
      toast.success('Task completed');
      refetch();
    } catch (err) {
      toast.error(err.message || 'Could not update the task');
    }
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    setDeleting(true);
    try {
      await api.delete(`/tasks/${deletingTask.id}`);
      notifyDataChanged();
      toast.success('Task deleted');
      refetch();
      setDeletingTask(null);
    } catch (err) {
      toast.error(err.message || 'Could not delete the task');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500">Track everything across all of your projects.</p>
        </div>
        <Button onClick={() => setEditingTask(null) || setFormOpen(true)}>
          <Plus className="h-4 w-4" /> New task
        </Button>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search tasks…" />
          </div>
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label="Filter by project">
            <option value="">All projects</option>
            {(projects || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filter by priority">
            {priorityOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort tasks">
            {SORT_BY_TASK.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </Select>
          <div className="sm:col-span-2 lg:col-span-6">
            <Select value={order} onChange={(e) => setOrder(e.target.value)} aria-label="Sort order">
              <option value="desc">Order: Newest first</option>
              <option value="asc">Order: Oldest first</option>
            </Select>
          </div>
        </div>
      </div>

      {error ? (
        <EmptyState title="Failed to load tasks" description={error.message} />
      ) : loading && !data ? (
        <PageLoader />
      ) : data?.items?.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ListTodo}
            title="No tasks found"
            description={search || status || priority || projectId ? 'Try adjusting your filters.' : 'Create your first task to get started.'}
            action={
              !search && !status && !priority && !projectId ? (
                <Button onClick={() => setFormOpen(true)}>
                  <Plus className="h-4 w-4" /> New task
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due date</th>
                  <th className="w-24 px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.items.map((task) => (
                  <tr key={task.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleComplete(task)}
                          disabled={task.status === 'COMPLETED'}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition disabled:cursor-default ${
                            task.status === 'COMPLETED'
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-slate-300 text-transparent hover:border-emerald-400 hover:text-emerald-400'
                          }`}
                          aria-label={task.status === 'COMPLETED' ? 'Completed' : 'Mark as completed'}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <div className="min-w-0">
                          <p className={`font-medium ${task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            {task.name}
                          </p>
                          {task.description && <p className="mt-0.5 line-clamp-1 max-w-xs text-xs text-slate-500">{task.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {task.project ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <span className={`h-2 w-2 rounded-full ${PROJECT_STATUS[task.project.status]?.dot || 'bg-slate-300'}`} />
                          {task.project.name}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge className={TASK_PRIORITY[task.priority].color}>{TASK_PRIORITY[task.priority].label}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge config={TASK_STATUS[task.status]} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{formatDate(task.dueDate)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditingTask(task) || setFormOpen(true)}
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                          aria-label="Edit task"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingTask(task)}
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Delete task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && (
            <div className="border-t border-slate-100 px-4 py-3">
              <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
            </div>
          )}
        </div>
      )}

      <TaskForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
        onSaved={refetch}
        task={editingTask}
        projects={projects || []}
      />

      <ConfirmDialog
        open={Boolean(deletingTask)}
        title="Delete this task?"
        message={deletingTask ? `"${deletingTask.name}" will be permanently deleted.` : ''}
        onCancel={() => setDeletingTask(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}