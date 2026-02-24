# LAZZAT RESTORAN - TO'LIQ LOYIHA TAHLILI

> **Loyiha nomi:** Lazzat Restaurant Management System
> **Turi:** Restoran Boshqaruv & POS (Point of Sale) Tizimi
> **Backend API:** `http://45.130.148.187:5781/api`
> **Tahlil sanasi:** 2026-02-21

---

## 1. FAYL STRUKTURASI

```
4545/
├── index.html                         # HTML kirish nuqtasi (lang="uz")
├── package.json                       # NPM konfiguratsiyasi
├── vite.config.js                     # Vite build konfiguratsiyasi (port: 3000)
├── tailwind.config.js                 # Tailwind CSS konfiguratsiyasi (dark: 'class')
├── postcss.config.js                  # PostCSS konfiguratsiyasi
├── .env                               # VITE_API_BASE_URL=http://45.130.148.187:5781
├── .gitignore
├── dist/                              # Build natijasi
│   └── assets/
│       └── index-ePLVbcTF.js
└── src/
    ├── main.jsx                       # React ilovasi kirish nuqtasi
    ├── App.jsx                        # Router konfiguratsiyasi
    ├── index.css                      # Global stillar
    ├── api/
    │   ├── axios.js                   # Axios instance + interceptorlar + Analytics
    │   ├── auth.js                    # Login, JWT decode
    │   ├── users.js                   # Xodimlar CRUD
    │   ├── products.js                # Mahsulotlar CRUD + rasm yuklash
    │   ├── categories.js              # Kategoriyalar CRUD
    │   ├── orders.js                  # Buyurtmalar CRUD + status
    │   └── tables.js                  # Stollar CRUD + status
    ├── store/
    │   ├── authStore.js               # Zustand - autentifikatsiya holati
    │   └── themeStore.js              # Zustand - dark/light rejim
    ├── hooks/
    │   └── useOrders.js               # Buyurtma mutatsiya hooklari
    ├── components/
    │   ├── Layout/
    │   │   ├── AppLayout.jsx          # Asosiy layout wrapper
    │   │   └── Sidebar.jsx            # Navigatsiya paneli
    │   ├── OrderViewModal.jsx         # Buyurtmani ko'rish + chop etish
    │   ├── OrderDetailModal.jsx       # Buyurtmani tahrirlash
    │   ├── ProtectedRoute.jsx         # Ruxsat asosida yo'naltirish
    │   ├── ToggleActiveButton.jsx     # Faol/Nofaol tugmasi
    │   └── AnalyticsPanel.jsx         # Dashboard grafiklar
    └── pages/
        ├── LoginPage.jsx              # Kirish sahifasi
        ├── AdminDashboard.jsx         # Bosh panel (statistika)
        ├── UsersPage.jsx              # Xodimlar boshqaruvi
        ├── MenuPage.jsx               # Menyu (mahsulot + kategoriya)
        ├── TablesPage.jsx             # Stollar boshqaruvi
        ├── OrdersPage.jsx             # Buyurtmalar ro'yxati
        └── POSTerminal.jsx            # POS terminali (asosiy)
```

---

## 2. ISHLATILGAN TEXNOLOGIYALAR

### Frontend Framework & Build
| Texnologiya | Versiya | Maqsad |
|---|---|---|
| React | 19.2.0 | UI framework |
| Vite | 6.0.5 | Build tool, dev server (port 3000) |
| React Router DOM | 7.13.0 | Sahifalar orasida navigatsiya |

### UI & Stillar
| Texnologiya | Versiya | Maqsad |
|---|---|---|
| Tailwind CSS | 3.4.17 | Utility-first CSS (dark mode: class) |
| Framer Motion | 12.33.0 | Animatsiyalar |
| Lucide React | 0.563.0 | Ikonkalar kutubxonasi |
| clsx | 2.1.1 | Shartli CSS klasslar |

### Ma'lumot Boshqaruvi
| Texnologiya | Versiya | Maqsad |
|---|---|---|
| Zustand | 5.0.11 | Global state (auth, theme) |
| TanStack React Query | 5.90.20 | Server state, cache, auto-refetch |
| Axios | 1.13.5 | HTTP client + interceptorlar |
| React Hook Form | 5.2.2 (resolvers) | Form boshqaruvi |

