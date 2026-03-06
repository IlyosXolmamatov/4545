import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderAPI } from '../api/orders';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
  ComposedChart, Line, Area,
} from 'recharts';
import {
  ShoppingCart, DollarSign, TrendingUp, Users,
  Table2, Percent, Clock, Loader2, AlertCircle,
  BarChart2, Zap, UtensilsCrossed, ShoppingBag,
} from 'lucide-react';
import { analyticsAPI } from '../api/analytics';
import PeriodFilter from '../components/PeriodFilter';
import ProductAnalyticsPanel from '../components/ProductAnalyticsPanel';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt      = (n) => (n || 0).toLocaleString('uz-UZ');
const fmtMoney = (n) => `${fmt(Math.round(n || 0))} so'm`;
const fmtPct   = (n) => `${((n || 0) * 100).toFixed(1)}%`;
const fmtDur   = (s) => {
  if (!s || s === '00:00:00') return '—';
  const [h, m] = s.split(':').map(Number);
  if (h > 0) return `${h} s ${m} d`;
  return `${m} daqiqa`;
};
const fmtDateRange = (start, end) => {
  if (!start) return '';
  const d = (v) => new Date(v).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${d(start)} — ${d(end)}`;
};

const COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#14b8a6'];

// ─── Loading / Error ──────────────────────────────────────────────────────────
const Loading = () => (
  <div className="flex items-center justify-center gap-2 text-gray-400 py-12">
    <Loader2 size={20} className="animate-spin" />
    <span className="text-sm">Yuklanmoqda...</span>
  </div>
);
const getErrMsg = (err) => {
  const d = err?.response?.data;
  if (typeof d === 'string' && d.length < 300) return d;
  if (d?.message) return d.message;
  if (d?.title)   return d.title;
  return "Ma'lumot yuklanmadi";
};

const ErrorBox = ({ error }) => (
  <div className="flex items-center justify-center gap-2 text-red-400 py-12">
    <AlertCircle size={16} className="shrink-0" />
    <span className="text-sm text-center">{getErrMsg(error)}</span>
  </div>
);
const Empty = () => (
  <p className="text-sm text-center text-gray-400 py-12">Ma'lumot yo'q</p>
);

// ─── Section ─────────────────────────────────────────────────────────────────
const Section = ({ title, sub, icon: Icon, children }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex items-center gap-3 mb-5">
      {Icon && (
        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
          <Icon size={17} className="text-indigo-600 dark:text-indigo-400" />
        </div>
      )}
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
    {children}
  </div>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className={`rounded-xl p-4 border ${color.bg} ${color.border}`}>
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color.icon}`}>
        <Icon size={16} className={color.iconText} />
      </div>
      <div>
        <p className={`text-xs font-medium ${color.text} opacity-70`}>{label}</p>
        <p className={`text-lg font-bold ${color.text}`}>{value}</p>
      </div>
    </div>
  </div>
);

// ─── ORDERS SECTION ───────────────────────────────────────────────────────────
const SC_RATE = 0.15;

