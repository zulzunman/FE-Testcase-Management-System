import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { extractError } from '../../api/client';
import { executeTestCase, TEST_RESULTS } from '../../api/test-executions';
import { fetchTestCase, type TestCase } from '../../api/test-cases';
import { useAuth } from '../../context/AuthContext';

export default function TestCaseExecutePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canExecute =
    user?.role === 'admin' || user?.role === 'qa_lead' || user?.role === 'qa_engineer';

  const [tc, setTc] = useState<TestCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [result, setResult] = useState('');
  const [actualResult, setActualResult] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!result) {
      setError('Test result is required.');
      return;
    }
    if (result === 'fail') {
      if (!actualResult.trim()) {
        setError('Actual result is required for failed test.');
        return;
      }
      if (!notes.trim()) {
        setError('Notes are required for failed test.');
        return;
      }
    }
    setSaving(true);
    try {
      const res = await executeTestCase(Number(id), {
        result,
        actual_result: actualResult.trim(),
        notes: notes.trim(),
        attachments: files.length ? files : undefined,
      });
      navigate(`/test-cases/${id}`, { state: { executionDone: true, newStatus: res.test_case_status } });
    } catch (err) {
      setError(extractError(err, 'Failed to save execution.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading…</div>;
  if (!tc) return <div className="p-8 text-center text-red-600">{error || 'Test case not found.'}</div>;
  if (!canExecute) {
    return (
      <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        You don't have permission to execute test cases.
      </div>
    );
  }

  const inputCls =
    'w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none';
  const labelCls = 'mb-1 block text-sm font-medium text-slate-700';

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900">Execute Test Case</h1>
        <p className="font-mono text-xs text-slate-500">
          {tc.test_case_code} — {tc.title}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Test steps as reference (PRD UI Behaviour) */}
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-medium text-slate-900">Test Steps (reference)</h2>
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
          {tc.preconditions && (
            <div className="mt-4 rounded bg-amber-50 p-3 text-sm">
              <p className="font-medium text-amber-800">Preconditions</p>
              <p className="mt-1 whitespace-pre-wrap text-amber-700">{tc.preconditions}</p>
            </div>
          )}
          <div className="mt-4 rounded bg-slate-50 p-3 text-sm">
            <p className="font-medium text-slate-600">Expected Result</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-700">{tc.expected_result}</p>
          </div>
        </section>

        {/* Execution form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-medium text-slate-900">Execution Result</h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Result *</label>
                <div className="flex gap-2">
                  {TEST_RESULTS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setResult(r)}
                      className={`flex-1 rounded border px-3 py-2 text-sm font-medium capitalize transition ${
                        result === r
                          ? r === 'pass'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : r === 'fail'
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>
                  Actual Result {result === 'fail' ? '*' : ''}
                </label>
                <textarea
                  value={actualResult}
                  onChange={(e) => setActualResult(e.target.value)}
                  rows={3}
                  className={inputCls}
                  placeholder="What actually happened during testing"
                />
              </div>
              <div>
                <label className={labelCls}>Notes {result === 'fail' ? '*' : ''}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className={inputCls}
                  placeholder="Additional context for developers (required for failed test)"
                />
              </div>
              <div>
                <label className={labelCls}>Evidence (screenshot/file, optional)</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                />
                {files.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    {files.length} file(s): {files.map((f) => f.name).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Execution'}
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
    </div>
  );
}