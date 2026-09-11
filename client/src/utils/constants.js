export const PROJECT_STATUS = {
  NOT_STARTED: { label: 'Not Started', color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
};

export const TASK_STATUS = {
  PENDING: { label: 'Pending', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
};

export const TASK_PRIORITY = {
  LOW: { label: 'Low', color: 'bg-slate-100 text-slate-700' },
  MEDIUM: { label: 'Medium', color: 'bg-amber-50 text-amber-700' },
  HIGH: { label: 'High', color: 'bg-rose-50 text-rose-700' },
};

export const SORT_BY_PROJECT = [
  { value: 'createdAt', label: 'Created date' },
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'startDate', label: 'Start date' },
  { value: 'updatedAt', label: 'Updated date' },
];

export const SORT_BY_TASK = [
  { value: 'createdAt', label: 'Created date' },
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'updatedAt', label: 'Updated date' },
];

export function parseIsoOrDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}