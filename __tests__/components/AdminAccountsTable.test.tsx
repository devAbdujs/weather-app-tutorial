import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminAccountsTable, AdminUser } from '@/components/admin/AdminAccountsTable';
import * as adminActions from '@/app/actions/admin';

jest.mock('@/app/actions/admin', () => ({
  deleteAdminAccount: jest.fn(),
  toggleAdminActive: jest.fn(),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

const mockAdmins: AdminUser[] = [
  {
    id: 'admin-1',
    username: 'super_boss',
    role: 'superadmin',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'admin-2',
    username: 'content_writer',
    role: 'editor',
    is_active: true,
    created_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'admin-3',
    username: 'old_staff',
    role: 'readonly',
    is_active: false,
    created_at: '2026-03-01T00:00:00Z',
  },
];

describe('AdminAccountsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  it('renders all admin accounts and highlights current admin session', () => {
    render(<AdminAccountsTable admins={mockAdmins} currentAdminId="admin-1" />);

    expect(screen.getByText('@super_boss')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Current Session')).toBeInTheDocument();

    expect(screen.getByText('@content_writer')).toBeInTheDocument();
    expect(screen.getByText('@old_staff')).toBeInTheDocument();

    // Check status badges
    expect(screen.getAllByText(/Active/i).length).toBe(2);
    expect(screen.getByText(/Deactivated/i)).toBeInTheDocument();
  });

  it('toggles active status when Deactivate is clicked and confirmed', async () => {
    (adminActions.toggleAdminActive as jest.Mock).mockResolvedValueOnce({ success: true });

    render(<AdminAccountsTable admins={mockAdmins} currentAdminId="admin-1" />);

    const deactivateBtn = screen.getByRole('button', { name: /deactivate @content_writer/i });
    fireEvent.click(deactivateBtn);

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Are you sure you want to deactivate @content_writer')
    );

    await waitFor(() => {
      expect(adminActions.toggleAdminActive).toHaveBeenCalledWith('admin-2', false);
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('reactivates account when Activate is clicked without prompt', async () => {
    (adminActions.toggleAdminActive as jest.Mock).mockResolvedValueOnce({ success: true });

    render(<AdminAccountsTable admins={mockAdmins} currentAdminId="admin-1" />);

    const activateBtn = screen.getByRole('button', { name: /activate @old_staff/i });
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(adminActions.toggleAdminActive).toHaveBeenCalledWith('admin-3', true);
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('deletes account when Delete is clicked and confirmed', async () => {
    (adminActions.deleteAdminAccount as jest.Mock).mockResolvedValueOnce({ success: true });

    render(<AdminAccountsTable admins={mockAdmins} currentAdminId="admin-1" />);

    const deleteBtn = screen.getByRole('button', { name: /delete @content_writer/i });
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Are you sure you want to permanently delete @content_writer')
    );

    await waitFor(() => {
      expect(adminActions.deleteAdminAccount).toHaveBeenCalledWith('admin-2');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('does not perform action if user cancels confirmation', async () => {
    window.confirm = jest.fn(() => false);

    render(<AdminAccountsTable admins={mockAdmins} currentAdminId="admin-1" />);

    const deleteBtn = screen.getByRole('button', { name: /delete @content_writer/i });
    fireEvent.click(deleteBtn);

    expect(adminActions.deleteAdminAccount).not.toHaveBeenCalled();
  });
});
