import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  Users, UtensilsCrossed, Table2, Grid3x3,
  ShoppingCart, DollarSign, TrendingUp, Award, Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../api/users';
import { productAPI } from '../api/products';
import { tableAPI } from '../api/tables';
import { categoryAPI } from '../api/categories';
import { analyticsAPI } from '../api/analytics';
import PeriodFilter from '../components/PeriodFilter';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt    = (n) => (n || 0).toLocaleString('uz-UZ');
const fmtMoney = (n) => `${fmt(Math.round(n || 0))} so'm`;

const COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16'];

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, gradient, sub }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
      </div>
      <div className={`w-14 h-14 shrink-0 ml-3 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
    </div>
  </div>
);

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, metric }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.fill }}>
          {p.name}: {metric === 'revenue' ? fmtMoney(p.value) : fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

// ─── WAITER VIEW ─────────────────────────────────────────────────────────────
function WaiterView({ user }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics', 'waiters', 'daily'],
    queryFn: () => analyticsAPI.getWaiters({ period: 'Daily' }),
    refetchInterval: 30_000,
  });

  const myStats = stats?.orderRankings?.find(
    (w) => w.waiterId === user?.id || w.waiterId === user?.nameid
  );

  return (
    <div className="p-4 sm:p-8 bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Afitsant Paneli</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Bugungi statistika — {user?.name || 'Ofitsant'}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400 py-10">
          <Loader2 size={20} className="animate-spin" /> Yuklanmoqda...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            icon={ShoppingCart}
            label="Bugungi buyurtmalar"
            value={fmt(myStats?.totalOrders ?? 0)}
            gradient="from-blue-500 to-blue-600"
            sub={`Reyting: #${myStats?.rank ?? '—'}`}
          />
          <StatCard
            icon={DollarSign}
            label="Bugungi umumiy summa"
            value={fmtMoney(myStats?.totalRevenue ?? 0)}
            gradient="from-emerald-500 to-emerald-600"
          />
        </div>
      )}
    </div>
  );
}

