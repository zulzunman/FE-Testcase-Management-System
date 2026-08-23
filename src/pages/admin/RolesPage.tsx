import { useEffect, useState } from 'react';

import { extractError } from '../../api/client';
import { fetchRolesMatrix, type RolesMatrix } from '../../api/users';
import { useAuth } from '../../context/AuthContext';

export default function RolesPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [matrix, setMatrix] = useState<RolesMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchRolesMatrix()
      .then((m) => {
        if (active) setMatrix(m);
      })
      .catch((err) => {
        if (active) setError(extractError(err, 'Failed to load roles.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!isAdmin) {
    return (
      <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        You don't have permission to access role management.
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading…</div>;
  if (!matrix) {
    return (
      <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error || 'Failed to load roles.'}
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Roles & Permissions</h1>
      <p className="mb-4 text-sm text-slate-500">
        Permission matrix per role. Assign a role when creating/editing a user.
      </p>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Permission</th>
              {matrix.roles.map((r) => (
                <th key={r.role} className="px-4 py-3 text-center">
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {matrix.permissions.map((p) => (
              <tr key={p.key} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-700">
                  {p.label}
                  <span className="ml-2 font-mono text-xs text-slate-400">{p.key}</span>
                </td>
                {matrix.roles.map((r) => (
                  <td key={r.role} className="px-4 py-2.5 text-center">
                    {r.permissions.includes(p.key) ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}