# POS TIZIM - LOYIHA HOLATI VA TEXNOLOGIYALAR

## 1. LOYIHANING MAQSADI

Restoran/kafe uchun to'liq POS (Point of Sale) tizimi yaratish. Tizimda:
- Buyurtmalarni boshqarish
- Stollarni boshqarish (kafolat, ofitsantlar)
- Mahsulotlar va kategoriyalar
- Foydalanuvchilar va rolle-ruxsat tizimi
- Admin dashboard va tahlilotika
- Chop etish va analitika

---

## 2. TEXNOLOGIYALAR

### 2.1 Frontend Texnologiyalar
- **React 18+** — UI komponentlar yozish uchun
- **Vite** — zamonaviy build tool
- **React Router v6** — sahifalar orasida navigatsiya
- **TanStack Query (React Query) v5** — data fetching, caching, synchronization
- **Zustand** — state management (auth store, theme store)
- **Axios** — HTTP client with interceptors
- **TailwindCSS** — styling (utility-first CSS framework)
- **Recharts** — charts va grafiklar (dashboard analitika)
- **Lucide React** — SVG icons

### 2.2 Backend Integratsiyasi
- **REST API** — backend bilan HTTP orqali bog'lanish
- **Token-based Authentication** — JWT tokens
- **API Endpoints** → `/api/products`, `/api/orders`, `/api/tables`, `/api/categories`, `/api/users`, va boshqalar

### 2.3 Loyihani Boshqarish
- **Node.js** + npm — paketlarni o'rnatish
- **Git** — versiya kontroli

---

## 3. LOYIHANING STRUKTURASI

```
src/
├── api/               # Backend API wrapper funksiyalari
│   ├── auth.js        # Autentifikatsiya
│   ├── products.js    # Mahsulotlar API
│   ├── orders.js      # Buyurtmalar API + enums
│   ├── categories.js  # Kategoriyalar API
│   ├── tables.js      # Stollar API
│   ├── users.js       # Foydalanuvchilar API
│   └── axios.js       # Axios instance + interceptors
│
├── components/        # React komponentlar
│   ├── OrderViewModal.jsx      # Buyurtmani ko'rish + chop etish
│   ├── OrderDetailModal.jsx    # Buyurtma detallari
│   ├── ToggleActiveButton.jsx  # Aktivlik tugmasi
│   ├── ProtectedRoute.jsx      # Ochiq route'lar uchun himoya
│   ├── AnalyticsPanel.jsx      # Dashboard analitika
│   └── Layout/
│       ├── AppLayout.jsx       # Asosiy layout
│       └── Sidebar.jsx         # Lateral menyusi
│
├── pages/             # Sahifalar
│   ├── LoginPage.jsx           # Kirish sahifasi
│   ├── AdminDashboard.jsx      # Admin dashboard
│   ├── AdminLayout.jsx         # Admin layout
│   ├── TablesPage.jsx          # Stollarni boshqarish
│   ├── OrdersPage.jsx          # Buyurtmalarni ko'rish
│   ├── ProductsPage.jsx        # Mahsulotlarni boshqarish
│   ├── UsersPage.jsx           # Foydalanuvchilar
│   ├── CategoriesPage.jsx      # Kategoriyalar
│   ├── MenuPage.jsx            # Menyu
│   └── POSTerminal.jsx         # POS kassir terminali
│
├── hooks/             # Custom React hooks
│   └── useOrders.js             # Buyurtmalar hooks (increase/decrease items)
│
├── store/             # Zustand stores
│   ├── authStore.js            # Autentifikatsiya state
│   └── themeStore.js           # Tema state (dark/light)
│
├── App.jsx           # Route'lar registratsiyasi
├── main.jsx          # Entry point
├── index.css         # Asosiy CSS
└── types.js          # Tipi definitions va enums
```

---

## 4. ASOSIY COMPONENT'LAR VA ULARNING ISHCHI TAMOYILLARI

### 4.1 Buyurtmalar (Orders)
**Enum qiymatlari:** (`src/api/orders.js`)
```javascript
OrderStatus = {
  1: 'Tayyor',     // Tayyor
  2: 'Bekor qilgan', // Cancelled  
  3: 'Yakunlangan', // Finished
  Pending: 1,
  Cancelled: 2,
  Finished: 3,
}

OrderType = {
  1: 'Dinedin',
  2: 'Olib ketish',
  Dinedin: 1,
  OlibKetish: 2,
}
```