### Qo'shimcha
| Texnologiya | Versiya | Maqsad |
|---|---|---|
| Recharts | 3.7.0 | Dashboard grafiklar |
| React Hot Toast | 2.6.0 | Toast xabarnomalari |

---

## 3. API ENDPOINTLAR

### Base URL
```
http://45.130.148.187:5781/api
```

### Autentifikatsiya (`src/api/auth.js`)
```
POST  /Auth/Login/login          # Login (username + password → JWT token)
```

### Foydalanuvchilar (`src/api/users.js`)
```
GET    /User/GetAllUsers                         # Barcha xodimlar
GET    /User/GetUser/id?username={username}      # Username bo'yicha foydalanuvchi
POST   /User/CreateUser                          # Yangi xodim qo'shish
PUT    /User/UpdateUser/{id}                     # Xodimni yangilash
DELETE /User/DeleteUser/{id}                     # Xodimni o'chirish
```

**Rol kodlari:**
- `1` = Admin
- `2` = Ofitsant (Waiter)
- `3` = Kassir (Cashier)

### Mahsulotlar (`src/api/products.js`)
```
GET    /Product/GetAllProducts        # Barcha mahsulotlar
POST   /Product/CreateProduct         # Mahsulot qo'shish (FormData, rasm bilan)
PUT    /Product/UpdateProduct         # Mahsulotni yangilash
DELETE /Product/Delete/{id}           # Mahsulotni o'chirish
```

**Terminal Tag kodlari:**
- `1` = Oshxona (Kitchen)
- `2` = Somsoxona
- `3` = Kassa (Cashier)
- `4` = Bar
- `5` = Extra

### Kategoriyalar (`src/api/categories.js`)
```
GET    /Category/GetAllCategories        # Barcha kategoriyalar
POST   /Category/AddCategory             # Kategoriya qo'shish
PUT    /Category/UpdateCategory          # Kategoriyani yangilash
DELETE /Category/DeleteCategory/{id}     # Kategoriyani o'chirish
```

### Stollar (`src/api/tables.js`)
```
GET    /Table/GetAllTables               # Barcha stollar
GET    /Table/GetTable/{id}              # Bitta stol
POST   /Table/CreateTable                # Stol qo'shish
PUT    /Table/UpdateTable                # Stolni yangilash
PATCH  /Table/UpdateStatus/{id}?status=n # Stol statusini o'zgartirish
DELETE /Table/DeleteTable/{id}           # Stolni o'chirish
```

**Stol statuslari:**
- `1` = Bo'sh (Empty)
- `2` = Band (Occupied)
- `3` = Rezerv (Reserved)

**Stol turlari:**
- `1` = Ichkari (Simple/Interior)
- `2` = Terasa (Terrace)
- `3` = VIP

### Buyurtmalar (`src/api/orders.js`)
```
GET    /Order/GetAll                                                      # Barcha buyurtmalar
GET    /Order/GetById/{orderId}                                           # Bitta buyurtma
GET    /Order/GetMyActiveOrders/my-active                                 # Mening aktiv buyurtmalarim
POST   /Order/Create                                                      # Yangi buyurtma yaratish
PATCH  /Order/IncreaseItem/{orderId}/items/increase?productId=x&count=n  # Mahsulot qo'shish
PATCH  /Order/DecreaseItem/{orderId}/items/decrease?productId=x&count=n&aboutOfCancelled=reason  # Mahsulot kamaytirish
PATCH  /Order/ChangeTable/{orderId}/table?newTableId=x                   # Stolni o'zgartirish
PATCH  /Order/ChangeStatus/{orderId}/status?status=n                     # Status o'zgartirish
PATCH  /Order/CancelItem/{orderId}/items/cancel?productId=x              # Mahsulotni bekor qilish
```

**Buyurtma statuslari (Backend Enum):**
- `1` = Tayyorlanmoqda (Accepted/Preparing)
- `2` = Bekor qilingan (Cancelled)
- `3` = To'landi (Finished/Completed)

**Buyurtma turlari:**
- `1` = Ichida (Dine In)
- `2` = Olib ketish (Take Out)

