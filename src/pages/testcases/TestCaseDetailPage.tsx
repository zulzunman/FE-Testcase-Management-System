import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { extractError } from '../../api/client';
import { fetchExecutions, type TestExecution } from '../../api/test-executions';
import {
  deleteTestCase,
  duplicateTestCase,
  fetchTestCase,
  type TestCase,
} from '../../api/test-cases';
import { useAuth } from '../../context/AuthContext';

const statusColor: Record<string, string> = {
  passed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  blocked: 'bg-yellow-100 text-yellow-700',
  deprecated: 'bg-slate-200 text-slate-500',
  draft: 'bg-slate-100 text-slate-600',
  ready: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
};

const priorityColor: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-slate-100 text-slate-600',
};

const humanize = (s: string) =>
  s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function TestCaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite =
    user?.role === 'admin' || user?.role === 'qa_lead' || user?.role === 'qa_engineer';

  const [tc, setTc] = useState<TestCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [executionsLoading, setExecutionsLoading] = useState(false);

  const loadExecutions = () => {
    setExecutionsLoading(true);
    fetchExecutions(Number(id), { page_size: 20 })
      .then((data) => setExecutions(data.results))
      .catch(() => setExecutions([]))
      .finally(() => setExecutionsLoading(false));
  };

  useEffect(() => {
    let active = true;
    fetchTestCase(Number(id))
      .then((data) => {
        if (active) setTc(data);
      })
      .catch((err) => {
        if (active) setError(extractError(err, 'Failed to load test case.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    loadExecutions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDuplicate = async () => {
    if (!window.confirm('Duplicate this test case?')) return;
    try {
      const copy = await duplicateTestCase(tc!.id);
      navigate(`/test-cases/${copy.id}`);
    } catch (err) {
      setError(extractError(err, 'Failed to duplicate test case.'));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete test case "${tc?.test_case_code}"?`)) return;
    try {
      await deleteTestCase(tc!.id);
      navigate('/test-cases');
    } catch (err) {
      setError(extractError(err, 'Failed to delete test case.'));
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading…</div>;
  if (!tc) return <div className="p-8 text-center text-red-600">{error || 'Test case not found.'}</div>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-900">{tc.title}</h1>
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${statusColor[tc.status] ?? 'bg-slate-100 text-slate-600'}`}
            >
              {humanize(tc.status)}
            </span>
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${priorityColor[tc.priority] ?? 'bg-slate-100 text-slate-600'}`}
            >
              {humanize(tc.priority)}
            </span>
          </div>
          <p className="mt-1 font-mono text-xs text-slate-500">{tc.test_case_code}</p>
          {tc.modified_after_execution && (
            <p className="mt-1 text-xs text-amber-600">
              Modified after last execution.
            </p>
          )}
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <Link
              to={`/test-cases/${tc.id}/execute`}
              className="rounded bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-600"
            >
              Execute
            </Link>
            <Link
              to={`/test-cases/${tc.id}/edit`}
              className="rounded bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-600"
            >
              Edit
            </Link>
            <button
              onClick={handleDuplicate}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Duplicate
            </button>
            <button
              onClick={handleDelete}
              className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main info */}
        <div className="space-y-4 lg:col-span-2">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 font-medium text-slate-900">Description</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {tc.description || '—'}
            </p>
          </section>

          {tc.preconditions && (
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 font-medium text-slate-900">Preconditions</h2>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{tc.preconditions}</p>
            </section>
          )}

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 font-medium text-slate-900">Test Steps</h2>
            <ol className="space-y-2">
              {tc.steps.map((s) => (
                <li key={s.id ?? s.step_number} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
                    {s.step_number}
                  </span>
                  <div>
                    <p className="text-slate-800">{s.action || '—'}</p>
                    {s.expected && (
                      <p className="mt-0.5 text-xs text-slate-500">Expected: {s.expected}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 font-medium text-slate-900">Expected Result</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{tc.expected_result}</p>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 font-medium text-slate-900">Details</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Project</dt>
                <dd className="text-slate-800">{tc.project_name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Module</dt>
                <dd className="text-slate-800">{tc.module_name}</dd>
              </div>
              {tc.feature_name && (
                <div>
                  <dt className="text-slate-500">Feature</dt>
                  <dd className="text-slate-800">{tc.feature_name}</dd>
                </div>
              )}
              <div>
                <dt className="text-slate-500">Assignee</dt>
                <dd className="text-slate-800">{tc.assignee_name || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Created by</dt>
                <dd className="text-slate-800">{tc.created_by_name || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Updated</dt>
                <dd className="text-slate-800">{new Date(tc.updated_at).toLocaleString()}</dd>
              </div>
            </dl>
          </section>

          {tc.tags.length > 0 && (
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 font-medium text-slate-900">Tags</h2>
              <div className="flex flex-wrap gap-1.5">
                {tc.tags.map((t) => (
                  <span key={t} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Execution History */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-medium text-slate-900">Execution History</h2>
        </div>
        {executionsLoading ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">Loading…</p>
        ) : executions.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            No executions yet. Click "Execute" to run this test case.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {executions.map((ex) => (
              <li key={ex.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        ex.result === 'pass'
                          ? 'bg-green-100 text-green-700'
                          : ex.result === 'fail'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {humanize(ex.result)}
                    </span>
                    <span className="text-sm text-slate-700">{ex.executor_name || 'Unknown'}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(ex.execution_date).toLocaleString()}
                  </span>
                </div>
                {(ex.actual_result || ex.notes) && (
                  <div className="mt-2 space-y-1 text-sm text-slate-600">
                    {ex.actual_result && (
                      <p>
                        <span className="font-medium text-slate-500">Actual:</span>{' '}
                        {ex.actual_result}
                      </p>
                    )}
                    {ex.notes && (
                      <p>
                        <span className="font-medium text-slate-500">Notes:</span> {ex.notes}
                      </p>
                    )}
                  </div>
                )}
                {ex.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ex.attachments.map((a) => (
                      <a
                        key={a.id}
                        href={a.url ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200"
                      >
                        📎 Evidence #{a.id}
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}