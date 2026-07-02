'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import RoleForm from '@/components/roles/RoleForm';
import { roleApi } from '@/lib/roleApi';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { useEffect } from 'react';

export default function CreateRolePage() {
  const router = useRouter();
  const { user } = useAuth();
  const canCreate = hasPermission(user?.permissions ?? [], 'role', 'manage');

  useEffect(() => {
    if (user && !canCreate) router.replace('/roles');
  }, [user, canCreate, router]);

  if (!canCreate) return null;

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
          <h1 className="text-base font-semibold text-[var(--text)]">Create Role</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Define a new role and assign permissions</p>
        </div>
      </div>

      <RoleForm
        mode="create"
        onSubmit={(data) => roleApi.create(data as Parameters<typeof roleApi.create>[0])}
      />
    </div>
  );
}
