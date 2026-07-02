export {
  PermissionSubject,
  PermissionAction,
  perm,
  type PermissionSubjectValues,
  type PermissionActionValues,
} from '@/constants/permissions';

import { PermissionSubject, PermissionAction } from '@/constants/permissions';

// Legacy aliases kept for backward compatibility
export const SUBJECTS = PermissionSubject;
export const ACTIONS  = PermissionAction;

export type Subject = PermissionSubjectValues;
export type Action  = PermissionActionValues;

import type { PermissionSubjectValues, PermissionActionValues } from '@/constants/permissions';

// Ordered columns for the permission matrix
export const PERMISSION_ACTIONS: PermissionActionValues[] = [
  PermissionAction.MANAGE,
  PermissionAction.READ,
  PermissionAction.CREATE,
  PermissionAction.UPDATE,
  PermissionAction.DELETE,
];

// Resource groups shown in the permission matrix
export const PERMISSION_RESOURCES: { code: PermissionSubjectValues; label: string }[] = [
  { code: PermissionSubject.AFFILIATE, label: 'Affiliate Programs' },
  { code: PermissionSubject.PROXY,     label: 'Proxy Management' },
  { code: PermissionSubject.CONFIG,    label: 'Configuration' },
  { code: PermissionSubject.ROLE,      label: 'Role Management' },
  { code: PermissionSubject.USER,      label: 'User Management' },
];

export function hasPermission(
  permissions: string[],
  subject: PermissionSubjectValues,
  action: PermissionActionValues,
): boolean {
  if (permissions.includes('all:manage')) return true;
  if (permissions.includes(`${subject}:manage`)) return true;
  return permissions.includes(`${subject}:${action}`);
}

export function canAny(
  permissions: string[],
  checks: Array<[PermissionSubjectValues, PermissionActionValues]>,
): boolean {
  return checks.some(([s, a]) => hasPermission(permissions, s, a));
}
