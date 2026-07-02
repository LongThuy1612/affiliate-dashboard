'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Pencil, Trash2, ShieldCheck } from 'lucide-react';
import { userApi, type User } from '@/lib/userApi';
import { roleApi, type Role } from '@/lib/roleApi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toaster';
import { hasPermission } from '@/lib/permissions';
import { resolveApiError } from '@/lib/apiError';
import { PermissionSubject as S, PermissionAction as A } from '@/constants/permissions';

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  user,
  roles,
  onSave,
  onClose,
}: {
  user: User;
  roles: Role[];
  onSave: (updated: User) => void;
  onClose: () => void;
}) {
  const t = useTranslations('users');
  const tErr = useTranslations('errors');
  const { toast } = useToast();
  const [fullName, setFullName] = useState(user.fullName ?? '');
  const [roleId, setRoleId] = useState<string>(user.roleId != null ? String(user.roleId) : '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await userApi.update(user.id, {
        fullName: fullName.trim() || undefined,
        roleId: roleId ? Number(roleId) : null,
      });
      onSave(updated);
    } catch (e) {
      toast(resolveApiError(e, tErr), { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-[var(--text)]">{t('edit.title')}</h2>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--text-muted)]">{t('edit.fullNameLabel')}</label>
          <input
            className="w-full rounded-md border bg-[var(--surface-2)] border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            placeholder={t('edit.fullNamePlaceholder')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--text-muted)]">{t('edit.roleLabel')}</label>
          <select
            className="w-full rounded-md border bg-[var(--surface-2)] border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
          >
            <option value="">{t('edit.noRole')}</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {saving ? '…' : t('edit.submit')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-md border border-[var(--border)] text-[var(--text-muted)] text-sm hover:bg-[var(--surface-2)] transition-colors"
          >
            {t('edit.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────

function UserRow({
  user,
  canManage,
  isSelf,
  onEdit,
  onDelete,
}: {
  user: User;
  canManage: boolean;
  isSelf: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}) {
  const t = useTranslations('users');
  const isAllManage = user.role?.code === 'SUPERADMIN';

  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--surface-2)]/40 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-[var(--text)]">{user.username}</span>
          {isSelf && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/25">
              you
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{user.fullName ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{user.email ?? '—'}</td>
      <td className="px-4 py-3">
        {user.role ? (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/25">
              {user.role.code}
            </span>
            {isAllManage && <ShieldCheck size={13} className="text-[var(--warning)]" />}
          </div>
        ) : (
          <span className="text-xs text-[var(--text-muted)] italic">{t('noRole')}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
          user.status === 'ACTIVE'
            ? 'bg-[var(--success)]/15 text-[var(--success)]'
            : 'bg-[var(--danger)]/15 text-[var(--danger)]'
        }`}>
          {user.status}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {canManage && (
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={() => onEdit(user)}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
              title="Edit"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(user)}
              disabled={isSelf}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={isSelf ? 'Cannot delete yourself' : 'Delete'}
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const tErr = useTranslations('errors');
  const { toast } = useToast();
  const { user: me } = useAuth();
  const perms = me?.permissions ?? [];
  const canManage = hasPermission(perms, S.USER, A.MANAGE);

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([userApi.list(), roleApi.list()])
      .then(([u, r]) => { setUsers(u); setRoles(r); })
      .catch((e) => setLoadError(resolveApiError(e, tErr)))
      .finally(() => setLoading(false));
  }, [tErr]);

  const handleSaved = (updated: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setEditing(null);
    toast('Saved', { type: 'success' });
  };

  const handleDelete = async (user: User) => {
    if (user.id === me?.id) { toast(t('deleteSelf'), { type: 'error' }); return; }
    if (!confirm(t('deleteConfirm', { name: user.username }))) return;
    setDeleting(user.id);
    try {
      await userApi.delete(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (e) {
      toast(resolveApiError(e, tErr), { type: 'error' });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      {editing && (
        <EditModal
          user={editing}
          roles={roles}
          onSave={handleSaved}
          onClose={() => setEditing(null)}
        />
      )}

      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-base font-semibold text-[var(--text)]">{t('title')}</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{t('subtitle')}</p>
        </div>

        {loading && (
          <div className="text-sm text-[var(--text-muted)] py-12 text-center">{tCommon('loading')}</div>
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
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{t('username')}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{t('fullName')}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{t('email')}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{t('role')}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide w-24">{t('status')}</th>
                  <th className="w-20 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-[var(--text-muted)]">{t('noUsers')}</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      canManage={canManage && deleting !== user.id}
                      isSelf={user.id === me?.id}
                      onEdit={setEditing}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