function OrdersSection({ filter }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['analytics', 'orders', filter],
    queryFn: () => analyticsAPI.getOrders(filter),
  });

  const { data: allOrders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderAPI.getAll(),
  });

  const stats = useMemo(() => {
    const zero = { count: 0, base: 0, charge: 0, total: 0 };
    if (!data?.startDate || !allOrders.length) return { dineIn: zero, dineInWith: zero, dineInWithout: zero, takeOut: zero, grandCharge: 0, grandTotal: 0, totalCount: 0 };

    const start = new Date(data.startDate);
    const end   = new Date(data.endDate);
    end.setHours(23, 59, 59, 999);

    const filtered = allOrders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= start && d <= end;
    });

    const sum = (arr) => arr.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const chargeSum = (arr) => arr.reduce((s, o) => s + Math.round((o.totalAmount || 0) * SC_RATE), 0);

    const dineInAll   = filtered.filter(o => o.orderType === 1);
    const dineInWith  = dineInAll.filter(o => o.serviceCharge === true);
    const dineInNo    = dineInAll.filter(o => o.serviceCharge !== true);
    const takeOutAll  = filtered.filter(o => o.orderType === 2);

    const dineInWithBase   = sum(dineInWith);
    const dineInWithCharge = chargeSum(dineInWith);

    return {
      totalCount:     filtered.length,
      dineIn:         { count: dineInAll.length,  base: sum(dineInAll),  charge: dineInWithCharge, total: sum(dineInAll) + dineInWithCharge },
      dineInWith:     { count: dineInWith.length, base: dineInWithBase,  charge: dineInWithCharge, total: dineInWithBase + dineInWithCharge },
      dineInWithout:  { count: dineInNo.length,   base: sum(dineInNo),   charge: 0,                total: sum(dineInNo) },
      takeOut:        { count: takeOutAll.length,  base: sum(takeOutAll), charge: 0,                total: sum(takeOutAll) },
      grandCharge:    dineInWithCharge,
      grandTotal:     sum(filtered) + dineInWithCharge,
    };
  }, [allOrders, data]);

  return (
    <Section title="Buyurtmalar" sub={data ? fmtDateRange(data.startDate, data.endDate) : ''} icon={ShoppingCart}>
      {isLoading ? <Loading /> : isError ? <ErrorBox error={error} /> : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tur</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Soni</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Asosiy summa</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-rose-400 uppercase tracking-wide">Xizmat haqqi</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Jami</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">

              {/* ── Ichida ── */}
              <tr className="bg-white dark:bg-gray-900 font-semibold">
                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">🍴 Ichida (Dine In)</td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                    {fmt(stats.dineIn.count)} ta
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{fmtMoney(stats.dineIn.base)}</td>
                <td className="px-4 py-3 text-right text-rose-500 font-semibold">
                  {stats.dineIn.charge > 0 ? `+${fmtMoney(stats.dineIn.charge)}` : '—'}
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{fmtMoney(stats.dineIn.total)}</td>
              </tr>

              {/* ── Ichida → Xizmat haqqili (sub-row) ── */}
              <tr className="bg-violet-50/50 dark:bg-violet-950/20 text-xs">
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-px bg-gray-300 dark:bg-gray-600 inline-block" />
                    Xizmat haqqili
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                    {fmt(stats.dineInWith.count)} ta
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right text-gray-500 dark:text-gray-400">{fmtMoney(stats.dineInWith.base)}</td>
                <td className="px-4 py-2.5 text-right text-rose-500 font-semibold">
                  {stats.dineInWith.charge > 0 ? `+${fmtMoney(stats.dineInWith.charge)}` : '—'}
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-gray-700 dark:text-gray-300">{fmtMoney(stats.dineInWith.total)}</td>
              </tr>

              {/* ── Ichida → Xizmat haqqisiz (sub-row) ── */}
              <tr className="bg-gray-50/50 dark:bg-gray-800/30 text-xs">
                <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-px bg-gray-300 dark:bg-gray-600 inline-block" />
                    Xizmat haqqisiz
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    {fmt(stats.dineInWithout.count)} ta
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right text-gray-500 dark:text-gray-400">{fmtMoney(stats.dineInWithout.base)}</td>
                <td className="px-4 py-2.5 text-right text-gray-400">—</td>
                <td className="px-4 py-2.5 text-right font-semibold text-gray-700 dark:text-gray-300">{fmtMoney(stats.dineInWithout.total)}</td>
              </tr>

              {/* ── Olib ketish ── */}
              <tr className="bg-white dark:bg-gray-900 font-semibold">
                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">🛍 Olib ketish (Take Out)</td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                    {fmt(stats.takeOut.count)} ta
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{fmtMoney(stats.takeOut.base)}</td>
                <td className="px-4 py-3 text-right text-gray-400">—</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">{fmtMoney(stats.takeOut.total)}</td>
              </tr>

              {/* ── Xizmat haqqi jami ── */}
              <tr className="bg-rose-50 dark:bg-rose-950/30 border-t-2 border-rose-200 dark:border-rose-800">
                <td colSpan={3} className="px-4 py-3 text-rose-600 dark:text-rose-400 font-semibold text-sm">
                  Jami xizmat haqqi (15%)
                </td>
                <td colSpan={2} className="px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-400 text-base">
                  {fmtMoney(stats.grandCharge)}
                </td>
              </tr>

              {/* ── Grand total ── */}
              <tr className="bg-indigo-600 dark:bg-indigo-700">
                <td className="px-4 py-3.5 text-white font-bold">Umumiy jami</td>
                <td className="px-3 py-3.5 text-center">
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                    {fmt(stats.totalCount)} ta
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right text-indigo-200 font-semibold">{fmtMoney(stats.grandTotal - stats.grandCharge)}</td>
                <td className="px-4 py-3.5 text-right text-rose-300 font-semibold">+{fmtMoney(stats.grandCharge)}</td>
                <td className="px-4 py-3.5 text-right text-white font-black text-base">{fmtMoney(stats.grandTotal)}</td>
              </tr>

            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

// ─── WAITERS SECTION ──────────────────────────────────────────────────────────
const WaiterTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-3 shadow-xl text-sm min-w-[180px]">
      <p className="font-bold text-gray-900 dark:text-white mb-2 border-b border-gray-100 dark:border-gray-700 pb-1.5">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Buyurtmalar:</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{fmt(d?.Buyurtmalar)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Daromad:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmtMoney(d?.Daromad)}</span>
        </div>
        {d?.rank && (
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Reyting:</span>
            <span className="font-semibold text-amber-600">#{d.rank}</span>
          </div>
        )}
      </div>
    </div>
  );
};

