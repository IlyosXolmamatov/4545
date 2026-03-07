# 🏢 LOYIHA BIZNES LOGIKASI VA JARAYONLAR

**Loyiha:** Lazzat Restaurant POS Terminal  
**Versiya:** 1.0.0  
**Backend API:** http://45.138.158.239:5781/api

---

## 📑 ICHIGA NAVIGATSIYA

1. [System Arxitekturasi](#system-arxitekturasi)
2. [Autentifikatsiya Jarayoni](#autentifikatsiya-jarayoni)
3. [Buyurtmani Boshqarish Jarayoni](#buyurtmani-boshqarish-jarayoni)
4. [Menyu va Mahsulot Boshqarish](#menyu-va-mahsulot-boshqarish)
5. [Stol Boshqarish](#stol-boshqarish)
6. [Tahlil va Hisobot](#tahlil-va-hisobot)
7. [Foydalanuvchi va Ruxsatlar Tizimi](#foydalanuvchi-va-ruxsatlar-tizimi)
8. [Ma'lumot Modellari](#malumot-modellari)

---

## 🏗️ SYSTEM ARXITEKTURASI

### Frontend Stack
```
React 19.2 + Vite 6
├─ Holat: Zustand (authStore, themeStore)
├─ Ma'lumot Yuklanishi: TanStack Query (React Query)
├─ Yo'naltirish: React Router 7
├─ Interfeys: Tailwind CSS 3.4
├─ Nishonalar: Lucide React
├─ Formalar: React Hook Form
├─ Bildirishnomalar: React Hot Toast
└─ Animatsiyalar: Framer Motion
```

### Backend API
```
.NET Backend
├─ AuthController: /Auth/Login/login
├─ UserController: /User/*
├─ ProductController: /Product/*
├─ CategoryController: /Category/*
├─ TableController: /Table/*
└─ OrderController: /Order/*
```

### Saqlash Strategiyasi
```
localStorage:
├─ access_token (JWT - Bearer token)
├─ user_data (JSON - normallashtirish qilingan foydalanuvchi info)
├─ table_capacities (JSON - vaqtinchalik sig'im saqlash)
└─ theme_mode (qora/yorug' rejimi)

SessionStorage:
└─ (Hozirda ishlatilmaydi)

IndexedDB:
└─ (Amalga oshtirilmagan - oflayn kesh uchun bo'lishi mumkin)
```

---

## 🔐 AUTENTIFIKATSIYA JARAYONI

### Kirish Jarayoni

```
Foydalanuvchi kiritgan ma'lumotlar (username, parol)
        ↓
authAPI.login(username, parol)
        ↓
POST /Auth/Login/login {username, parol}
        ↓
Javob: {access_token: "JWT_STRING"}
        ↓
JWT Dekodlash (payload chiqarish)
        ↓
Foydalanuvchi Ma'lumotlarini Normallashtirish:
  ├─ id: JWT claimlaridan chiqarilgan
  ├─ name: name/unique_name/fullName'dan
  ├─ username: unique_name
  ├─ role: 1=Admin, 2=Ofitsant, 3=Kassir
  ├─ permissions: JWT claim massivi
  └─ boshqa claimlar: saqlanib qoladi
        ↓
authStore.login() → localStorage'ga saqlash
        ↓
/dashboard'ga yo'naltirish ✅
```

### JWT Claim Mapping

**Frontend normallashtirish** (.NET JWT format variatsiyalarini boshqaradi):

| JWT Claim (Backend) | Normallashtira To | Misol |
|---|---|---|
| `nameid` YOKI `sub` YOKI `id` YOKI `nameidentifier` | `user.id` | "550e8400-e29b-41d4-a716-446655440000" |
| `name` YOKI `unique_name` YOKI `userName` | `user.name`, `user.username` | "Ali Karim" |
| `role` (string: "Admin"/"Ofitsant"/"Kassir") | `user.role` (1/2/3) | 1 = Admin |
| `permission` (massiv) | `user.permissions` | ["User_Read", "Product_Create"] |

### Token Boshqarish

- **Saqlash:** localStorage['access_token']
- **Tasdiqlanish:** `authAPI.isTokenValid(token)` exp claimini tekshiradi
- **Muddati tugashi:** 401 javobda avtomatik /login'ga yo'naltirish
- **Headers:** Axios interceptor orqali avtomatik kiritish → `Authorization: Bearer {token}`

### Ruxsatlar Tizimi

**Role-Based Ruxsatlar:**

```javascript
// Admin (role=1)
└─ null (barcha ruxsatlar)

// Ofitsant (role=2)
├─ Product_Read / Products_Read
├─ Order_Create / Order_Read / Order_My_Read
├─ Order_ItemIncrease / Order_TableChange
├─ Table_Read / Tables_Read
└─ Category_Read / Categories_Read

// Kassir (role=3)
├─ To'liq mahsulot boshqarish
├─ To'liq buyurtma boshqarish
├─ To'liq stol boshqarish
├─ To'liq kategoriya boshqarish
├─ User_Read / Users_Read / User_Create
└─ Boshqa barcha ruxsatlar
```

**Ruxsat Tekshirish:**
```javascript
// src/components/ProtectedRoute.jsx
const {hasPermission} = useAuthStore();

// Ishlatilishi:
if (hasPermission('User_Read')) {
  // Foydalanuvchi sahifasini ko'rsatish
}
```

---

## 🛒 BUYURTMANI BOSHQARISH JARAYONI

### Buyurtma Holati Siklsi

```
┌──────────────────────────────────┐
│    BUYURTMANING VAQTI DAVRI     │
└──────────────────────────────────┘

BUYURTMA YARATISH
   ↓
holati = 1 (Qabul qilindi) ✅
   ↓
   ├─→ FAOL: Xonajon toa'om yeyapti/buyurtmalar kelayapti
   │    ├─ mahsulotni oshirish: +1 mahsulot
   │    ├─ mahsulotni kamaytirish: Mahsulotni o'chirish sababi bilan
   │    └─ stolni almashtirish: Boshqa stolga ko'chirish
   │       ↓
   ├─→ BUYURTMANI TUGATISH
   │    │
   │    └─→ holati = 3 (To'landi) ✅ [To'lov qabul qilindi]
   │
   │ YOKI
   │
   └─→ BUYURTMANI BEKOR QILISH
        │
        └─→ holati = 2 (Bekor qilindi) ✅ [Qayta pul qaytatildi]
```

**Buyurtma Holati Kodlari:**

| Kod | Nomi | O'zbek | Ma'nosi |
|------|------|-------|---------|
| 1 | Qabul qilindi | Qo'mmalandi | Buyurtma javobi olingan |
| 2 | Bekor qilindi | Bekor | Buyurtma bekor/qayta pul |
| 3 | To'landi | To'landi | To'lov olindi, tayyor |
| 0 | MEROS | Bekor | Meros (2ga konvertita) |

### Buyurtma Yaratish

```javascript
// Ma'lumot strukturi
{
  userId: "UUID",                    // Ofitsant ID
  tableId: "UUID" | null,           // null = Olib ketish
  orderType: 1 | 2,                 // 1=Ichida, 2=Olib ketish
  items: [
    { productId: "UUID", count: 2 },
    { productId: "UUID", count: 1 }
  ]
}

// Javob
{
  id: "UUID",
  sku: 12345,                       // Ko'rsatish buyurtma raqami
  orderType: 1,                     // Backend string/raqam qaytaradi
  orderStatus: 1 | "Qabul qilindi",  // Raqamga normallashtira
  tableNumber: 5,
  totalAmount: 125500,              // so'm
  waiterName: "Ali Karim",
  createdAt: "2026-03-07T12:30:00Z",
  items: [
    {
      id: "UUID",
      productId: "UUID",
      productName: "Osh",
      count: 2,
      priceAtTime: 45000          // Snapshot narxi
    }
  ]
}
```

### Mahsulot Boshqarish

**Mahsulotni Oshirish:**
```
OrderDetailModal foydalanuvchi mahsulot sonini oshiradi
   ↓
orderAPI.increaseItem(buyurtmaId, mahsulotId, son)
   ↓
PATCH /Order/IncreaseItem/{buyurtmaId}/items/increase?productId=X&count=N
   ↓
Javob: yangilanib turgan buyurtma
   ↓
useQuery qayta yuklanish → Interfeys yangilanadi
```

**Mahsulotni Kamaytirish:**
```
Foydalanuvchi buyurtmadan mahsulot o'chiradi
   ↓
Bekor sababini kiritish
   ↓
orderAPI.decreaseItem(buyurtmaId, mahsulotId, son, sabab)
   ↓
PATCH /Order/DecreaseItem/{buyurtmaId}/items/decrease?productId=X&count=N&aboutOfCancelled=sabab
   ↓
Javob: yangilanib turgan buyurtma
   ↓
Jami hisob-kit → Yangilangan narxni ko'rsatish
```

### Stol Almashtirish Mantig'i

```
Ofitsant buyurtmani boshqa stolga ko'chiradi
   ↓
Yangi stol mavjudligini tekshirish (tableStatus = 1)
   ↓
orderAPI.changeTable(buyurtmaId, yangiStolId)
   ↓
PATCH /Order/ChangeTable/{buyurtmaId}/table?newTableId=UUID
   ↓
Eski stol: tableStatus = 1 (Bo'sh)
Yangi stol: tableStatus = 2 (Band)
   ↓
Interfeys: Stol tarafi yangilanadi
```

### Faol Buyurtmalar Ko'rinishi

**Ofitsant Dashboard'i:**
```javascript
// So'rov: /Order/GetMyActiveOrders/my-active
// Qaytaradi: Faqat bu ofitsantning tugamagan buyurtmalari (status != 2,3)
{
  refetchInterval: 10_000ms,  // Har 10s avtomatik yangilash
  enabled: user.role === 2    // Faqat ofitsantlar uchun
}

// Ofitsant o'z buyurtmalarini tahrir qila oladi
// Oshxona ko'radi lekin tahriri qila oldinlarni (faqat ko'rinishi)
```

**Admin/Kassir Dashboard'i:**
```javascript
// So'rov: /Order/GetAll
// Qaytaradi: Barcha buyurtmalar (barcha ofitsantlar, barcha holatlari)
{
  refetchInterval: 30_000ms,  // Katta ma'lumot to'plami uchun sekinroq yangilash
}

// Filtr qilish: holat, sana, stol, ofitsant
```

---

## 📋 MENU & PRODUCT MANAGEMENT

### Menu Structure

```
PRODUCTS (Display)
└─ CATEGORIES (Filter)
   ├─ Salatlar (Salads)
   ├─ Ichimliklar (Drinks)
   ├─ Asosiy taomlar (Main)
   └─ Dessertlar (Desserts)
```

### Product Data Model

```javascript
{
  id: "UUID",
  name: "Osh",
  description: "Tepalikda yog' va goshtli osh",
  price: 45000,                  // so'm
  categoryId: "UUID",
  categoryName: "Asosiy taomlar",
  image: "/uploads/osh.jpg",    // Relative or absolute URL
  isActive: true,
  terminalTag: 1,               // 1=Oshxona, 2=Somsaxona, 3=Kassa
  createdAt: "2026-03-07T...",
  updatedAt: "2026-03-07T..."
}
```

### Product CRUD

**Create:**
```javascript
// MultiPart FormData (image upload)
{
  File: image,
  name: "Osh",
  description: "...",
  price: 45000,
  categoryId: "UUID",
  terminalTag: 1,
  isActive: true
}

POST /Product/CreateProduct
```

**Read:**
```javascript
GET /Product/GetAllProducts
// Returns: Array[Product]
```

**Update:**
```javascript
// FormData again
PUT /Product/UpdateProduct
```

**Delete:**
```javascript
DELETE /Product/Delete/{id}
```

### Category Management

**List:**
```javascript
GET /Category/GetAllCategories
// Returns: [{ id, name }, ...]
```

**Create:**
```javascript
POST /Category/AddCategory
{
  name: "Yangi kategoriya"
}
```

**Update:**
```javascript
PUT /Category/UpdateCategory  // NOTE: typo in code = /UpdateCatigory
{
  id: "UUID",
  name: "Kategoriya nomi"
}
```

**Delete:**
```javascript
DELETE /Category/DeleteCategory/{id}
```

---

## 🪑 TABLE MANAGEMENT

### Table Status Lifecycle

```
Table created
   ↓
tableStatus = 1 (Empty/Bo'sh)
   ↓
   ├─→ Order created for table
   │    ↓
   │    tableStatus = 2 (NotEmpty/Band)
   │    ↓
   │    Customers eating...
   │    ↓
   │    Order finished (status=3)
   │    ↓
   │    tableStatus = 1 (Empty) ← Back to start
   │
   └─→ Table reserved
        ↓
        tableStatus = 3 (Reserved)
        ↓
        Reservation expires → status = 1
```

**Table Status Codes:**

| Code | Name | Uzbek | Color |
|------|------|-------|-------|
| 1 | Empty | Bo'sh | 🟢 Emerald |
| 2 | NotEmpty | Band | 🔴 Rose |
| 3 | Reserved | Rezerv | 🟠 Amber |

**Table Type Codes:**

| Code | Name | Uzbek |
|------|------|-------|
| 1 | Simple | Oddiy |
| 2 | Terrace | Terasa |
| 3 | VIP | VIP |

### Table Creation

```javascript
{
  tableNumber: 5,
  tableStatus: 1,      // Start as empty
  tableType: 1,        // Simple/Terrace/VIP
  capacity: 4,         // Persons (stored in localStorage temp)
  waiterName: "Ali"    // Assigned waiter
}

POST /Table/CreateTable
```

### Table Assignment

- **Default:** Table's assigned waiter from database
- **Change:** Order → changeTable → New table assigned
- **Display:** TablesGrid shows table number, status, waiter name, capacity

---

## 📊 ANALYTICS & REPORTING

### Dashboard Analytics

**AdminDashboard shows:**

```javascript
// Top metrics
├─ Total Orders (today)
├─ Revenue (today)
├─ Average Order Value
└─ Busy Tables

// Charts (Recharts)
├─ Orders by hour (line)
├─ Sales by category (pie)
├─ Busy tables (bar)
└─ Revenue trends (area)
```

**Data Source:**
```javascript
// useQuery: /Analytics/GetDashboardMetrics
GET /Analytics/Dashboard
// Returns: metrics for charts
```

### ProductAnalyticsPanel

```javascript
// Most topsold products
// Revenue by category
// Inventory status
```

---

## 👥 USER & PERMISSION SYSTEM

### User Roles

| Role | ID | Permissions | Sidebar Access |
|------|----|----|---|
| **Admin** | 1 | All | All pages |
| **Waiter** | 2 | Orders, Tables, Products (View) | Dashboard, Orders, My Orders, Tables, Menu |
| **Cashier** | 3 | Orders, Products, Users, Categories | Dashboard, Orders, Users, Menu, Categories |

### User Management (Admin Only)

**Create User:**
```javascript
{
  name: "Ali",
  username: "ali_waiter",
  password: "secure123",
  role: 2  // Waiter
}

POST /User/CreateUser
```

**Update User:**
```javascript
{
  id: "UUID",
  name: "Ali Karim",
  role: 2,
  isActive: true
}

PUT /User/UpdateUser/{id}
```

**Delete User:**
```javascript
DELETE /User/DeleteUser/{id}
```

**List Users:**
```javascript
GET /User/GetAllUsers
// Admin: sees all
// Others: access denied
```

---

## 💾 DATA MODELS

### Order Model (Frontend)

```javascript
{
  id: UUID,
  sku: Number,              // Display #
  orderType: 1|2,           // 1=DineIn, 2=TakeOut
  orderStatus: 1|2|3,       // 1=Accepted, 2=Cancelled, 3=Finished
  tableNumber: Number|null, // null for TakeOut
  totalAmount: Number,      // so'm
  waiterName: String,
  createdAt: ISO8601Date,
  items: [
    {
      id: UUID,
      productId: UUID,
      productName: String,
      count: Number,
      priceAtTime: Number    // Price snapshot
    }
  ]
}
```

### User Model (Frontend - normalized)

```javascript
{
  id: UUID,
  name: String,
  username: String,
  role: 1|2|3,
  permissions: String[],     // From JWT
  isAuthenticated: Boolean,
  ...otherJWTClaims
}
```

### Table Model (Frontend)

```javascript
{
  id: UUID,
  tableNumber: Number,
  tableStatus: 1|2|3,
  tableType: 1|2|3,
  capacity: Number,          // localStorage
  waiterName: String|null,
  activeOrderId: UUID|null   // Current order
}
```

### Product Model (Frontend)

```javascript
{
  id: UUID,
  name: String,
  description: String,
  price: Number,
  categoryId: UUID,
  categoryName: String,
  image: URL,
  isActive: Boolean,
  terminalTag: 1|2|3,       // Kitchen routing
  createdAt: ISO8601Date
}
```

---

## 🔄 KEY BUSINESS RULES

### Order Rules

✅ **Can create order:**
- Logged in user (any role)
- Valid tableId OR orderType=2 (TakeOut)

✅ **Can modify own order:**
- Creator (waiter) CAN increase/decrease/changeTable
- Admin CAN modify any order

✅ **Can finish order:**
- Order status must be 1 (Accepted)
- All items must be prepared (status != 0)

⛔ **Cannot:**
- Create order without tableId AND orderType
- Move finished/cancelled order
- Delete finished order

### Product Rules

✅ **Management:**
- Only Cashier can create/edit/delete products
- Admin can do everything
- Waiter can only view

✅ **Pricing:**
- Price stored at order creation time (snapshot)
- Product price changes don't affect old orders

### Table Rules

✅ **Table Status:**
- Only changes when order's status changes
- Reserved (status=3) expires after X hours

⛔ **Cannot:**
- Move order to occupied table (unless swap)
- Delete table with active order

### Permission Rules

✅ **Applied:**
- Via `<ProtectedRoute permission="Feature_Read" />`
- JWT claims are PRIMARY source
- Role fallback is SECONDARY

---

## 🔌 API Response Format

### Success Response

```javascript
{
  data: {...},           // Actual data
  status: 200|201,
  message: "OK"
}
// Frontend: response.data
```

### Error Response

```javascript
{
  error: "Error message",
  status: 400|401|403|404|500,
  details: "Additional..."
}
// Caught by axios interceptor → toast.error()
```

### Pagination (if used)

```javascript
{
  items: [...],
  total: 100,
  page: 1,
  pageSize: 20
}
```

---

## 📌 CRITICAL FLOWS SUMMARY

| Flow | Trigger | Key Steps | Result |
|------|---------|-----------|--------|
| **Login** | User clicks "Login" | POST token → Decode → Normalize → localStorage | Dashboard access |
| **Create Order** | Waiter clicks "+" | Select table/TakeOut → Add items → POST | Order created, table status=2 |
| **Modify Order** | Waiter clicks item | Increase/decrease → PATCH → Revalidate | Price updated |
| **Finish Order** | Admin settles → PATCH status=3 | Payment taken → Close order | Table status=1 |
| **User Management** | Admin adds user | Form → POST /User/CreateUser | User active |
| **Menu Update** | Cashier edits product | Upload image → PUT /Product/UpdateProduct | Menu refreshed |

---

## 🎯 BUSINESS METRICS

**Key Indicators:**
- Orders per hour
- Average order value (AOV)
- Revenue per table
- Table turnover rate
- Busy hours forecast
- Staff performance (orders/waiter)

**Tracked in:**
- AdminDashboard (real-time)
- Analytics page (historical)
- Reports (exported)
