import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import api from '../services/api';
import { useToast } from './Toast';
import { Button } from './Button';
import { Input, Textarea, Select } from './Input';
import { Modal } from './Modal';
import { PROJECT_STATUS } from '../utils/constants';
import { parseIsoOrDate } from '../utils/constants';
import { projectCreateSchema, formatProjectPayload } from '../schemas/projectSchemas';
import { notifyDataChanged } from '../utils/events';

const initialValues = { name: '', description: '', status: 'NOT_STARTED', startDate: '', endDate: '' };

export function ProjectForm({ open, onClose, onSaved, project }) {
  const toast = useToast();
  const isEdit = Boolean(project);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(projectCreateSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (open) {
      reset(
        project
          ? {
              name: project.name,
              description: project.description || '',
              status: project.status,
              startDate: parseIsoOrDate(project.startDate),
              endDate: parseIsoOrDate(project.endDate),
            }
          : initialValues,
      );
    }
  }, [open, project, reset]);

  const onSubmit = async (values) => {
    const payload = formatProjectPayload(values);
    try {
      if (isEdit) {
        await api.put(`/projects/${project.id}`, payload);
        toast.success('Project updated');
      } else {
        await api.post('/projects', payload);
        toast.success('Project created');
      }
      notifyDataChanged();
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Could not save the project');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit project' : 'New project'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Project name" placeholder="e.g. Website Redesign" error={errors.name?.message} {...register('name')} />
        <Textarea label="Description" placeholder="Optional description" error={errors.description?.message} {...register('description')} />

        <Select label="Status" error={errors.status?.message} {...register('status')}>
          {Object.entries(PROJECT_STATUS).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Start date" type="date" error={errors.startDate?.message} {...register('startDate')} />
          <Input label="End date" type="date" error={errors.endDate?.message} {...register('endDate')} />
        </div>
        {errors.endDate?.message && errors.endDate?.message.includes('start date') ? (
          <p className="-mt-2 text-xs text-rose-600">{errors.endDate.message}</p>
        ) : null}
      </form>
    </Modal>
  );
}