# 🚀 TEZKOR HARAKATLAR REJASI

## 🔴 DARHOL FIX QILISH KERAK (Bu soat ichida)

### Issue #1: OrderDetailModal - Undefined OrderStatus.Finished
**File:** `src/components/OrderDetailModal.jsx` (Lines 84, 117)  
**Problem:** `OrderStatus` enum-da `Finished` va `Cancelled` yo'q  
**Current Code:**
```javascript
status === OrderStatus.Finished  // ❌ XATO
status === OrderStatus.Cancelled  // ❌ XATO
```
**Solution:** Orders API-ni tekshir, backend da bu status kodlari nima?  
**Estimated Time:** 15 min  
**Difficulty:** 🟡 Easy

---

### Issue #2: Category API - JSON Serialization Bug
**File:** `src/api/categories.js` (Line 11-17)  
**Problem:** Create method text string'ni JSON qiladi, object bo'lishi kerak  
**Current Code:**
```javascript
create: async (text) => {
  const response = await axiosClient.post(
    '/Category/AddCategory',
    JSON.stringify(text),  // ❌ String JSON qiladi
  );
}
```
**Fix:**
```javascript
create: async ({ name }) => {
  const response = await axiosClient.post(
    '/Category/AddCategory',
    { name },  // ✅ Object yuboradi, axios jsonify qiladi
  );
}
```
**Estimated Time:** 10 min  
**Difficulty:** 🟢 Very Easy

---

### Issue #3: Missing Categories Route
**File:** `src/App.jsx`  
**Problem:** CategoriesPage.jsx mavjud lekin route yoq  
**Add this route:**
```javascript
<Route
  path="/categories"
  element={
    <ProtectedRoute permission="Categories_Read">
      <CategoriesPage />
    </ProtectedRoute>
  }
/>
```
**Estimated Time:** 5 min  
**Difficulty:** 🟢 Very Easy

---

### Issue #4: Missing Order API Methods
**File:** `src/api/orders.js`  
**Problem:** `changeStatus()` va `changeTable()` methods chaqiriladi lekin yoq  
**Add to orderAPI object:**
```javascript
/**
 * Buyurtma statusini o'zgartirishh
 * PATCH /Order/UpdateStatus/{orderId}?status={status}
 */
changeStatus: async (orderId, status) => {
  const res = await api.patch(
    `/Order/UpdateStatus/${orderId}`,
    null,
    { params: { status } }
  );
  return res.data;
},

/**
 * Buyurtma stolini o'zgartirishh
 * PATCH /Order/ChangeTable/{orderId}?tableId={tableId}
 */
changeTable: async (orderId, tableId) => {
  const res = await api.patch(
    `/Order/ChangeTable/${orderId}`,
    null,
    { params: { tableId } }
  );
  return res.data;
},
```
**Note:** Backend endpoint'larni backend developerga tasdiqlat!  
**Estimated Time:** 10 min + 30 min backend confirmation  
**Difficulty:** 🟠 Medium

---

## 🟠 SHUNGA O'XSH MUHIMLIKDA (Bugun)

### Issue #5: Category API Typo
**File:** `src/api/categories.js` (Line 18)  
**Typo:** `UpdateCatigory` → `UpdateCategory`?  
**Check:** Backend endpoint nima? `/Category/UpdateCatigory` yoki `/Category/UpdateCategory`?  
**If typo:** Fix endpoint name  
**Fix code if needed:**
```javascript
update: async ({ id, name }) => {
  const response = await axiosClient.put(
    '/Category/UpdateCategory',  // Typo'ni tuzat
    { id, name }
  );
  return response.data;
}
```
**Estimated Time:** 5 min  
**Difficulty:** 🟢 Easy

---

### Issue #6: Remove Duplicate AdminLayout
**File:** `src/pages/AdminLayout.jsx`  
**Status:** Ishlatilmamoqda, `AppLayout.jsx` bor  
**Action:** O'chirish kerak  
**Command:**
```bash
rm src/pages/AdminLayout.jsx
```
**Estimated Time:** 1 min  
**Difficulty:** 🟢 Very Easy

---

## 🟡 MEDIUM PRIORITY (Bu hafta)

### Issue #7: Add Missing Functions to OrderDetailModal
**Problems:**
- Order status change functionality
- Print order functionality

**Incomplete print handler:**
```javascript
// src/components/OrderViewModal.jsx, Line 64
<button className="...">
  <Printer size={18} />
  Chop etish
</button>
// ❌ onClick handler yoq!
```

