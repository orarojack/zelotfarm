import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, Shield, Save, X, Check } from 'lucide-react';

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

interface ModulePermission {
  id?: string;
  module_path: string;
  module_name: string;
  can_view: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

interface RolePermission extends ModulePermission {
  role_id: string;
  role_name: string;
}

const AVAILABLE_MODULES = [
  { path: '/admin', name: 'Dashboard' },
  { path: '/admin/farms', name: 'Farms' },
  { path: '/admin/cattle', name: 'Cattle' },
  { path: '/admin/milking', name: 'Milking' },
  { path: '/admin/poultry', name: 'Poultry' },
  { path: '/admin/inventory', name: 'Inventory' },
  { path: '/admin/finance', name: 'Finance' },
  { path: '/admin/staff', name: 'Staff' },
  { path: '/admin/users', name: 'Users' },
  { path: '/admin/reports', name: 'Reports' },
  { path: '/admin/approvals', name: 'Approvals' },
  { path: '/admin/ecommerce', name: 'Ecommerce' },
  { path: '/admin/orders', name: 'Orders' },
  { path: '/admin/profile', name: 'Profile' },
];

export default function RolePermissions() {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, RolePermission[]>>({});
  const [loading, setLoading] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
  });
  const [permissions, setPermissions] = useState<Record<string, ModulePermission>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; role: CustomRole | null }>({
    show: false,
    role: null,
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (roles.length > 0) {
      fetchRolePermissions();
    }
  }, [roles]);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .order('is_system_role', { ascending: false })
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRolePermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('module_name');

      if (error) throw error;

      // Group permissions by role
      const grouped: Record<string, RolePermission[]> = {};
      (data || []).forEach((perm) => {
        if (!grouped[perm.role_name]) {
          grouped[perm.role_name] = [];
        }
        grouped[perm.role_name].push(perm);
      });
      setRolePermissions(grouped);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roleFormData.name.trim()) {
      alert('Role name is required');
      return;
    }

    try {
      if (editingRole) {
        // Update existing role
        const { error } = await supabase
          .from('custom_roles')
          .update({
            name: roleFormData.name.trim(),
            description: roleFormData.description.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRole.id);

        if (error) throw error;
      } else {
        // Create new role
        const { error } = await supabase
          .from('custom_roles')
          .insert({
            name: roleFormData.name.trim(),
            description: roleFormData.description.trim() || null,
            is_system_role: false,
          });

        if (error) {
          if (error.message.includes('unique') || error.message.includes('duplicate')) {
            alert('A role with this name already exists');
            return;
          }
          throw error;
        }
      }

      setShowRoleModal(false);
      setEditingRole(null);
      resetRoleForm();
      fetchRoles();
    } catch (error: any) {
      console.error('Error saving role:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handlePermissionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    try {
      // Get existing permissions for this role
      const { data: existingPerms } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role_id', selectedRole.id);

      const existingMap = new Map(
        (existingPerms || []).map((p) => [p.module_path, p])
      );

      // Prepare permissions to insert/update
      const permissionsToUpsert = Object.values(permissions).map((perm) => ({
        role_id: selectedRole.id,
        role_name: selectedRole.name,
        module_path: perm.module_path,
        module_name: perm.module_name,
        can_view: perm.can_view,
        can_create: perm.can_create,
        can_update: perm.can_update,
        can_delete: perm.can_delete,
      }));

      // Delete permissions that were removed
      const pathsToKeep = new Set(Object.keys(permissions));
      const pathsToDelete = Array.from(existingMap.keys()).filter(
        (path) => !pathsToKeep.has(path)
      );

      if (pathsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', selectedRole.id)
          .in('module_path', pathsToDelete);

        if (deleteError) throw deleteError;
      }

      // Upsert permissions
      if (permissionsToUpsert.length > 0) {
        const { error: upsertError } = await supabase
          .from('role_permissions')
          .upsert(permissionsToUpsert, {
            onConflict: 'role_id,module_path',
          });

        if (upsertError) throw upsertError;
      }

      setShowPermissionsModal(false);
      setSelectedRole(null);
      setPermissions({});
      fetchRolePermissions();
      alert('Permissions saved successfully!');
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.role) return;

    if (deleteConfirm.role.is_system_role) {
      alert('System roles cannot be deleted');
      setDeleteConfirm({ show: false, role: null });
      return;
    }

    try {
      // Check if any users are using this role
      const { data: usersWithRole } = await supabase
        .from('users')
        .select('id, email')
        .eq('custom_role_id', deleteConfirm.role.id)
        .limit(1);

      if (usersWithRole && usersWithRole.length > 0) {
        alert(
          `Cannot delete role. ${usersWithRole.length} user(s) are currently using this role. Please reassign them first.`
        );
        setDeleteConfirm({ show: false, role: null });
        return;
      }

      const { error } = await supabase
        .from('custom_roles')
        .delete()
        .eq('id', deleteConfirm.role.id);

      if (error) throw error;

      setDeleteConfirm({ show: false, role: null });
      fetchRoles();
      alert('Role deleted successfully');
    } catch (error: any) {
      console.error('Error deleting role:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const openPermissionsModal = (role: CustomRole) => {
    setSelectedRole(role);
    
    // Load existing permissions for this role
    const existingPerms = rolePermissions[role.name] || [];
    const permMap: Record<string, ModulePermission> = {};

    // Initialize all modules
    AVAILABLE_MODULES.forEach((module) => {
      const existing = existingPerms.find((p) => p.module_path === module.path);
      permMap[module.path] = {
        module_path: module.path,
        module_name: module.name,
        can_view: existing?.can_view ?? false,
        can_create: existing?.can_create ?? false,
        can_update: existing?.can_update ?? false,
        can_delete: existing?.can_delete ?? false,
      };
    });

    setPermissions(permMap);
    setShowPermissionsModal(true);
  };

  const resetRoleForm = () => {
    setRoleFormData({
      name: '',
      description: '',
    });
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Role & Permissions Management</h1>
          <p className="text-gray-600 mt-2">Create custom roles and define module access</p>
        </div>
        <button
          onClick={() => {
            setEditingRole(null);
            resetRoleForm();
            setShowRoleModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          Create Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => {
          const rolePerms = rolePermissions[role.name] || [];
          const accessibleModules = rolePerms.filter((p) => p.can_view).length;

          return (
            <div
              key={role.id}
              className="bg-white rounded-lg shadow p-6 border-2 border-gray-200 hover:border-green-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="text-green-600" size={20} />
                    <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                    {role.is_system_role && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                        System
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-sm text-gray-600">{role.description}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <strong>{accessibleModules}</strong> accessible module(s)
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openPermissionsModal(role)}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
                >
                  <Edit size={16} />
                  Permissions
                </button>
                {!role.is_system_role && (
                  <>
                    <button
                      onClick={() => {
                        setEditingRole(role);
                        setRoleFormData({
                          name: role.name,
                          description: role.description || '',
                        });
                        setShowRoleModal(true);
                      }}
                      className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm"
                      title="Edit Role"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ show: true, role })}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                      title="Delete Role"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </h2>
            <form onSubmit={handleRoleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                <input
                  type="text"
                  value={roleFormData.name}
                  onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                  required
                  disabled={editingRole?.is_system_role}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  placeholder="e.g., Farm Supervisor"
                />
                {editingRole?.is_system_role && (
                  <p className="text-xs text-gray-500 mt-1">System role name cannot be changed</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={roleFormData.description}
                  onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Describe the role's responsibilities..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {editingRole ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleModal(false);
                    setEditingRole(null);
                    resetRoleForm();
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

      {/* Permissions Modal */}
      {showPermissionsModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Manage Permissions</h2>
                <p className="text-gray-600 mt-1">Role: <strong>{selectedRole.name}</strong></p>
              </div>
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedRole(null);
                  setPermissions({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handlePermissionsSubmit} className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Tip:</strong> Check the permissions for each module. "View" allows access to the module.
                  Other permissions control what actions can be performed.
                </p>
              </div>

              <div className="space-y-3">
                {AVAILABLE_MODULES.map((module) => {
                  const perm = permissions[module.path];
                  if (!perm) return null;

                  return (
                    <div
                      key={module.path}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{module.name}</h3>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={perm.can_view}
                              onChange={(e) => {
                                setPermissions({
                                  ...permissions,
                                  [module.path]: {
                                    ...perm,
                                    can_view: e.target.checked,
                                    // If view is disabled, disable all other permissions
                                    can_create: e.target.checked ? perm.can_create : false,
                                    can_update: e.target.checked ? perm.can_update : false,
                                    can_delete: e.target.checked ? perm.can_delete : false,
                                  },
                                });
                              }}
                              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                            <span className="text-sm font-medium">View</span>
                          </label>
                        </div>
                      </div>

                      {perm.can_view && (
                        <div className="grid grid-cols-3 gap-4 mt-3 pl-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={perm.can_create}
                              onChange={(e) => {
                                setPermissions({
                                  ...permissions,
                                  [module.path]: {
                                    ...perm,
                                    can_create: e.target.checked,
                                  },
                                });
                              }}
                              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                            <span className="text-sm">Create</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={perm.can_update}
                              onChange={(e) => {
                                setPermissions({
                                  ...permissions,
                                  [module.path]: {
                                    ...perm,
                                    can_update: e.target.checked,
                                  },
                                });
                              }}
                              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                            <span className="text-sm">Update</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={perm.can_delete}
                              onChange={(e) => {
                                setPermissions({
                                  ...permissions,
                                  [module.path]: {
                                    ...perm,
                                    can_delete: e.target.checked,
                                  },
                                });
                              }}
                              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                            <span className="text-sm">Delete</span>
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  <Save size={18} />
                  Save Permissions
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPermissionsModal(false);
                    setSelectedRole(null);
                    setPermissions({});
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
      {deleteConfirm.show && deleteConfirm.role && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Delete Role</h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete role <strong>{deleteConfirm.role.name}</strong>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              <strong>Warning:</strong> This will permanently delete the role and all its permissions.
              Users with this role will need to be reassigned. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm({ show: false, role: null })}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


