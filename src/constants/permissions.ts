export const PermissionSubject = {
  ALL:       'all',
  AFFILIATE: 'affiliate',
  PROXY:     'proxy',
  CONFIG:    'config',
  ROLE:      'role',
  USER:      'user',
  FEEDBACK:  'feedback',
} as const;

export type PermissionSubjectValues = (typeof PermissionSubject)[keyof typeof PermissionSubject];

export const PermissionAction = {
  MANAGE: 'manage',
  READ:   'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;

export type PermissionActionValues = (typeof PermissionAction)[keyof typeof PermissionAction];

/** Build a permission string, e.g. perm(S.AFFILIATE, A.READ) → "affiliate:read" */
export function perm(
  subject: PermissionSubjectValues,
  action: PermissionActionValues,
): string {
  return `${subject}:${action}`;
}
