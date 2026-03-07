# 🚀 LOYIHANI RIVOJLANTIRISH: TAVSIYALAR VA YANGILIKLAR

**Loyiha:** Lazzat Restaurant POS Terminal  
**Versiya:** 1.0.0 → 1.1.0 (Rejalashtirish)  
**Tavsiya qilgan ish vaqti:** 20-30 soat

---

## 📋 YANGILIKLAR XULCHASI

| # | Yangilik | Ahamiyat | Vaqt | Priority |
|----|----------|----------|------|----------|
| 1 | **Oflayn support (PWA)** | 🔴 Jiddiy | 4h | P1 |
| 2 | **Global error boundary** | 🔴 Jiddiy | 1h | P1 |
| 3 | **Forma tasdiqlanish takomillan** | 🟡 O'rtacha | 2h | P2 |
| 4 | **Ko'p-til support** | 🟡 O'rtacha | 3h | P2 |
| 5 | **Qora rejim qoldirilishi** | 🟡 O'rtacha | 0.5h | P2 |
| 6 | **Real-vaqt buyurtma yangilanishi** | 🟡 O'rtacha | 3h | P2 |
| 7 | **Quitansiya chop'ish** | 🟡 O'rtacha | 1.5h | P2 |
| 8 | **Buyurtmalarni CSV/PDF'ga eksport** | 🟠 Past | 2h | P3 |
| 9 | **Oshxona displey tizimi (KDS)** | 🔴 Jiddiy | 6h | P1 |
| 10 | **To'lov integratsiyasi** | 🔴 Jiddiy | 5h | P1 |
| 11 | **Jadval boshqarish** | 🟠 Past | 3h | P3 |
| 12 | **Inventar kuzatilishi** | 🟡 O'rtacha | 4h | P2 |

---

## 🔴 P1 PRIORITY - JIDDIY XUSUSIYATLAR

### 1. Oflayn Support (PWA)

**Vazifa:** Internet ulanishi ketsa ham app ishlashi

**Kerakli:**
- Service Worker registratsiyasi
- Cache API statik aktivlar uchun
- IndexedDB buyurtma kesha uchun
- Offline o'zgarishlar uchun sinxronizatsiya navbati

**Fayllar:**
```
src/
├─ service-worker.js (YANGI)
├─ utils/
│  └─ offlineSync.js (YANGI)
└─ hooks/
   └─ useOfflineCache.js (YANGI)
```

**Paket:**
```bash
npm install vite-plugin-pwa
```

**vite.config.js:**
```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Lazzat POS',
        short_name: 'Lazzat',
        description: 'Restoran Boshqarish Tizimi',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#f97316',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        cacheId: 'lazzat-v1',
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/45\.138\.158\.239/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50 }
            }
          }
        ]
      }
    })
  ]
}
```

**Tavsiya takomil:**
```javascript
// src/hooks/useOfflineCache.js
export const useOfflineCache = () => {
  const isOnline = useNetworkStatus();  // YANGI hook
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (isOnline) {
      // Kutilayotgan o'zgarishlarni backend'ga sinxronizatsiya qilish
      syncPendingChanges();
      // So'rovlarni bekor qilish
      queryClient.invalidateQueries();
    }
  }, [isOnline]);
  
  return { isOnline };
};
```

---

### 2. Oshxona Displey Tizimi (KDS)

**Vazifa:** Oshxona xodimi buyurtmalarni real-vaqtda ko'rsin

**Interfeys Layout'i:**
```
┌───────────────────────────────────────┐
│  OSHXONA DISPLEY (Kitchen Display)   │
├───────────────────────────────────────┤
│  Filtr: [Hammasi] [Yangi] [Tayyor]   │
├───────────────────────────────────────┤
│                                       │
│  Buyurtma #1234   10:30        [TAYYOR]│
│  ├─ 2x Osh                           │
│  ├─ 1x Plov                          │
│  └─ Stol 5                           │
│                                       │
│  Buyurtma #1235   10:32        [TAYYOR]│
│  ├─ 1x Qorma                         │
│  └─ Olib ketish                      │
│                                       │
│  Buyurtma #1236   10:35  [TAYYORLANMOQ]│
│  ├─ 3x Manti                         │
│  └─ Stol 3                           │
│                                       │
└───────────────────────────────────────┘
```

