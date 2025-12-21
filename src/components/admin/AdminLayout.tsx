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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tabClicked, setTabClicked] = useState(false);
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 p-3 flex items-center justify-between shadow-sm">
        <h1 className="text-lg font-bold text-green-700 truncate">Zealot AgriWorks</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100 flex-shrink-0"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-30 transition-all duration-300 flex-shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
        } w-64 lg:pt-0 pt-14`}
        onMouseEnter={() => {
          if (window.innerWidth >= 1024 && sidebarCollapsed && tabClicked) {
            setSidebarCollapsed(false);
          }
        }}
        onMouseLeave={() => {
          if (window.innerWidth >= 1024 && tabClicked) {
            setSidebarCollapsed(true);
          }
        }}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className={`p-4 lg:p-6 border-b border-gray-200 ${sidebarCollapsed ? 'lg:p-4 lg:flex lg:justify-center' : ''}`}>
            <div className="relative">
              <img 
                src="/agriworkslogo.jpeg" 
                alt="ZEALOT AGRIWORKS LTD" 
                className={`h-12 w-auto mb-2 ${sidebarCollapsed ? 'lg:mb-0 lg:mx-auto' : ''}`}
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
              <div className={`logo-fallback hidden ${sidebarCollapsed ? 'lg:block' : ''}`}>
                <h1 className={`text-2xl font-bold text-green-700 ${sidebarCollapsed ? 'lg:text-lg' : ''}`}>ZA</h1>
              </div>
              <div className={`logo-fallback ${sidebarCollapsed ? 'lg:hidden' : 'hidden'}`}>
                <h1 className="text-2xl font-bold text-green-700">Zealot AgriWorks</h1>
                <p className="text-sm text-gray-500 mt-1">Management System</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 lg:p-4">
            <ul className="space-y-1 lg:space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path !== '/admin' && location.pathname.startsWith(item.path));
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-2 lg:gap-3 px-3 py-2.5 lg:px-4 lg:py-3 rounded-lg transition-colors text-sm lg:text-base ${
                        sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''
                      } ${
                        isActive
                          ? 'bg-green-50 text-green-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        // Close mobile sidebar on navigation
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        } else {
                          // Collapse sidebar on desktop when a tab is clicked
                          setSidebarCollapsed(true);
                          setTabClicked(true);
                        }
                      }}
                      title={sidebarCollapsed ? item.label : ''}
                    >
                      <Icon size={18} className="flex-shrink-0 lg:w-5 lg:h-5" />
                      <span className={`${sidebarCollapsed ? 'lg:hidden' : ''} truncate`}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User info and logout */}
          <div className={`p-3 lg:p-4 border-t border-gray-200 ${sidebarCollapsed ? 'lg:p-2' : ''}`}>
            {!sidebarCollapsed && (
              <div className="mb-2 lg:mb-3">
                <p className="text-xs lg:text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                <p className="text-xs text-gray-500 truncate">{user?.role}</p>
              </div>
            )}
            <button
              onClick={() => {
                // Close mobile sidebar on navigation
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                } else {
                  setSidebarCollapsed(true);
                }
                navigate('/admin/profile');
              }}
              className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors mb-2 ${
                sidebarCollapsed ? 'lg:justify-center lg:px-2' : 'text-left'
              }`}
              title={sidebarCollapsed ? 'Profile Settings' : ''}
            >
              <User size={16} className="flex-shrink-0" />
              <span className={sidebarCollapsed ? 'lg:hidden' : ''}>Profile Settings</span>
            </button>
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
                sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''
              }`}
              title={sidebarCollapsed ? 'Sign Out' : ''}
            >
              <LogOut size={16} className="flex-shrink-0" />
              <span className={sidebarCollapsed ? 'lg:hidden' : ''}>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 min-w-0 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        <main className="w-full max-w-full overflow-x-hidden p-3 lg:p-4 xl:p-8 pt-16 lg:pt-4">
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