**API endpoint'lari:**
- `POST /api/orders` — yangi buyurtma yaratish
- `GET /api/orders` — barcha buyurtmalar
- `GET /api/orders/:id` — buyurtma detallari
- `PUT /api/orders/:id/status` — holat o'zgartirish
- `POST /api/orders/:id/items` — mahsulot qo'shish
- `DELETE /api/orders/:id/items/:itemId` — mahsulot olib tashlash

**Modallari:**
- `OrderViewModal.jsx` — buyurtmani tezkor ko'rish + chop etish
- `OrderDetailModal.jsx` — shaklni o'zgartirish (holat, mahsulotlar)

### 4.2 Stollar (Tables)
**Enum qiymatlari:** (`src/api/tables.js`)
```javascript
TableStatus = {
  'Empty': 'Boş',
  'NotEmpty': 'Ishlatilayapti',
  'Reserved': 'Rezerv qilga',
  
  // Legacy aliases
  'Free': 'Boş',
  'Occupied': 'Ishlatilayapti',
}
```

**API endpoint'lari:**
- `POST /api/tables` — yangi stol yaratish (capacity + waiterName)
- `GET /api/tables` — barcha stollar
- `PUT /api/tables/:id` — stol o'zgartirish
- `DELETE /api/tables/:id` — stol o'chirish

**Dizayn qarorlar:**
- `capacity` — server'dan keladi (client-side fallback yo'q)
- `waiterName` — stol uchun ofitsant nomi
- Bu maʼlumotlar TablesPage create/update forma orqali olanadi

### 4.3 Mahsulotlar (Products)
**API endpoint'lari:**
- `GET /api/products` — barcha mahsulotlar
- `POST /api/products` — yangi mahsulot
- `PUT /api/products/:id` — o'zgartirish
- `DELETE /api/products/:id` — o'chirish

### 4.4 Kategoriyalar (Categories)
**API endpoint'lari:**
- `GET /api/categories` — barcha kategoriyalar
- `POST /api/categories` — yangi kategoriya
- `PUT /api/categories/:id` — o'zgartirish
- `DELETE /api/categories/:id` — o'chirish

**Diqqat:** API payload'lar barcha lozim maydonlarni o'z ichiga olishi kerak (name, description, va hokazo).

### 4.5 Foydalanuvchilar (Users)
**API endpoint'lari:**
- `GET /api/users` — barcha foydalanuvchilar
- `POST /api/users` — yangi foydalanuvchi
- `PUT /api/users/:id` — o'zgartirish
- `DELETE /api/users/:id` — o'chirish

**Rolle'lar:**
- `admin` — full access
- `manager` — boshqarish access
- `cashier` — POS kassirlari
- `waiter` — ofitsantlar

---

## 5. MUTAMADDIY ISHLARI (Done)

### 5.1 Orders va OrdersPage tahlili va qayta yozish ✓
- Order status enums joriy qilindi
- OrderStatus labels backend qiymatlari bilan aligned
- Optimistic mutations (increase/decrease items)
- Order detail modal integratsiyasi

### 5.2 Tables CRUD tahlili va muammolarni tuzatish ✓
- `TableStatus` enum yaratildi va backend qiymatlari bilan aligned
- `capacity` field server'dan olinadi (localStorage fallback o'chirildi)
- `waiterName` stol creation/update payload'iga qo'shildi
- TablesPage create/update/delete mutations to'liq ishlayapti

### 5.3 Admin Dashboard analitika ✓
- AnalyticsPanel component yaratildi
- Charts (Recharts) integratsiyasi
- Backend API'dan data fetch'lash (axios + auth interceptors)

### 5.4 Categories API muammolarni tuzatish ✓
- Create/update payloads togri shakllantirildi
- `/categories` route Router'da registratsiya qilindi

### 5.5 OrderViewModal — chop etish ✓
- Formatted print popup HTML
- Order details bilan formatted output
- Status, stol, ofitsant, vaqt, mahsulotlar ro'yxati va jami narx

### 5.6 Enum alignment'i barcha joyda ✓
- OrderStatus numeric constants qo'shildi
- TableStatus enum va aliases
- ORDER_STATUS_COLORS, ORDER_STATUS_LABELS'ning togri moslashtirilishi

### 5.7 AnalyticsPanel — axios integration ✓
- fetch() ni axios'ga almashtirildi
- Auth interceptors avtomatik qo'llaniladi

### 5.8 POSTerminal — server capacity ✓
- `capacityHelpers` localStorage fallback o'chirildi
- Server'dan kelgan `table.capacity` qo'llaniladi

