'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, ShieldCheck, ChevronDown, ChevronRight } from 'lucide-react';
import { roleApi, type Role } from '@/lib/roleApi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toaster';
import { hasPermission, PERMISSION_ACTIONS, PERMISSION_RESOURCES } from '@/lib/permissions';
import { resolveApiError } from '@/lib/apiError';

function PermissionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    manage: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    read:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
    create: 'bg-green-500/20 text-green-400 border-green-500/30',
    update: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    delete: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors[action] ?? 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]'}`}>
      {action}
    </span>
  );
}

function RoleRow({ role, canEdit, onDelete }: { role: Role; canEdit: boolean; onDelete: (id: number) => void }) {
  const t = useTranslations('roles');
  const [expanded, setExpanded] = useState(false);

  const grouped = PERMISSION_RESOURCES.map(({ code, label }) => ({
    code,
    label,
    actions: PERMISSION_ACTIONS.filter((a) =>
      role.permissions.some((p) => p.resourceCode === code && p.action === a)
    ),
  })).filter((g) => g.actions.length > 0);

  const isAllManage = role.permissions.some((p) => p.resourceCode === 'all' && p.action === 'manage');

  return (
    <>
      <tr className="border-b border-[var(--border)] hover:bg-[var(--surface-2)]/40 transition-colors">
        <td className="px-4 py-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/25">
              {role.code}
            </span>
            {role.isConst && (
              <ShieldCheck size={13} className="text-[var(--warning)]" />
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-[var(--text)]">{role.name}</td>
        <td className="px-4 py-3 text-sm text-[var(--text-muted)] max-w-xs truncate">{role.description ?? '—'}</td>
        <td className="px-4 py-3">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
            role.status === 'ACTIVE'
              ? 'bg-[var(--success)]/15 text-[var(--success)]'
              : 'bg-[var(--danger)]/15 text-[var(--danger)]'
          }`}>
            {role.status}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          {canEdit && !role.isConst && (
            <div className="flex items-center gap-1 justify-end">
              <Link
                href={`/roles/${role.id}/edit`}
                className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
              >
                <Pencil size={13} />
              </Link>
              <button
                onClick={() => onDelete(role.id)}
                className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/30">
          <td colSpan={6} className="px-8 py-3">
            {isAllManage ? (
              <span className="text-xs text-[var(--warning)] font-medium">⚡ all:manage — {t('allManage')}</span>
            ) : grouped.length === 0 ? (
              <span className="text-xs text-[var(--text-muted)]">{t('noPermissions')}</span>
            ) : (
              <div className="flex flex-col gap-2">
                {grouped.map(({ code, label, actions }) => (
                  <div key={code} className="flex items-start gap-3">
                    <span className="text-xs text-[var(--text-muted)] w-36 shrink-0 pt-0.5">{label}</span>
                    <div className="flex flex-wrap gap-1">
                      {actions.map((a) => <PermissionBadge key={a} action={a} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function RolesPage() {
  const t = useTranslations('roles');
  const tCommon = useTranslations('common');
  const tErr = useTranslations('errors');
  const { toast } = useToast();
  const { user } = useAuth();
  const perms = user?.permissions ?? [];
  const canEdit = hasPermission(perms, 'role', 'manage');

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    roleApi.list()
      .then(setRoles)
      .catch((e) => setLoadError(resolveApiError(e, tErr)))
      .finally(() => setLoading(false));
  }, [tErr]);

  const handleDelete = async (id: number) => {
    const role = roles.find((r) => r.id === id);
    if (!confirm(t('deleteConfirm', { name: role?.name ?? '' }))) return;
    setDeleting(id);
    try {
      await roleApi.delete(id);
      setRoles((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      toast(resolveApiError(e, tErr), { type: 'error' });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-[var(--text)]">{t('title')}</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{t('subtitle')}</p>
        </div>
        {canEdit && (
          <Link
            href="/roles/create"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-colors"
          >
            <Plus size={14} />
            {t('newRole')}
          </Link>
        )}
      </div>

      {loading && (
        <div className="text-sm text-[var(--text-muted)] py-12 text-center">
          {tCommon('loading')}
        </div>
      )}

      {loadError && (
        <div className="rounded-md bg-[var(--danger)]/10 border border-[var(--danger)]/30 px-4 py-3 text-sm text-[var(--danger)]">
          {loadError}
        </div>
      )}

      {!loading && !loadError && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                <th className="w-10 px-4 py-3" />
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide w-36">{t('code')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{t('name')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{t('description')}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide w-24">{t('status')}</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-[var(--text-muted)]">{t('noRoles')}</td>
                </tr>
              ) : (
                roles.map((role) => (
                  <RoleRow
                    key={role.id}
                    role={role}
                    canEdit={canEdit && deleting !== role.id}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