function WaitersSection({ filter }) {
  const [metric, setMetric] = useState('orders');

  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['analytics', 'waiters', filter],
    queryFn: () => analyticsAPI.getWaiters(filter),
  });

  const rankings = stats?.orderRankings ?? [];
  const chartData = rankings.map((w) => ({
    name: w.waiterName || '—',
    Buyurtmalar: w.totalOrders ?? 0,
    Daromad: w.totalRevenue ?? 0,
    rank: w.rank,
  }));

  return (
    <Section title="Ofitsantlar samaradorligi" icon={Users}>
      {/* Metric toggle */}
      <div className="flex gap-2 mb-5">
        {[
          { id: 'orders',  label: 'Buyurtmalar soni' },
          { id: 'revenue', label: 'Daromad' },
        ].map((m) => (
          <button key={m.id} onClick={() => setMetric(m.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              metric === m.id
                ? 'bg-indigo-600 text-white border-transparent'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-transparent hover:border-indigo-300'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {isLoading ? <Loading /> : isError ? <ErrorBox error={error} /> : chartData.length === 0 ? <Empty /> : (
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickFormatter={metric === 'revenue' ? (v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v : undefined}
              />
              <Tooltip content={<WaiterTooltip />} />
              <Bar
                dataKey={metric === 'orders' ? 'Buyurtmalar' : 'Daromad'}
                name={metric === 'orders' ? 'Buyurtmalar soni' : "Daromad (so'm)"}
                radius={[5, 5, 0, 0]}
              >
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Section>
  );
}

// ─── TABLES SECTION — Custom Tooltip ─────────────────────────────────────────
const TableTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-3 shadow-xl text-sm min-w-[200px]">
      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-100 dark:border-gray-700">
        <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
          <Table2 size={12} className="text-violet-600 dark:text-violet-400" />
        </div>
        <p className="font-bold text-gray-900 dark:text-white">Stol #{label}</p>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between gap-6">
          <span className="text-gray-500 dark:text-gray-400">Buyurtmalar:</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{fmt(d?.totalOrders)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-gray-500 dark:text-gray-400">Daromad:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmtMoney(d?.totalRevenue)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-gray-500 dark:text-gray-400">Band bo'lish:</span>
          <span className="font-semibold text-amber-600 dark:text-amber-400">{fmtPct(d?.occupancyRate)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-gray-500 dark:text-gray-400">O'rt. vaqt:</span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">{fmtDur(d?.averageOccupancyDuration)}</span>
        </div>
      </div>
    </div>
  );
};

function TablesSection({ filter }) {
  const [metric, setMetric] = useState('orders');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['analytics', 'tables', filter],
    queryFn: () => analyticsAPI.getTables(filter),
  });

  const tables = data?.tables ?? [];
  const chartData = [...tables].sort((a, b) => a.tableNumber - b.tableNumber);

  return (
    <Section title="Stollar bandligi" sub={data ? fmtDateRange(data.startDate, data.endDate) : ''} icon={Table2}>
      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <StatCard
            label="O'rtacha band bo'lish"
            value={fmtPct(data.averageOccupancyRate)}
            icon={Percent}
            color={{ bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-100 dark:border-violet-800', icon: 'bg-violet-100 dark:bg-violet-900/40', iconText: 'text-violet-600 dark:text-violet-400', text: 'text-violet-700 dark:text-violet-300' }}
          />
          <StatCard
            label="O'rtacha stol vaqti"
            value={fmtDur(data.averageTableDuration)}
            icon={Clock}
            color={{ bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-100 dark:border-cyan-800', icon: 'bg-cyan-100 dark:bg-cyan-900/40', iconText: 'text-cyan-600 dark:text-cyan-400', text: 'text-cyan-700 dark:text-cyan-300' }}
          />
        </div>
      )}

      {/* Metric toggle */}
      <div className="flex gap-2 mb-5">
        {[
          { id: 'orders',      label: 'Buyurtmalar' },
          { id: 'revenue',     label: 'Daromad' },
          { id: 'occupancy',   label: 'Bandlik %' },
        ].map((m) => (
          <button key={m.id} onClick={() => setMetric(m.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              metric === m.id
                ? 'bg-violet-600 text-white border-transparent'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-transparent hover:border-violet-300'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {isLoading ? <Loading /> : isError ? <ErrorBox error={error} /> : chartData.length === 0 ? <Empty /> : (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="tableNumber"
                tickFormatter={(v) => `#${v}`}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickFormatter={
                  metric === 'revenue'   ? (v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v
                  : metric === 'occupancy' ? (v) => `${(v*100).toFixed(0)}%`
                  : undefined
                }
              />
              {/* Custom Tooltip */}
              <Tooltip content={<TableTooltip />} />
              <Bar
                dataKey={
                  metric === 'orders'    ? 'totalOrders'
                  : metric === 'revenue' ? 'totalRevenue'
                  : 'occupancyRate'
                }
                name={
                  metric === 'orders'    ? 'Buyurtmalar'
                  : metric === 'revenue' ? "Daromad"
                  : 'Bandlik darajasi'
                }
                radius={[5, 5, 0, 0]}
              >
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Section>
  );
}

// ─── PEAK TIME SECTION ────────────────────────────────────────────────────────
const PeakTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const h = d?.hour;
  const next = h === 23 ? 0 : (h + 1);
  const timeLabel = `${String(h).padStart(2,'0')}:00 – ${String(next).padStart(2,'0')}:00`;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-3 shadow-xl text-sm min-w-[200px]">
      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-100 dark:border-gray-700">
        <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
          <Zap size={12} className="text-amber-500" />
        </div>
        <p className="font-bold text-gray-900 dark:text-white">{timeLabel}</p>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between gap-6">
          <span className="text-gray-500 dark:text-gray-400">Buyurtmalar:</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{fmt(d?.totalOrders)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-gray-500 dark:text-gray-400">Daromad:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmtMoney(d?.totalRevenue)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-gray-500 dark:text-gray-400">Mijozlar:</span>
          <span className="font-semibold text-violet-600 dark:text-violet-400">{fmt(d?.uniqueCustomers)}</span>
        </div>
      </div>
    </div>
  );
};

function PeakTimeSection({ filter }) {
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ['analytics', 'peak-time', filter],
    queryFn: () => analyticsAPI.getPeakTime(filter),
  });

  // Eng band soat
  const peakHour = data.reduce((max, r) => (r.totalOrders > (max?.totalOrders ?? 0) ? r : max), null);

  // 06:00 dan 23:00 gacha barcha soatlar (ma'lumot bo'lmasa 0)
  const FIXED_HOURS = Array.from({ length: 18 }, (_, i) => i + 6);
  const dataMap = Object.fromEntries(data.map(r => [r.hour, r]));
  const chartData = FIXED_HOURS.map(h => ({
    ...(dataMap[h] ?? { hour: h, totalOrders: 0, totalRevenue: 0, uniqueCustomers: 0 }),
    hourLabel: `${String(h).padStart(2, '0')}:00`,
  }));

  return (
    <Section title="Eng band soatlar (Peak Time)" icon={Zap}
      sub={peakHour ? `Eng band vaqt: ${String(peakHour.hour).padStart(2,'0')}:00 – ${String(peakHour.hour === 23 ? 0 : peakHour.hour+1).padStart(2,'0')}:00` : ''}
    >
      {/* Peak stat cards */}
      {peakHour && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <StatCard
            label="Eng band soat"
            value={`${String(peakHour.hour).padStart(2,'0')}:00`}
            icon={Zap}
            color={{ bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800', icon: 'bg-amber-100 dark:bg-amber-900/40', iconText: 'text-amber-600 dark:text-amber-400', text: 'text-amber-700 dark:text-amber-300' }}
          />
          <StatCard
            label="Max buyurtmalar"
            value={fmt(peakHour.totalOrders)}
            icon={ShoppingCart}
            color={{ bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-100 dark:border-indigo-800', icon: 'bg-indigo-100 dark:bg-indigo-900/40', iconText: 'text-indigo-600 dark:text-indigo-400', text: 'text-indigo-700 dark:text-indigo-300' }}
          />
          <StatCard
            label="Max daromad"
            value={fmtMoney(peakHour.totalRevenue)}
            icon={DollarSign}
            color={{ bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800', icon: 'bg-emerald-100 dark:bg-emerald-900/40', iconText: 'text-emerald-600 dark:text-emerald-400', text: 'text-emerald-700 dark:text-emerald-300' }}
          />
        </div>
      )}

      {isLoading ? <Loading /> : isError ? <ErrorBox error={error} /> : chartData.length === 0 ? <Empty /> : (
        <div style={{ width: '100%', height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 24, left: 8, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="hourLabel"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={50}
                interval={0}
              />
              {/* Sol Y — buyurtmalar */}
              <YAxis
                yAxisId="orders"
                orientation="left"
                tick={{ fontSize: 11, fill: '#6366f1' }}
                label={{ value: 'Buyurtmalar', angle: -90, position: 'insideLeft', offset: 10, fill: '#6366f1', fontSize: 11 }}
              />
              {/* O'ng Y — daromad */}
              <YAxis
                yAxisId="revenue"
                orientation="right"
                tick={{ fontSize: 11, fill: '#10b981' }}
                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                label={{ value: "Daromad", angle: 90, position: 'insideRight', offset: 10, fill: '#10b981', fontSize: 11 }}
              />
              <Tooltip content={<PeakTooltip />} />
              <Legend />
              {/* Bar — buyurtmalar soni */}
              <Bar
                yAxisId="orders"
                dataKey="totalOrders"
                name="Buyurtmalar"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                opacity={0.85}
              >
                {chartData.map((r, i) => (
                  <Cell
                    key={i}
                    fill={r.hour === peakHour?.hour ? '#f59e0b' : '#6366f1'}
                  />
                ))}
              </Bar>
              {/* Line — daromad */}
              <Line
                yAxisId="revenue"
                type="monotone"
                dataKey="totalRevenue"
                name="Daromad"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3, fill: '#10b981' }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Section>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'orders',    label: 'Buyurtmalar',  icon: ShoppingCart },
  { id: 'waiters',   label: 'Ofitsantlar',  icon: Users },
  { id: 'tables',    label: 'Stollar',      icon: Table2 },
  { id: 'peaktime',  label: 'Peak Time',    icon: Zap },
  { id: 'products',  label: 'Mahsulotlar',  icon: BarChart2 },
];

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('orders');
  const [filter, setFilter] = useState({ period: 'Weekly', startDate: null, endDate: null });
  const customReady = filter.period !== 'Custom' || (!!filter.startDate && !!filter.endDate);

  return (
    <div className="p-4 sm:p-8 bg-gray-50 dark:bg-gray-950 min-h-screen">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analitika</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Restoran to'liq statistikasi</p>
      </div>

      {/* Period Filter */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl px-5 py-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Davr tanlash</p>
          <PeriodFilter filter={filter} onChange={setFilter} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {!customReady ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center text-gray-400 border border-gray-100 dark:border-gray-700">
          Sanalarni tanlang va <span className="font-semibold text-indigo-500">Qo'llash</span> bosing
        </div>
      ) : (
        <div>
          {activeTab === 'orders'   && <OrdersSection   filter={filter} />}
          {activeTab === 'waiters'  && <WaitersSection  filter={filter} />}
          {activeTab === 'tables'   && <TablesSection   filter={filter} />}
          {activeTab === 'peaktime' && <PeakTimeSection filter={filter} />}
          {activeTab === 'products' && <ProductAnalyticsPanel />}
        </div>
      )}
    </div>
  );
}
