# 🔍 LOYIHA TAHLILI: MUAMMOLAR VA XATOLIKLAR

**Loyiha:** Lazzat Restaurant POS Terminal  
**Tahlil sanasi:** 2026-03-07  
**Holat:** ⚠️ Tamomlanmagan (6/10)

---

## 📋 MUAMMOLARNING XULCHASI

| #  | Muammo | Jiddiylik | Holat | Tavsiya |
|----|--------|----------|--------|---------|
| 1  | Categories API - `/UpdateCatigory` imlo xatosi | 🔴 Jiddiy | ❌ Xatolik | Backend yoki Frontend tuzatish |
| 2  | Orders API - `statusni o'zgartirish` va `stolni almashtirish` yo'q | 🔴 Jiddiy | ❌ Xatolik | Backend endpoint tasdiqlash |
| 3  | OrderDetailModal - `OrderStatus` noto'g'ri import | 🟡 O'rtacha | ⚠️ Partial | Komponent tuzatish |
| 4  | App.jsx - `/kategoriyalar` va `/mahsulotlar` bir xil `MenuPage`'ga | 🟡 O'rtacha | ⚠️ Logic xatosi | Alohida komponent yaratish |
| 5  | POSTerminal - `avtoPrint()` metodi yo'q | 🟡 O'rtacha | ❌ Xatolik | API metodi qo'shish |
| 6  | Tables API - `sig'imi` localStorage'da | 🟡 O'rtacha | ⚠️ Vaqtinchalik | Backend support kerak |
| 7  | Ruxsatlar hardcoded | 🟡 O'rtacha | ⚠️ Xavfli | Backend'dan dinamik olish kerak |
| 8  | Xatolikni boshqarish nomaqulakri | 🟠 Past | ⚠️ Ogohlantirish | Global error boundary kerak |
| 9  | Oflayn rejalashi yo'q | 🟠 Past | ⚠️ Dizayn | PWA/kesh strategiyasi kerak |
| 10 | Hardcoded API manziladress | 🟠 Past | ⚠️ Config | .env sozlash kerak |

---

## 🔴 JIDDIY XATOLIKLAR

### 1. **Categories API - `/UpdateCatigory` Imlo Xatosi**

