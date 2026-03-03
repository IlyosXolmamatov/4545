import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../api/analytics';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useState, useMemo } from 'react';
import { BarChart2, BarChartHorizontal, TrendingUp, PieChart as PieIcon, Table2, Download, ChevronUp, ChevronDown } from 'lucide-react';
import PeriodFilter from './PeriodFilter';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6'];

const val = (row, ...keys) => {
  for (const k of keys) if (row[k] !== undefined && row[k] !== null) return row[k];
  return 0;
};
const nameOf = (row) => row.name || row.productName || row.label || '—';

const fmtMoney = (v) => {
  if (v === undefined || v === null) return '—';
  return Number(v).toLocaleString('uz-UZ') + " so'm";
};
const fmtNum = (v) => {
  if (v === undefined || v === null) return '—';
  return Number(v).toLocaleString('uz-UZ');
};

const TABS = [
  { id: 'revenue', label: 'Daromad',  icon: BarChart2 },
  { id: 'sold',    label: 'Sotilgan', icon: BarChartHorizontal },
  { id: 'price',   label: 'Narx',     icon: TrendingUp },
  { id: 'share',   label: 'Ulush',    icon: PieIcon },
  { id: 'table',   label: 'Jadval',   icon: Table2 },
];

function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {fmtMoney(p.value)}</p>
      ))}
    </div>
  );
}

function CountTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {fmtNum(p.value)}</p>
      ))}
    </div>
  );
}

function RevenueChart({ data }) {
  const chartData = data.map((r) => ({
    name: nameOf(r),
    Daromad: val(r, 'totalRevenue', 'revenue', 'count'),
  }));
  return (
    <div style={{ width: '100%', height: 320, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} angle={-35} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
          <Tooltip content={<MoneyTooltip />} />
          <Bar dataKey="Daromad" radius={[4, 4, 0, 0]}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SoldChart({ data }) {
  const chartData = [...data]
    .sort((a, b) => val(b, 'totalQuantitySold', 'count') - val(a, 'totalQuantitySold', 'count'))
    .map((r) => ({ name: nameOf(r), Sotilgan: val(r, 'totalQuantitySold', 'count') }));
  const barH = Math.max(260, chartData.length * 36);
  return (
    <div style={{ width: '100%', height: barH, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 40, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
          <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11, fill: '#6b7280' }} />
          <Tooltip content={<CountTooltip />} />
          <Bar dataKey="Sotilgan" radius={[0, 4, 4, 0]}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PriceChart({ data }) {
  const hasPrice = data.some((r) => r.averagePrice !== undefined || r.price !== undefined);
  const chartData = data.map((r) => ({ name: nameOf(r), Narx: val(r, 'averagePrice', 'price') }));

  if (hasPrice) {
    return (
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 8, right: 16, left: 16, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" name="Mahsulot" tick={{ fontSize: 11, fill: '#6b7280' }} angle={-35} textAnchor="end" />
            <YAxis dataKey="Narx" name="Narx" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => fmtNum(v)} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<MoneyTooltip />} />
            <Scatter data={chartData} fill="#6366f1" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }
  return (
    <div style={{ width: '100%', height: 320, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} angle={-35} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
          <Tooltip content={<MoneyTooltip />} />
          <Line type="monotone" dataKey="Narx" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ShareChart({ data }) {
  const total = data.reduce((s, r) => s + val(r, 'totalRevenue', 'revenue', 'count'), 0);
  const pieData = data.map((r) => ({
    name: nameOf(r),
    value: val(r, 'totalRevenue', 'revenue', 'count'),
  }));
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.04) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };
  return (
    <div style={{ width: '100%', height: 360, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={130} dataKey="value" labelLine={false} label={renderLabel}>
            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(value, name) => [fmtMoney(value) + ` (${total ? ((value / total) * 100).toFixed(1) : 0}%)`, name]} />
          <Legend formatter={(value) => <span className="text-gray-700 dark:text-gray-300 text-xs">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function DataTable({ data }) {
  const [sortKey, setSortKey] = useState('totalRevenue');
  const [sortDir, setSortDir] = useState('desc');
  const [filter, setFilter]   = useState('');

  const columns = [
    { key: 'name',              label: 'Mahsulot' },
    { key: 'totalRevenue',      label: "Daromad (so'm)" },
    { key: 'totalQuantitySold', label: 'Sotilgan (dona)' },
    { key: 'averagePrice',      label: "O'rtacha narx" },
  ];

  const rows = useMemo(() => {
    const filtered = data.filter((r) => nameOf(r).toLowerCase().includes(filter.toLowerCase()));
    return [...filtered].sort((a, b) => {
      if (sortKey === 'name') {
        const av = nameOf(a).toLowerCase(), bv = nameOf(b).toLowerCase();
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const av = val(a, sortKey, 'count'), bv = val(b, sortKey, 'count');
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [data, sortKey, sortDir, filter]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const exportCSV = () => {
    const header = columns.map((c) => c.label).join(',');
    const body = rows.map((r) => [
      `"${nameOf(r)}"`,
      val(r, 'totalRevenue', 'revenue', 'count'),
      val(r, 'totalQuantitySold', 'count'),
      val(r, 'averagePrice', 'price'),
    ].join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'product_analytics.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 text-gray-300 dark:text-gray-600" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-indigo-500" />
      : <ChevronDown className="w-3 h-3 text-indigo-500" />;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text" placeholder="Mahsulot qidirish..." value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <Download className="w-4 h-4" /> CSV
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              {columns.map((col) => (
                <th key={col.key} onClick={() => toggleSort(col.key)}
                  className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 select-none whitespace-nowrap">
                  <span className="flex items-center gap-1">{col.label}<SortIcon col={col.key} /></span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">Ma'lumot topilmadi</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{nameOf(r)}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{fmtMoney(val(r, 'totalRevenue', 'revenue', 'count'))}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{fmtNum(val(r, 'totalQuantitySold', 'count'))}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{fmtMoney(val(r, 'averagePrice', 'price'))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 text-right">{rows.length} ta mahsulot</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProductAnalyticsPanel() {
  const [activeTab, setActiveTab] = useState('revenue');
  const [filter, setFilter] = useState({ period: 'Weekly', startDate: null, endDate: null });

  const customReady = filter.period !== 'Custom' || (!!filter.startDate && !!filter.endDate);

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['analytics', 'product-stats', filter],
    queryFn: () => analyticsAPI.getProductStats(filter),
    enabled: customReady,
    select: (d) => (Array.isArray(d) ? d : []),
  });

  return (
    <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Mahsulot Analitikasi</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Daromad, sotilgan miqdor va narx statistikasi</p>
        </div>
        <PeriodFilter filter={filter} onChange={setFilter} />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>
              <Icon className="w-4 h-4" />{tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {!customReady ? (
        <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-sm">
          Boshlanish va tugash sanasini tanlang, so'ng Qo'llash bosing
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-sm">
          Yuklanmoqda...
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center h-48 text-red-400 text-sm">
          Ma'lumotlarni yuklashda xatolik
        </div>
      ) : !data || data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-sm">
          Hozircha ma'lumot yo'q
        </div>
      ) : (
        <>
          {activeTab === 'revenue' && <RevenueChart data={data} />}
          {activeTab === 'sold'    && <SoldChart data={data} />}
          {activeTab === 'price'   && <PriceChart data={data} />}
          {activeTab === 'share'   && <ShareChart data={data} />}
          {activeTab === 'table'   && <DataTable data={data} />}
        </>
      )}
    </div>
  );
}