**Fayllar:**
```
src/pages/KitchenDisplay.jsx (YANGI)
src/components/KitchenOrderCard.jsx (YANGI)
src/hooks/useKitchenOrders.js (YANGI)
```

**Integratsiya:**
```javascript
// App.jsx - YANGI yo'nalis
<Route path="/kitchen" element={
  <ProtectedRoute permission="Order_Read">
    <KitchenDisplay />
  </ProtectedRoute>
} />
```

**Real-vaqt ulanishi:**
```javascript
// Har 5 sekundda so'rovni takrorlash
const { data: orders } = useQuery({
  queryKey: ['kitchen-orders'],
  queryFn: () => orderAPI.getAll(),
  refetchInterval: 5000,  // Real-vaqt effekti
  staleTime: 2000
});
```

---

### 3. To'lov Integratsiyasi

**Vazifa:** Naqd+plastik pul qabul qilish

**Integratsiya:**
- **Click.uz** (TT UZ to'lov tizimi)
- **PayMe** (UZCARD, HUMO, VISA, MASTERCARD)
- **Payme** (API)

**Fayllar:**
```
src/
├─ api/payment.js (YANGI)
├─ components/PaymentModal.jsx (YANGI)
└─ utils/paymentUtil.js (YANGI)
```

**Jarayon:**

```javascript
// OrderDetailModal
<Button onClick={() => handlePayment()}>
  To'lash ({jami} so'm)
</Button>

// handlePayment
const handlePayment = async () => {
  // Usul 1: Naqd pul
  await orderAPI.changeStatus(orderId, 3);
  
  // Usul 2: Karta (Click.uz)
  const paymentLink = await paymentAPI.createPayment({
    orderId,
    amount: jami,
    description: `Buyurtma #${order.sku}`
  });
  window.location.href = paymentLink;
};
```

---

### 4. Global Error Boundary

**Vazifa:** App crash bo'lmasa ham xatoliklarni ko'rsatish

**Fayl:**
```
src/components/ErrorBoundary.jsx (YANGI)
```

**Kod:**
```javascript
// src/components/ErrorBoundary.jsx
import { Component } from 'react';
import toast from 'react-hot-toast';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Xatolik ushlandi:', error, errorInfo);
    toast.error('Noma\'lum xatolik yuz berdi. Sahifani yangilang.');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-red-50">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-600">Xatolik!</h1>
            <p className="text-gray-600 mt-2">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
            >
              Qaytadan yuklash
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**App.jsx'da:**
```javascript
<ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {/* Yo'nalishlar */}
    </BrowserRouter>
  </QueryClientProvider>
</ErrorBoundary>
```

---

## 🟡 P2 PRIORITY - MUHIM XUSUSIYATLAR

### 5. Real-vaqt Buyurtma Yangilanishi (SignalR)

**Kerakli:** Buyurtmalar real-vaqtda update bo'lishi

**Backend:** Allaqachon installed (`@microsoft/signalr`)

**Frontend hook:**
```javascript
// src/hooks/useOrderHub.js (TAKOMIL)
import * as SignalR from '@microsoft/signalr';

export const useOrderHub = () => {
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    const conn = new SignalR.HubConnectionBuilder()
      .withUrl('http://45.138.158.239:5781/orderHub')
      .withAutomaticReconnect()
      .build();

    conn.on('OrderCreated', (order) => {
      // So'rovni bekor qilish
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    });

    conn.on('OrderUpdated', (order) => {
      // Keshdani bevosita yangilash
      queryClient.setQueryData(['order', order.id], order);
    });

    conn.start().catch(err => console.error(err));
    setConnection(conn);

    return () => conn.stop();
  }, []);

  return { connection };
};
```

---

### 6. Ko'p-til Support (i18n)

**Kerakli:** O'zbek, Ingilis, Rus tillari

**Paket:**
```bash
npm install i18next react-i18next
```

**Tuzilma:**
```
src/locales/
├─ en.json
├─ uz.json
└─ ru.json
```

**Misol (uz.json):**
```json
{
  "nav": {
    "dashboard": "Bosh sahifa",
    "orders": "Buyurtmalar",
    "menu": "Menyu"
  },
  "order": {
    "create_success": "Buyurtma yaratildi",
    "total": "Jami"
  }
}
```