**Fayl:** [src/api/categories.js](src/api/categories.js#L21)

```javascript
// BUG: "Catigory" → "Category"
update: async ({ id, name }) => {
  const response = await axiosClient.put('/Category/UpdateCatigory', {  // ❌ XATOLIK
    id,
    name,
  });
  return response.data;
}
```

**Muammo:**
- Backend endpoint `/Category/UpdateCategory` (to'g'ri imlo)
- Frontend `/Category/UpdateCatigory` (imlo xatosi) yuboradi
- **Natija:** Kategoriyani yangilash ishlomaydi → 404 xatosi

**Tuzatish:**
```javascript
update: async ({ id, name }) => {
  const response = await axiosClient.put('/Category/UpdateCategory', {  // ✅ TUZATILGAN
    id,
    name,
  });
  return response.data;
}
```

---

### 2. **Orders API - `statusni o'zgartirish()` va `stolni almashtirish()` Tugamagan**

**Fayl:** [src/api/orders.js](src/api/orders.js#L145-L160)

```javascript
// Fayl oxiri:
changeStatus: async (orderId, status) => {
  if (![1, 2, 3].includes(Number(status))) {
    // TUGAMAGAN - tugallanmagan kod!
```

**Muammo:**
- `statusni o'zgartirish()` va `stolni almashtirish()` metodlar tugamagan (yarim amalga oshgan)
- **Natija:** Buyurtma statusini o'zgartirish, stolni almashtirish ishlomaydi
- Backend endpoint tasdiqlash kerak

**Kerakli tuzatish:**
```javascript
// orders.js'da - FUNKTSIALARNI TUGATISH

/**
 * Statusni o'zgartirish
 * PATCH /Order/ChangeStatus/{orderId}/status?status=n
 */
changeStatus: async (orderId, status) => {
  if (![1, 2, 3].includes(Number(status))) {
    throw new Error('Xato status. 1, 2 yoki 3 bo\'lishi kerak');
  }
  const res = await api.patch(
    `/Order/ChangeStatus/${orderId}/status`,
    null,
    { params: { status } }
  );
  return normalizeOrder(res.data);
},

/**
 * Stolni almashtirish
 * PATCH /Order/ChangeTable/{orderId}/table?newTableId=x
 */
changeTable: async (orderId, newTableId) => {
  const res = await api.patch(
    `/Order/ChangeTable/${orderId}/table`,
    null,
    { params: { newTableId } }
  );
  return normalizeOrder(res.data);
},
```

---

### 3. **OrderDetailModal - Aniqlanmagan Import**

**Fayl:** [src/components/OrderDetailModal.jsx](src/components/OrderDetailModal.jsx#L1-L20)

```javascript
import { orderAPI, OrderStatus, OrderType, ... } from '../api/orders';
// OrderStatus importlangan lekin aniqlanmagan yoki eksport qilinmagan
```

**Muammo:**
- Modal `ORDER_STATUS_LABELS[status]` ishlatmoqda lekin `OrderStatus` noto'g'ri import
- import tutshashmagan (imlo xatosi yoki eksport yo'q)

**Tekshirish qadami:**
`src/api/orders.js` eksportini ko'ring:
```javascript
// src/api/orders.js - hozirgi eksportlar:
export const OrderStatus = { ... }  // ✅ Eksport qilgan
export const ORDER_STATUS_LABELS = OrderStatus;  // ✅ Eksport qilgan
```

**Mumkin sabab:**
- Aylana bog'lanish (circular dependency)
- TypeScript turi vs runtime eksport konflikt

---

### 4. **App.jsx - `/kategoriyalar` va `/mahsulotlar` Bir Manba Muammosi**

**Fayl:** [src/App.jsx](src/App.jsx#L45-L65)

```jsx
{/* MenuPage bitta faylda, lekin ikkita yo'nalis */}
<Route path="/mahsulotlar" element={...}>
  <MenuPage />
</Route>

<Route path="/kategoriyalar" element={...}>
  <MenuPage />  {/* ❌ BUG: Kategoriyalar sahifasi ham MenuPage */}
</Route>
```

**Muammo:**
- Kategoriyalar va Mahsulotlar bitta komponenta ko'rsatadi
- Faqat mahsulotlar ro'yxati ko'rinadi, kategoriyalar yo'q
- Kategoriyalarni boshqarish sahifasi yo'q

**Tuzatish:**
Alohida `CategoriesPage.jsx` yaratish kerak:
```jsx
// src/pages/CategoriesPage.jsx - YANGI
export default function CategoriesPage() {
  // Kategoriyalarni boshqarish interfeysi
}

// App.jsx
<Route path="/kategoriyalar" element={
  <ProtectedRoute permission="Category_Read">
    <CategoriesPage />  {/* ✅ TUZATILGAN */}
  </ProtectedRoute>
} />
```

---

### 5. **POSTerminal - `avtoPrint()` Aniqlanmagan Metodi**

**Fayl:** [src/pages/POSTerminal.jsx](src/pages/POSTerminal.jsx#L43)

```javascript
const avtoPrint = (orderId) => {
  if (!orderId) return;
  orderAPI.printCashier(orderId).catch(() => {});  // ❌ METOD ANIQLANMAGAN
};
```

**Muammo:**
- `orderAPI.printCashier()` metodi mavjud emas
- Chop'ish funktsiyasi ishlomaydi

**Tuzatish:**
```javascript
// Usul 1: API metodini qo'shish
// src/api/orders.js
export const orderAPI = {
  // ...
  printCashier: async (orderId) => {
    const res = await api.post(`/Order/PrintCashier/${orderId}`);
    return res.data;
  },
};

// Usul 2: Window.print() ishlatish (oddiy)
const avtoPrint = (orderId) => {
  if (!orderId) return;
  setTimeout(() => window.print(), 100);
};
```

---

## 🟡 O'RTACHA XATOLIKLAR

### 6. **Hardcoded Ruxsatlar va Dinamik Ruxsatlar Yo'q**

**Fayl:** [src/store/authStore.js](src/store/authStore.js#L35-L65)

```javascript
const ROLE_PERMISSIONS = {
  1: null,  // Admin - barcha ruxsatlar
  2: ['Product_Read', 'Order_Create', ...],  // Ofitsant
  3: ['Product_Read', ...],  // Kassir
};
```

**Muammo:**
- Ruxsatlar frontend'da hardcoded
- Backend JWT'da permission claim yuboradi lekin e'tiborga olinmaydi
- Role-based fallback xavfsiz emas (rol o'zgarsa, xakerlash mumkin)

**Risk:** 🔓 Xavfsizlik zafari - JWT `permission` claim osonlikcha soxta qilinishi mumkin

**Tuzatish:**
```javascript
// JWT'dan permission claim o'qish (priority)
const permissions = decoded.permission ?? decoded.permissions ?? [];

// ROLE_PERMISSIONS faqat backup sifatida
const ROLE_PERMISSIONS = { /* ... */ };
const fallbackPerms = ROLE_PERMISSIONS[role] ?? [];

// JWT va fallback'ni birlash
const finalPermissions = [...new Set([...permissions, ...fallbackPerms])];
```

---

### 7. **Tables - Sig'imi Field localStorage'da**

**Fayl:** [src/api/tables.js](src/api/tables.js#L48-L75)

```javascript
export const capacityHelpers = {
  get: (tableId) => {
    const caps = JSON.parse(localStorage.getItem(CAPACITY_KEY) || '{}');
    return caps[tableId] ?? null;  // localStorage'dan o'qish
  },
  set: (tableId, capacity) => {
    // localStorage'ga yozish
  },
};
```

**Muammo:**
- Backend capacity field qabul qilmaydi
- Frontend localStorage'da vaqtinchalik saqlab turpti
- Multi-qurilma/tab'da desink yuz beradi
- Server qayta ishga tushsa → data yo'qoladi

**Holat:** Vaqtinchalik yechim (backend yangilangach tuzatish kerak)

---

### 8. **Xatolikni Boshqarish Nomaqulakri**

**Muammolar:**
1. Toast xabarlari tarjimasi yo'q (Ingilis + O'zbek aralash)
2. Tarmoq xatoliklari umumiy boshqarish
3. Forma tasdiqlanish xatoliklari nomaqulakri
4. Global error boundary yo'q

**Tuzatish tavsiyasi:**
```javascript
// src/utils/errorHandler.js - YANGI
export const handleError = (err) => {
  const errorMap = {
    'Network Error': 'Internet ulanishi yo\'q',
    '401': 'Sessiya tugadi',
    '403': 'Ruxsat yo\'q',
    '404': 'Topilmadi',
    '500': 'Server xatosi',
  };
  
  const message = errorMap[err.code] || JSON.stringify(err.response?.data?.message || err.message);
  toast.error(message);
};
```

---

## 🟠 PAST AHAMIYATLI XATOLIKLAR

### 9. **Oflayn Rejalashi Yo'q**

**Muammolar:**
- Internet ulanishi ketsa, app to'liq ishlamaydi
- Service Worker yo'q
- Oflayn keshlash yo'q
- Ma'lumot sinxronizatsiya strategiyasi yo'q

**Tavsiya:** PWA sozlash `vite-plugin-pwa`

---

### 10. **Hardcoded API Manziladress**

**Fayl:** [src/api/axios.js](src/api/axios.js#L5)

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api',
});
```

**Holat:** ✅ Qisman tuzatilgan (env o'zgaruvchisi)

**Kerak:** `.env` fayl dokumentatsiyasi

---

## 📊 XATOLIKLAR JIDDIYLIK DARAJALARI

```
🔴 JIDDIY (App ishlomaydi):
  ├─ Kategoriyalar yangilash imlo xatosi
  ├─ Orders statusni o'zgartirish/stolni almashtirish tugamagan
  └─ OrderDetailModal aniqlanmagan import

🟡 O'RTACHA (Xususiyat buzilgan):
  ├─ Kategoriyalar sahifasi yo'q
  ├─ POSTerminal chop'ish aniqlanmagan
  ├─ Ruxsatlar hardcoded
  └─ Tables sig'imi localStorage

🟠 PAST (Kod sifati):
  ├─ Xatolikni boshqarish
  ├─ Oflayn support
  └─ Tur xavfsizligi
```

---

## ✅ TAVSIYA QILGAN TUZATISH TARTIBI

1. **Kategoriyalar API imlo xatosi** (2 minut)
2. **Orders API to'liq metodlar** (10 minut)
3. **CategoriesPage yaratish** (15 minut)
4. **Import va aniqlanmagan metodlarni tuzatish** (5 minut)
5. **Xatolikni boshqarish takomil** (20 minut)
6. **Global error boundary qo'shish** (10 minut)
7. **Ruxsatlar JWT prioriteti** (15 minut)
8. **.env dokumentatsiyasi qo'shish** (5 minut)
