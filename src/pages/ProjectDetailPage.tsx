import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';

import { extractError } from '../api/client';
import {
  createFeature,
  createModule,
  deleteFeature,
  deleteModule,
  fetchProject,
  type Feature,
  type Module,
  type Project,
} from '../api/projects';
import { useAuth } from '../context/AuthContext';

function ModuleCard({
  module,
  canManage,
  onAddFeature,
  onDeleteFeature,
  onDeleteModule,
}: {
  module: Module;
  canManage: boolean;
  onAddFeature: (moduleId: number, name: string, description: string) => Promise<void>;
  onDeleteFeature: (feature: Feature) => Promise<void>;
  onDeleteModule: (id: number) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Feature name is required.');
      return;
    }
    setSaving(true);
    try {
      await onAddFeature(module.id, name.trim(), description);
      setName('');
      setDescription('');
      setShowForm(false);
    } catch (err) {
      setError(extractError(err, 'Failed to add feature.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-slate-900">{module.name}</h3>
        {canManage && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm((v) => !v)}
              className="text-sm text-slate-600 hover:underline"
            >
              {showForm ? 'Cancel' : '+ Feature'}
            </button>
            <button
              onClick={() => onDeleteModule(module.id)}
              className="text-sm text-red-600 hover:underline"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {showForm && canManage && (
        <form onSubmit={submit} className="mb-3 space-y-2 rounded bg-slate-50 p-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
            placeholder="Feature name *"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
            placeholder="Description (optional)"
          />
          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add Feature'}
          </button>
        </form>
      )}

      {module.features.length === 0 ? (
        <p className="text-sm text-slate-400">No features yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {module.features.map((f) => (
            <li key={f.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-700">{f.name}</span>
              {canManage && (
                <button
                  onClick={() => onDeleteFeature(f)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = Number(id);
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'qa_lead';

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [moduleName, setModuleName] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');
  const [savingModule, setSavingModule] = useState(false);
  const [moduleError, setModuleError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetchProject(projectId)
      .then(setProject)
      .catch((err) => setError(extractError(err, 'Failed to load project.')))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddModule = async (e: FormEvent) => {
    e.preventDefault();
    setModuleError('');
    if (!moduleName.trim()) {
      setModuleError('Module name is required.');
      return;
    }
    setSavingModule(true);
    try {
      await createModule(projectId, { name: moduleName.trim(), description: moduleDesc });
      setModuleName('');
      setModuleDesc('');
      load();
    } catch (err) {
      setModuleError(extractError(err, 'Failed to create module.'));
    } finally {
      setSavingModule(false);
    }
  };

  const handleAddFeature = async (moduleId: number, name: string, description: string) => {
    await createFeature(moduleId, { name, description });
    load();
  };

  const handleDeleteModule = async (moduleId: number) => {
    if (!window.confirm('Delete this module? Its features will also be removed.')) return;
    try {
      await deleteModule(moduleId);
      load();
    } catch (err) {
      setError(extractError(err, 'Failed to delete module.'));
    }
  };

  const handleDeleteFeature = async (feature: Feature) => {
    if (!window.confirm(`Delete feature "${feature.name}"?`)) return;
    try {
      await deleteFeature(feature.id);
      load();
    } catch (err) {
      setError(extractError(err, 'Failed to delete feature.'));
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading…</div>;
  if (!project) return <div className="p-8 text-center text-red-600">{error || 'Project not found.'}</div>;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900">{project.name}</h1>
        <p className="text-sm text-slate-500">{project.description || 'No description.'}</p>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {project.modules.map((m) => (
          <ModuleCard
            key={m.id}
            module={m}
            canManage={canManage}
            onAddFeature={handleAddFeature}
            onDeleteFeature={handleDeleteFeature}
            onDeleteModule={handleDeleteModule}
          />
        ))}

        {canManage && (
          <form
            onSubmit={handleAddModule}
            className="rounded-lg border border-dashed border-slate-300 bg-white p-4"
          >
            <h3 className="mb-2 font-medium text-slate-900">Add Module</h3>
            <div className="space-y-2">
              <input
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                placeholder="Module name *"
              />
              <input
                value={moduleDesc}
                onChange={(e) => setModuleDesc(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                placeholder="Description (optional)"
              />
              {moduleError && (
                <div className="rounded border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700">
                  {moduleError}
                </div>
              )}
              <button
                type="submit"
                disabled={savingModule}
                className="w-full rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {savingModule ? 'Saving…' : 'Add Module'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}