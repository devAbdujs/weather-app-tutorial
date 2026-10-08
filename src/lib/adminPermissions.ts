export type AdminPermission =
  | 'admin:manage'
  | 'payments:view'
  | 'payments:approve'
  | 'payments:reject'
  | 'ai:view'
  | 'users:view'
  | 'notes:read'
  | 'notes:write'
  | 'questions:read'
  | 'questions:write'
  | 'analytics:read'
  | 'ambassador:view';

export function hasPermission(admin: { role: string } | null | undefined, permission: AdminPermission): boolean {
  if (!admin) return false;
  if (admin.role === 'superadmin') return true;

  switch (permission) {
    case 'admin:manage':
    case 'ai:view':
      return admin.role === 'superadmin';

    case 'ambassador:view':
      return ['superadmin', 'ambassador'].includes(admin.role);

    case 'payments:view':
    case 'payments:approve':
    case 'payments:reject':
      return admin.role === 'financial_admin';

    case 'users:view':
      return ['financial_admin', 'readonly'].includes(admin.role);

    case 'analytics:read':
      return ['financial_admin', 'readonly', 'reviewer'].includes(admin.role);

    case 'notes:read':
    case 'questions:read':
      return ['financial_admin', 'editor', 'content_editor', 'readonly', 'reviewer'].includes(admin.role);

    case 'notes:write':
    case 'questions:write':
      return ['editor', 'content_editor'].includes(admin.role);

    default:
      return false;
  }
}
