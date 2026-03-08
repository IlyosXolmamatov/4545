import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import ConfirmModal from '../ConfirmModal';
import {
  Home, Users, ShoppingBag, Table2,
  ShoppingCart, CreditCard, LogOut, X, Sun, Moon, BarChart2,
} from 'lucide-react';

// role: null = barcha rollar, number = faqat shu rol
const ALL_MENU_ITEMS = [
  { label: 'Dashboard',    icon: Home,         path: '/dashboard',  permission: null,           role: null },
  { label: 'Xodimlar',     icon: Users,        path: '/users',      permission: 'User_Read',    role: null },
  { label: 'Menyu',        icon: ShoppingBag,  path: '/products',   permission: 'Product_Read', role: null },
  { label: 'Stollar',      icon: Table2,       path: '/tables',     permission: 'Table_Read',   role: null },
  { label: 'Buyurtmalar',  icon: ShoppingCart, path: '/orders',     permission: 'Order_Read',   role: null },
  { label: 'POS Terminal', icon: CreditCard,   path: '/pos',        permission: 'Order_Create', role: null },
  { label: 'Analitika',    icon: BarChart2,    path: '/analytics',  permission: null,           role: 1    },
];

const getRoleColor = (role) => {
  if (role === 1) return 'bg-basand-500 dark:bg-basand-400';
  if (role === 2) return 'bg-blue-500 dark:bg-blue-400';
  if (role === 3) return 'bg-teal-500 dark:bg-teal-400';
  return 'bg-slate-500 dark:bg-slate-400';
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, hasPermission, getPanelName } = useAuthStore();
  const { isDark, toggle } = useThemeStore();

  const visibleItems = ALL_MENU_ITEMS.filter((item) => {
    if (item.role !== null && item.role !== user?.role) return false;
    if (item.permission === null) return true;
    return hasPermission(item.permission);
  });

  const [dlg, setDlg] = useState(null);

  const handleLogout = () => {
    setDlg({
      message: 'Tizimdan chiqmoqchimisiz?',
      confirmText: 'Ha, chiqish',
      danger: false,
      onConfirm: logout,
    });
  };

  return (
    <>
    <aside
      className={`
        fixed inset-y-0 left-0 z-30 w-64 flex flex-col h-screen flex-shrink-0
        transition-transform duration-300 ease-in-out
        md:static md:translate-x-0
        bg-white dark:bg-slate-900
        border-r border-slate-200 dark:border-slate-700
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* ── Logo ── */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Basand" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
          <div>
            <h1 className="text-xl font-bold text-basand-500 dark:text-basand-400 leading-tight">Basand</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">
              {getPanelName()}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── User info ── */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0 ${getRoleColor(user?.role)}`}>
            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {user?.name ?? '—'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              @{user?.username ?? '—'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive
                    ? 'bg-basand-100 dark:bg-basand-900/30 text-basand-700 dark:text-basand-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={19}
                    className={isActive ? 'text-basand-500 dark:text-basand-400' : 'text-slate-400 dark:text-slate-500'}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-basand-500 dark:bg-basand-400" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Footer: Theme toggle + Logout ── */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
        {/* Dark/Light toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium
                     text-slate-600 dark:text-slate-400
                     hover:bg-slate-100 dark:hover:bg-slate-800/50
                     hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          {isDark ? (
            <>
              <Sun size={19} className="text-amber-500" />
              <span>Kunduzgi rejim</span>
            </>
          ) : (
            <>
              <Moon size={19} className="text-slate-500" />
              <span>Tungi rejim</span>
            </>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium
                     text-status-error hover:bg-status-error/10 dark:hover:bg-status-error/20 transition-colors"
        >
          <LogOut size={19} />
          <span>Chiqish</span>
        </button>
      </div>
    </aside>

    <ConfirmModal
      open={!!dlg}
      message={dlg?.message}
      confirmText={dlg?.confirmText}
      danger={dlg?.danger ?? true}
      onConfirm={() => { dlg?.onConfirm?.(); setDlg(null); }}
      onCancel={() => setDlg(null)}
    />
    </>
  );
};

export default Sidebar;
