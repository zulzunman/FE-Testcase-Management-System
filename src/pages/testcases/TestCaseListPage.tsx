import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { extractError } from '../../api/client';
import { fetchProjects, fetchModules, type Project } from '../../api/projects';
import {
  deleteTestCase,
  duplicateTestCase,
  fetchTestCases,
  TEST_CASE_PRIORITIES,
  TEST_CASE_STATUSES,
  type TestCase,
} from '../../api/test-cases';
import { useAuth } from '../../context/AuthContext';

const PAGE_SIZE = 10;

export default function TestCaseListPage() {
  const { user } = useAuth();
  const canWrite =
    user?.role === 'admin' || user?.role === 'qa_lead' || user?.role === 'qa_engineer';

  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [projectId, setProjectId] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [ordering, setOrdering] = useState('-updated_at');

  const [projects, setProjects] = useState<Project[]>([]);
  const [modules, setModules] = useState<Project['modules']>([]);

  useEffect(() => {
    fetchProjects({ page_size: 100 })
      .then((d) => setProjects(d.results))
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    if (!projectId) {
      setModules([]);
      setModuleId('');
      return;
    }
    fetchModules(Number(projectId), { page_size: 100 })
      .then((d) => setModules(d.results))
      .catch(() => setModules([]));
  }, [projectId]);

  const load = useCallback(() => {
    setLoading(true);
    const params = {
      page,
      page_size: PAGE_SIZE,
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(projectId ? { project: Number(projectId) } : {}),
      ...(moduleId ? { module: Number(moduleId) } : {}),
      ordering,
    };
    fetchTestCases(params)
      .then((data) => {
        setTestCases(data.results);
        setCount(data.count);
      })
      .catch((err) => setError(extractError(err, 'Failed to load test cases.')))
      .finally(() => setLoading(false));
  }, [page, search, status, priority, projectId, moduleId, ordering]);

  useEffect(() => {
    load();
  }, [load]);

  const applySearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const resetFilters = () => {
    setSearch('');
    setSearchInput('');
    setStatus('');
    setPriority('');
    setProjectId('');
    setModuleId('');
    setOrdering('-updated_at');
    setPage(1);
  };

  const handleDuplicate = async (id: number) => {
    if (!window.confirm('Duplicate this test case?')) return;
    try {
      await duplicateTestCase(id);
      load();
    } catch (err) {
      setError(extractError(err, 'Failed to duplicate test case.'));
    }
  };

  const handleDelete = async (tc: TestCase) => {
    if (!window.confirm(`Delete test case "${tc.test_case_code}"?`)) return;
    try {
      await deleteTestCase(tc.id);
      load();
    } catch (err) {
      setError(extractError(err, 'Failed to delete test case.'));
    }
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const statusLabel = (s: string) => s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Test Cases</h1>
        {canWrite && (
          <Link
            to="/test-cases/new"
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            + Create Test Case
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Search</label>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              placeholder="Search by ID, title…"
              className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
            >
              <option value="">All</option>
              {TEST_CASE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Priority</label>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
            >
              <option value="">All</option>
              {TEST_CASE_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {statusLabel(p)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Project</label>
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setPage(1);
              }}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
            >
              <option value="">All</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Module</label>
            <select
              value={moduleId}
              onChange={(e) => {
                setModuleId(e.target.value);
                setPage(1);
              }}
              disabled={!projectId}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-900 disabled:opacity-50"
            >
              <option value="">All</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Sort</label>
            <select
              value={ordering}
              onChange={(e) => {
                setOrdering(e.target.value);
                setPage(1);
              }}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
            >
              <option value="-updated_at">Updated (newest)</option>
              <option value="updated_at">Updated (oldest)</option>
              <option value="title">Title (A–Z)</option>
              <option value="-title">Title (Z–A)</option>
              <option value="priority">Priority (asc)</option>
              <option value="-priority">Priority (desc)</option>
            </select>
          </div>
          <button
            onClick={applySearch}
            className="rounded bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-600"
          >
            Apply
          </button>
          <button
            onClick={resetFilters}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assignee</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!loading && testCases.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  No test cases found.
                </td>
              </tr>
            )}
            {testCases.map((tc) => (
              <tr key={tc.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{tc.test_case_code}</td>
                <td className="px-4 py-3">
                  <Link to={`/test-cases/${tc.id}`} className="font-medium text-slate-900 hover:underline">
                    {tc.title}
                  </Link>
                  {tc.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {tc.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{tc.module_name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      tc.priority === 'critical'
                        ? 'bg-red-100 text-red-700'
                        : tc.priority === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : tc.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {statusLabel(tc.priority)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      tc.status === 'passed'
                        ? 'bg-green-100 text-green-700'
                        : tc.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : tc.status === 'blocked'
                            ? 'bg-yellow-100 text-yellow-700'
                            : tc.status === 'deprecated'
                              ? 'bg-slate-200 text-slate-500'
                              : tc.status === 'ready'
                                ? 'bg-blue-100 text-blue-700'
                                : tc.status === 'in_progress'
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {statusLabel(tc.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{tc.assignee_name || '—'}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(tc.updated_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {canWrite && (
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/test-cases/${tc.id}/edit`}
                        className="text-slate-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDuplicate(tc.id)}
                        className="text-slate-600 hover:underline"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={() => handleDelete(tc)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Page {page} of {totalPages} ({count} results)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}