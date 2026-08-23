import { useEffect, useState } from 'react';

import { extractError } from '../api/client';
import { fetchProjects, type Project } from '../api/projects';
import {
  fetchExecutionSummary,
  fetchProgress,
  fetchTestSummary,
  type ExecutionSummary,
  type ModuleProgress,
  type ProjectProgress,
  type TestCaseSummary,
} from '../api/reports';

const humanize = (s: string) =>
  s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');

  const [testSummary, setTestSummary] = useState<TestCaseSummary | null>(null);
  const [execSummary, setExecSummary] = useState<ExecutionSummary | null>(null);
  const [progress, setProgress] = useState<ProjectProgress[]>([]);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects({ page_size: 100 })
      .then((d) => setProjects(d.results))
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const params = projectId ? { project: Number(projectId) } : undefined;
    Promise.all([
      fetchTestSummary(params),
      fetchExecutionSummary(params),
      fetchProgress(params),
    ])
      .then(([ts, es, pg]) => {
        if (!active) return;
        setTestSummary(ts);
        setExecSummary(es);
        setProgress(pg.projects);
        setModuleProgress(pg.modules ?? []);
      })
      .catch((err) => {
        if (active) setError(extractError(err, 'Failed to load reports.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  if (loading && !testSummary) {
    return <div className="p-8 text-center text-slate-500">Loading…</div>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Reports</h1>
        <div>
          <label className="mr-2 text-sm text-slate-600">Project</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-900"
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {testSummary && (
        <section className="mb-6">
          <h2 className="mb-3 font-medium text-slate-900">Test Case Summary</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            <StatCard label="Total" value={testSummary.total} color="text-slate-900" />
            <StatCard label="Draft" value={testSummary.draft} color="text-slate-600" />
            <StatCard label="Ready" value={testSummary.ready} color="text-blue-700" />
            <StatCard label="In Progress" value={testSummary.in_progress} color="text-indigo-700" />
            <StatCard label="Passed" value={testSummary.passed} color="text-green-700" />
            <StatCard label="Failed" value={testSummary.failed} color="text-red-700" />
            <StatCard label="Blocked" value={testSummary.blocked} color="text-yellow-700" />
          </div>
        </section>
      )}

      {execSummary && (
        <section className="mb-6">
          <h2 className="mb-3 font-medium text-slate-900">Execution Summary</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <StatCard
              label="Total Executions"
              value={execSummary.total_executions}
              color="text-slate-900"
            />
            <StatCard label="Pass" value={execSummary.pass} color="text-green-700" />
            <StatCard label="Fail" value={execSummary.fail} color="text-red-700" />
            <StatCard label="Blocked" value={execSummary.blocked} color="text-yellow-700" />
            <StatCard
              label="Pass Rate"
              value={`${execSummary.pass_rate}%`}
              color="text-blue-700"
            />
          </div>
          <div className="mt-4 flex gap-4">
            <div className="flex-1">
              <p className="mb-1 text-xs text-slate-500">Pass rate</p>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${Math.min(100, execSummary.pass_rate)}%` }}
                />
              </div>
            </div>
            <div className="flex-1">
              <p className="mb-1 text-xs text-slate-500">Fail rate</p>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-red-500"
                  style={{ width: `${Math.min(100, execSummary.fail_rate)}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-medium text-slate-900">Progress per Project</h2>
        </div>
        {progress.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            No active test cases found.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {progress.map((p) => (
              <li key={p.project_id} className="px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{p.project_name}</span>
                  <span className="text-slate-500">
                    {p.executed}/{p.total} executed — {p.progress}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${Math.min(100, p.progress)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {projectId && moduleProgress.length > 0 && (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-medium text-slate-900">Progress per Module</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {moduleProgress.map((m) => (
              <li key={m.module_id} className="px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{m.module_name}</span>
                  <span className="text-slate-500">
                    {m.executed}/{m.total} executed — {m.progress}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${Math.min(100, m.progress)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-6 text-xs text-slate-400">
        Coverage excludes deprecated test cases. {humanize('not run')} = total active minus executed.
      </p>
    </div>
  );
}