**Ishlatilishi:**
```javascript
import { useTranslation } from 'react-i18next';

export function Dashboard() {
  const { t, i18n } = useTranslation();
  
  return (
    <>
      <h1>{t('nav.dashboard')}</h1>
      <select onChange={(e) => i18n.changeLanguage(e.target.value)}>
        <option value="uz">O'zbek</option>
        <option value="en">English</option>
        <option value="ru">Русский</option>
      </select>
    </>
  );
}
```

---

### 7. Quitansiya Chop'ish

**Vazifa:** POS printer'ga quitansiya chop'ish

**Paket:** Thermal printer support

```javascript
// src/utils/printer.js (YANGI)
export const printReceipt = (order) => {
  const receipt = `
═════════════════════════
    LAZZAT RESTORAN
═════════════════════════
Buyurtma #${order.sku}
Sana: ${new Date().toLocaleString('uz-UZ')}
Stol: ${order.tableNumber || 'Olib ketish'}
─────────────────────────
${order.items.map(item => 
  `${item.productName.padEnd(20)} x${item.count}  ${item.priceAtTime * item.count}so'm`
).join('\n')}
─────────────────────────
JAMI: ${order.totalAmount} so'm
═════════════════════════
  Rahmat! Yana ko'rinishga!
═════════════════════════
  `;

  // Chop etish (Firefox print dialog)
  const printWindow = window.open('', '', 'height=400,width=600');
  printWindow.document.write('<pre>' + receipt + '</pre>');
  printWindow.document.close();
  printWindow.print();
};
```

---

### 8. Inventar Boshqarish

**Kerakli:** Mahsulot stock kuzatilishi

**Database:** Mahsulotlarga `stock` field qo'shilishi (backend)

**Frontend:**
```javascript
// Mahsulot modeli
{
  ...
  stock: 50,
  minStock: 10,  // Ogoh qilish trigeri
  reorderQuantity: 30
}

// Interfeys
<Badge color={stock < minStock ? 'red' : 'green'}>
  Stock: {stock}
</Badge>

// Kam stock ogoh qilishi
{stock < minStock && (
  <AlertBox>Kam mahsulot! {stock} qoldi</AlertBox>
)}
```

---

## 🟠 P3 PRIORITY - NICE-TO-HAVE

### 9. CSV/PDF'ga Eksport

```javascript
// src/utils/export.js (YANGI)
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportOrdersToCSV = (orders) => {
  const csv = [['Buyurtma', 'Stol', 'Jami', 'Ofitsant', 'Holat']];
  orders.forEach(o => {
    csv.push([o.sku, o.tableNumber, o.totalAmount, o.waiterName, o.orderStatus]);
  });
  
  const csvContent = csv.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders-${new Date().toISOString()}.csv`;
  a.click();
};

export const exportOrdersToPDF = (orders) => {
  const doc = new jsPDF();
  doc.autoTable({
    head: [['Buyurtma', 'Stol', 'Jami', 'Ofitsant']],
    body: orders.map(o => [o.sku, o.tableNumber, o.totalAmount, o.waiterName])
  });
  doc.save(`orders-${new Date().toISOString()}.pdf`);
};
```

---

### 10. Xodim Jadval Boshqarish

```
src/pages/SchedulePage.jsx (YANGI)
├─ Haftalik taqvim
├─ Shift tayinlanishi
├─ Mavjudlik kuzatilishi
└─ Shift almashtirish so'rovlari
```

---

### 11. Tahlilni Takomillash

```javascript
// Ilg'or grafiklar
├─ Daromad prognozi
├─ Ish vaqti issiqlik xaritasi
├─ Xodim ishlash reytingi
├─ Xonajonga qaytarish
└─ Feedback sentiament tahlili
```

---

## 🛠️ KOD SIFATI TAKOMILLASH

### 1. Tur Xavfsizligi (TypeScript)

```bash
npm install --save-dev typescript @types/react @types/node
```

**Bosqichma-bosqich `.ts` fayllariga ko'chirish:**

```typescript
// Oldin: orderAPI.js
export const orderAPI = { ... }

// Keyin: orderAPI.ts
interface Buyurtma {
  id: string;
  sku: number;
  orderStatus: 1 | 2 | 3;
  items: BuyurtmaItem[];
}

interface BuyurtmaItem {
  id: string;
  productName: string;
  count: number;
  priceAtTime: number;
}

