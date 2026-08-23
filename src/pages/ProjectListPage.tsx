import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { extractError } from '../api/client';
import {
  createProject,
  deleteProject,
  fetchProjects,
  type Project,
} from '../api/projects';
import { useAuth } from '../context/AuthContext';

export default function ProjectListPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'qa_lead';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    fetchProjects({ page_size: 100 })
      .then((data) => setProjects(data.results))
      .catch((err) => setError(extractError(err, 'Failed to load projects.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) {
      setFormError('Project name is required.');
      return;
    }
    setSaving(true);
    try {
      await createProject({ name: name.trim(), description });
      setName('');
      setDescription('');
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(extractError(err, 'Failed to create project.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this project? All modules and features will be removed.')) {
      return;
    }
    try {
      await deleteProject(id);
      load();
    } catch (err) {
      setError(extractError(err, 'Failed to delete project.'));
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Projects</h1>
        {canManage && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            {showForm ? 'Cancel' : '+ Create Project'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && canManage && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="project-name" className="mb-1 block text-sm font-medium text-slate-700">
                Name *
              </label>
              <input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                placeholder="e.g. Mobile Banking App"
              />
            </div>
            <div>
              <label htmlFor="project-desc" className="mb-1 block text-sm font-medium text-slate-700">
                Description
              </label>
              <input
                id="project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                placeholder="Optional"
              />
            </div>
          </div>
          {formError && (
            <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="mt-3 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Project'}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Modules</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No projects found.
                </td>
              </tr>
            )}
            {projects.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/projects/${p.id}`} className="font-medium text-slate-900 hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.description || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{p.module_count}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(p.updated_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {canManage && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}