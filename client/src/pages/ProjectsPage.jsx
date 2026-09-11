import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Calendar, ExternalLink } from 'lucide-react';

import api from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useDataVersion } from '../utils/events';
import { PROJECT_STATUS, SORT_BY_PROJECT } from '../utils/constants';
import { formatDate } from '../utils/format';
import { SearchInput } from '../components/SearchInput';
import { Select } from '../components/Input';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/Badge';
import { PageLoader } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { ProjectForm } from '../components/ProjectForm';

const PER_PAGE = 10;

export default function ProjectsPage() {
  const navigate = useNavigate();
  const version = useDataVersion();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => setPage(1), [debouncedSearch, status, sortBy, order]);

  const { data, loading, error, refetch } = useAsync(
    () =>
      api
        .get('/projects', {
          params: {
            search: debouncedSearch || undefined,
            status: status || undefined,
            page,
            limit: PER_PAGE,
            sortBy,
            order,
          },
        })
        .then((r) => r.data),
    [debouncedSearch, status, page, sortBy, order, version],
  );

  const projectStatusFilter = [
    { value: '', label: 'All statuses' },
    ...Object.entries(PROJECT_STATUS).map(([value, meta]) => ({ value, label: meta.label })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500">Manage your work streams.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> New project
        </Button>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search projects…" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            {projectStatusFilter.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort by">
            {SORT_BY_PROJECT.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </Select>
          <Select value={order} onChange={(e) => setOrder(e.target.value)} aria-label="Sort order">
            <option value="desc">Order: Newest first</option>
            <option value="asc">Order: Oldest first</option>
          </Select>
        </div>
      </div>

      {error ? (
        <EmptyState title="Failed to load projects" description={error.message} />
      ) : loading && !data ? (
        <PageLoader />
      ) : data?.items?.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FolderKanban}
            title="No projects found"
            description={search || status ? 'Try adjusting your filters, or create a new project.' : 'Create your first project to get started.'}
            action={
              !search && !status ? (
                <Button onClick={() => setFormOpen(true)}>
                  <Plus className="h-4 w-4" /> New project
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
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Timeline</th>
                  <th className="px-4 py-3 font-medium text-center">Tasks</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.items.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="cursor-pointer transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-900">{project.name}</p>
                      {project.description && <p className="mt-0.5 line-clamp-1 max-w-md text-xs text-slate-500">{project.description}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge config={PROJECT_STATUS[project.status]} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(project.startDate)} → {formatDate(project.endDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex min-w-[2rem] justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {project.taskCount}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{formatDate(project.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <ExternalLink className="h-4 w-4 text-slate-300" />
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

      <ProjectForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={refetch}
      />
    </div>
  );
}