### Analytics (`src/api/axios.js`)
```
GET  /Analytics/orders               # Buyurtma statistikasi
GET  /Analytics/products?topCount=5  # Top mahsulotlar
GET  /Analytics/tables               # Stol band bo'lish statistikasi
```

---

## 4. AUTENTIFIKATSIYA & RUXSATLAR

### Login Jarayoni
```
1. LoginPage → username + password kiritiladi
2. authStore.login() → POST /Auth/Login/login chaqiriladi
3. JWT token qaytariladi va decode qilinadi
4. Token + user ma'lumotlari localStorage'ga saqlanadi
5. Foydalanuvchi /dashboard ga yo'naltiriladi
```

### JWT Token Tuzilishi
- .NET JWT formati
- Claims: `name`, `role`, `permission`, `nameid`
- Muddati tugagan tokenlar avtomatik tozalanadi
- `localStorage`'da `access_token` kaliti bilan saqlanadi

### Axios Interceptorlar
**Request interceptor:**
- `Authorization: Bearer {token}` headerni qo'shadi
- FormData uchun Content-Type'ni axios o'zi belgilaydi
- JSON uchun `Content-Type: application/json`

**Response interceptor:**
- `401` → Auth tozalanadi, login sahifasiga yo'naltiriladi
- `403` → "Ruxsat yo'q" xatosi ko'rsatiladi
- Boshqa xatolar → Toast xabar ko'rsatiladi

### Rol Asosida Ruxsatlar
| Rol | Ruxsatlar |
|---|---|
| **Admin (1)** | Hamma narsa - to'liq kirish |
| **Ofitsant (2)** | Order_Create, Order_Read, Table_Read, Product_Read, Category_Read |
| **Kassir (3)** | Mahsulot, buyurtma, stol, foydalanuvchi boshqaruvi |

---

## 5. GLOBAL STATE MANAGEMENT

### Auth Store (`useAuthStore` - Zustand)

**Holat:**
```javascript
{
  user: object | null,       // Hozirgi foydalanuvchi
  token: string | null,      // JWT token
  isAuthenticated: boolean,  // Kirgan/kirmagani
  isLoading: boolean         // Boshlang'ich yuklash
}
```

**Metodlar:**
```javascript
login(username, password)  // Kirish
logout()                   // Chiqish
initAuth()                 // localStorage'dan sessiyani tiklash
isAdmin()                  // Admin ekanini tekshirish
isWaiter()                 // Ofitsant ekanini tekshirish
isCashier()                // Kassir ekanini tekshirish
hasPermission(permission)  // Muayyan ruxsatni tekshirish
hasRole(role)              // Rolni tekshirish
getRoleName()              // Rol nomini olish (uz tilida)
getPanelName()             // Panel nomini olish
```

### Theme Store (`useThemeStore` - Zustand)

**Holat:**
```javascript
{
  isDark: boolean  // Dark rejim holati
  toggle()         // Rejimni almashtirish (localStorage'ga saqlanadi)
}
```

---

## 6. MA'LUMOT MODELLARI

### User (Foydalanuvchi)
```javascript
{
  id: string (UUID),
  name: string,
  username: string,
  role: 1 | 2 | 3,          // Admin | Waiter | Cashier
  isActive: boolean,
  permissions: string[]
}
```

### Product (Mahsulot)
```javascript
{
  id: string,
  name: string,
  description: string,
  price: number,
  categoryId: string,
  imageUrl: string,          // Nisbiy yo'l, getImgUrl() bilan to'liq URL ga aylantiriladi
  terminalTag: 1 | 2 | 3 | 4 | 5,
  isActive: boolean
}
```

### Order (Buyurtma)
```javascript
{
  id: string,
  sku: string,               // Qisqa identifikator (masalan: "LZT-001")
  userId: string,
  tableId: string | null,
  tableNumber: number | null,
  waiterName: string,
  orderType: 1 | 2,          // DineIn | TakeOut
  orderStatus: 1 | 2 | 3,    // Accepted | Cancelled | Finished
  totalAmount: number,
  createdAt: datetime,
  items: [
    {
      id: string,
      productId: string,
      productName: string,
      count: number,
      priceAtTime: number,
      extensionProducts: []
    }
  ]
}
```