export const orderAPI = {
  getAll: async (): Promise<Buyurtma[]> => { ... },
  getById: async (id: string): Promise<Buyurtma> => { ... }
};
```

---

### 2. Keng Logging

```javascript
// src/utils/logger.js (YANGI)
export const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data),
  error: (msg, error) => console.error(`[ERROR] ${msg}`, error),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data),
  debug: (msg, data) => {
    if (import.meta.env.DEV) console.debug(`[DEBUG] ${msg}`, data);
  }
};
```

---

### 3. E2E Testlash

```bash
npm install --save-dev cypress
```

**Misol test:**
```javascript
// cypress/e2e/login.cy.js
describe('Login Jarayoni', () => {
  it('muvaffaqiyatli kirishi kerak', () => {
    cy.visit('/login');
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

---

## 📈 ISHLASH OPTIMIZATSIYALARI

### 1. Kod Ajratilishi

```javascript
// Oldin
import AnalyticsPage from './pages/AnalyticsPage';

// Keyin
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

<Suspense fallback={<LoadingSpinner />}>
  <AnalyticsPage />
</Suspense>
```

### 2. Rasm Optimizatsiyasi

```bash
npm install sharp
```

### 3. Bundle Tahlili

```bash
npm install --save-dev rollup-plugin-visualizer
```

---

## 🗒️ AMALGA ASHARILISH ROADMAP'i

**Bosqich 1 (1-2 haftasi): Jiddiy Tuzatishlar**
- [ ] kategoriyalar API imlo xatosi
- [ ] Orders API metodlarini to'liq qilish
- [ ] CategoriesPage yaratish
- [ ] Global Error Boundary qo'shish

**Bosqich 2 (3-4 haftasi): Asosiy Xususiyatlar**
- [ ] PWA oflayn support qilish
- [ ] Oshxona Displey Tizimini qo'shish
- [ ] To'lov tizimini integratsiya qilish
- [ ] Real-vaqt buyurtma yangilanishi (SignalR)

**Bosqich 3 (5-6 haftasi): Takomillashlar**
- [ ] Ko'p-til support qilish
- [ ] Quitansiya chop'ish
- [ ] CSV/PDF'ga eksport
- [ ] Inventar boshqarish

**Bosqich 4 (7 va ko'p): Optimallashtirish va Masshtab**
- [ ] TypeScript migratsiyasi
- [ ] Keng testlash (E2E)
- [ ] Ishlash optimizatsiyasi
- [ ] Tahlillarni takomillash
- [ ] Xodim jadvallash

---

## 💰 TASMINJAY RIVOJLANTIRISH VAQTI

| Kategoriya | Soatlar |
|-----------|--------|
| P1 Tuzatishlar | 3-4 |
| P1 Xususiyatlar | 15-18 |
| P2 Xususiyatlar | 10-12 |
| P3 Xususiyatlar | 5-8 |
| Testlash va QA | 8-10 |
| **JAMI** | **45-52 soat** |

---

## 📞 BACKEND TASDIQLARI KERAK

1. ✅ `/Category/UpdateCategory` endpoint nomi (hozir typo: `/UpdateCatigory`)
2. ✅ `/Order/ChangeStatus` endpoint mavjud va ishlaydi
3. ✅ `/Order/ChangeTable` endpoint mavjud va ishlaydi
4. ✅ `/Order/PrintCashier` endpoint quitansiya chop'ish uchun
5. ✅ `/Analytics/Dashboard` metrikalari endpoint
6. ✅ SignalR hub URL va eventlar (`OrderCreated`, `OrderUpdated`)
7. ✅ To'lov gateway API dokumentatsiyasi (Click.uz yoki Payme)
8. ✅ `capacity` field'ni jadval modeliga qo'shish (hozir localStorage)
9. ✅ `stock` field'ni Mahsulot modeliga qo'shish (inventar uchun)
10. ✅ Xodim boshqarish uchun `schedule` endpointlar qo'shish

---

## 📖 YANGILASI KERAK BO'LGAN DOKUMENTATSIYA

- [ ] API Dokumentatsiyasi (Swagger/OpenAPI)
- [ ] O'rnatish Bo'yicha Qo'llanma
- [ ] Joyida Joriylash Bo'yicha Qo'llanma
- [ ] Foydalanuvchi Qo'llanmasi (O'zbek + Rus)
- [ ] Rivojlantiruvchi Qo'llanmasi (Arxitektura, naqshlar)
- [ ] Hissa Qo'shish Bo'yicha Bo'yicha Qo'llanmalar
import * as SignalR from '@microsoft/signalr';

export const useOrderHub = () => {
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    const conn = new SignalR.HubConnectionBuilder()
      .withUrl('http://45.138.158.239:5781/orderHub')
      .withAutomaticReconnect()
      .build();

    conn.on('OrderCreated', (order) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    });

    conn.on('OrderUpdated', (order) => {
      // Update cache directly
      queryClient.setQueryData(['order', order.id], order);
    });

    conn.start().catch(err => console.error(err));
    setConnection(conn);

    return () => conn.stop();
  }, []);

  return { connection };
};
```

---

### 6. Multi-language Support (i18n)

**Kerakli:** Uzbek, English, Russian tillar

**Paket:**
```bash
npm install i18next react-i18next
```

**Struktur:**
```
src/locales/
├─ en.json
├─ uz.json
└─ ru.json
```

**Misol (uz.json):**
```json
{
  "nav": {
    "dashboard": "Bosh sahifa",
    "orders": "Buyurtmalar",
    "menu": "Menyu"
  },
  "order": {
    "create_success": "Buyurtma yaratildi",
    "total": "Umumiy"
  }
}
```

**Ishlatish:**
```javascript
import { useTranslation } from 'react-i18next';

export function Dashboard() {
  const { t, i18n } = useTranslation();
  
  return (
    <>
      <h1>{t('nav.dashboard')}</h1>
      <select onChange={(e) => i18n.changeLanguage(e.target.value)}>
        <option value="uz">Uzbek</option>
        <option value="en">English</option>
        <option value="ru">Русский</option>
      </select>
    </>
  );
}
```

---

### 7. Receipt Printing

**Vazifa:** POS printer'ga quitansiya chop etish

**Paket:** Thermal printer support

```javascript
// src/utils/printer.js (NEW)
export const printReceipt = (order) => {
  const receipt = `
═════════════════════════
    LAZZAT RESTAURANT
═════════════════════════
Order #${order.sku}
Date: ${new Date().toLocaleString('uz-UZ')}
Table: ${order.tableNumber || 'TakeOut'}
─────────────────────────
${order.items.map(item => 
  `${item.productName.padEnd(20)} x${item.count}  ${item.priceAtTime * item.count}so'm`
).join('\n')}
─────────────────────────
TOTAL: ${order.totalAmount} so'm
═════════════════════════
  Thank you! Come again!
