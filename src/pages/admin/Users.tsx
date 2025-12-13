import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { User, StaffRole, Staff as StaffType } from '../../types';
import { Plus, Edit, Trash2, Users as UsersIcon, Mail, Shield, Key, Search, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Users() {
  const { user: currentUser, supabaseUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [staffList, setStaffList] = useState<StaffType[]>([]);
  const [customRoles, setCustomRoles] = useState<Array<{ id: string; name: string; is_system_role: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFormData, setUserFormData] = useState({
    email: '',
    role: 'Field Staff' as StaffRole | string,
    custom_role_id: '',
    staff_id: '',
    password: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; user: User | null }>({
    show: false,
    user: null,
  });
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    show: boolean;
    userId: string | null;
    userEmail: string | null;
  }>({
    show: false,
    userId: null,
    userEmail: null,
  });
  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchStaff();
    fetchCustomRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          custom_roles (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data } = await supabase
        .from('staff')
        .select('*')
        .order('name');
      setStaffList(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchCustomRoles = async () => {
    try {
      const { data } = await supabase
        .from('custom_roles')
        .select('id, name, is_system_role')
        .order('name');
      setCustomRoles(data || []);
    } catch (error) {
      console.error('Error fetching custom roles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userFormData.email) {
      alert('Email is required');
      return;
    }

    if (!userFormData.password && !editingUser) {
      alert('Password is required when creating a new user');
      return;
    }

    if (userFormData.password && userFormData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      // Save admin session before creating/updating user
      const { data: currentSession } = await supabase.auth.getSession();
      const adminAccessToken = currentSession?.session?.access_token;
      const adminRefreshToken = currentSession?.session?.refresh_token;
      const adminUserId = supabaseUser?.id;

      if (editingUser) {
        // Determine if using custom role or default role
        const isCustomRole = userFormData.custom_role_id !== '';
        const roleToUse = isCustomRole 
          ? (customRoles.find(r => r.id === userFormData.custom_role_id)?.name || userFormData.role)
          : userFormData.role;

        // Update existing user
        const { error } = await supabase
          .from('users')
          .update({
            email: userFormData.email,
            role: isCustomRole ? roleToUse : userFormData.role,
            custom_role_id: userFormData.custom_role_id || null,
            staff_id: userFormData.staff_id || null,
          })
          .eq('id', editingUser.id);

        if (error) throw error;
      } else {
        // Create new user account
        if (!userFormData.password) {
          alert('Password is required for new users');
          return;
        }

        // Create Supabase Auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userFormData.email,
          password: userFormData.password,
          options: {
            emailRedirectTo: undefined,
          },
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            alert('A user with this email already exists. Please use a different email.');
            return;
          }
          throw authError;
        }

        if (!authData?.user) {
          throw new Error('Failed to create user account');
        }

        // Determine if using custom role or default role
        const isCustomRole = userFormData.custom_role_id !== '';
        const roleToUse = isCustomRole 
          ? (customRoles.find(r => r.id === userFormData.custom_role_id)?.name || userFormData.role)
          : userFormData.role;

        // Create users table record
        const { error: userError } = await supabase.from('users').insert({
          id: authData.user.id,
          email: userFormData.email,
          role: isCustomRole ? roleToUse : userFormData.role,
          custom_role_id: userFormData.custom_role_id || null,
          staff_id: userFormData.staff_id || null,
        });

        if (userError) throw userError;

        // Restore admin session
        if (adminAccessToken && adminRefreshToken && adminUserId) {
          try {
            await supabase.auth.signOut();
            const { error: restoreError, data: restoreData } = await supabase.auth.setSession({
              access_token: adminAccessToken,
              refresh_token: adminRefreshToken,
            });

            if (restoreError || !restoreData.session || restoreData.session.user.id !== adminUserId) {
              console.error('Error restoring admin session:', restoreError);
              alert('User created successfully, but your session was interrupted. Please log in again.');
              window.location.href = '/admin/login';
              return;
            }
          } catch (restoreError) {
            console.error('Error restoring admin session:', restoreError);
            alert('User created successfully, but your session was interrupted. Please log in again.');
            window.location.href = '/admin/login';
            return;
          }
        }
      }

      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.user) return;

    try {
      // Delete user record (this will cascade delete auth user due to ON DELETE CASCADE)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', deleteConfirm.user.id);

      if (error) throw error;

      setDeleteConfirm({ show: false, user: null });
      fetchUsers();
      alert('User deleted successfully');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(`Error deleting user: ${error.message}`);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordModal.userEmail) return;

    if (resetPasswordForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      // Copy password to clipboard
      try {
        await navigator.clipboard.writeText(resetPasswordForm.newPassword);
      } catch (clipboardError) {
        console.log('Could not copy to clipboard');
      }

      const instructions = `Password Reset Instructions\n\n` +
        `New Password: ${resetPasswordForm.newPassword}\n` +
        `(Password has been copied to your clipboard)\n\n` +
        `Steps to reset in Supabase Dashboard:\n` +
        `1. Go to Supabase Dashboard → Authentication → Users\n` +
        `2. Find user: ${resetPasswordModal.userEmail}\n` +
        `3. Click on the user → Update password\n` +
        `4. Set password to: ${resetPasswordForm.newPassword}\n` +
        `5. Save changes\n\n` +
        `After updating, share the new password with the user.`;

      alert(instructions);

      setResetPasswordModal({ show: false, userId: null, userEmail: null });
      setResetPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const resetForm = () => {
    setUserFormData({
      email: '',
      role: 'Field Staff',
      custom_role_id: '',
      staff_id: '',
      password: '',
    });
  };

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage system users and their roles</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by email or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Linked Staff</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? 'No users found matching your search' : 'No users found'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const linkedStaff = staffList.find((s) => s.id === user.staff_id);
                const isCurrentUser = user.id === currentUser?.id;
                
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Mail className="text-gray-400" size={16} />
                        <span className="text-sm font-medium">{user.email}</span>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {(user as any).custom_roles?.name || user.role}
                        </span>
                        {(user as any).custom_roles && (
                          <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                            Custom
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {linkedStaff ? (
                        <div className="flex items-center gap-2">
                          <UsersIcon className="text-gray-400" size={14} />
                          {linkedStaff.name}
                        </div>
                      ) : (
                        <span className="text-gray-400">Not linked</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isCurrentUser && (
                          <>
                            <button
                              onClick={() => {
                                setResetPasswordModal({
                                  show: true,
                                  userId: user.id,
                                  userEmail: user.email,
                                });
                                setResetPasswordForm({ newPassword: '', confirmPassword: '' });
                              }}
                              className="text-orange-600 hover:text-orange-900"
                              title="Reset Password"
                            >
                              <Key size={18} />
                            </button>
                            <button
                              onClick={async () => {
                                // Fetch user with custom role info
                                const { data: userData } = await supabase
                                  .from('users')
                                  .select(`
                                    *,
                                    custom_roles (
                                      id,
                                      name
                                    )
                                  `)
                                  .eq('id', user.id)
                                  .single();

                                setEditingUser(user);
                                setUserFormData({
                                  email: user.email,
                                  role: (userData as any)?.custom_roles?.name || user.role,
                                  custom_role_id: (userData as any)?.custom_role_id || '',
                                  staff_id: user.staff_id || '',
                                  password: '',
                                });
                                setShowModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit User"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ show: true, user })}
                              className="text-red-600 hover:text-red-900"
                              title="Delete User"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                        {isCurrentUser && (
                          <span className="text-xs text-gray-400">Current user</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  required
                  disabled={!!editingUser}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  placeholder="user@example.com"
                />
                {editingUser && (
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Type</label>
                <select
                  value={userFormData.custom_role_id ? 'custom' : 'default'}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setUserFormData({ ...userFormData, custom_role_id: customRoles[0]?.id || '', role: '' });
                    } else {
                      setUserFormData({ ...userFormData, custom_role_id: '', role: 'Field Staff' });
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 mb-2"
                >
                  <option value="default">Default Role</option>
                  <option value="custom">Custom Role</option>
                </select>
              </div>
              {userFormData.custom_role_id ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom Role *</label>
                  <select
                    value={userFormData.custom_role_id}
                    onChange={(e) => setUserFormData({ ...userFormData, custom_role_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a custom role</option>
                    {customRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Role *</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as StaffRole })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Branch Manager">Branch Manager</option>
                    <option value="Vet">Vet</option>
                    <option value="Storekeeper">Storekeeper</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Field Staff">Field Staff</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link to Staff (Optional)</label>
                <select
                  value={userFormData.staff_id}
                  onChange={(e) => setUserFormData({ ...userFormData, staff_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">No staff link</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.role})
                    </option>
                  ))}
                </select>
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    required={!editingUser}
                    minLength={6}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Enter password (min. 6 characters)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 6 characters long
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {editingUser ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && deleteConfirm.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Delete User</h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete user <strong>{deleteConfirm.user.email}</strong>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              <strong>Warning:</strong> This will permanently delete the user account and all associated data.
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm({ show: false, user: null })}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
            <p className="text-sm text-gray-600 mb-4">
              Reset password for <strong>{resetPasswordModal.userEmail}</strong>
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  value={resetPasswordForm.newPassword}
                  onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Enter new password (min. 6 characters)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={resetPasswordForm.confirmPassword}
                  onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Confirm new password"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800 mb-2">
                  <strong>Note:</strong> Password reset requires Supabase Dashboard access. The password will be copied to your clipboard when you confirm.
                </p>
                <p className="text-xs text-blue-700 font-semibold">
                  New Password: {resetPasswordForm.newPassword || '(enter password above)'}
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetPasswordModal({ show: false, userId: null, userEmail: null });
                    setResetPasswordForm({ newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

