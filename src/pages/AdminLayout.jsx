import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Users,
  UtensilsCrossed,
  Grid3x3,
  Table2,
  LogOut,
  Home,
  ShoppingCart,
  MonitorSmartphone,
} from 'lucide-react';

export default function AdminLayout() {
  const { user, logout, hasPermission } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { 
      path: '/admin', 
      icon: Home, 
      label: 'Dashboard', 
      permission: null 
    },
    { 
      path: '/admin/users', 
      icon: Users, 
      label: 'Xodimlar', 
      permission: 'Users_Read' 
    },
    { 
      path: '/admin/products', 
      icon: UtensilsCrossed, 
      label: 'Mahsulotlar', 
      permission: 'Products_Read' 
    },
    { 
      path: '/admin/categories', 
      icon: Grid3x3, 
      label: 'Kategoriyalar', 
      permission: 'Categories_Read' 
    },
    {
      path: '/admin/tables',
      icon: Table2,
      label: 'Stollar',
      permission: 'Tables_Read',
    },
    {
      path: '/admin/orders',
      icon: ShoppingCart,
      label: 'Buyurtmalar',
      permission: null,
    },
    {
      path: '/admin/pos',
      icon: MonitorSmartphone,
      label: 'POS Terminal',
      permission: null,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Bassand
          </h1>
          <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.role?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.role || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || 'admin'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            // Permission tekshirish
            if (item.permission && !hasPermission(item.permission)) {
              return null;
            }

            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
