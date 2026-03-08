import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  Eye, Search, ShoppingBag, Plus, Pencil,
  Clock, CheckCircle, XCircle, Wallet,
  UtensilsCrossed, Printer, CalendarDays, Percent,
} from 'lucide-react';

import {
  orderAPI,
  OrderStatus,
  ORDER_TYPE_LABELS,
} from '../api/orders';
import { extractErrorMessage } from '../utils/errorHandler';
import { TableStatus } from '../api/tables';
import { useAuthStore } from '../store/authStore';
import OrderViewModal from '../components/OrderViewModal';
import OrderDetailModal from '../components/OrderDetailModal';

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────

const STATUS_META = {
  1: { label: 'Tayyor',    bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-400',  Icon: CheckCircle },
  2: { label: 'Bekor',     bg: 'bg-red-100 dark:bg-red-900/30',      text: 'text-red-700 dark:text-red-400',      Icon: XCircle     },
  3: { label: "To'landi",  bg: 'bg-basand-100 dark:bg-basand-800/30',text: 'text-basand-600 dark:text-basand-300',Icon: Wallet      },
  0: { label: 'Bekor',     bg: 'bg-red-100 dark:bg-red-900/30',      text: 'text-red-700 dark:text-red-400',      Icon: XCircle     },
};

// ─── FILTERS ──────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { label: 'Barchasi',       value: 'all' },
  { label: 'Tayyor',         value: '1' },
  { label: 'Bekor qilingan', value: '2' },
  { label: "To'landi",       value: '3' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const ITEMS_PREVIEW = 4;

const formatTime = (d) => {
  if (!d) return null;
  const date = new Date(d);
  if (date.getFullYear() < 1900) return null;
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

// ─── ORDER CARD ───────────────────────────────────────────────────────────────

function OrderCard({ order, onView, onEdit, onFinish, canEdit, canPrint, canFinish, onToggleServiceCharge }) {
  const meta   = STATUS_META[order.orderStatus] ?? STATUS_META[0];
  const Icon   = meta.Icon;
  const items  = order.items ?? [];
  const shown  = items.slice(0, ITEMS_PREVIEW);
  const extra  = items.length - ITEMS_PREVIEW;
  const time   = formatTime(order.createdAt);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">

      {/* ── TOP: SKU + STATUS ── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            #{order.sku}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
            {order.orderType === 2
              ? <span className="flex items-center gap-1"><UtensilsCrossed size={11} /> Olib ketish</span>
              : order.tableNumber
                ? `Stol #${order.tableNumber}`
                : 'Stol yo\'q'}
          </p>
        </div>
        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.text}`}>
          <Icon size={12} />
          {meta.label}
        </span>
      </div>

      {/* ── DIVIDER ── */}
      <div className="mx-4 border-t border-slate-100 dark:border-slate-800" />

      {/* ── ITEMS ── */}
      <div className="px-4 py-3 flex-1 space-y-1">
        {shown.map((item, i) => (
          <div key={i} className="flex items-baseline justify-between gap-2">
            <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
              <span className="font-semibold text-slate-900 dark:text-white">{item.count}x</span>{' '}
              {item.productName}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
              {((item.priceAtTime ?? 0) * item.count).toLocaleString('ru-RU')} so'm
            </span>
          </div>
        ))}
        {extra > 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 pt-0.5">
            +{extra} ta mahsulot
          </p>
        )}
        {items.length === 0 && (
          <p className="text-xs text-slate-400 italic">Mahsulotlar yo'q</p>
        )}
      </div>

      {/* ── TOTAL ── */}
      <div className="mx-4 border-t border-slate-100 dark:border-slate-800" />
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Jami:</span>
        <span className="text-base font-black text-slate-900 dark:text-white">
          {(order.totalAmount ?? 0).toLocaleString('ru-RU')} so'm
        </span>
      </div>

      {/* ── FOOTER: TIME + WAITER ── */}
      <div className="mx-4 border-t border-slate-100 dark:border-slate-800" />
      <div className="flex items-center justify-between px-4 py-2 text-xs text-slate-400 dark:text-slate-400">
        {time
          ? <span className="flex items-center gap-1"><Clock size={11} /> {time}</span>
          : <span />}
        <span className="font-medium truncate max-w-28 text-right">{order.waiterName || '—'}</span>
      </div>

      {/* ── BUTTONS ── */}
      <div className="flex flex-col gap-1.5 px-4 pb-4 pt-1">
        {/* Service charge toggle — faqat admin/kassa, faqat aktiv (status=1) order */}
        {onToggleServiceCharge && order.orderStatus === 1 && (
          <button
            onClick={() => onToggleServiceCharge(order.id, !(order.serviceCharge ?? true))}
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              (order.serviceCharge ?? true)
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
            }`}
          >
            <Percent size={12} />
            {(order.serviceCharge ?? true) ? 'Xizmat haqqi: 15%' : "Xizmat haqqi: yo'q"}
          </button>
        )}

        {/* Row 1: Ko'rish + Tahrirlash */}
        <div className="flex gap-1.5">
          <button
            onClick={() => onView(order)}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl
                       border border-slate-200 dark:border-slate-700 text-xs font-medium
                       text-slate-700 dark:text-slate-300 min-w-0
                       hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Eye size={13} className="shrink-0" />
            <span className="truncate">Ko'rish</span>
          </button>

          {canEdit && (
            <button
              onClick={() => onEdit(order.id)}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl
                         bg-slate-900 dark:bg-white text-white dark:text-slate-900
                         text-xs font-semibold min-w-0
                         hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors"
            >
              <Pencil size={13} className="shrink-0" />
              <span className="truncate">Tahrir</span>
            </button>
          )}
        </div>

        {/* Row 2: Print + To'lov qabul qilish */}
        {(canPrint || canFinish) && (
          <div className="flex gap-1.5">
            {canPrint && (
              <button
                onClick={() => orderAPI.printCashier(order.id).catch(() => {})}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl
                           bg-basand-400 hover:bg-basand-500 text-white text-xs font-semibold
                           min-w-0 transition-colors"
              >
                <Printer size={13} className="shrink-0" />
                <span className="truncate">Print</span>
              </button>
            )}

            {canFinish && (
              <button
                onClick={() => onFinish(order.id)}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl
                           bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold
                           min-w-0 transition-colors"
              >
                <Wallet size={13} className="shrink-0" />
                <span className="truncate">To'lov</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isWaiter, hasPermission } = useAuthStore();
  const waiter = isWaiter();

  const [statusFilter,   setStatusFilter]   = useState('all');
  const [dateFilter,     setDateFilter]     = useState('today');
  const [search,         setSearch]         = useState('');
  const [viewingOrder,   setViewingOrder]   = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);

  // Polling yo'q — useOrderHub (AppLayout) SignalR orqali invalidate qiladi.
  // 60s stale fallback saqlanadi.
  const { data: orders = [], isLoading } = useQuery({
    queryKey:  waiter ? ['orders', 'my-active'] : ['orders'],
    queryFn:   waiter ? orderAPI.getMyActive : orderAPI.getAll,
    staleTime: 10_000,
    refetchInterval: 60_000,
  });

  const todayStr = new Date().toLocaleDateString('sv-SE'); // 'YYYY-MM-DD'

  // Faqat sana filtri — stat cardlar shu asosda hisoblanadi
  const dateOrders = waiter || dateFilter === 'all'
    ? orders
    : orders.filter((o) => o.createdAt
        ? new Date(o.createdAt).toLocaleDateString('sv-SE') === todayStr
        : false);

  // Tayyor (1) → To'landi (3) → Bekor (2) tartibida, bir xil status ichida yangirog'i oldin
  const STATUS_ORDER = { 1: 0, 3: 1, 2: 2 };

  const filtered = dateOrders
    .filter((order) => {
      const matchStatus =
        statusFilter === 'all' || order.orderStatus === Number(statusFilter);
      if (!search) return matchStatus;
      const q = search.toLowerCase();
      const match =
        String(order.sku        ?? '').toLowerCase().includes(q) ||
        String(order.waiterName ?? '').toLowerCase().includes(q) ||
        String(order.tableNumber ?? '').toLowerCase().includes(q) ||
        (order.items ?? []).map((it) => it.productName ?? '').join(' ').toLowerCase().includes(q);
      return matchStatus && match;
    })
    .sort((a, b) => {
      const sd = (STATUS_ORDER[a.orderStatus] ?? 9) - (STATUS_ORDER[b.orderStatus] ?? 9);
      if (sd !== 0) return sd;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const total     = dateOrders.length;
  const preparing = dateOrders.filter((o) => o.orderStatus === 1).length;
  const cancelled = dateOrders.filter((o) => o.orderStatus === 2).length;
  const finished  = dateOrders.filter((o) => o.orderStatus === 3).length;

  const canEdit = hasPermission('Order_ItemIncrease');

  const serviceChargeMutation = useMutation({
    mutationFn: ({ id, value }) => orderAPI.changeServiceCharge(id, value),
    onMutate: ({ id, value }) => {
      const key = waiter ? ['orders', 'my-active'] : ['orders'];
      queryClient.setQueryData(key, (old) =>
        Array.isArray(old) ? old.map(o => o.id === id ? { ...o, serviceCharge: value } : o) : old
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err, { id, value }) => {
      const key = waiter ? ['orders', 'my-active'] : ['orders'];
      queryClient.setQueryData(key, (old) =>
        Array.isArray(old) ? old.map(o => o.id === id ? { ...o, serviceCharge: !value } : o) : old
      );
      toast.error(extractErrorMessage(err, "Xizmat haqqini o'zgartirib bo'lmadi"));
    },
  });

  const finishMutation = useMutation({
    mutationFn: (id) => orderAPI.changeStatus(id, OrderStatus.Finished),
    onSuccess: (_, id) => {
      // Free the table after payment
      const order = orders.find(o => o.id === id);
      let tableId = order?.tableId;
      if (!tableId && order?.tableNumber) {
        const tables = queryClient.getQueryData(['tables']) ?? [];
        tableId = tables.find(t => t.tableNumber === order.tableNumber)?.id;
      }
      if (tableId) {
        queryClient.setQueryData(['tables'], (old) =>
          Array.isArray(old)
            ? old.map(t => t.id === tableId ? { ...t, tableStatus: TableStatus.Empty } : t)
            : old
        );
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success("To'lov qabul qilindi");
    },
    onError: (err) => toast.error(extractErrorMessage(err, "To'lovda xatolik")),
  });

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-950 min-h-screen">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Buyurtmalar</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            {waiter ? 'Mening faol buyurtmalarim' : dateFilter === 'today' ? 'Bugungi buyurtmalar' : 'Barcha buyurtmalar'}
          </p>
        </div>
        <div className="flex items-center gap-3">


          {hasPermission('Order_Create') && (
            <button
              onClick={() => navigate('/pos')}
              className="flex items-center gap-2 px-4 py-2.5 bg-basand-400 hover:bg-basand-500
                         text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus size={16} />
              Buyurtma
            </button>
          )}
        </div>
      </div>

      {/* ── SANA FILTRI — faqat admin/kassir uchun ── */}
      {!waiter && (
        <div className="flex gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 w-fit mb-4">
          <button
            onClick={() => setDateFilter('today')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              dateFilter === 'today'
                ? 'bg-basand-400 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarDays size={14} />
            Bugun
          </button>
          <button
            onClick={() => setDateFilter('all')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              dateFilter === 'all'
                ? 'bg-basand-400 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Hammasi
          </button>
        </div>
      )}

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Jami',           count: total,     color: 'text-slate-800 dark:text-slate-100'   },
          { label: 'Tayyor',         count: preparing, color: 'text-green-600 dark:text-green-400' },
          { label: 'Bekor qilingan', count: cancelled, color: 'text-red-600 dark:text-red-400'     },
          { label: "To'landi",       count: finished,  color: 'text-basand-500 dark:text-basand-300' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm"
          >
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">{stat.label}</p>
            <p className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* ── SEARCH + FILTER ── */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SKU, ofitsant, stol, mahsulot..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700
                       bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                       focus:outline-none focus:border-basand-300 focus:ring-1 focus:ring-basand-200"
          />
        </div>

        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              statusFilter === f.value
                ? 'bg-basand-400 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-basand-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-100 dark:border-slate-800" />
          ))}
        </div>

      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <ShoppingBag size={48} className="mb-3 opacity-30" />
          <p className="font-medium text-lg">Buyurtmalar yo'q</p>
        </div>

      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onView={setViewingOrder}
              onEdit={setEditingOrderId}
              onFinish={(id) => finishMutation.mutate(id)}
              canEdit={canEdit}
              canPrint={!waiter}
              canFinish={!waiter && order.orderStatus === OrderStatus.Accepted}
              onToggleServiceCharge={!waiter ? (id, val) => serviceChargeMutation.mutate({ id, value: val }) : null}
            />
          ))}
        </div>
      )}

      {/* ── VIEW MODAL ── */}
      <OrderViewModal
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
      />

      {/* ── EDIT MODAL ── */}
      {editingOrderId && (
        <OrderDetailModal
          orderId={editingOrderId}
          onClose={() => setEditingOrderId(null)}
        />
      )}
    </div>
  );
}
