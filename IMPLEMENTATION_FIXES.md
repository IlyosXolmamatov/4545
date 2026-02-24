# ✏️ TUZATISH UCHUN TOG'RI KOD (Copy-Paste Ready)

## Fix #1: Category Create API - JSON Bug

**File:** `src/api/categories.js`  
**Lines:** 8-17  

### ❌ WRONG (Current)
```javascript
// 2. CREATE (Qo'shish)
create: async (text) => {
  const response = await axiosClient.post(
    '/Category/AddCategory',
    JSON.stringify(text),  // ❌ BAD: Stringifying text directly
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
},
```

### ✅ CORRECT (Fixed)
```javascript
// 2. CREATE (Qo'shish)
create: async (data) => {
  const response = await axiosClient.post(
    '/Category/AddCategory',
    { name: typeof data === 'string' ? data : data.name },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
},
```

**Alternative (Cleaner):**
```javascript
create: async ({ name }) => {
  const response = await axiosClient.post(
    '/Category/AddCategory',
    { name },
  );
  return response.data;
},
```

**Then update MenuPage.jsx where it's called (Line ~130):**
```javascript
// Old: saveMutation.mutate(name)
// New: saveMutation.mutate({ name })
```

---

## Fix #2: Category Update API - Typo Check

**File:** `src/api/categories.js`  
**Lines:** 18-24  

### Current Code
```javascript
update: async ({ id, name }) => {
  const response = await axiosClient.put('/Category/UpdateCatigory', {
    id: id,
    name: name,
  });
  return response.data;
},
```

### ✅ FIX (if typo confirmed)
```javascript
update: async ({ id, name }) => {
  const response = await axiosClient.put('/Category/UpdateCategory', {  // Typo fixed
    id,  // Simplified
    name,
  });
  return response.data;
},
```

**IMPORTANT:** First confirm with backend developer if endpoint is:
- `/Category/UpdateCategory` (correct spelling)
- `/Category/UpdateCatigory` (backend has typo)

---

## Fix #3: Add Missing Order API Methods

**File:** `src/api/orders.js`  
**Add after line ~120** (at end of orderAPI object):

```javascript
  /**
   * Buyurtma statusini o'zgartirishh
   * PATCH /Order/UpdateStatus/{orderId}?status={status}
   * @param {string} orderId
   * @param {number} status - 1=Tayyorlanmoqda, 2=Yetkazildi, 3=To'landi
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
   * Buyurtma stolini o'zgartirivsh
   * PATCH /Order/ChangeTable/{orderId}?tableId={tableId}
   * @param {string} orderId
   * @param {string} tableId - table UUID
   */
  changeTable: async (orderId, tableId) => {
    const res = await api.patch(
      `/Order/ChangeTable/${orderId}`,
      null,
      { params: { tableId } }
    );
    return res.data;
  },

  /**
   * Buyurtma itemini bekor qilish
   * PATCH /Order/CancelItem/{orderId}/items/cancel?productId=x
   */
  cancelItem: async (orderId, productId, reason = '') => {
    const res = await api.patch(
      `/Order/CancelItem/${orderId}/items/cancel`,
      null,
      { params: { productId, ...(reason && { reason }) } }
    );
    return res.data;
  },
```

**IMPORTANT:** Confirm backend endpoints first!

---

## Fix #4: Add Categories Route to App.jsx

**File:** `src/App.jsx`  
**Add between lines 63-70** (after Orders route):

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

**Full context:**
```javascript
            <Route
              path="/orders"
              element={
                <ProtectedRoute permission="Order_Read">
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            
            {/* ADD HERE 👇 */}
            <Route
              path="/categories"
              element={
                <ProtectedRoute permission="Categories_Read">
                  <CategoriesPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/pos"
              element={
                <ProtectedRoute permission="Order_Create">
                  <POSTerminal />
                </ProtectedRoute>
              }
            />
```

---

## Fix #5: Fix OrderDetailModal - Undefined OrderStatus

**File:** `src/components/OrderDetailModal.jsx`

### Problem at Lines 84 & 117
```javascript
// Line 84
status === OrderStatus.Finished  // ❌ undefined

// Line 117  
if (status === OrderStatus.Finished || status === OrderStatus.Cancelled)
```

### Solution Options:

**Option A: Use numeric status (recommended)**
```javascript
// Replace OrderStatus.Finished with 3 (or whatever backend uses)
// Replace OrderStatus.Cancelled with appropriate number

// Line 84:
if (status === 3) { ... }  // 3 = To'landi / Completed

// Line 117:
if (status === 3 || status === -1) { ... }  // If -1 is cancelled
```

**Option B: Add to OrderStatus enum in orders.js**
```javascript
// src/api/orders.js
export const OrderStatus = {
  1: 'Tayyorlanmoqda',
  2: 'Yetkazildi',
  3: "To'landi",
  0: 'Bekor qilindi',    // Add if needed
  "-1": 'Bekor qilindi',  // Or negative
};

// Then use: status === 3 or status === OrderStatus[3]
```

**Option C: Check with backend**
Ask backend developer:
- Is there a "Finished" or "Completed" status?
- Is there a "Cancelled" status?
- What are their numeric codes?

### Temporary Fix (safest)
```javascript
// Line 84 - Change from:
if (status === OrderStatus.Finished || status === OrderStatus.Cancelled) onClose();

// To:
if (status === 3 || status === 0) onClose();  // 3 = To'landi, verify 0 or other for cancelled
```