═════════════════════════
  `;

  // Print (browser print dialog)
  const printWindow = window.open('', '', 'height=400,width=600');
  printWindow.document.write('<pre>' + receipt + '</pre>');
  printWindow.document.close();
  printWindow.print();
};
```

---

### 8. Inventory Management

**Kerakli:** Product stock tracking

**Database:** Products'ga `stock` field qo'shish (backend)

**Frontend:**
```javascript
// Product model
{
  ...
  stock: 50,
  minStock: 10,  // Alert trigger
  reorderQuantity: 30
}

// UI
<Badge color={stock < minStock ? 'red' : 'green'}>
  Stock: {stock}
</Badge>

// Low stock alert
{stock < minStock && (
  <AlertBox>Kam mahsulot! {stock} qoldi</AlertBox>
)}
```

---

## 🟠 P3 PRIORITY - NICE-TO-HAVE

### 9. CSV/PDF Export

```javascript
// src/utils/export.js (NEW)
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportOrdersToCSV = (orders) => {
  const csv = [['Order', 'Table', 'Total', 'Waiter', 'Status']];
  orders.forEach(o => {
    csv.push([o.sku, o.tableNumber, o.totalAmount, o.waiterName, o.orderStatus]);
  });
  
  const csvContent = csv.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders-${new Date().toISOString()}.csv`;
  a.click();
};