**Add:**
```javascript
const handlePrint = () => {
  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write('<html><head><title>Buyurtma Chop</title></head><body>');
  printWindow.document.write(`<h1>Buyurtma #${order.sku}</h1>`);
  printWindow.document.write(`<p>Status: ${ORDER_STATUS_LABELS[order.orderStatus]}</p>`);
  // Add more details...
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.print();
};
```

---

### Issue #8: Improve User Dashboard
**Current:** Static data, hardcoded numbers  
**Needed:** 
```javascript
const { data: stats } = useQuery({
  queryKey: ['dashboard-stats'],
  queryFn: async () => {
    const [users, products, tables, categories] = await Promise.all([
      userAPI.getAll(),
      productAPI.getAll(),
      tableAPI.getAll(),
      categoryAPI.getAll(),
    ]);
    return {
      users: users.length,
      products: products.length,
      tables: tables.length,
      categories: categories.length,
    };
  },
});
```

---

### Issue #9: Add Order API Endpoints to Types
**File:** `src/types.js`  
**Add JSDoc types:**
```javascript
/**
 * @typedef {Object} OrderStatusChangeRequest
 * @property {number} status - 1=Tayyorlanmoqda, 2=Yetkazildi, 3=To'landi
 */

/**
 * @typedef {Object} ChangeTableRequest
 * @property {string} tableId - Table UUID
 */
```

---

## 📋 TESTING CHECKLIST

### Before Production:
- [ ] Login/Logout test
- [ ] Admin panel - users CRUD
- [ ] Product upload with image
- [ ] Category CRUD
- [ ] Table status changes
- [ ] POS order creation
- [ ] Order status changes
- [ ] Logout at 401 (expired token)
- [ ] Dark mode toggle
- [ ] Mobile responsive test

---

## 📊 TIMELINE ESTIMATE

| Task | Duration | Priority |
|------|----------|----------|
| Fix OrderDetailModal undefined | 15 min | 🔴 Critical |
| Fix Category API JSON | 10 min | 🔴 Critical |
| Add categories route | 5 min | 🔴 Critical |
| Add order API methods | 30-45 min | 🔴 Critical |
| Fix Category typo | 5 min | 🟠 High |
| Remove AdminLayout | 1 min | 🟠 High |
| Add print functionality | 1 hour | 🟠 High |
| Dashboard real data | 1-2 hours | 🟠 High |
| **TOTAL** | **~3-4 hours** | - |

---

## 💻 QUICK FIX COMMANDS

```bash
# 1. Yangilash kerak API calls
# Fayl: src/api/categories.js
# - JSON.stringify(text) → { name: text }
# - "/Category/UpdateCatigory" → "/Category/UpdateCategory"

# 2. Yangilash kerak routes
# Fayl: src/App.jsx
# + Add /categories route

# 3. O'chirish kerak
# rm src/pages/AdminLayout.jsx

# 4. Qo'shish kerak
# Fayl: src/api/orders.js
# + changeStatus() method
# + changeTable() method

# 5. TEST
npm run dev
# Login qil → Test har bir page
```

---

## 🔗 BACKEND ENDPOINTS TO CONFIRM

**Backend developer ga tasdiqlat:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/Order/UpdateStatus/{orderId}?status=x` | PATCH | Change order status |
| `/Order/ChangeTable/{orderId}?tableId=x` | PATCH | Change order table |
| `/Category/AddCategory` | POST | Add category (check if expects `name` or other property) |
| `/Category/UpdateCategory` | PUT | Update category (check endpoint name - typo?) |
| `/Category/UpdateCatigory` | PUT | Is this the real endpoint with typo? |

---

## ✅ TEST AFTER FIXES

```javascript
// Test 1: Categories mendment
navigate('/categories');  // Route should work
// Add category, edit, delete

// Test 2: Orders
// Open order detail modal
// Try to change status
// Error should not occur

// Test 3: POS Terminal
// Create new order
// Try to change its status
// Confirm it works
```

---

## 📞 NEXT STEPS

1. **Frontend fixes** (Today): 3-4 soat
2. **Backend confirmation** (Today-Tomorrow): API endpoints confirm
3. **Integration testing** (Tomorrow): All CRUD operations
4. **User testing** (Tomorrow): QA team
5. **Deploy to production** (Next day)

---

**Last Updated:** 2026-02-20  
**Status:** Ready for implementation