---

## Fix #6: Remove Duplicate AdminLayout

**File:** `src/pages/AdminLayout.jsx`

### Action
```bash
# Simply delete this file:
rm src/pages/AdminLayout.jsx

# Verify it's NOT imported in:
# - App.jsx ✅ (using AppLayout instead)
# - index.jsx ✅ (no reference)
```

---

## Fix #7: Add Print Handler to OrderViewModal

**File:** `src/components/OrderViewModal.jsx`  
**Lines:** 60-70 area

### Current (No handler)
```javascript
<button className="...">
  <Printer size={18} />
  Chop etish
</button>
```

### Fixed
```javascript
<button 
  onClick={handlePrint}
  className="..."
>
  <Printer size={18} />
  Chop etish
</button>
```

### Add function before return statement
```javascript
const handlePrint = () => {
  const printWindow = window.open('', '', 'height=600,width=800');
  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <title>Buyurtma Chop</title>
      <style>
        body { font-family: Arial; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .info { margin: 10px 0; }
        .items { margin: 20px 0; }
        .item { padding: 10px; border-bottom: 1px solid #ccc; }
        .total { font-weight: bold; font-size: 18px; margin-top: 20px; text-align: right; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>Buyurtma #${current.sku}</h2>
        <p>${ORDER_STATUS_LABELS[current.orderStatus] ?? 'Noma\'lum'}</p>
      </div>
      <div class="info">
        <p><strong>Stol:</strong> ${tableNum ? `#${tableNum}` : 'TakeOut'}</p>
        <p><strong>Ofitsant:</strong> ${waiterName}</p>
        <p><strong>Vaqti:</strong> ${formatDate(createdAt)}</p>
      </div>
      <div class="items">
        <h3>Mahsulotlar:</h3>
        ${current.items?.map(item => `
          <div class="item">
            <p>${item.productName} × ${item.count} = ${(item.price * item.count).toLocaleString()} so'm</p>
          </div>
        `).join('') ?? ''}
      </div>
      <div class="total">
        Jami: ${(current.totalAmount || 0).toLocaleString()} so'm
      </div>
    </body>
    </html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 250);
};
```

---

## Fix #8: Update Dashboard with Real Data

**File:** `src/pages/AdminDashboard.jsx`  
**Lines:** 1-30

### Current (Hardcoded)
```javascript
const stats = [
  {
    label: 'Xodimlar',
    value: '12',  // ❌ Hardcoded
    // ...
  },
  {
    label: 'Mahsulotlar',
    value: '156',  // ❌ Hardcoded
    // ...
  },
];
```

### Fixed with Query
```javascript
import { useQuery } from '@tanstack/react-query';
import { userAPI } from '../api/users';
import { productAPI } from '../api/products';
import { tableAPI } from '../api/tables';
import { categoryAPI } from '../api/categories';

export default function AdminDashboard() {
  const { user } = useAuthStore();

  // Fetch all data in parallel
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: userAPI.getAll,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productAPI.getAll,
  });

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: tableAPI.getAll,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryAPI.getAll,
  });

  const stats = [
    {
      label: 'Xodimlar',
      value: users.length.toString(),  // ✅ Dynamic
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Mahsulotlar',
      value: products.length.toString(),  // ✅ Dynamic
      icon: UtensilsCrossed,
      color: 'from-orange-500 to-amber-600'
    },
    {
      label: 'Stollar',
      value: tables.length.toString(),  // ✅ Dynamic
      icon: Table2,
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Kategoriyalar',
      value: categories.length.toString(),  // ✅ Dynamic
      icon: Grid3x3,
      color: 'from-purple-500 to-purple-600'
    },
  ];

  // Rest of component...
```

---

## Validation: Quick Test After Fixes

```javascript
// Test 1: Can add category
1. Navigate to /products
2. Click "Kategoriya qo'shish"
3. Enter name: "Test"
4. Submit
   Expected: ✅ Category added
   Result: _____

// Test 2: Can access categories page
1. Click menu → Categories
2. Expected: Page loads
   Result: _____

// Test 3: Order operations
1. Create an order in POS
2. Open it from Orders page
3. Try to change status
   Expected: ✅ No crash
   Result: _____

4. Try to change table
   Expected: ✅ No crash
   Result: _____

// Test 4: Print
1. Click "Chop etish" button on order
   Expected: ✅ Print dialog opens
   Result: _____
```

---

## Implementation Checklist

### Phase 1: Critical Fixes (1 hour)
- [ ] Fix categories.js create() JSON bug
- [ ] Add changeStatus() & changeTable() to orders.js
- [ ] Add /categories route to App.jsx
- [ ] Test all three fixes

### Phase 2: High Priority (2-3 hours)
- [ ] Fix categories.js typo (UpdateCatigory)
- [ ] Fix OrderDetailModal undefined refs
- [ ] Add print handler
- [ ] Remove AdminLayout.jsx
- [ ] Test all operations

### Phase 3: Enhancement (2-4 hours)
- [ ] Update dashboard with real data
- [ ] Add form validation
- [ ] Improve error messages
- [ ] Test on mobile

### Phase 4: QA & Testing (4-8 hours)
- [ ] Full CRUD testing for all entities
- [ ] Permission testing
- [ ] Error case testing
- [ ] Performance check
- [ ] Mobile responsiveness

---

**Ready to implement?** Start with Phase 1! 🚀
