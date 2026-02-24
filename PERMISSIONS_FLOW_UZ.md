# KASSAN RUXSATLARI — API'DAN FRONTEND'GA OQIMI

## 1. BACKEND API JAVOB (LOGIN ENDPOINT)

Backend `/Auth/Login/login` endpoint'dan **JWT token** qaytaradi:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaW1wgZSIsInVuaXF1ZV9uYW1lIjoiYWxpbTEwIiwicm9sZSI6IkNhc2hpZXIiLCJwZXJtaXNzaW9uIjpbIlByb2R1Y3RfUmVhZCIsIkFkbGljX0NyZWF0ZSIsIk9yZGVyX1N0YXR1c0NoYW5nZSJdLCJleHAiOjE3MDAwMDAwMDB9..."
}
```

**JWT Payload struktura (decoded):**
```json
{
  "sub": "1234567890",
  "name": "Alim",
  "unique_name": "alim10",
  "role": "Cashier",
  "permission": [
    "Product_Read",
    "Product_Create",
    "Product_Update",
    "Order_Create",
    "Order_Read",
    "Order_Update",
    "Order_StatusChange",
    "Order_ItemIncrease",
    "Order_ItemDecrease",
    "Table_Read",
    "Table_Create",
    "Table_Update",
    "Table_Delete",
    "Category_Read",
    "Category_Create",
    "Category_Update",
    "Category_Delete",
    "User_Read",
    "User_Create"
  ],
  "exp": 1700000000
}
```

---

## 2. LOGIN QILISH VA TOKEN SAQLANISH

### 2.1 Frontend'da Login API Call (`src/api/auth.js`)

```javascript
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/Auth/Login/login', {
      username,
      password,
    });
    // Backend'dan JWT token qaytaradi
    return response.data;  // { access_token: "...", ... }
  },

  // JWT'ni decode qilish (signature tekshirimasdan)
  decodeToken: (token) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);  // Payload: { name, role, permission, ... }
  },

  // Token muddatini tekshirish
  isTokenValid: (token) => {
    if (!token) return false;
    const decoded = authAPI.decodeToken(token);
    if (!decoded) return false;
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  },
};
```

### 2.2 Store'da Normalizatsiya (`src/store/authStore.js`)

```javascript
const normalizeUser = (decoded) => {
  // Decoded JWT payload'dan user objekt yasaydi
  
  const name = decoded.name ?? decoded.unique_name ?? 'Foydalanuvchi';
  
  // Role: string ("Cashier") → number (3)
  const roleRaw = decoded.role;  // "Cashier" vs "Waiter" vs "Admin"
  const role = ROLE_MAP[roleRaw] ?? 0;  // { Cashier: 3, Waiter: 2, Admin: 1 }
  
  const id = decoded.sub ?? decoded.id;

  return {
    ...decoded,                    // Barcha original JWT claims
    id,
    name,
    username: decoded.unique_name ?? name,
    role,                          // Number: 1=Admin, 2=Waiter, 3=Cashier
    permissions: decoded.permission ?? [],  // API'dan kelgan ruxsatlar massivi
  };
};
```

---

## 3. ZUSTAND STORE'DA PERMISSION TEKSHIRUVI

### 3.1 Store Creation (`src/store/authStore.js`)

```javascript
export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  // ── Login ──
  login: async (username, password) => {
    // 1. API'ga so'rov jo'nat
    const data = await authAPI.login(username, password);  // Backend JWT qaytaradi
    
    // 2. JWT'ni decode qil
    const decoded = authAPI.decodeToken(data.access_token);
    
    // 3. Normalizatsiya qil
    const user = normalizeUser(decoded);  // { role: 3, permissions: [...], ... }

    // 4. localStorage'da saqlash
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user_data', JSON.stringify(user));

    // 5. Zustand state'ni yangilash
    set({ token: data.access_token, user, isAuthenticated: true });
    return user;
  },

  // ── Permission Tekshiruvi ──
  hasPermission: (permission) => {
    const { user } = get();
    if (!user) return false;

    // Admin — barcha narsaga ruxsat (role === 1)
    if (user.role === 1) return true;

    // Priority 1: JWT'dan kelgan permissions massage (agar mavjud bo'lsa)
    if (Array.isArray(user.permissions) && user.permissions.includes(permission)) {
      return true;
    }

    // Priority 2: Role-based fallback ROLE_PERMISSIONS'dan
    const allowed = ROLE_PERMISSIONS[user.role];  // Kassan uchun: {...}
    if (!allowed) return true;  // null = barcha ruxsat (admin uchun)
    return allowed.includes(permission);
  },

  // ── Role Check Methods ──
  isCashier: () => get().user?.role === 3,  // Kassan ekanini tekshirish
  isWaiter: () => get().user?.role === 2,
  isAdmin: () => get().user?.role === 1,

  getRoleName: () => {
    const role = get().user?.role;
    return role === 3 ? 'Kassir' : role === 2 ? 'Ofitsant' : role === 1 ? 'Admin' : 'Foydalanuvchi';
  },
}));
```

### 3.2 Kassan Uchun Fallback Ruxsatlar

Agar JWT'da `permission` maydon bo'lmasa, quyidagilar qo'llaniladi:

```javascript
const ROLE_PERMISSIONS = {
  3: [  // Cashier (Kassan)
    // Mahsulotlar
    'Product_Read', 'Products_Read', 'Product_Create', 'Product_Update',
    
    // Buyurtmalar
    'Order_Read', 'Orders_Read', 'Order_Create', 'Order_Update',
    'Order_StatusChange', 'Order_ItemIncrease', 'Order_ItemDecrease',
    
    // Stollar
    'Table_Read', 'Tables_Read', 'Table_Create', 'Table_Update', 'Table_Delete',
    
    // Kategoriyalar
    'Category_Read', 'Categories_Read', 'Category_Create', 'Category_Update', 'Category_Delete',
    
    // Foydalanuvchilar
    'User_Read', 'Users_Read', 'User_Create',
  ],
};
```

---

## 4. RUXSATLARNI FOYDALANISH — FRONTEND'DA

### 4.1 ProtectedRoute - Route'larni Himoya Qilish

```javascript
// src/components/ProtectedRoute.jsx
const ProtectedRoute = ({ children, permission }) => {
  const { user, hasPermission } = useAuthStore();

  // Token yo'q → Login'ga yo'nalt
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Permission yo'q → Dashboard'ga yo'nalt
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
```

### 4.2 App.jsx'da Route'larni Registratsiya Qilish

```javascript
import { ProtectedRoute } from './components/ProtectedRoute';
import TablesPage from './pages/TablesPage';
import OrdersPage from './pages/OrdersPage';
import AdminDashboard from './pages/AdminDashboard';

const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes with permission */}
      <Route
        path="/tables"
        element={
          <ProtectedRoute permission="Table_Read">
            <TablesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/orders"
        element={
          <ProtectedRoute permission="Order_Read">
            <OrdersPage />
          </ProtectedRoute>
        }
      />

      {/* Admin-only */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
```

### 4.3 Component'da Permission Tekshirish

```javascript
// Kassan uchun "Stol o'chirish" tugmasini ko'rsatish yoki yo'q
import { useAuthStore } from '../store/authStore';

const TablesPage = () => {
  const { hasPermission } = useAuthStore();

  return (
    <div>
      {/* Hamma uchun */}
      <button onClick={() => getAllTables()}>Stollarni Yuklash</button>

      {/* Faqat Table_Create ruxsatiga eganlar uchun */}
      {hasPermission('Table_Create') && (
        <button onClick={() => openCreateTableModal()}>+ Yangi Stol</button>
      )}

      {/* Faqat Table_Delete ruxsatiga eganlar uchun */}
      {hasPermission('Table_Delete') && (
        <button onClick={() => deleteTable(tableId)}>O'chirish</button>
      )}
    </div>
  );
};
```

---

## 5. KASSAN (CASHIER) UCHUN TO'LIQ OQIMI

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. BACKEND LOGIN ENDPOINT                                       │
│    POST /Auth/Login/login                                       │
│    { username: "alim10", password: "pass123" }                  │
│    ↓ RESPONSE                                                    │
│    { access_token: "eyJ....", token_type: "Bearer" }            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND - authStore.login() qo'ng'iroq                      │
│    await authAPI.login("alim10", "pass123")                     │
│    ↓ JWT'ni olish va decode qilish                              │
│    decoded = {                                                  │
│      sub: "123",                                                │
│      name: "Alim",                                              │
│      role: "Cashier",                                           │
│      permission: ["Product_Read", "Order_Create", ...],         │
│      exp: 1700000000                                            │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. FRONTEND - normalizeUser()                                   │
│    user = {                                                     │
│      id: "123",                                                 │
│      name: "Alim",                                              │
│      username: "alim10",                                        │
│      role: 3,  ← Cashier                                        │
│      permissions: ["Product_Read", "Order_Create", ...],        │
│      ...                                                        │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. FRONTEND - localStorage + Zustand Store                      │
│    localStorage.setItem('access_token', token)                  │
│    localStorage.setItem('user_data', JSON.stringify(user))      │
│    set({ user, token, isAuthenticated: true })                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. COMPONENT'DA PERMISSION TEKSHIRISH                           │
│    hasPermission('Order_Create') → TRUE                         │
│    hasPermission('User_Delete') → FALSE (ruxsat yo'q)           │
│    ↓                                                            │
│    <button>Buyurtma Yaratish</button> ← ko'rinadi                │
│    <button>Foydalanuvchi O'chirish</button> ← ko'rinmadi         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. AXIOS INTERCEPTORS - TOKEN'NI AVTOMATIK QOSHISH

```javascript
// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    // Har so'rovga Authorization header qosh
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 → logout va login'ga qaytish
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 7. KASSAN PANELI - REALNI MISOL

```javascript
// src/pages/POSTerminal.jsx
import { useAuthStore } from '../store/authStore';
import { orderAPI } from '../api/orders';
import { tableAPI } from '../api/tables';

export default function POSTerminal() {
  const { user, hasPermission, isCashier } = useAuthStore();

  // Faqat kassan uchun
  if (!isCashier()) {
    return <div>Kassan paneli faqat kassirlarga ochiq</div>;
  }

  return (
    <div>
      <h1>Kassan Paneli — {user?.name}</h1>

      {/* Buyurtma yaratsish */}
      {hasPermission('Order_Create') && (
        <button onClick={createNewOrder}>+ Yangi Buyurtma</button>
      )}

      {/* Stol yaratishi */}
      {hasPermission('Table_Create') && (
        <button onClick={createNewTable}>+ Yangi Stol</button>
      )}

      {/* Mahsulot yaratishi */}
      {hasPermission('Product_Create') && (
        <button onClick={createNewProduct}>+ Yangi Mahsulot</button>
      )}

      {/* Admin-only */}
      {!hasPermission('User_Create') && (
        <p style={{ color: 'gray' }}>Foydalanuvchi yaratishi - mavjud emas</p>
      )}
    </div>
  );
}
```

---

## 8. QOLGAN ROLLAR

### // ADMIN (role: 1)
```javascript
// Admin — barcha ruxsatlar avtomatik
if (user.role === 1) return true;  // hasPermission() har doim true
```

### OFITSANT (role: 2)
```javascript
ROLE_PERMISSIONS[2] = [
  'Product_Read', 'Products_Read',
  'Order_Create', 'Order_Read', 'Order_My_Read',
  'Order_ItemIncrease', 'Order_BusyTables',
  'Table_Read', 'Tables_Read',
  'Category_Read', 'Categories_Read',
];
// O'chirish imkoniyati yo'q
```

---

## 9. FOYDALANISH SHARTIYLARI

| Ruxsat | Kassan | Ofitsant | Admin |
|--------|--------|----------|-------|
| Product_Read | ✅ | ✅ | ✅ |
| Product_Create | ✅ | ❌ | ✅ |
| Product_Update | ✅ | ❌ | ✅ |
| Order_Create | ✅ | ✅ | ✅ |
| Order_StatusChange | ✅ | ❌ | ✅ |
| Table_Delete | ✅ | ❌ | ✅ |
| User_Create | ✅ | ❌ | ✅ |

---

## 10. DEBUGGING

### Token'ni Browser Console'da tekshirish:
```javascript
// Console'da
const token = localStorage.getItem('access_token');
console.log(token);  // JWT ko'rsat

// Decode qil
const decoded = JSON.parse(atob(token.split('.')[1]));
console.log(decoded);  // { role: "Cashier", permission: [...], ... }
```

### Store'dan tekshirish:
```javascript
// React DevTools console'da
const { user, hasPermission } = useAuthStore();
console.log(user);  // { role: 3, permissions: [...], ... }
console.log(hasPermission('Order_Create'));  // true/false
```

---

**Qisqa:** Kassan login qilganda, backend JWT'sida `"role": "Cashier"` va `"permission": [...]` massivi qaytaradi. Frontend JWT'ni decode qiladi, store'da saqlaydi va har bir komponent `hasPermission()` orqali tekshiradi.
