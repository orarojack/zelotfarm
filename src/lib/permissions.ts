import { StaffRole } from '../types';
import { supabase } from './supabase';

export interface Permission {
  resource: string;
  actions: string[];
}

// Cache for dynamic permissions
let permissionsCache: Record<string, any[]> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fetch dynamic permissions from database
export async function fetchDynamicPermissions(roleName: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role_name', roleName);

    if (error) {
      console.error('Error fetching dynamic permissions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching dynamic permissions:', error);
    return [];
  }
}

// Check if role can access a module path
export async function canAccessModule(roleName: string, modulePath: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('can_view')
      .eq('role_name', roleName)
      .eq('module_path', modulePath)
      .maybeSingle();

    if (error || !data) {
      // Fallback to default permissions if not found in database
      return canAccessRoute(roleName as StaffRole, modulePath);
    }

    return data.can_view === true;
  } catch (error) {
    console.error('Error checking module access:', error);
    // Fallback to default permissions
    return canAccessRoute(roleName as StaffRole, modulePath);
  }
}

export const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  'Super Admin': [
    { resource: '*', actions: ['*'] }, // Full access to everything
    { resource: 'ecommerce', actions: ['*'] },
  ],
  'Branch Manager': [
    { resource: 'farms', actions: ['read', 'update'] },
    { resource: 'cattle', actions: ['create', 'read', 'update'] },
    { resource: 'milking', actions: ['create', 'read', 'update'] },
    { resource: 'poultry', actions: ['create', 'read', 'update'] },
    { resource: 'inventory', actions: ['create', 'read', 'update'] },
    { resource: 'expenses', actions: ['create', 'read', 'update'] },
    { resource: 'revenue', actions: ['create', 'read', 'update'] },
    { resource: 'staff', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'ecommerce', actions: ['create', 'read', 'update'] },
  ],
  'Vet': [
    { resource: 'cattle', actions: ['read', 'update'] },
    { resource: 'cattle_health', actions: ['create', 'read', 'update'] },
    { resource: 'reports', actions: ['read'] },
  ],
  'Storekeeper': [
    { resource: 'inventory', actions: ['create', 'read', 'update'] },
    { resource: 'stock_movements', actions: ['create', 'read'] },
    { resource: 'reports', actions: ['read'] },
  ],
  'Accountant': [
    { resource: 'expenses', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'revenue', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'staff', actions: ['read'] },
    { resource: 'salaries', actions: ['read', 'update'] },
    { resource: 'casual_wages', actions: ['create', 'read', 'update'] },
    { resource: 'reports', actions: ['read', 'export'] },
  ],
  'Field Staff': [
    { resource: 'milking', actions: ['create', 'read'] },
    { resource: 'egg_collections', actions: ['create', 'read'] },
    { resource: 'broiler_batches', actions: ['read', 'update'] },
    { resource: 'attendance', actions: ['create', 'read'] },
  ],
};

export function hasPermission(
  role: StaffRole,
  resource: string,
  action: string
): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];

  // Super Admin has all permissions
  if (permissions.some((p) => p.resource === '*' && p.actions.includes('*'))) {
    return true;
  }

  // Check if role has permission for this resource and action
  return permissions.some(
    (p) =>
      (p.resource === resource || p.resource === '*') &&
      (p.actions.includes(action) || p.actions.includes('*'))
  );
}

export function canAccessRoute(role: StaffRole | string, route: string): boolean {
  // Default route permissions (fallback)
  const routePermissions: Record<string, StaffRole[]> = {
    '/admin': ['Super Admin', 'Branch Manager', 'Vet', 'Storekeeper', 'Accountant', 'Field Staff'],
    '/admin/farms': ['Super Admin', 'Branch Manager'],
    '/admin/cattle': ['Super Admin', 'Branch Manager', 'Vet'],
    '/admin/milking': ['Super Admin', 'Branch Manager', 'Field Staff'],
    '/admin/poultry': ['Super Admin', 'Branch Manager', 'Field Staff'],
    '/admin/inventory': ['Super Admin', 'Branch Manager', 'Storekeeper'],
    '/admin/finance': ['Super Admin', 'Accountant', 'Branch Manager'],
    '/admin/staff': ['Super Admin', 'Branch Manager', 'Accountant'],
    '/admin/reports': ['Super Admin', 'Branch Manager', 'Vet', 'Storekeeper', 'Accountant'],
    '/admin/approvals': ['Super Admin', 'Branch Manager'],
    '/admin/ecommerce': ['Super Admin', 'Branch Manager'],
    '/admin/profile': ['Super Admin', 'Branch Manager', 'Vet', 'Storekeeper', 'Accountant', 'Field Staff'],
    '/admin/users': ['Super Admin'],
    '/admin/role-permissions': ['Super Admin'],
  };

  const allowedRoles = routePermissions[route] || [];
  
  // Check if role is in the default list
  if (allowedRoles.includes(role as StaffRole)) {
    return true;
  }

  // For custom roles, we'll check dynamically via canAccessModule
  // This is a synchronous fallback - the async check happens in ProtectedRoute
  return false;
}

// Helper function to check if a user is Super Admin
// Handles both default role and custom role named "Super Admin"
export function isSuperAdmin(userRole: string | undefined | null): boolean {
  if (!userRole) return false;
  return userRole === 'Super Admin' || userRole.toLowerCase() === 'super admin';
}