---

## 6. ASOSIY ARCHITECTURAL QARORLARI

### 6.1 Data Fetching va Caching
- **TanStack Query v5** — data'ni cache qilish va synchronization
- **Object-style API** — useQuery({ queryKey, queryFn, enabled })
- **Automatic refetch** — server state o'zgarganda

### 6.2 State Management
- **Zustand** — minimal, simple state untuk auth va theme
- **Local component state** — forma fields uchun
- **TanStack Query cache** — server data uchun

### 6.3 API Interceptors (axios.js)
```javascript
// Token'ni har so'rovga qo'sh
request interceptor → Authorization header

// Xatolar toastni ko'rsatish
response interceptor → error toast va logout (401)
```

### 6.4 Accessibility va Performance
- Dark mode support (TailwindCSS dark: classes)
- Loading spinners va disabled buttons
- Responsive design (mobile + tablet + desktop)

---

## 7. HOZIRGI MUAMMO VA QARORLARI

### 7.1 Server-side Capacity ✓ FIXED
**Muammo:** Capacity localStorage'da saqlangan edi
**Qaror:** Server'dan olinadi, client-side fallback yo'q

### 7.2 Enum Consistency ✓ DONE
**Muammo:** Numeric literals doimiy undefined errors berardi
**Qaror:** Named constants va proper enum mapping

### 7.3 Print Functionality ✓ FIXED
**Muammo:** Whole-page print butun HTML'ni chop etardi
**Qaror:** Formatted popup window bilan order-specific print

### 7.4 Analytics Authentication ✓ FIXED
**Muammo:** fetch() bilan axios interceptors ishladi yo'q
**Qaror:** axios instance qo'llaniladi

---

## 8. TESTING VA DEPLOYMENT

### DevServer Ishga Tushirish:
```bash
npm install              # Paketlarni o'rnatish (agar kerak bo'lsa)
npm run dev             # Vite dev server (odatda: http://localhost:5173)
```

### Backend Integration:
- Backend API'ning base URL: `.env` faylida yoki `src/api/axios.js'da

### Authentication Flow:
1. Login page → credentials jo'natish
2. Backend token qaytaradi
3. Token localStorage'da saqlanadi
4. Har so'rovga token o'tkaziladi (Authorization header)
5. 401 error → logout va login sahifasiga qaytish

---

## 9. QOLGAN TOPSHIRIQLAR (Pending)

### 9.1 Full Runtime Testing
- [ ] Create/Update/Delete flows'ni test qilish
- [ ] Order status changes
- [ ] Analytics data load qilish

### 9.2 Numeric Literals Sweep
- [ ] Butun codebase'ni tekshirish
- [ ] Qolgan numeric hardcodes'ni enums'ga almashtirrish

### 9.3 Backend Endpoint Confirmation
- [ ] Endpoint names va response shapes tekshirish
- [ ] Typos mavjud bo'lsa tuzatish (masalan: UpdateCatigory vs UpdateCategory)

### 9.4 Automated Testing
- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] E2E tests (Cypress/Playwright)

---

## 10. FAYDALI KOMANDALAR

### Paketlarni o'rnatish:
```bash
npm install
```

### Dev server'ni ishga tushirish:
```bash
npm run dev
```

### Build uchun production:
```bash
npm run build
```

### Lint/Code check:
```bash
npm run lint
```

---

## 11. MUHIM ESLATMALAR

1. **Backend URL** — `.env`'dan olinadi yoki axios.js'da hardcoded
2. **Auth Token** — localStorage'da `token` kalit nomi bilan saqlanadi
3. **Dark Mode** — TailwindCSS dark classes va Zustand theme store orqali
4. **API Errors** — toast notifications (orqali axios interceptors)
5. **Enum Values** — backend response qiymatlari bilan mos bo'lishi kerak
6. **Capacity** — server'dan keladi, client-side persistence yo'q
7. **Print** — popup window'da formatted HTML

---

## 12. KONTAKT VA SAVOLLARI

Agar qandaydir savol yoki muammo bo'lsa:
1. Browser console'ni tekshirish (Ctrl+Shift+I → Console)
2. Network tab'da API requests'ni tekshirish
3. Backend logs'ni tekshirish
4. Git history: `git log --oneline`

---

**Oxirgi yangilanish:** 2026-yil 20-Fevral
**Loyiha holati:** Active Development
**Dastur tili:** Uzbek (o'zbek)
