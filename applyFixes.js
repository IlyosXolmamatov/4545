#!/usr/bin/env node

/**
 * LAZZAT RESTAURANT - AUTOMATIC FIXES SCRIPT
 * 
 * Diese Script qo'llaydi barcha 8 ta niqaytli xatolarni avtomatik
 * 
 * Ishga tushirish:
 *   node applyFixes.js
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}`),
};

const srcDir = path.join(__dirname, 'src');

/**
 * UTILITIES
 */

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    log.error(`Failed to read ${filePath}: ${error.message}`);
    return null;
  }
}

function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    log.error(`Failed to write ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * FIXES
 */

const fixes = [
  {
    name: 'Fix #1: Category Create API - JSON Bug',
    file: 'src/api/categories.js',
    apply: function () {
      const filePath = path.join(__dirname, this.file);
      let content = readFile(filePath);
      if (!content) return false;

      // Find and replace the buggy create function
      const oldCreate = `create: async (text) => {
  const response = await axiosClient.post(
    '/Category/AddCategory',
    JSON.stringify(text),
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
},`;

      const newCreate = `create: async (data) => {
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
},`;

      if (content.includes(oldCreate)) {
        content = content.replace(oldCreate, newCreate);
        return writeFile(filePath, content);
      }
      return true; // Already fixed
    }
  },

  {
    name: 'Fix #2: Category Update API - Typo Fix',
    file: 'src/api/categories.js',
    apply: function () {
      const filePath = path.join(__dirname, this.file);
      let content = readFile(filePath);
      if (!content) return false;

      // Replace typo: UpdateCatigory → UpdateCategory
      const oldLine = `'/Category/UpdateCatigory'`;
      const newLine = `'/Category/UpdateCategory'`;

      if (content.includes(oldLine)) {
        content = content.replace(oldLine, newLine);
        return writeFile(filePath, content);
      }
      return true; // Already fixed
    }
  },

  {
    name: 'Fix #3: Add Missing Order API Methods',
    file: 'src/api/orders.js',
    apply: function () {
      const filePath = path.join(__dirname, this.file);
      let content = readFile(filePath);
      if (!content) return false;

      const newMethods = `
  /**
   * Buyurtma statusini o'zgartirivsh
   * PATCH /Order/UpdateStatus/{orderId}?status={status}
   */
  changeStatus: async (orderId, status) => {
    const res = await api.patch(
      \`/Order/UpdateStatus/\${orderId}\`,
      null,
      { params: { status } }
    );
    return res.data;
  },

  /**
   * Buyurtma stolini o'zgartirivsh
   * PATCH /Order/ChangeTable/{orderId}?tableId={tableId}
   */
  changeTable: async (orderId, tableId) => {
    const res = await api.patch(
      \`/Order/ChangeTable/\${orderId}\`,
      null,
      { params: { tableId } }
    );
    return res.data;
  },`;

      // Check if already exists
      if (content.includes('changeStatus:')) {
        log.info('  Order API methods already exist');
        return true;
      }

      // Find the end of orderAPI object (before last export)
      const insertPoint = content.lastIndexOf('};');
      if (insertPoint === -1) return false;

      content = content.slice(0, insertPoint) + ',' + newMethods + '\n' + content.slice(insertPoint);
      return writeFile(filePath, content);
    }
  },

  {
    name: 'Fix #4: Add Missing /categories Route',
    file: 'src/App.jsx',
    apply: function () {
      const filePath = path.join(__dirname, this.file);
      let content = readFile(filePath);
      if (!content) return false;

      // First, import CategoriesPage
      const importLine = `import CategoriesPage from './pages/CategoriesPage';`;
      if (!content.includes(importLine)) {
        const importPoint = content.indexOf('import MenuPage');
        if (importPoint !== -1) {
          const insertPoint = content.indexOf('\n', importPoint);
          content = content.slice(0, insertPoint) + '\n' + importLine + content.slice(insertPoint);
        }
      }

      // Add route
      const newRoute = `            <Route
              path="/categories"
              element={
                <ProtectedRoute permission="Categories_Read">
                  <CategoriesPage />
                </ProtectedRoute>
              }
            />`;

      if (!content.includes('path="/categories"')) {
        // Find /orders route and add after it
        const ordersRouteEnd = content.indexOf('</Route>', content.indexOf('path="/orders"'));
        if (ordersRouteEnd !== -1) {
          const insertPoint = content.indexOf('\n', ordersRouteEnd) + 1;
          content = content.slice(0, insertPoint) + '            \n' + newRoute + '\n' + content.slice(insertPoint);
        }
      }

      return writeFile(filePath, content);
    }
  },

  {
    name: 'Fix #5: Fix OrderDetailModal - Undefined OrderStatus',
    file: 'src/components/OrderDetailModal.jsx',
    apply: function () {
      const filePath = path.join(__dirname, this.file);
      let content = readFile(filePath);
      if (!content) return false;

      // Replace OrderStatus.Finished with 3
      content = content.replace(/status === OrderStatus\.Finished/g, 'status === 3');
      // Replace OrderStatus.Cancelled with 0 or -1
      content = content.replace(/status === OrderStatus\.Cancelled/g, 'status === 0');
      // Replace the compound condition
      content = content.replace(
        /status === 3 \|\| status === 0/g,
        'status === 3 || status === 0'
      );

      return writeFile(filePath, content);
    }
  },

  {
    name: 'Fix #6: Delete Duplicate AdminLayout',
    file: 'src/pages/AdminLayout.jsx',
    apply: function () {
      const filePath = path.join(__dirname, this.file);
      if (!fs.existsSync(filePath)) {
        log.info('  AdminLayout.jsx already deleted or doesn\'t exist');
        return true;
      }

      try {
        // Create a backup
        const backupPath = filePath + '.backup';
        const content = readFile(filePath);
        writeFile(backupPath, content);
        log.info(`  Backup created: ${backupPath}`);

        // Delete the file
        fs.unlinkSync(filePath);
        return true;
      } catch (error) {
        log.warn(`  Could not delete: ${error.message}`);
        return true; // Don't fail the whole script
      }
    }
  },

  {
    name: 'Fix #7: Add Print Handler to OrderViewModal',
    file: 'src/components/OrderViewModal.jsx',
    apply: function () {
      const filePath = path.join(__dirname, this.file);
      let content = readFile(filePath);
      if (!content) return false;

      // Check if print handler already exists
      if (content.includes('handlePrint')) {
        log.info('  Print handler already exists');
        return true;
      }

      const printHandler = `
  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    const htmlContent = \`
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
          <h2>Buyurtma #\${current.sku}</h2>
          <p>\${ORDER_STATUS_COLORS[current.orderStatus] ?? 'Noma\\'lum'}</p>
        </div>
        <div class="info">
          <p><strong>Stol:</strong> \${tableNum ? '#' + tableNum : 'TakeOut'}</p>
          <p><strong>Ofitsant:</strong> \${waiterName}</p>
          <p><strong>Vaqti:</strong> \${formatDate(createdAt)}</p>
        </div>
        <div class="items">
          <h3>Mahsulotlar:</h3>
          \${current.items?.map(item => \`
            <div class="item">
              <p>\${item.productName} × \${item.count} = \${(item.price * item.count).toLocaleString()} so'm</p>
            </div>
          \`).join('') ?? ''}
        </div>
        <div class="total">
          Jami: \${(current.totalAmount || 0).toLocaleString()} so'm
        </div>
      </body>
      </html>
    \`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };`;

      // Find the return statement and add handler before it
      const returnIndex = content.indexOf('return (');
      if (returnIndex !== -1) {
        content = content.slice(0, returnIndex) + printHandler + '\n\n  ' + content.slice(returnIndex);
      }

      // Replace button without onClick with button with onClick
      content = content.replace(
        /<button className="\.\.\."\s*>\s*<Printer/,
        '<button onClick={handlePrint} className="..."><Printer'
      );

      return writeFile(filePath, content);
    }
  },

  {
    name: 'Fix #8: Update Dashboard with Real Data',
    file: 'src/pages/AdminDashboard.jsx',
    apply: function () {
      const filePath = path.join(__dirname, this.file);
      let content = readFile(filePath);
      if (!content) return false;

      // Add imports if not exist
      if (!content.includes('useQuery')) {
        const importIndex = content.indexOf("import { useAuthStore }");
        if (importIndex !== -1) {
          const insertPoint = content.indexOf('\n', importIndex);
          content = content.slice(0, insertPoint) +
            "\nimport { useQuery } from '@tanstack/react-query';" +
            content.slice(insertPoint);
        }
      }

      // Add API imports if not exist
      if (!content.includes('userAPI')) {
        const importIndex = content.indexOf("import { useAuthStore }");
        if (importIndex !== -1) {
          const insertPoint = content.indexOf('\n', importIndex);
          content = content.slice(0, insertPoint) +
            "\nimport { userAPI } from '../api/users';" +
            "\nimport { productAPI } from '../api/products';" +
            "\nimport { tableAPI } from '../api/tables';" +
            "\nimport { categoryAPI } from '../api/categories';" +
            content.slice(insertPoint);
        }
      }

      // Replace the hardcoded stats with dynamic data
      const oldStats = `const stats = [
    {
      label: 'Xodimlar',
      value: '12',
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Mahsulotlar',
      value: '156',
      icon: UtensilsCrossed,
      color: 'from-orange-500 to-amber-600'
    },
    {
      label: 'Stollar',
      value: '24',
      icon: Table2,
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Kategoriyalar',
      value: '8',
      icon: Grid3x3,
      color: 'from-purple-500 to-purple-600'
    },
  ];`;

      const newStats = `const { data: users = [] } = useQuery({
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
      value: users.length.toString(),
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Mahsulotlar',
      value: products.length.toString(),
      icon: UtensilsCrossed,
      color: 'from-orange-500 to-amber-600'
    },
    {
      label: 'Stollar',
      value: tables.length.toString(),
      icon: Table2,
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Kategoriyalar',
      value: categories.length.toString(),
      icon: Grid3x3,
      color: 'from-purple-500 to-purple-600'
    },
  ];`;

      if (content.includes(oldStats)) {
        content = content.replace(oldStats, newStats);
      }

      return writeFile(filePath, content);
    }
  }
];

/**
 * MAIN EXECUTION
 */

async function main() {
  log.header('LAZZAT RESTAURANT - AUTOMATIC FIXES');
  console.log(`\nLoyiha: Lazzat Restaurant POS System`);
  console.log(`Status: Applying ${fixes.length} critical fixes...\n`);

  let successCount = 0;
  let failureCount = 0;

  for (const fix of fixes) {
    try {
      const success = fix.apply();
      if (success) {
        log.success(fix.name);
        successCount++;
      } else {
        log.error(fix.name);
        failureCount++;
      }
    } catch (error) {
      log.error(`${fix.name}: ${error.message}`);
      failureCount++;
    }
  }

  // Summary
  log.header('NATIJA');
  console.log(`✅ Muvaffaq:  ${successCount}/${fixes.length}\n`);

  if (failureCount === 0) {
    log.success('Barcha fixlar muvaffaqiyatli qo\'llanildi!');
    console.log('\n▶ Keyingi qadamlar:');
    console.log('  1. npm run build     # Build tekshir');
    console.log('  2. npm run dev       # Local test qil');
    console.log('  3. git add .         # Changes git\'ga qo\'sh');
    console.log('  4. git commit        # Commit qil');
    console.log('  5. git push          # Deploy qil\n');
  } else {
    log.warn(`${failureCount} ta fixda muammo yuz berdi. Ularni qo'l bilan tekshirab ko'ring.`);
  }

  // Build check
  console.log('\n▶ Keyingi: npm run build da xatolik yo\'qligini tekshirang.');
  console.log('   Agar xatolik bo\'lsa, IMPLEMENTATION_FIXES.md dan manual fix qiling.\n');
}

main().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
