import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Trash2, FolderKanban, Calendar, CheckCircle2 } from 'lucide-react';

import api from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useDataVersion, notifyDataChanged } from '../utils/events';
import { PROJECT_STATUS, TASK_STATUS, TASK_PRIORITY } from '../utils/constants';
import { formatDate } from '../utils/format';
import { Button } from '../components/Button';
import { StatusBadge, Badge } from '../components/Badge';
import { PageLoader } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ProjectForm } from '../components/ProjectForm';
import { TaskForm } from '../components/TaskForm';
import { useToast } from '../components/Toast';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const version = useDataVersion();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: project, loading, error, refetch } = useAsync(
    () => api.get(`/projects/${id}`).then((r) => r.data),
    [id, version],
  );

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/projects/${id}`);
      notifyDataChanged();
      toast.success('Project deleted (tasks removed as well)');
      navigate('/projects');
    } catch (err) {
      toast.error(err.message || 'Could not delete the project');
      setDeleting(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await api.patch(`/tasks/${taskId}/complete`);
      notifyDataChanged();
      toast.success('Task marked as completed');
      refetch();
    } catch (err) {
      toast.error(err.message || 'Could not update the task');
    }
  };

  if (error) {
    return (
      <div className="card">
        <EmptyState title="Project not found" description={error.message} />
      </div>
    );
  }

  if (loading && !project) return <PageLoader label="Loading project…" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Projects
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button variant="dangerGhost" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 sm:flex">
              <FolderKanban className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-slate-900">{project.name}</h1>
                <StatusBadge config={PROJECT_STATUS[project.status]} />
              </div>
              {project.description && <p className="mt-2 max-w-2xl text-sm text-slate-600">{project.description}</p>}
            </div>
          </div>
          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Start</dt>
              <dd className="mt-0.5 inline-flex items-center gap-1.5 font-medium text-slate-700">
                <Calendar className="h-3.5 w-3.5 text-slate-400" /> {formatDate(project.startDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">End</dt>
              <dd className="mt-0.5 inline-flex items-center gap-1.5 font-medium text-slate-700">
                <Calendar className="h-3.5 w-3.5 text-slate-400" /> {formatDate(project.endDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Tasks</dt>
              <dd className="mt-0.5 font-medium text-slate-700">{project.tasks?.length ?? 0}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Tasks</h2>
        <Button onClick={() => setTaskFormOpen(true)}>
          <Plus className="h-4 w-4" /> Add task
        </Button>
      </div>

      {project.tasks?.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={CheckCircle2}
            title="No tasks yet"
            description="Break the project down into tasks to track progress."
            action={
              <Button onClick={() => setTaskFormOpen(true)}>
                <Plus className="h-4 w-4" /> Add task
              </Button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-slate-100">
            {project.tasks.map((task) => (
              <div key={task.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50">
                <button
                  onClick={() => handleCompleteTask(task.id)}
                  disabled={task.status === 'COMPLETED'}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition disabled:cursor-default ${
                    task.status === 'COMPLETED'
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-300 text-transparent hover:border-emerald-400 hover:text-emerald-400'
                  }`}
                  aria-label={task.status === 'COMPLETED' ? 'Completed' : 'Mark as completed'}
                  title={task.status === 'COMPLETED' ? 'Completed' : 'Mark as completed'}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.name}</p>
                  {task.description && <p className="mt-0.5 truncate text-xs text-slate-500">{task.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={TASK_PRIORITY[task.priority].color}>{TASK_PRIORITY[task.priority].label}</Badge>
                  <StatusBadge config={TASK_STATUS[task.status]} />
                </div>
                <div className="w-24 text-right text-xs text-slate-500">Due {formatDate(task.dueDate)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ProjectForm open={editOpen} onClose={() => setEditOpen(false)} onSaved={refetch} project={project} />

      <TaskForm
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        onSaved={refetch}
        defaultProjectId={project.id}
        hideProjectSelect
        projects={[project]}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this project?"
        message={`"${project.name}" and all of its ${project.tasks?.length ?? 0} task(s) will be permanently deleted.`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}