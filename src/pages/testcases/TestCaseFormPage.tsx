import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { extractError } from '../../api/client';
import { fetchFeatures, fetchModules, fetchProjects, type Project } from '../../api/projects';
import {
  createTestCase,
  fetchTestCase,
  TEST_CASE_PRIORITIES,
  TEST_CASE_STATUSES,
  updateTestCase,
  type TestCasePayload,
} from '../../api/test-cases';
import { fetchUsers, type User } from '../../api/users';
import { useAuth } from '../../context/AuthContext';

interface StepRow {
  action: string;
  expected: string;
}

const EMPTY_STEP: StepRow = { action: '', expected: '' };

export default function TestCaseFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite =
    user?.role === 'admin' || user?.role === 'qa_lead' || user?.role === 'qa_engineer';

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [projectId, setProjectId] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [featureId, setFeatureId] = useState('');
  const [modules, setModules] = useState<Project['modules']>([]);
  const [features, setFeatures] = useState<Project['modules'][number]['features']>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('draft');
  const [assignee, setAssignee] = useState('');
  const [tags, setTags] = useState('');
  const [steps, setSteps] = useState<StepRow[]>([{ ...EMPTY_STEP }]);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects({ page_size: 100 })
      .then((d) => setProjects(d.results))
      .catch(() => setProjects([]));
    fetchUsers()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    if (!projectId) {
      setModules([]);
      setFeatures([]);
      setModuleId('');
      setFeatureId('');
      return;
    }
    fetchModules(Number(projectId), { page_size: 100 })
      .then((d) => setModules(d.results))
      .catch(() => setModules([]));
  }, [projectId]);

  useEffect(() => {
    if (!moduleId) {
      setFeatures([]);
      setFeatureId('');
      return;
    }
    fetchFeatures(Number(moduleId), { page_size: 100 })
      .then((d) => setFeatures(d.results))
      .catch(() => setFeatures([]));
  }, [moduleId]);

  // Load existing test case for edit mode
  useEffect(() => {
    if (!id) return;
    let active = true;
    fetchTestCase(Number(id))
      .then((tc) => {
        if (!active) return;
        setProjectId(String(tc.project));
        setModuleId(String(tc.module));
        setFeatureId(tc.feature ? String(tc.feature) : '');
        setTitle(tc.title);
        setDescription(tc.description);
        setPreconditions(tc.preconditions);
        setExpectedResult(tc.expected_result);
        setPriority(tc.priority);
        setStatus(tc.status);
        setAssignee(tc.assignee ? String(tc.assignee) : '');
        setTags(tc.tags.join(', '));
        setSteps(tc.steps.length ? tc.steps.map((s) => ({ action: s.action, expected: s.expected })) : [{ ...EMPTY_STEP }]);
      })
      .catch((err) => setError(extractError(err, 'Failed to load test case.')))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const addStep = () => setSteps((s) => [...s, { ...EMPTY_STEP }]);
  const removeStep = (index: number) =>
    setSteps((s) => (s.length <= 1 ? s : s.filter((_, i) => i !== index)));
  const updateStep = (index: number, field: keyof StepRow, value: string) =>
    setSteps((s) => s.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  const buildPayload = (): TestCasePayload => ({
    project: Number(projectId),
    module: Number(moduleId),
    feature: featureId ? Number(featureId) : null,
    title: title.trim(),
    description,
    preconditions,
    expected_result: expectedResult.trim(),
    priority,
    status,
    assignee: assignee ? Number(assignee) : null,
    tag_names: tags.split(',').map((t) => t.trim()).filter(Boolean),
    steps: steps.map((s) => ({ action: s.action.trim(), expected: s.expected.trim() })),
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Test case title is required.');
      return;
    }
    if (!projectId || !moduleId) {
      setError('Project and Module are required.');
      return;
    }
    if (!expectedResult.trim()) {
      setError('Expected result is required.');
      return;
    }
    const cleanSteps = buildPayload().steps;
    if (cleanSteps.length === 0 || cleanSteps.every((s) => !s.action)) {
      setError('Test steps are required (at least one step).');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      const saved = isEdit
        ? await updateTestCase(Number(id), payload)
        : await createTestCase(payload);
      navigate(`/test-cases/${saved.id}`);
    } catch (err) {
      setError(extractError(err, 'Failed to save test case.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading…</div>;
  if (!canWrite) {
    return (
      <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        You don't have permission to perform this action.
      </div>
    );
  }

  const inputCls =
    'w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none';
  const labelCls = 'mb-1 block text-sm font-medium text-slate-700';

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
          {isEdit ? 'Edit Test Case' : 'Create Test Case'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Basic info */}
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-medium text-slate-900">Test Case Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className={inputCls}
                placeholder="e.g. Login with valid credentials"
              />
            </div>
            <div>
              <label className={labelCls}>Project *</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className={inputCls}
              >
                <option value="">Select project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Module *</label>
              <select
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                disabled={!projectId}
                className={inputCls}
              >
                <option value="">Select module…</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Feature (optional)</label>
              <select
                value={featureId}
                onChange={(e) => setFeatureId(e.target.value)}
                disabled={!moduleId}
                className={inputCls}
              >
                <option value="">None</option>
                {features.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority *</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
                {TEST_CASE_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                {TEST_CASE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Assignee (optional)</label>
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={inputCls}>
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email} ({u.role_display})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Tags (comma separated, max 10)</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className={inputCls}
                placeholder="regression, smoke"
              />
            </div>
          </div>
        </section>

        {/* Description & preconditions */}
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-medium text-slate-900">Details</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Preconditions</label>
              <textarea
                value={preconditions}
                onChange={(e) => setPreconditions(e.target.value)}
                rows={2}
                className={inputCls}
                placeholder="e.g. User already registered"
              />
            </div>
            <div>
              <label className={labelCls}>Expected Result *</label>
              <textarea
                value={expectedResult}
                onChange={(e) => setExpectedResult(e.target.value)}
                rows={2}
                className={inputCls}
              />
            </div>
          </div>
        </section>

        {/* Test steps */}
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium text-slate-900">Test Steps *</h2>
            <button
              type="button"
              onClick={addStep}
              className="rounded bg-slate-700 px-3 py-1 text-sm font-medium text-white hover:bg-slate-600"
            >
              + Add Step
            </button>
          </div>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-2">
                <span className="flex w-8 items-center justify-center rounded bg-slate-100 text-sm font-medium text-slate-500">
                  {i + 1}
                </span>
                <input
                  value={step.action}
                  onChange={(e) => updateStep(i, 'action', e.target.value)}
                  className={inputCls}
                  placeholder="Action"
                />
                <input
                  value={step.expected}
                  onChange={(e) => updateStep(i, 'expected', e.target.value)}
                  className={inputCls}
                  placeholder="Expected (per step)"
                />
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  disabled={steps.length <= 1}
                  className="rounded border border-slate-300 px-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Update Test Case' : 'Create Test Case'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}