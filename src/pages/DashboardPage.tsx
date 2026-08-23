import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { extractError } from '../api/client';
import { fetchProjects, type Project } from '../api/projects';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchProjects({ page_size: 100 })
      .then((data) => {
        if (active) setProjects(data.results);
      })
      .catch((err) => {
        if (active) setError(extractError(err, 'Failed to load projects.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const totalModules = projects.reduce((sum, p) => sum + p.module_count, 0);
  const totalFeatures = projects.reduce(
    (sum, p) => sum + p.modules.reduce((ms, m) => ms + m.features.length, 0),
    0,
  );

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Dashboard</h1>
      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Projects</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">
            {loading ? '—' : projects.length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Modules</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">
            {loading ? '—' : totalModules}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Features</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">
            {loading ? '—' : totalFeatures}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-medium text-slate-900">Projects</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {projects.length === 0 && !loading && (
            <li className="px-4 py-8 text-center text-sm text-slate-500">
              No projects yet.{' '}
              <Link to="/projects" className="text-slate-700 underline">
                Create your first project
              </Link>
              .
            </li>
          )}
          {projects.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <Link to={`/projects/${p.id}`} className="font-medium text-slate-900 hover:underline">
                  {p.name}
                </Link>
                <p className="text-xs text-slate-500">{p.module_count} modules</p>
              </div>
              <span className="text-xs text-slate-400">
                {new Date(p.updated_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}