### Table (Stol)
```javascript
{
  id: string,
  tableNumber: number,
  tableStatus: 1 | 2 | 3,   // Empty | Occupied | Reserved
  tableType: 1 | 2 | 3,     // Simple | Terrace | VIP
  capacity: number,
  waiterName: string,
  activeSku: string | null
}
```

### Category (Kategoriya)
```javascript
{
  id: string,
  name: string
}
```

---

## 7. SAHIFALAR VA FUNKSIYALAR

### LoginPage - Kirish Sahifasi
- Username va parol bilan kirish
- Orange/amber gradient UI
- Xato uchun toast xabarnoma
- Yuklanish holati (spinner)

### AdminDashboard - Bosh Panel
- Statistika kartochkalar: Foydalanuvchilar, Mahsulotlar, Stollar, Kategoriyalar soni
- Analytics Panel: Recharts bilan grafiklar
- Foydalanuvchi ruxsatlari ko'rsatiladi
- Tezkor harakatlar tugmalari

### UsersPage - Xodimlar Sahifasi
- Barcha xodimlar ro'yxati
- Yangi xodim yaratish (username, parol, rol)
- Xodimni tahrirlash (ism, rol, faollik)
- Xodimni o'chirish
- Faol/Nofaol holatni almashtirish (optimistik yangilanish)
- Rol nishonlari (Admin/Ofitsant/Kassir)
- Ruxsat tekshiruvi: `User_Create`, `User_Update`, `User_Delete`

### MenuPage - Menyu Sahifasi (Mahsulot & Kategoriya)
**Kategoriyalar:**
- Ro'yxat, qo'shish, yangilash, o'chirish
- Mahsulotlarni kategoriya bo'yicha filtrlash

**Mahsulotlar:**
- Grid ko'rinish + rasmlar
- Rasm yuklash (FormData)
- Kategoriya va nom bo'yicha qidiruv/filter
- Tahrirlash/o'chirish
- Faol holatni almashtirish
- Terminal tag belgilash
- Dark mode qo'llab-quvvatlash

### TablesPage - Stollar Sahifasi
- Barcha stollar kartochka ko'rinishida
- Stol turi bo'yicha guruhlash (Ichkari, Terasa, VIP)
- Holat ko'rsatkichlari: Bo'sh (yashil), Band (qizil), Rezerv (sariq)
- Sig'im va biriktirilgan ofitsant
- Faol buyurtma SKU ko'rsatish
- Stol yaratish/tahrirlash/o'chirish
- 10 soniyada bir avtomatik yangilanish
- Stol turi bo'yicha filter
- Holat sanoq nishonlari

### OrdersPage - Buyurtmalar Sahifasi
- Barcha buyurtmalar yoki ofitsantning aktiv buyurtmalari (rol asosida)
- Status bo'yicha filter: Tayyorlanmoqda, Yetkazildi, To'landi
- Qidiruv: SKU, ofitsant ismi, stol raqami, mahsulot nomi bo'yicha
- Statistika kartochkalar: Jami, Tayyorlanmoqda, Yetkazildi, To'langan
- 15 soniyada bir avtomatik yangilanish
- Buyurtma tafsilotlari va tahrirlash modali

