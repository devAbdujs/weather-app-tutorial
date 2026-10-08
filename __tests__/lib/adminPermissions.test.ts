/**
 * @jest-environment node
 */
import { logAdminAction } from '@/app/actions/admin';
import { hasPermission } from '@/lib/adminPermissions';

const mockInsert = jest.fn();

jest.mock('@/utils/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: mockInsert,
    })),
  })),
}));

describe('Admin Permissions (hasPermission)', () => {
  it('grants full access to superadmin', () => {
    const admin = { role: 'superadmin' };
    expect(hasPermission(admin, 'admin:manage')).toBe(true);
    expect(hasPermission(admin, 'payments:approve')).toBe(true);
    expect(hasPermission(admin, 'notes:write')).toBe(true);
    expect(hasPermission(admin, 'questions:write')).toBe(true);
  });

  it('restricts financial_admin to payment operations and read access', () => {
    const admin = { role: 'financial_admin' };
    expect(hasPermission(admin, 'payments:approve')).toBe(true);
    expect(hasPermission(admin, 'payments:reject')).toBe(true);
    expect(hasPermission(admin, 'notes:read')).toBe(true);
    expect(hasPermission(admin, 'admin:manage')).toBe(false);
    expect(hasPermission(admin, 'notes:write')).toBe(false);
  });

  it('restricts editor to content editing only', () => {
    const admin = { role: 'editor' };
    expect(hasPermission(admin, 'notes:write')).toBe(true);
    expect(hasPermission(admin, 'questions:write')).toBe(true);
    expect(hasPermission(admin, 'payments:approve')).toBe(false);
    expect(hasPermission(admin, 'admin:manage')).toBe(false);
    expect(hasPermission(admin, 'analytics:read')).toBe(false);
    expect(hasPermission(admin, 'payments:view')).toBe(false);
    expect(hasPermission(admin, 'ai:view')).toBe(false);
    expect(hasPermission(admin, 'users:view')).toBe(false);
  });

  it('restricts readonly to viewing content and analytics', () => {
    const admin = { role: 'readonly' };
    expect(hasPermission(admin, 'notes:read')).toBe(true);
    expect(hasPermission(admin, 'analytics:read')).toBe(true);
    expect(hasPermission(admin, 'notes:write')).toBe(false);
    expect(hasPermission(admin, 'payments:approve')).toBe(false);
    expect(hasPermission(admin, 'admin:manage')).toBe(false);
  });

  it('denies all permissions when admin is null or undefined', () => {
    expect(hasPermission(null, 'notes:read')).toBe(false);
    expect(hasPermission(undefined, 'payments:view')).toBe(false);
  });
});

describe('Admin Audit Logging (logAdminAction)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts audit log entry with action, admin details, and resource target', async () => {
    const admin = { id: 'admin-uuid-1', username: 'super_lead' };
    await logAdminAction(admin, 'payment:approved', {
      target_resource: 'payment_receipts',
      target_id: 'receipt-123',
      details: { amount: 499 },
    });

    expect(mockInsert).toHaveBeenCalledWith({
      admin_id: 'admin-uuid-1',
      admin_username: 'super_lead',
      action: 'payment:approved',
      target_resource: 'payment_receipts',
      target_id: 'receipt-123',
      details: { amount: 499 },
      ip_address: undefined,
    });
  });
});
