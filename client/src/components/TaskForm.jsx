import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import api from '../services/api';
import { useToast } from './Toast';
import { Button } from './Button';
import { Input, Textarea, Select } from './Input';
import { Modal } from './Modal';
import { TASK_STATUS, TASK_PRIORITY, parseIsoOrDate } from '../utils/constants';
import { taskCreateSchema, formatTaskPayload } from '../schemas/taskSchemas';
import { notifyDataChanged } from '../utils/events';

const initialValues = { projectId: '', name: '', description: '', priority: 'MEDIUM', status: 'PENDING', dueDate: '' };

export function TaskForm({ open, onClose, onSaved, task, projects, defaultProjectId, hideProjectSelect = false }) {
  const toast = useToast();
  const isEdit = Boolean(task);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (open) {
      reset(
        task
          ? {
              projectId: task.projectId,
              name: task.name,
              description: task.description || '',
              priority: task.priority,
              status: task.status,
              dueDate: parseIsoOrDate(task.dueDate),
            }
          : { ...initialValues, projectId: defaultProjectId || '', status: 'PENDING' },
      );
    }
  }, [open, task, reset, defaultProjectId]);

  const projectError = useMemo(() => errors.projectId?.message, [errors]);

  const onSubmit = async (values) => {
    const payload = formatTaskPayload(values);
    try {
      if (isEdit) {
        const { projectId, ...update } = payload;
        void projectId;
        await api.put(`/tasks/${task.id}`, update);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', payload);
        toast.success('Task created');
      }
      notifyDataChanged();
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message || `Could not ${isEdit ? 'update' : 'create'} the task`);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit task' : 'New task'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!hideProjectSelect && (
          <Select label="Project" error={projectError} {...register('projectId')}>
            <option value="">Select a project…</option>
            {(projects || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        )}

        <Input label="Task name" placeholder="e.g. Create homepage" error={errors.name?.message} {...register('name')} />
        <Textarea label="Description" placeholder="Optional description" error={errors.description?.message} {...register('description')} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select label="Priority" error={errors.priority?.message} {...register('priority')}>
            {Object.entries(TASK_PRIORITY).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </Select>
          <Select label="Status" error={errors.status?.message} {...register('status')}>
            {Object.entries(TASK_STATUS).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </Select>
          <Input label="Due date" type="date" error={errors.dueDate?.message} {...register('dueDate')} />
        </div>
      </form>
    </Modal>
  );
}