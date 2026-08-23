import { useEffect, useState, type FormEvent } from 'react';

import { extractError } from '../../api/client';
import {
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
  USER_ROLES,
  type User,
  type UserPayload,
} from '../../api/users';
import { useAuth } from '../../context/AuthContext';

const humanize = (s: string) =>
  s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

interface FormState {
  id: number | null;
  email: string;
  full_name: string;
  role: string;
  password: string;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  id: null,
  email: '',
  full_name: '',
  role: 'qa_engineer',
  password: '',
  is_active: true,
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    fetchUsers()
      .then(setUsers)
      .catch((err) => setError(extractError(err, 'Failed to load users.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isAdmin) {
    return (
      <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        You don't have permission to access user management.
      </div>
    );
  }

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setForm({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      password: '',
      is_active: u.is_active,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.email.trim() || !form.full_name.trim()) {
      setFormError('Email and full name are required.');
      return;
    }
    if (!form.id && !form.password) {
      setFormError('Password is required for a new user.');
      return;
    }
    setSaving(true);
    try {
      const payload: UserPayload = {
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        role: form.role,
        is_active: form.is_active,
        ...(form.password ? { password: form.password } : {}),
      };
      if (form.id) {
        await updateUser(form.id, payload);
      } else {
        await createUser(payload);
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setFormError(extractError(err, 'Failed to save user.'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      await updateUser(u.id, { is_active: !u.is_active });
      load();
    } catch (err) {
      setError(extractError(err, 'Failed to update user.'));
    }
  };

  const handleDelete = async (u: User) => {
    if (u.id === currentUser?.id) {
      setError('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Delete user "${u.email}"?`)) return;
    try {
      await deleteUser(u.id);
      load();
    } catch (err) {
      setError(extractError(err, 'Failed to delete user.'));
    }
  };

  const inputCls =
    'w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none';
  const labelCls = 'mb-1 block text-sm font-medium text-slate-700';

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Users</h1>
        <button
          onClick={openCreate}
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Create User
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          noValidate
        >
          <h2 className="mb-3 font-medium text-slate-900">
            {form.id ? `Edit User — ${form.email}` : 'Create User'}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Full Name *</label>
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={inputCls}
              >
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {humanize(r)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>
                Password {form.id ? '(leave blank to keep)' : '*'}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={inputCls}
                autoComplete="new-password"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Active
              </label>
            </div>
          </div>
          {formError && (
            <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : form.id ? 'Update User' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Full Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No users found.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {u.email}
                  {u.id === currentUser?.id && (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                      you
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700">{u.full_name || '—'}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {u.role_display}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      u.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(u)} className="text-slate-600 hover:underline">
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(u)}
                      className="text-slate-600 hover:underline"
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}