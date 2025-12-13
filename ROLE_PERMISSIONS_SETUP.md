# Role & Permissions Management Setup Guide

## Overview

The Zealot AgriWorks Management System now includes a dynamic role and permissions management system. Admins can create custom roles and define which modules each role can access.

## Database Setup

1. **Run the SQL Schema Script**

   Execute `role_permissions_schema.sql` in your Supabase SQL Editor. This will create:
   - `custom_roles` table - Stores custom roles
   - `role_permissions` table - Maps roles to module permissions
   - Default system roles (Super Admin, Branch Manager, Vet, etc.)
   - Default permissions for system roles

2. **Verify Tables Created**

   ```sql
   SELECT * FROM custom_roles;
   SELECT * FROM role_permissions LIMIT 10;
   ```

## Features

### 1. Custom Role Creation

- **Access**: Super Admin only
- **Location**: Admin Panel → Roles & Permissions
- **Features**:
  - Create custom roles with names and descriptions
  - System roles cannot be deleted or renamed
  - Custom roles can be edited or deleted (if no users are assigned)

### 2. Permission Management

- **Access**: Super Admin only
- **Location**: Admin Panel → Roles & Permissions → Click "Permissions" on any role
- **Features**:
  - Define which modules each role can access
  - Set granular permissions: View, Create, Update, Delete
  - Permissions are applied immediately

### 3. User Role Assignment

- **Access**: Super Admin only
- **Location**: Admin Panel → Users
- **Features**:
  - Assign default roles (Super Admin, Branch Manager, etc.)
  - Assign custom roles
  - Switch between default and custom roles
  - View role type in user list

## Available Modules

The following modules can be configured for each role:

- Dashboard (`/admin`)
- Farms (`/admin/farms`)
- Cattle (`/admin/cattle`)
- Milking (`/admin/milking`)
- Poultry (`/admin/poultry`)
- Inventory (`/admin/inventory`)
- Finance (`/admin/finance`)
- Staff (`/admin/staff`)
- Users (`/admin/users`) - Super Admin only
- Reports (`/admin/reports`)
- Approvals (`/admin/approvals`)
- Ecommerce (`/admin/ecommerce`)
- Orders (`/admin/orders`)
- Profile (`/admin/profile`)

## How It Works

### Permission Checking

1. **Default Roles**: Use hardcoded permissions (fallback)
2. **Custom Roles**: Check `role_permissions` table dynamically
3. **Hybrid**: If a default role has custom permissions defined, those take precedence

### User Role Resolution

- Users can have either:
  - A default role (stored in `users.role`)
  - A custom role (stored in `users.custom_role_id`)
- The system automatically resolves the effective role name

### Menu Filtering

- Admin sidebar automatically filters based on user's permissions
- Only modules with "View" permission are shown
- Works for both default and custom roles

## Usage Examples

### Example 1: Create a "Farm Supervisor" Role

1. Go to **Roles & Permissions**
2. Click **Create Role**
3. Enter:
   - Name: `Farm Supervisor`
   - Description: `Oversees daily farm operations`
4. Click **Create**
5. Click **Permissions** on the new role
6. Enable:
   - Dashboard: View
   - Farms: View, Update
   - Cattle: View, Create, Update
   - Milking: View, Create
   - Reports: View
7. Click **Save Permissions**

### Example 2: Assign Custom Role to User

1. Go to **Users**
2. Click **Edit** on a user
3. Select **Custom Role** from "Role Type"
4. Select the custom role from dropdown
5. Click **Update**

### Example 3: Modify Existing Role Permissions

1. Go to **Roles & Permissions**
2. Click **Permissions** on any role
3. Toggle permissions as needed
4. Click **Save Permissions**
5. Changes apply immediately to all users with that role

## Important Notes

1. **System Roles**: Cannot be deleted or renamed, but permissions can be modified
2. **Custom Roles**: Can be deleted only if no users are assigned
3. **Permission Changes**: Take effect immediately (no logout required)
4. **Default Permissions**: System roles have default permissions that can be overridden
5. **Super Admin**: Always has full access regardless of permissions table

## Troubleshooting

### Issue: User can't see a module they should have access to

**Solution**:
1. Check user's role in Users page
2. Go to Roles & Permissions → Permissions for that role
3. Verify "View" is enabled for the module
4. Refresh the page

### Issue: Can't delete a custom role

**Solution**:
1. Check if any users are assigned to this role
2. Reassign those users to a different role
3. Then delete the custom role

### Issue: Permissions not updating

**Solution**:
1. Clear browser cache
2. Refresh the page
3. Check database directly: `SELECT * FROM role_permissions WHERE role_name = 'YourRole';`

## Database Schema

### custom_roles
- `id` (UUID) - Primary key
- `name` (TEXT) - Unique role name
- `description` (TEXT) - Optional description
- `is_system_role` (BOOLEAN) - True for default roles

### role_permissions
- `id` (UUID) - Primary key
- `role_id` (UUID) - Foreign key to custom_roles
- `role_name` (TEXT) - Denormalized role name
- `module_path` (TEXT) - Route path (e.g., '/admin/cattle')
- `module_name` (TEXT) - Display name (e.g., 'Cattle')
- `can_view` (BOOLEAN) - Can access module
- `can_create` (BOOLEAN) - Can create records
- `can_update` (BOOLEAN) - Can update records
- `can_delete` (BOOLEAN) - Can delete records

## Security

- Only Super Admin can access Roles & Permissions page
- RLS policies protect the tables
- Permission checks happen on both frontend and backend
- Custom roles cannot override Super Admin access


