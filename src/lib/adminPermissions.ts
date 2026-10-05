export type AdminPermission =
  | 'admin:manage'
  | 'payments:view'
  | 'payments:approve'
  | 'payments:reject'
  | 'notes:read'
  | 'notes:write'
  | 'questions:read'
  | 'questions:write'
  | 'analytics:read';

export function hasPermission(admin: { role: string } | null | undefined, permission: AdminPermission): boolean {
  if (!admin) return false;
  if (admin.role === 'superadmin') return true;

  switch (permission) {
    case 'admin:manage':
      return admin.role === 'superadmin';

    case 'payments:view':
    case 'payments:approve':
    case 'payments:reject':
      return admin.role === 'financial_admin';

    case 'notes:read':
    case 'questions:read':
    case 'analytics:read':
      return ['financial_admin', 'editor', 'content_editor', 'readonly', 'reviewer'].includes(admin.role);

    case 'notes:write':
    case 'questions:write':
      return ['editor', 'content_editor'].includes(admin.role);

    default:
      return false;
  }
}
