import { useState, useMemo, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  Circle, 
  Milk, 
  Egg, 
  Package, 
  DollarSign, 
  Users, 
  FileText,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  Activity,
  User,
  UserCog,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessRoute, canAccessModule } from '../../lib/permissions';
import { StaffRole } from '../../types';

interface MenuItem {
  path: string;
  icon: any;
  label: string;
  roles: StaffRole[];
}

const allMenuItems: MenuItem[] = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', roles: ['Super Admin', 'Branch Manager', 'Vet', 'Storekeeper', 'Accountant', 'Field Staff'] },
  { path: '/admin/farms', icon: MapPin, label: 'Farms', roles: ['Super Admin', 'Branch Manager'] },
  { path: '/admin/cattle', icon: Circle, label: 'Cattle', roles: ['Super Admin', 'Branch Manager', 'Vet'] },
  { path: '/admin/milking', icon: Milk, label: 'Milking', roles: ['Super Admin', 'Branch Manager', 'Field Staff'] },
  { path: '/admin/poultry', icon: Egg, label: 'Poultry', roles: ['Super Admin', 'Branch Manager', 'Field Staff'] },
  { path: '/admin/inventory', icon: Package, label: 'Inventory', roles: ['Super Admin', 'Branch Manager', 'Storekeeper'] },
  { path: '/admin/finance', icon: DollarSign, label: 'Finance', roles: ['Super Admin', 'Accountant', 'Branch Manager'] },
  { path: '/admin/staff', icon: Users, label: 'Staff', roles: ['Super Admin', 'Branch Manager', 'Accountant'] },
  { path: '/admin/users', icon: UserCog, label: 'Users', roles: ['Super Admin'] },
  { path: '/admin/role-permissions', icon: Shield, label: 'Roles & Permissions', roles: ['Super Admin'] },
  { path: '/admin/reports', icon: FileText, label: 'Reports', roles: ['Super Admin', 'Branch Manager', 'Vet', 'Storekeeper', 'Accountant'] },
  { path: '/admin/approvals', icon: ShieldCheck, label: 'Approvals', roles: ['Super Admin', 'Branch Manager'] },
  { path: '/admin/ecommerce', icon: ShoppingBag, label: 'Ecommerce', roles: ['Super Admin', 'Branch Manager'] },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  // Filter menu items based on user role (with dynamic permissions support)
  const [menuItems, setMenuItems] = useState(allMenuItems);

  useEffect(() => {
    const filterMenuItems = async () => {
      if (!user) {
        setMenuItems([]);
        return;
      }

      const filtered: typeof allMenuItems = [];
      
      for (const item of allMenuItems) {
        // First check default permissions
        const defaultAccess = canAccessRoute(user.role, item.path);
        
        if (defaultAccess) {
          filtered.push(item);
        } else {
          // Check dynamic permissions for custom roles
          try {
            const dynamicAccess = await canAccessModule(user.role, item.path);
            if (dynamicAccess) {
              filtered.push(item);
            }
          } catch (error) {
            // If error, skip this item
            console.error(`Error checking access for ${item.path}:`, error);
          }
        }
      }
      
      setMenuItems(filtered);
    };

    filterMenuItems();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-green-700">Zealot AgriWorks</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-30 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <img 
                src="/agriworkslogo.jpeg" 
                alt="ZEALOT AGRIWORKS LTD" 
                className="h-12 w-auto mb-2"
                onError={(e) => {
                  // Hide image and show text fallback
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = parent.querySelector('.logo-fallback') as HTMLElement;
                    if (fallback) fallback.style.display = 'block';
                  }
                }}
              />
              <div className="logo-fallback hidden">
                <h1 className="text-2xl font-bold text-green-700">Zealot AgriWorks</h1>
                <p className="text-sm text-gray-500 mt-1">Management System</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path !== '/admin' && location.pathname.startsWith(item.path));
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-green-50 text-green-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        // Close mobile sidebar on navigation
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <button
              onClick={() => {
                // Close mobile sidebar on navigation
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
                navigate('/admin/profile');
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors mb-2 text-left"
            >
              <User size={16} />
              <span>Profile Settings</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

