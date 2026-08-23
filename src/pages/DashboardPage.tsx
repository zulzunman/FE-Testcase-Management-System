import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { extractError } from '../api/client';
import { fetchDashboard, type DashboardData } from '../api/reports';

const humanize = (s: string) =>
  s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const resultBadge: Record<string, string> = {
  pass: 'bg-green-100 text-green-700',
  fail: 'bg-red-100 text-red-700',
  blocked: 'bg-yellow-100 text-yellow-700',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchDashboard()
      .then((d) => {
        if (active) setData(d);
      })
      .catch((err) => {
        if (active) setError(extractError(err, 'Failed to load dashboard.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading…</div>;
  if (error && !data) {
    return (
      <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (!data) return null;

  const tc = data.test_case_summary;
  const ex = data.execution_summary;
  const notRun = Math.max(0, tc.total - ex.total_executions);

  const cards = [
    { label: 'Total Test Cases', value: tc.total, color: 'text-slate-900' },
    { label: 'Passed', value: tc.passed, color: 'text-green-700' },
    { label: 'Failed', value: tc.failed, color: 'text-red-700' },
    { label: 'Blocked', value: tc.blocked, color: 'text-yellow-700' },
    { label: 'Not Run', value: notRun, color: 'text-slate-500' },
    { label: 'Progress', value: `${data.progress}%`, color: 'text-blue-700' },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Dashboard</h1>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Execution summary */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-medium text-slate-900">Execution Summary</h2>
          </div>
          <div className="p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Total Executions</dt>
                <dd className="font-medium text-slate-900">{ex.total_executions}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Pass Rate</dt>
                <dd className="font-medium text-green-700">{ex.pass_rate}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Fail Rate</dt>
                <dd className="font-medium text-red-700">{ex.fail_rate}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Blocked Rate</dt>
                <dd className="font-medium text-yellow-700">{ex.blocked_rate}%</dd>
              </div>
            </dl>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-green-500"
                style={{ width: `${Math.min(100, ex.pass_rate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Projects / Modules */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-medium text-slate-900">Structure</h2>
          </div>
          <div className="p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Projects</dt>
                <dd className="font-medium text-slate-900">{data.total_projects}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Modules</dt>
                <dd className="font-medium text-slate-900">{data.total_modules}</dd>
              </div>
            </dl>
            <Link
              to="/reports"
              className="mt-4 inline-block rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              View Reports
            </Link>
          </div>
        </div>

        {/* Recent executions */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-medium text-slate-900">Recent Executions</h2>
          </div>
          {data.recent_executions.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              No executions yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recent_executions.map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-medium ${resultBadge[r.result] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {humanize(r.result)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(r.execution_date).toLocaleString()}
                    </span>
                  </div>
                  <Link
                    to={`/test-cases/${r.test_case_id}`}
                    className="mt-1 block truncate text-sm font-medium text-slate-800 hover:underline"
                  >
                    {r.test_case_code} — {r.title}
                  </Link>
                  <p className="text-xs text-slate-500">{r.executor_name || 'Unknown'}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}