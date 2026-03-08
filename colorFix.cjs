const fs = require('fs');
const files = [
  'src/pages/OrdersPage.jsx',
  'src/pages/AdminDashboard.jsx',
  'src/pages/UsersPage.jsx',
  'src/pages/MenuPage.jsx',
  'src/pages/TablesPage.jsx',
  'src/pages/POSTerminal.jsx',
  'src/pages/AnalyticsPage.jsx',
  'src/pages/ProductsPage.jsx',
  'src/components/OrderDetailModal.jsx',
  'src/components/ConfirmModal.jsx',
  'src/components/TablesGrid.jsx',
  'src/components/AnalyticsPanel.jsx',
  'src/components/ProductAnalyticsPanel.jsx',
  'src/components/PeriodFilter.jsx',
];

const replacements = [
  [/bg-gray-50/g,  'bg-slate-50'],
  [/bg-gray-100/g, 'bg-slate-100'],
  [/bg-gray-200/g, 'bg-slate-200'],
  [/bg-gray-300/g, 'bg-slate-300'],
  [/bg-gray-400/g, 'bg-slate-400'],
  [/bg-gray-500/g, 'bg-slate-500'],
  [/bg-gray-600/g, 'bg-slate-600'],
  [/bg-gray-700/g, 'bg-slate-700'],
  [/bg-gray-800/g, 'bg-slate-800'],
  [/bg-gray-900/g, 'bg-slate-900'],
  [/bg-gray-950/g, 'bg-slate-950'],
  [/text-gray-50/g,  'text-slate-50'],
  [/text-gray-100/g, 'text-slate-100'],
  [/text-gray-200/g, 'text-slate-200'],
  [/text-gray-300/g, 'text-slate-300'],
  [/text-gray-400/g, 'text-slate-400'],
  [/text-gray-500/g, 'text-slate-500'],
  [/text-gray-600/g, 'text-slate-600'],
  [/text-gray-700/g, 'text-slate-700'],
  [/text-gray-800/g, 'text-slate-800'],
  [/text-gray-900/g, 'text-slate-900'],
  [/border-gray-50/g,  'border-slate-50'],
  [/border-gray-100/g, 'border-slate-100'],
  [/border-gray-200/g, 'border-slate-200'],
  [/border-gray-300/g, 'border-slate-300'],
  [/border-gray-400/g, 'border-slate-400'],
  [/border-gray-500/g, 'border-slate-500'],
  [/border-gray-600/g, 'border-slate-600'],
  [/border-gray-700/g, 'border-slate-700'],
  [/border-gray-800/g, 'border-slate-800'],
  [/border-gray-900/g, 'border-slate-900'],
  [/ring-gray-(\d+)/g, 'ring-slate-$1'],
  [/bg-brand-50/g,  'bg-lazzat-50'],
  [/bg-brand-100/g, 'bg-lazzat-100'],
  [/bg-brand-200/g, 'bg-lazzat-200'],
  [/bg-brand-300/g, 'bg-lazzat-300'],
  [/bg-brand-400/g, 'bg-lazzat-400'],
  [/bg-brand-500/g, 'bg-lazzat-500'],
  [/bg-brand-600/g, 'bg-lazzat-600'],
  [/bg-brand-700/g, 'bg-lazzat-700'],
  [/bg-brand-800/g, 'bg-lazzat-800'],
  [/bg-brand-900/g, 'bg-lazzat-900'],
  [/text-brand-50/g,  'text-lazzat-50'],
  [/text-brand-100/g, 'text-lazzat-100'],
  [/text-brand-200/g, 'text-lazzat-200'],
  [/text-brand-300/g, 'text-lazzat-300'],
  [/text-brand-400/g, 'text-lazzat-400'],
  [/text-brand-500/g, 'text-lazzat-500'],
  [/text-brand-600/g, 'text-lazzat-600'],
  [/text-brand-700/g, 'text-lazzat-700'],
  [/border-brand-(\d+)/g, 'border-lazzat-$1'],
  [/ring-brand-(\d+)/g, 'ring-lazzat-$1'],
  [/focus:border-brand-(\d+)/g, 'focus:border-lazzat-$1'],
  [/focus:ring-brand-(\d+)/g, 'focus:ring-lazzat-$1'],
  [/hover:bg-brand-(\d+)/g, 'hover:bg-lazzat-$1'],
  [/hover:text-brand-(\d+)/g, 'hover:text-lazzat-$1'],
  [/hover:border-brand-(\d+)/g, 'hover:border-lazzat-$1'],
];

let totalChanges = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changes = 0;
  for (const [regex, replacement] of replacements) {
    const matches = content.match(regex);
    if (matches) {
      changes += matches.length;
      content = content.replace(regex, replacement);
    }
  }
  if (changes > 0) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(file + ': ' + changes + ' changes');
    totalChanges += changes;
  }
}
console.log('\nTotal: ' + totalChanges + ' changes across ' + files.length + ' files');
