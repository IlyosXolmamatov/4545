# Lazzat Restaurant - Admin Panel

React.js bilan yozilgan restoran ichki boshqaruv tizimi.

## 🚀 Xususiyatlar

- ✅ JWT autentifikatsiya
- ✅ Role-based access control (Admin, Waiter, Cashier)
- ✅ Permission-based routing
- ✅ Zustand state management
- ✅ TanStack Query (React Query)
- ✅ Axios interceptors
- ✅ Modern UI/UX (Tailwind CSS)
- ✅ Toast notifications

## 📁 Loyiha strukturasi

```
src/
├── api/              # API xizmatlari
│   ├── axios.js      # Axios instance va interceptors
│   ├── auth.js       # Auth API
│   └── users.js      # Users CRUD API
├── components/       # Komponentlar
│   └── ProtectedRoute.jsx
├── pages/           # Sahifalar
│   ├── LoginPage.jsx
│   ├── AdminLayout.jsx
│   ├── AdminDashboard.jsx
│   └── UsersPage.jsx
├── store/           # Zustand store
│   └── authStore.js
├── types.js         # TypeScript types (JS format)
├── App.jsx          # Asosiy app
├── main.jsx         # Entry point
└── index.css        # Global styles
```

## 🛠 O'rnatish

1. **Dependencies o'rnatish:**
```bash
npm install
```

2. **Environment variables:**
`.env` faylini yarating:
```
VITE_API_BASE_URL=http://45.138.158.239:5781
```

3. **Loyihani ishga tushirish:**
```bash
npm run dev
```

Brauzerda avtomatik ochiladi: `http://localhost:3000`

## 🔐 Test ma'lumotlari

**Admin:**
- Username: `admin`
- Password: `admin`

## 📚 Asosiy kutubxonalar

- **React 19.2** - UI framework
- **React Router 7** - Routing
- **Zustand** - State management
- **TanStack Query** - Server state
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## 🎯 JWT bilan ishlash

### 1. Token saqlash
Token `localStorage`da saqlanadi:
```javascript
localStorage.setItem('access_token', token);
```

### 2. Token tekshirish
Har bir sahifa refresh bo'lganda:
```javascript
useEffect(() => {
  initAuth(); // Token mavjudligini tekshiradi
}, []);
```

### 3. Axios interceptor
Har bir requestga avtomatik token qo'shiladi:
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 4. 401 xatolikda
Token muddati tugaganda avtomatik logout:
```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
  }
);
```

## 🔒 Permission system

### Permission tekshirish:
```javascript
const { hasPermission } = useAuthStore();

if (hasPermission('User_Create')) {
  // Tugma ko'rsatish
}
```

### Role tekshirish:
```javascript
<ProtectedRoute requiredRole="Admin">
  <AdminLayout />
</ProtectedRoute>
```

## 📋 API Endpoints

**Auth:**
- POST `/api/Auth/Login/login` - Login

**Users:**
- GET `/api/Users` - Barcha userlar
- GET `/api/Users/{id}` - Bitta user
- POST `/api/Users` - User yaratish
- PUT `/api/Users/{id}` - User yangilash
- DELETE `/api/Users/{id}` - User o'chirish

## 🎨 UI komponentlar

- Login page (animatsiyali)
- Admin dashboard
- Sidebar navigation
- Users CRUD table
- Modal forms
- Toast notifications

## 🚧 Keyingi qadamlar

- [ ] Products CRUD
- [ ] Categories CRUD
- [ ] Tables CRUD
- [ ] Orders management
- [ ] Waiter interface
- [ ] Cashier interface
- [ ] SignalR integration
- [ ] Real-time updates

## 📝 Muhim eslatmalar

1. **Token refresh yo'q** - Token muddati tugaganda qayta login qilish kerak
2. **Permissions** - Har bir permission bo'yicha button ko'rinadi
3. **Role-based routing** - Har bir rol uchun alohida sahifalar
4. **localStorage** - Token va user ma'lumotlari saqlanadi
5. **Auto logout** - 401 xatolikda avtomatik chiqish

## 🤝 Hissa qo'shish

Pull request yuborishdan oldin:
1. Kodni test qiling
2. Format qiling (Prettier)
3. Commit xabarini yozing

## 📄 License

MIT
