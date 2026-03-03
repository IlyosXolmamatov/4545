import { create } from 'zustand';
import { authAPI } from '../api/auth';

// ─── JWT NORMALIZATSIYA ───────────────────────────────────────────────────────
// .NET JWT claim nomlarini oddiy field nomlarga aylantirish

const ROLE_MAP = { Admin: 1, Waiter: 2, Cashier: 3 };

/**
 * Decoded JWT payload'dan toza user obyekti yasaydi
 * @param {Object} decoded
 * @returns {Object}
 */
const normalizeUser = (decoded) => {
  if (!decoded) return null;

  // Name: turli .NET claim formatlari
  const name =
    decoded.name ??
    decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ??
    decoded.unique_name ??
    'Foydalanuvchi';

  // Role: string ("Admin") yoki number (1) bo'lishi mumkin
  const roleRaw =
    decoded.role ??
    decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  const role =
    typeof roleRaw === 'number' ? roleRaw :
      typeof roleRaw === 'string' ? (ROLE_MAP[roleRaw] ?? 0) : 0;


  // User ID: turli claim nomlar
  const id =
    decoded.nameid ??
    decoded.sub ??
    decoded.id ??
    decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
    null;

  return {
    ...decoded,      // Barcha original claimlar saqlandi (boshqa qismlar uchun)
    id,
    name,
    username: decoded.unique_name ?? name,
    role,            // Har doim number: 1=Admin, 2=Waiter, 3=Cashier
    permissions: decoded.permission ?? [],
  };
};

// ─── ROLE-BASED PERMISSIONS ──────────────────────────────────────────────────

const ROLE_PERMISSIONS = {
  // Admin — barcha ruxsatlar (bu list faqat fallback, JWT'dan keladi)
  1: null, // null = har narsaga ruxsat

  // Ofitsant
  2: [

    'Product_Read', 'Products_Read',
    'Order_Create', 'Order_Read',
    'Order_My_Read', 'Order_ItemIncrease',
    'Order_TableChange', 'Order_BusyTables',
    'Table_Read', 'Tables_Read',
    'Category_Read', 'Categories_Read'
  ],

  // Kassir
  3: [
    'Product_Read', 'Products_Read', 'Product_Create', 'Product_Update',
    'Order_Read', 'Orders_Read', 'Order_Create', 'Order_Update', 'Order_Delete',
    'Order_StatusChange', 'Order_ItemIncrease', 'Order_ItemDecrease',
    'Table_Read', 'Tables_Read', 'Table_Create', 'Table_Update', 'Table_Delete',
    'Category_Read', 'Categories_Read', 'Category_Create', 'Category_Update', 'Category_Delete',
    'User_Read', 'Users_Read', 'User_Create'

  ],
};

// ─── STORE ───────────────────────────────────────────────────────────────────

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  // ── Login ──
  login: async (username, password) => {
    const data = await authAPI.login(username, password);
    const decoded = authAPI.decodeToken(data.access_token);
    const user = normalizeUser(decoded);

    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user_data', JSON.stringify(user));

    set({ token: data.access_token, user, isAuthenticated: true });
    return user;
  },

  // ── Logout ──
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    set({ user: null, token: null, isAuthenticated: false });
  },

  // ── Token'dan tiklash (page refresh) ──
  initAuth: () => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');

    if (token && authAPI.isTokenValid(token) && userData) {
      const user = JSON.parse(userData);
      set({ token, user, isAuthenticated: true, isLoading: false });
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      set({ isLoading: false });
    }
  },

  // ── Role tekshiruv ──
  isAdmin: () => get().user?.role === 1,
  isWaiter: () => get().user?.role === 2,
  isCashier: () => get().user?.role === 3,

  // ── Role nomi ──
  getRoleName: () => {
    const role = get().user?.role;
    return role === 1 ? 'Admin' : role === 2 ? 'Ofitsant' : role === 3 ? 'Kassir' : 'Foydalanuvchi';
  },

  // ── Panel nomi ──
  getPanelName: () => {
    const role = get().user?.role;
    return role === 1 ? 'Admin Panel' : role === 2 ? 'Ofitsant Panel' : role === 3 ? 'Kassir Panel' : 'Panel';
  },

  // ── Permission tekshiruv ──
  hasPermission: (permission) => {
    const { user } = get();
    if (!user) return false;

    // Admin — hamma narsaga ruxsat
    if (user.role === 1) return true;

    // Avval JWT'dan kelgan permissions'ni tekshir
    if (Array.isArray(user.permissions) && user.permissions.includes(permission)) return true;

    // Role-based fallback
    const allowed = ROLE_PERMISSIONS[user.role];
    if (!allowed) return true; // null = barcha ruxsat
    return allowed.includes(permission);
  },

  // ── Eski `hasRole()` (backward compat) ──
  hasRole: (role) => {
    const { user } = get();
    if (!user) return false;
    // String yoki number bilan ishlaydi
    const numRole = typeof role === 'string' ? (ROLE_MAP[role] ?? -1) : role;
    return user.role === numRole;
  },
}));