### POSTerminal - POS Terminali (Asosiy)
**Chap panel - Mahsulot Katalogi:**
- Kategoriya filter
- Grid ko'rinish + rasmlar
- Savatga qo'shish (miqdor hisoblagichi)
- Savat nishonlari (mahsulotda nechta qo'shilgani)

**O'ng panel - Buyurtma Boshqaruvi:**
- **Yangi Buyurtma tab:**
  - Buyurtma turi (Ichida/Olib ketish - faqat kassir)
  - Stol tanlash (faqat Ichida uchun)
  - Savat: mahsulotlar, miqdorlar, o'chirish
  - Jami hisoblash
  - Savatni tozalash va yuborish
- **Aktiv Buyurtmalar tab:**
  - Ofitsantning/barcha aktiv buyurtmalari
  - Mavjud buyurtmani tezkor tahrirlash
- Real vaqtli backend bilan sinxronizatsiya

---

## 8. KOMPONENTLAR

### Layout
| Komponent | Fayl | Vazifa |
|---|---|---|
| AppLayout | `components/Layout/AppLayout.jsx` | Autentifikatsiyani tekshirish, layout |
| Sidebar | `components/Layout/Sidebar.jsx` | Navigatsiya, foydalanuvchi ma'lumotlari, dark mode, chiqish |

### Modal Komponentlar
| Komponent | Fayl | Vazifa |
|---|---|---|
| OrderViewModal | `components/OrderViewModal.jsx` | Buyurtmani ko'rish, chop etish, status o'zgartirish |
| OrderDetailModal | `components/OrderDetailModal.jsx` | Buyurtma mahsulotlarini tahrirlash, stol o'zgartirish |

### Yordamchi Komponentlar
| Komponent | Fayl | Vazifa |
|---|---|---|
| ProtectedRoute | `components/ProtectedRoute.jsx` | Ruxsat asosida yo'naltirish |
| ToggleActiveButton | `components/ToggleActiveButton.jsx` | Faol/Nofaol almashtirish (yuklanish holati bilan) |
| AnalyticsPanel | `components/AnalyticsPanel.jsx` | Dashboard Recharts grafiklar |

---

## 9. CUSTOM HOOKS

### useOrders.js - Buyurtma Mutatsiya Hooklari
```javascript
useIncreaseItem()   // Buyurtmaga mahsulot qo'shish (optimistik)
useDecreaseItem()   // Buyurtmadan mahsulot kamaytirish
useChangeStatus()   // Buyurtma statusini o'zgartirish
useChangeTable()    // Buyurtmani boshqa stolga ko'chirish
useCreateOrder()    // Yangi buyurtma yaratish
useDeleteOrder()    // Buyurtmani o'chirish
```

**Barcha hooklarda:**
- Optimistik yangilanishlar (API javobini kutmasdan UI yangilanadi)
- Cache avtomatik bekor qilinadi
- Xato bo'lsa avvalgi holatga qaytarish
- Jami summani qayta hisoblash

---

## 10. UI/UX XUSUSIYATLAR

| Xususiyat | Texnologiya | Izoh |
|---|---|---|
| Dark Mode | Tailwind `dark:` + localStorage | Sahifalar bo'ylab saqlangan |
| Toast xabarnomalar | React Hot Toast | Muvaffaqiyat, xato, ogohlantirish |
| Yuklanish holatlari | Tailwind animate + spinner | Skeleton loader, spinner |
| Modallar | Tailwind backdrop | Blur effekt, Esc bilan yopish |
| Animatsiyalar | Framer Motion | Sahifa o'tishlari, modal |
| Responsiv dizayn | Tailwind breakpoints | Mobile, tablet, desktop |

---

## 11. LOYIHA KONFIGURATSIYASI

### vite.config.js
```javascript
port: 3000,
open: true  // Brauzer avtomatik ochiladi
```

### .env
```
VITE_API_BASE_URL=http://45.130.148.187:5781
```

### tailwind.config.js
```javascript
darkMode: 'class',
content: ['./src/**/*.{js,jsx,ts,tsx}']
```

---

## 12. MUHIM TEXNIK ESLATMALAR

1. **Rasm URL'lari:** Backend nisbiy yo'l qaytaradi; `getImgUrl()` funksiyasi to'liq URL ga aylantiradi
2. **FormData:** Mahsulot rasmlari uchun; axios Content-Type'ni o'zi boshqaradi
3. **JWT Decode:** Bir nechta .NET claim formatlarini qo'llab-quvvatlaydi, standart maydonlarga normallashtiradi
4. **Optimistik Yangilanishlar:** Faollik almashtirish, miqdor o'zgartirish kabi operatsiyalar UI'ni API javobidan oldin yangilaydi
5. **Real Vaqtli Sync:** Buyurtmalar 15 soniyada, stollar 10 soniyada avtomatik yangilanadi
6. **Rol Asosida UI:** Komponentlar foydalanuvchi ruxsatlariga qarab shartli ko'rsatiladi
7. **Muhim:** `react-hook-form`ning `@hookform/resolvers` paketi versiyasi 5.x - bu `zod` yoki boshqa validator kutubxonasini talab qilishi mumkin

---

*Bu tahlil loyihaning `src/` papkasidagi barcha fayllar, `package.json`, va konfiguratsiya fayllari asosida tayyorlangan.*