export const exportOrdersToPDF = (orders) => {
  const doc = new jsPDF();
  doc.autoTable({
    head: [['Order', 'Table', 'Total', 'Waiter']],
    body: orders.map(o => [o.sku, o.tableNumber, o.totalAmount, o.waiterName])
  });
  doc.save(`orders-${new Date().toISOString()}.pdf`);
};
```

---

### 10. Staff Schedule Management

```
src/pages/SchedulePage.jsx (NEW)
├─ Weekly calendar
├─ Shift assignments
├─ Availability tracking
└─ Shift swap requests
```

---

### 11. Analytics Enhancements

```javascript
// Advanced charts
├─ Revenue forecast
├─ Peak hours heatmap
├─ Staff performance ranking
├─ Customer retention
└─ Feedback sentiment analysis
```

---

## 🛠️ CODE QUALITY IMPROVEMENTS

### 1. Type Safety (TypeScript)

```bash
npm install --save-dev typescript @types/react @types/node
```

**Migrate to `.ts` files gradually:**

```typescript
// Before: orderAPI.js
export const orderAPI = { ... }

// After: orderAPI.ts
interface Order {
  id: string;
  sku: number;
  orderStatus: 1 | 2 | 3;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  productName: string;
  count: number;
  priceAtTime: number;
}

export const orderAPI = {
  getAll: async (): Promise<Order[]> => { ... },
  getById: async (id: string): Promise<Order> => { ... }
};
```

---

### 2. Comprehensive Logging

```javascript
// src/utils/logger.js (NEW)
export const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data),
  error: (msg, error) => console.error(`[ERROR] ${msg}`, error),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data),
  debug: (msg, data) => {
    if (import.meta.env.DEV) console.debug(`[DEBUG] ${msg}`, data);
  }
};
```

---

### 3. E2E Testing

```bash
npm install --save-dev cypress
```

**Example test:**
```javascript
// cypress/e2e/login.cy.js
describe('Login Flow', () => {
  it('should login successfully', () => {
    cy.visit('/login');
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

---

## 📈 PERFORMANCE OPTIMIZATIONS

### 1. Code Splitting

```javascript
// Before
import AnalyticsPage from './pages/AnalyticsPage';

// After
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

<Suspense fallback={<LoadingSpinner />}>
  <AnalyticsPage />
</Suspense>
```

### 2. Image Optimization

```bash
npm install sharp
```

### 3. Bundle Analysis

```bash
npm install --save-dev rollup-plugin-visualizer
```

---

## 🗒️ IMPLEMENTATION ROADMAP

**Phase 1 (Week 1-2): Critical Fixes**
- [ ] Fix Categories API typo
- [ ] Complete Orders API methods
- [ ] Create CategoriesPage
- [ ] Add Global Error Boundary

**Phase 2 (Week 3-4): Core Features**
- [ ] Implement PWA offline support
- [ ] Add Kitchen Display System
- [ ] Integrate payment system
- [ ] Real-time order updates (SignalR)

**Phase 3 (Week 5-6): Enhancements**
- [ ] Multi-language support
- [ ] Receipt printing
- [ ] Export to CSV/PDF
- [ ] Inventory management

**Phase 4 (Week 7+): Polish & Scale**
- [ ] TypeScript migration
- [ ] Comprehensive testing (E2E)
- [ ] Performance optimization
- [ ] Analytics improvements
- [ ] Staff scheduling

---

## 💰 ESTIMATED DEVELOPMENT TIME

| Category | Hours |
|----------|-------|
| P1 Fixes | 3-4 |
| P1 Features | 15-18 |
| P2 Features | 10-12 |
| P3 Features | 5-8 |
| Testing & QA | 8-10 |
| **TOTAL** | **45-52 hours** |

---

## 📞 BACKEND CONFIRMATIONS NEEDED

1. ✅ `/Category/UpdateCategory` endpoint name (currently typo: `/UpdateCatigory`)
2. ✅ `/Order/ChangeStatus` endpoint exists & works
3. ✅ `/Order/ChangeTable` endpoint exists & works
4. ✅ `/Order/PrintCashier` endpoint for receipt printing
5. ✅ `/Analytics/Dashboard` metrics endpoint
6. ✅ SignalR hub URL & events (`OrderCreated`, `OrderUpdated`)
7. ✅ Payment gateway API documentation (Click.uz or Payme)
8. ✅ Add `capacity` field to Table model (currently localStorage)
9. ✅ Add `stock` field to Product model (for inventory)
10. ✅ Add `schedule` endpoints for staff management

---

## 📖 DOCUMENTATION TO UPDATE

- [ ] API Documentation (Swagger/OpenAPI)
- [ ] Installation Guide
- [ ] Deployment Guide
- [ ] User Manual (Uzbek + Russian)
- [ ] Developer Guide (Architecture, patterns)
- [ ] Contributing Guidelines
