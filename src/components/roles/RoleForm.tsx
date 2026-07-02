'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ACTIONS, PERMISSION_ACTIONS, PERMISSION_RESOURCES } from '@/lib/permissions';
import type { RoleCreateRequest, RolePermission, RoleUpdateRequest } from '@/lib/roleApi';

type PermissionMap = Record<string, Record<string, boolean>>;

function buildPermMap(perms: RolePermission[]): PermissionMap {
  const map: PermissionMap = {};
  for (const { resourceCode, action } of perms) {
    if (!map[resourceCode]) map[resourceCode] = {};
    map[resourceCode][action] = true;
  }
  return map;
}

function flattenPermMap(map: PermissionMap): RolePermission[] {
  const result: RolePermission[] = [];
  for (const resourceCode of Object.keys(map)) {
    for (const action of Object.keys(map[resourceCode])) {
      if (map[resourceCode][action]) result.push({ resourceCode, action });
    }
  }
  return result;
}

interface Props {
  mode: 'create' | 'edit';
  initial?: {
    code?: string;
    name?: string;
    description?: string;
    isConst?: boolean;
    permissions?: RolePermission[];
  };
  onSubmit: (data: RoleCreateRequest | RoleUpdateRequest) => Promise<unknown>;
}

export default function RoleForm({ mode, initial = {}, onSubmit }: Props) {
  const router = useRouter();
  const [code, setCode] = useState(initial.code ?? '');
  const [name, setName] = useState(initial.name ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [permMap, setPermMap] = useState<PermissionMap>(
    buildPermMap(initial.permissions ?? []),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const setCell = (resource: string, action: string, checked: boolean) => {
    setPermMap((prev) => {
      const next = { ...prev, [resource]: { ...(prev[resource] ?? {}) } };
      if (checked) {
        // Checking 'manage' → auto-check all
        if (action === ACTIONS.MANAGE) {
          for (const a of PERMISSION_ACTIONS) next[resource][a] = true;
        } else {
          next[resource][action] = true;
        }
      } else {
        // Unchecking 'manage' → uncheck all
        if (action === ACTIONS.MANAGE) {
          for (const a of PERMISSION_ACTIONS) next[resource][a] = false;
        } else {
          next[resource][action] = false;
          next[resource][ACTIONS.MANAGE] = false;
        }
      }
      return next;
    });
  };

  const isRowFull = (resource: string) =>
    PERMISSION_ACTIONS.every((a) => permMap[resource]?.[a]);

  const toggleRow = (resource: string) => {
    const full = isRowFull(resource);
    setPermMap((prev) => {
      const next = { ...prev, [resource]: {} as Record<string, boolean> };
      for (const a of PERMISSION_ACTIONS) next[resource][a] = !full;
      return next;
    });
  };

  const isAllFull = PERMISSION_RESOURCES.every((r) => isRowFull(r.code));

  const toggleAll = () => {
    setPermMap(() => {
      const next: PermissionMap = {};
      for (const { code: rc } of PERMISSION_RESOURCES) {
        next[rc] = {};
        for (const a of PERMISSION_ACTIONS) next[rc][a] = !isAllFull;
      }
      return next;
    });
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    if (mode === 'create' && !code.trim()) { setError('Code is required.'); return; }

    setError('');
    setSubmitting(true);
    try {
      const permissions = flattenPermMap(permMap);
      if (mode === 'create') {
        await onSubmit({ code: code.trim().toUpperCase(), name: name.trim(), description: description.trim() || undefined, permissions });
      } else {
        await onSubmit({ name: name.trim(), description: description.trim() || undefined, permissions });
      }
      router.push('/roles');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save role.');
    } finally {
      setSubmitting(false);
    }
  };

  const isConst = initial.isConst ?? false;

  // ── UI ───────────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Basic fields */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[var(--text)]">Role Info</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mode === 'create' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                Code <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                placeholder="EDITOR"
                maxLength={50}
                className="px-3 py-2 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              <p className="text-[11px] text-[var(--text-muted)]">Uppercase letters, numbers, underscores only</p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              Name <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Editor"
              maxLength={100}
              disabled={isConst}
              className="px-3 py-2 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this role can do…"
            rows={2}
            maxLength={500}
            disabled={isConst}
            className="px-3 py-2 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-sm resize-none focus:outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
          />
        </div>
      </div>

      {/* Permission matrix */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text)]">Permissions</h2>
          {!isConst && (
            <button
              type="button"
              onClick={toggleAll}
              className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                isAllFull
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
              }`}
            >
              {isAllFull ? 'Revoke All' : 'Grant All'}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--surface-2)]">
                <th className="text-left px-6 py-2.5 text-xs font-medium text-[var(--text-muted)] w-48">Resource</th>
                {PERMISSION_ACTIONS.map((a) => (
                  <th key={a} className="text-center px-3 py-2.5 text-xs font-medium text-[var(--text-muted)] capitalize w-20">
                    {a}
                  </th>
                ))}
                {!isConst && (
                  <th className="text-center px-3 py-2.5 text-xs font-medium text-[var(--text-muted)] w-20">All</th>
                )}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_RESOURCES.map(({ code: rc, label }, i) => (
                <tr key={rc} className={i % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--surface-2)]/40'}>
                  <td className="px-6 py-3 text-xs text-[var(--text)]">{label}</td>
                  {PERMISSION_ACTIONS.map((action) => (
                    <td key={action} className="text-center px-3 py-3">
                      <input
                        type="checkbox"
                        checked={!!permMap[rc]?.[action]}
                        onChange={(e) => !isConst && setCell(rc, action, e.target.checked)}
                        disabled={isConst}
                        className="w-4 h-4 accent-[var(--accent)] cursor-pointer disabled:cursor-default"
                      />
                    </td>
                  ))}
                  {!isConst && (
                    <td className="text-center px-3 py-3">
                      <button
                        type="button"
                        onClick={() => toggleRow(rc)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          isRowFull(rc)
                            ? 'bg-[var(--accent)]/20 text-[var(--accent)] border-[var(--accent)]/40'
                            : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                        }`}
                      >
                        {isRowFull(rc) ? '✓ Full' : 'All'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isConst && (
          <div className="px-6 py-3 bg-[var(--warning)]/10 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--warning)]">
              This is a system role — permissions cannot be modified.
            </p>
          </div>
        )}
      </div>

      {/* Error + actions */}
      {error && (
        <div className="rounded-md bg-[var(--danger)]/10 border border-[var(--danger)]/30 px-4 py-2 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.push('/roles')}
          className="px-4 py-2 rounded-md text-sm text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] hover:border-[var(--text-muted)] transition-colors"
        >
          Cancel
        </button>
        {!isConst && (
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-md text-sm font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving…' : mode === 'create' ? 'Create Role' : 'Save Changes'}
          </button>
        )}
      </div>
    </form>
  );
}
