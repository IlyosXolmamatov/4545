# 🚀 TEZKOR BOSHLASH

## 1️⃣ Loyihani ochish
```bash
cd lazzat-restaurant
```

## 2️⃣ Paketlarni o'rnatish
```bash
npm install
```

## 3️⃣ Ishga tushirish
```bash
npm run dev
```

Brauzer avtomatik ochiladi: http://localhost:3000

## 4️⃣ Login qilish
```
Username: admin
Password: admin
```

---

## 📂 ASOSIY FAYLLAR

### 🔧 Konfiguratsiya
- `.env` - API URL
- `package.json` - Dependencies
- `vite.config.js` - Vite settings

### 🎯 API
- `src/api/axios.js` - HTTP client, interceptors
- `src/api/auth.js` - Login, token decode
- `src/api/users.js` - Users CRUD

### 💾 State Management
- `src/store/authStore.js` - Zustand (user, token, permissions)

### 🎨 Pages
- `src/pages/LoginPage.jsx` - Login forma
- `src/pages/AdminLayout.jsx` - Sidebar layout
- `src/pages/AdminDashboard.jsx` - Dashboard
- `src/pages/UsersPage.jsx` - Users CRUD

### 🛡️ Security
- `src/components/ProtectedRoute.jsx` - Route protection

---

## 🔑 JWT ISHLASH MEXANIZMI

### Token saqlash:
```javascript
localStorage.setItem('access_token', token);
```

### Har bir requestda:
```javascript
headers: { Authorization: `Bearer ${token}` }
```

### 401 xatolikda:
```javascript
localStorage.clear();
window.location.href = '/login';
```

---

## 🎯 PERMISSION TEKSHIRISH

```javascript
// Store'dan olish
const { hasPermission } = useAuthStore();

// Komponentda
{hasPermission('User_Create') && (
  <button>Xodim qo'shish</button>
)}
```

---

## 🛠️ YANGI SAHIFA QO'SHISH

1. **API service yaratish:**
```javascript
// src/api/products.js
export const productAPI = {
  getAll: () => api.get('/Products'),
  create: (data) => api.post('/Products', data),
};
```

2. **Page yaratish:**
```javascript
// src/pages/ProductsPage.jsx
import { useQuery } from '@tanstack/react-query';
import { productAPI } from '../api/products';

export default function ProductsPage() {
  const { data } = useQuery({
    queryKey: ['products'],
    queryFn: productAPI.getAll,
  });
  // ...
}
```

3. **Route qo'shish:**
```javascript
// src/App.jsx
<Route path="products" element={<ProductsPage />} />
```

4. **Sidebar'ga qo'shish:**
```javascript
// src/pages/AdminLayout.jsx
{
  path: '/admin/products',
  icon: UtensilsCrossed,
  label: 'Mahsulotlar',
  permission: 'Products_Read'
}
```

---

## ❗ MUHIM ESLATMALAR

1. **.env faylini yaratish kerak** (loyihada .env.example bor)
2. **Token refresh yo'q** - muddati tugasa qayta login
3. **localStorage ishlatilgan** - production'da cookie yaxshiroq
4. **Permission check** - har bir CRUD operatsiya uchun
5. **Role-based routing** - Admin/Waiter/Cashier alohida

---

## 🐛 DEBUGGING

### Token ko'rish:
```javascript
console.log(localStorage.getItem('access_token'));
```

### Permissions ko'rish:
```javascript
const { user } = useAuthStore();
console.log(user.permission);
```

### API xatolarni ko'rish:
Axios interceptor avtomatik toast ko'rsatadi

---

## 📚 QAYSI QISMLARNI O'RGANISH KERAK

### Beginner uchun:
1. `src/api/axios.js` - Interceptorlar
2. `src/store/authStore.js` - State management
3. `src/pages/LoginPage.jsx` - Forma bilan ishlash

### Middle uchun:
1. `src/components/ProtectedRoute.jsx` - HOC pattern
2. `src/pages/UsersPage.jsx` - CRUD operations
3. TanStack Query usage

### Senior uchun:
- Arxitektura
- Error handling strategy
- State management pattern
- Security best practices

---

Bu loyiha **production-ready** emas, lekin **learning** va **prototyping** uchun juda yaxshi!