// ─── CASHIER VIEW ─────────────────────────────────────────────────────────────
function CashierView({ user }) {
  const [filter, setFilter] = useState({ period: 'Daily', startDate: null, endDate: null });
  const customReady = filter.period !== 'Custom' || (!!filter.startDate && !!filter.endDate);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics', 'waiters', filter],
    queryFn: () => analyticsAPI.getWaiters(filter),
    enabled: customReady,
    refetchInterval: 30_000,
  });

  const rankings = stats?.orderRankings ?? [];
  const totalOrders  = rankings.reduce((s, w) => s + (w.totalOrders ?? 0), 0);
  const totalRevenue = rankings.reduce((s, w) => s + (w.totalRevenue ?? 0), 0);

  const chartData = rankings.map((w) => ({
    name: w.waiterName || '—',
    Buyurtmalar: w.totalOrders ?? 0,
    Daromad: w.totalRevenue ?? 0,
  }));

  return (
    <div className="p-4 sm:p-8 bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kassir Paneli</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Xush kelibsiz, {user?.name}!</p>
        </div>
        <PeriodFilter filter={filter} onChange={setFilter} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard
          icon={ShoppingCart}
          label="Jami yakunlangan buyurtmalar"
          value={fmt(totalOrders)}
          gradient="from-indigo-500 to-indigo-600"
        />
        <StatCard
          icon={DollarSign}
          label="Jami daromad"
          value={fmtMoney(totalRevenue)}
          gradient="from-emerald-500 to-emerald-600"
        />
      </div>

      {/* Waiters breakdown */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Ofitsantlar kesimida</h2>

        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
            <Loader2 size={18} className="animate-spin" /> Yuklanmoqda...
          </div>
        ) : rankings.length === 0 ? (
          <p className="text-sm text-center text-gray-400 py-8">Ma'lumot yo'q</p>
        ) : (
          <>
            {/* Bar Chart */}
            <div style={{ width: '100%', height: 240 }} className="mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip content={<CustomTooltip metric="orders" />} />
                  <Bar dataKey="Buyurtmalar" name="Buyurtmalar" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Ofitsant</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Buyurtmalar</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Daromad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {rankings.map((w, i) => (
                    <tr key={w.waiterId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-gray-400">#{w.rank ?? i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{w.waiterName || '—'}</td>
                      <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">{fmt(w.totalOrders)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{fmtMoney(w.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── ADMIN: WAITER BAR CHART SECTION ─────────────────────────────────────────
function WaiterBarChartSection() {
  const [filter, setFilter] = useState({ period: 'Daily', startDate: null, endDate: null });
  const [selectedWaiter, setSelectedWaiter] = useState(null);
  const [metric, setMetric] = useState('orders'); // 'orders' | 'revenue'

  const customReady = filter.period !== 'Custom' || (!!filter.startDate && !!filter.endDate);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics', 'waiters', filter],
    queryFn: () => analyticsAPI.getWaiters(filter),
    enabled: customReady,
  });

  const rankings = stats?.orderRankings ?? [];

  const chartData = (selectedWaiter
    ? rankings.filter((w) => w.waiterId === selectedWaiter)
    : rankings
  ).map((w) => ({
    name: w.waiterName || '—',
    Buyurtmalar: w.totalOrders ?? 0,
    Daromad: w.totalRevenue ?? 0,
  }));

  const selectedStats = rankings.find((w) => w.waiterId === selectedWaiter);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mt-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Ofitsantlar samaradorligi</h3>
          <p className="text-xs text-gray-400 mt-0.5">Buyurtmalar soni va daromad kesimida</p>
        </div>
        <PeriodFilter filter={filter} onChange={setFilter} />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Metric toggle */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 text-xs">
          <button
            onClick={() => setMetric('orders')}
            className={`px-3 py-2 font-semibold transition-colors ${
              metric === 'orders'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            Buyurtmalar soni
          </button>
          <button
            onClick={() => setMetric('revenue')}
            className={`px-3 py-2 font-semibold transition-colors ${
              metric === 'revenue'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            Daromad
          </button>
        </div>

        {/* Waiter selector */}
        <select
          value={selectedWaiter ?? ''}
          onChange={(e) => setSelectedWaiter(e.target.value || null)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800
                     text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Barcha ofitsantlar</option>
          {rankings.map((w) => (
            <option key={w.waiterId} value={w.waiterId}>{w.waiterName}</option>
          ))}
        </select>
      </div>

      {/* Selected waiter detail cards */}
      {selectedWaiter && selectedStats && (
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="rounded-xl border border-indigo-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 p-4">
            <p className="text-xs text-indigo-500 font-medium mb-1">Buyurtmalar</p>
            <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{fmt(selectedStats.totalOrders)}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
            <p className="text-xs text-emerald-500 font-medium mb-1">Daromad</p>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{fmtMoney(selectedStats.totalRevenue)}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {!customReady ? (
        <p className="text-sm text-center text-gray-400 py-10">Sanalarni tanlang va Qo'llash bosing</p>
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-gray-400 py-10 justify-center">
          <Loader2 size={18} className="animate-spin" /> Yuklanmoqda...
        </div>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-center text-gray-400 py-10">Ma'lumot yo'q</p>
      ) : (
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickFormatter={metric === 'revenue' ? (v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v : undefined}
              />
              <Tooltip content={<CustomTooltip metric={metric} />} />
              <Legend />
              {metric === 'orders' ? (
                <Bar dataKey="Buyurtmalar" name="Buyurtmalar soni" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              ) : (
                <Bar dataKey="Daromad" name="Daromad (so'm)" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const role = user?.role; // 1=Admin, 2=Waiter, 3=Cashier

  // ── Waiter view ──
  if (role === 2) return <WaiterView user={user} />;

  // ── Cashier view ──
  if (role === 3) return <CashierView user={user} />;

  // ── Admin stats ──
  const { data: users = [],      isLoading: usersLoading }      = useQuery({ queryKey: ['users'],      queryFn: userAPI.getAll });
  const { data: products = [],   isLoading: productsLoading }   = useQuery({ queryKey: ['products'],   queryFn: productAPI.getAll });
  const { data: tables = [],     isLoading: tablesLoading }     = useQuery({ queryKey: ['tables'],     queryFn: tableAPI.getAll });
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({ queryKey: ['categories'], queryFn: categoryAPI.getAll });

  const stats = [
    { label: 'Xodimlar',      value: users.length,      icon: Users,           color: 'from-blue-500 to-blue-600',   loading: usersLoading },
    { label: 'Mahsulotlar',   value: products.length,   icon: UtensilsCrossed, color: 'from-orange-500 to-amber-600',loading: productsLoading },
    { label: 'Stollar',       value: tables.length,     icon: Table2,          color: 'from-green-500 to-green-600', loading: tablesLoading },
    { label: 'Kategoriyalar', value: categories.length, icon: Grid3x3,         color: 'from-purple-500 to-purple-600',loading: categoriesLoading },
  ];

  return (
    <div className="p-4 sm:p-8 bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Xush kelibsiz, {user?.name || 'Admin'}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.loading ? '—' : stat.value}
                  </p>
                </div>
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Tezkor harakatlar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Xodim qo'shish",      icon: Users,           path: '/users' },
            { label: "Mahsulot qo'shish",   icon: UtensilsCrossed, path: '/products' },
            { label: "Stol qo'shish",       icon: Table2,          path: '/tables' },
            { label: "Kategoriya qo'shish", icon: Grid3x3,         path: '/categories' },
          ].map(({ label, icon: Icon, path }) => (
            <button key={path} onClick={() => navigate(path)}
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl
                         hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10
                         transition-all text-left">
              <Icon className="w-6 h-6 text-gray-500 dark:text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Waiter Bar Chart */}
      <WaiterBarChartSection />
    </div>
  );
}
