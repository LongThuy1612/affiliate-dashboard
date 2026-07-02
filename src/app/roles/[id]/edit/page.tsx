'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import RoleForm from '@/components/roles/RoleForm';
import { roleApi, type Role } from '@/lib/roleApi';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { user } = useAuth();
  const canEdit = hasPermission(user?.permissions ?? [], 'role', 'manage');

  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && !canEdit) { router.replace('/roles'); return; }
    roleApi.get(id)
      .then(setRole)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, user, canEdit, router]);

  if (loading) return (
    <div className="p-6 text-sm text-[var(--text-muted)]">Loading…</div>
  );

  if (error) return (
    <div className="p-6">
      <div className="rounded-md bg-[var(--danger)]/10 border border-[var(--danger)]/30 px-4 py-3 text-sm text-[var(--danger)]">
        {error}
      </div>
    </div>
  );

  if (!role) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/roles')}
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-base font-semibold text-[var(--text)]">
            Edit Role — <span className="font-mono text-[var(--accent)]">{role.code}</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {role.isConst ? 'System role — permissions are read-only' : 'Modify role permissions'}
          </p>
        </div>
      </div>

      <RoleForm
        mode="edit"
        initial={{
          code: role.code,
          name: role.name,
          description: role.description ?? '',
          isConst: role.isConst,
          permissions: role.permissions,
        }}
        onSubmit={(data) => roleApi.update(id, data)}
      />
    </div>
  );
}
