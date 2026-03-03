import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../api/analytics';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { useState } from 'react';
import {
  ShoppingCart, DollarSign, TrendingUp,
  Clock, Percent,
  Loader2, AlertCircle,
} from 'lucide-react';
import PeriodFilter from './PeriodFilter';

const fmt = (n) => (n || 0).toLocaleString('ru-RU');
const fmtPrice = (n) => `${fmt(Math.round(n || 0))} so'm`;
const fmtPct = (n) => `${((n || 0) * 100).toFixed(1)}%`;

const formatDuration = (str) => {
  // "HH:MM:SS" → "2 s 30 d"
  if (!str || str === '00:00:00') return '—';
  const [h, m] = str.split(':').map(Number);
  if (h > 0) return `${h} soat ${m} daqiqa`;
  return `${m} daqiqa`;
};

const formatDateRange = (start, end) => {
  if (!start) return null;
  const d = (s) => new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${d(start)} — ${d(end)}`;
};

// ── Stat card ──────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className={`flex items-start gap-4 p-5 rounded-2xl border ${color.bg} ${color.border}`}>
    <div className={`p-3 rounded-xl ${color.icon}`}>
      <Icon size={20} className={color.iconText} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className={`text-xl font-bold truncate ${color.text}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── Section wrapper ────────────────────────────────────────────────────────────
const Section = ({ title, sub, children }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="mb-4">
      <p className="text-base font-bold text-gray-900 dark:text-white">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
    {children}
  </div>
);

// ── Loading / error ────────────────────────────────────────────────────────────
const LoadingBox = () => (
  <div className="flex items-center justify-center gap-2 text-gray-400 py-10">
    <Loader2 size={20} className="animate-spin" />
    <span className="text-sm">Yuklanmoqda...</span>
  </div>
);
const ErrorBox = ({ msg = "Ma'lumot yuklanmadi" }) => (
  <div className="flex items-center justify-center gap-2 text-red-400 py-10">
    <AlertCircle size={16} />
    <span className="text-sm">{msg}</span>
  </div>
);
const EmptyBox = () => (
  <p className="text-sm text-center text-gray-400 py-10">Ma'lumot yo'q</p>
);

// ── MAIN ───────────────────────────────────────────────────────────────────────
export default function AnalyticsPanel() {
  const [filter, setFilter] = useState({ period: 'Weekly', startDate: null, endDate: null });

  const customReady = filter.period !== 'Custom' || (!!filter.startDate && !!filter.endDate);
  const toArr = (d) => (Array.isArray(d) ? d : []);

  // Orders — { totalOrders, totalRevenue, averageOrderValue, startDate, endDate }
  const {
    data: ordersStats,
    isLoading: ordersLoading,
    error: ordersError,
  } = useQuery({
    queryKey: ['analytics', 'orders', filter],
    queryFn: () => analyticsAPI.getOrders(filter),
    enabled: customReady,
  });

  // Top products — array
  const {
    data: productsData = [],
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ['analytics', 'products', filter],
    queryFn: () => analyticsAPI.getTopProducts({ ...filter, topCount: 5 }),
    enabled: customReady,
    select: toArr,
  });

  // Tables — { tables:[], averageOccupancyRate, averageTableDuration, startDate, endDate }
  const {
    data: tablesStats,
    isLoading: tablesLoading,
    error: tablesError,
  } = useQuery({
    queryKey: ['analytics', 'tables', filter],
    queryFn: () => analyticsAPI.getTables(filter),
    enabled: customReady,
  });

  const tablesArr = Array.isArray(tablesStats?.tables) ? tablesStats.tables : [];

  const orderDateRange = ordersStats ? formatDateRange(ordersStats.startDate, ordersStats.endDate) : null;

  return (
    <div className="mt-6 space-y-5">

      {/* ── PERIOD FILTER ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl px-5 py-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Analitika</h3>
          <PeriodFilter filter={filter} onChange={setFilter} />
        </div>
      </div>

      {!customReady ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center text-sm text-gray-400 border border-gray-100 dark:border-gray-700">
          Sanalarni tanlang va <span className="font-semibold">Qo'llash</span> bosing
        </div>
      ) : (
        <>
          {/* ── ORDERS ── */}
          <Section title="Buyurtmalar" sub={orderDateRange}>
            {ordersLoading ? <LoadingBox /> : ordersError ? <ErrorBox /> : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard
                  icon={ShoppingCart}
                  label="Jami buyurtmalar"
                  value={fmt(ordersStats?.totalOrders)}
                  color={{
                    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
                    border: 'border-indigo-100 dark:border-indigo-800',
                    icon: 'bg-indigo-100 dark:bg-indigo-900/40',
                    iconText: 'text-indigo-600 dark:text-indigo-400',
                    text: 'text-indigo-700 dark:text-indigo-300',
                  }}
                />
                <StatCard
                  icon={DollarSign}
                  label="Jami daromad"
                  value={fmtPrice(ordersStats?.totalRevenue)}
                  color={{
                    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                    border: 'border-emerald-100 dark:border-emerald-800',
                    icon: 'bg-emerald-100 dark:bg-emerald-900/40',
                    iconText: 'text-emerald-600 dark:text-emerald-400',
                    text: 'text-emerald-700 dark:text-emerald-300',
                  }}
                />
                <StatCard
                  icon={TrendingUp}
                  label="O'rtacha buyurtma"
                  value={fmtPrice(ordersStats?.averageOrderValue)}
                  color={{
                    bg: 'bg-amber-50 dark:bg-amber-900/20',
                    border: 'border-amber-100 dark:border-amber-800',
                    icon: 'bg-amber-100 dark:bg-amber-900/40',
                    iconText: 'text-amber-600 dark:text-amber-400',
                    text: 'text-amber-700 dark:text-amber-300',
                  }}
                />
              </div>
            )}
          </Section>

          {/* ── TABLES ── */}
          <Section
            title="Stollar bandligi"
            sub={tablesStats ? formatDateRange(tablesStats.startDate, tablesStats.endDate) : null}
          >
            {tablesLoading ? <LoadingBox /> : tablesError ? <ErrorBox msg="Stollar yuklanmadi" /> : (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  <StatCard
                    icon={Percent}
                    label="O'rtacha band bo'lish darajasi"
                    value={fmtPct(tablesStats?.averageOccupancyRate)}
                    color={{
                      bg: 'bg-violet-50 dark:bg-violet-900/20',
                      border: 'border-violet-100 dark:border-violet-800',
                      icon: 'bg-violet-100 dark:bg-violet-900/40',
                      iconText: 'text-violet-600 dark:text-violet-400',
                      text: 'text-violet-700 dark:text-violet-300',
                    }}
                  />
                  <StatCard
                    icon={Clock}
                    label="O'rtacha stol vaqti"
                    value={formatDuration(tablesStats?.averageTableDuration)}
                    color={{
                      bg: 'bg-cyan-50 dark:bg-cyan-900/20',
                      border: 'border-cyan-100 dark:border-cyan-800',
                      icon: 'bg-cyan-100 dark:bg-cyan-900/40',
                      iconText: 'text-cyan-600 dark:text-cyan-400',
                      text: 'text-cyan-700 dark:text-cyan-300',
                    }}
                  />
                </div>

                {/* Tables bar chart */}
                {tablesArr.length === 0 ? (
                  <EmptyBox />
                ) : (
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tablesArr}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="tableNumber" tick={{ fontSize: 11 }} label={{ value: 'Stol', position: 'insideBottomRight', offset: 0, fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v, name) => name === 'occupancyRate' ? `${(v * 100).toFixed(1)}%` : v} />
                        <Bar dataKey="orderCount" name="Buyurtmalar" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </Section>

          {/* ── TOP PRODUCTS ── */}
          <Section title="Top 5 mahsulotlar">
            {productsLoading ? <LoadingBox /> : productsError ? <ErrorBox msg="Mahsulotlar yuklanmadi" /> : (
              productsData.length === 0 ? <EmptyBox /> : (
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Soni" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )
            )}
          </Section>
        </>
      )}
    </div>
  );
}
