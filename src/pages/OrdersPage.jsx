import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Eye, Search, ShoppingBag, Plus, Pencil,
  Clock, CheckCircle, XCircle, Wallet,
  UtensilsCrossed, Printer,
} from 'lucide-react';

const COMMISSION_RATE = 0.15;

import {
  orderAPI,
  OrderStatus,
  ORDER_TYPE_LABELS,
} from '../api/orders';
import { useAuthStore } from '../store/authStore';
import OrderViewModal from '../components/OrderViewModal';
import OrderDetailModal from '../components/OrderDetailModal';

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────

const STATUS_META = {
  1: { label: 'Tayyor',    bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-400',  Icon: CheckCircle },
  2: { label: 'Bekor',     bg: 'bg-red-100 dark:bg-red-900/30',      text: 'text-red-700 dark:text-red-400',      Icon: XCircle     },
  3: { label: "To'landi",  bg: 'bg-orange-100 dark:bg-orange-900/30',text: 'text-orange-700 dark:text-orange-400',Icon: Wallet      },
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

function OrderCard({ order, onView, onEdit, canEdit, canPrint }) {
  const meta   = STATUS_META[order.orderStatus] ?? STATUS_META[0];
  const Icon   = meta.Icon;
  const items  = order.items ?? [];
  const shown  = items.slice(0, ITEMS_PREVIEW);
  const extra  = items.length - ITEMS_PREVIEW;
  const time   = formatTime(order.createdAt);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">

      {/* ── TOP: SKU + STATUS ── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-base font-black text-gray-900 dark:text-white tracking-tight">
            #{order.sku}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
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
      <div className="mx-4 border-t border-gray-100 dark:border-gray-800" />

      {/* ── ITEMS ── */}
      <div className="px-4 py-3 flex-1 space-y-1">
        {shown.map((item, i) => (
          <div key={i} className="flex items-baseline justify-between gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
              <span className="font-semibold text-gray-900 dark:text-white">{item.count}x</span>{' '}
              {item.productName}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap shrink-0">
              {((item.priceAtTime ?? 0) * item.count).toLocaleString('ru-RU')} so'm
            </span>
          </div>
        ))}
        {extra > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 pt-0.5">
            +{extra} ta mahsulot
          </p>
        )}
        {items.length === 0 && (
          <p className="text-xs text-gray-400 italic">Mahsulotlar yo'q</p>
        )}
      </div>

      {/* ── TOTAL ── */}
      <div className="mx-4 border-t border-gray-100 dark:border-gray-800" />
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Jami:</span>
        <span className="text-base font-black text-gray-900 dark:text-white">
          {(order.totalAmount ?? 0).toLocaleString('ru-RU')} so'm
        </span>
      </div>

      {/* ── FOOTER: TIME + WAITER ── */}
      <div className="mx-4 border-t border-gray-100 dark:border-gray-800" />
      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-400 dark:text-gray-500">
        {time
          ? <span className="flex items-center gap-1"><Clock size={11} /> {time}</span>
          : <span />}
        <span className="font-medium truncate max-w-28 text-right">{order.waiterName || '—'}</span>
      </div>

      {/* ── BUTTONS ── */}
      <div className="flex gap-2 px-4 pb-4 pt-1">
        <button
          onClick={() => onView(order)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                     border border-gray-200 dark:border-gray-700 text-sm font-medium
                     text-gray-700 dark:text-gray-300
                     hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Eye size={14} />
          Ko'rish
        </button>

        {canEdit && (
          <button
            onClick={() => onEdit(order.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                       bg-gray-900 dark:bg-white text-white dark:text-gray-900
                       text-sm font-semibold
                       hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
          >
            <Pencil size={14} />
            Tahrirlash
          </button>
        )}

        {canPrint && (
          <button
            onClick={() => {
              const items = order.items || [];
              const subtotal = items.reduce((s, i) => s + (i.priceAtTime || 0) * i.count, 0);
              const serviceCharge = Math.round(subtotal * COMMISSION_RATE);
              fetch('/printer/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderSku: order.sku ?? '',
                  tableNumber: order.tableNumber ?? 0,
                  waiterName: order.waiterName ?? '',
                  totalAmount: subtotal + serviceCharge,
                  items: items.map((i) => ({
                    name: i.productName,
                    quantity: i.count,
                    price: i.priceAtTime ?? 0,
                  })),
                }),
              }).catch(() => {});
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl
                       bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors"
          >
            <Printer size={14} />
            Print
          </button>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const navigate = useNavigate();
  const { isWaiter, hasPermission } = useAuthStore();
  const waiter = isWaiter();

  const [statusFilter,   setStatusFilter]   = useState('all');
  const [search,         setSearch]         = useState('');
  const [viewingOrder,   setViewingOrder]   = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey:             waiter ? ['orders', 'my-active'] : ['orders'],
    queryFn:              waiter ? orderAPI.getMyActive : orderAPI.getAll,
    refetchInterval:      15_000,
    refetchIntervalInBackground: true,
  });

  const filtered = orders.filter((order) => {
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
  });

  const total     = orders.length;
  const preparing = orders.filter((o) => o.orderStatus === 1).length;
  const cancelled = orders.filter((o) => o.orderStatus === 2).length;
  const finished  = orders.filter((o) => o.orderStatus === 3).length;

  const canEdit = hasPermission('Order_ItemIncrease');

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Buyurtmalar</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {waiter ? 'Mening faol buyurtmalarim' : 'Barcha buyurtmalar'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">15 soniya</span>
          </div>
          {hasPermission('Order_Create') && (
            <button
              onClick={() => navigate('/pos')}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600
                         text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus size={16} />
              Buyurtma
            </button>
          )}
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Jami',           count: total,     color: 'text-gray-800 dark:text-gray-100'   },
          { label: 'Tayyor',         count: preparing, color: 'text-green-600 dark:text-green-400' },
          { label: 'Bekor qilingan', count: cancelled, color: 'text-red-600 dark:text-red-400'     },
          { label: "To'landi",       count: finished,  color: 'text-orange-600 dark:text-orange-400' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm"
          >
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium truncate">{stat.label}</p>
            <p className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* ── SEARCH + FILTER ── */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SKU, ofitsant, stol, mahsulot..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                       focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
          />
        </div>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              statusFilter === f.value
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-orange-300'
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
            <div key={i} className="h-64 bg-white dark:bg-gray-900 rounded-2xl animate-pulse border border-gray-100 dark:border-gray-800" />
          ))}
        </div>

      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
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
              canEdit={canEdit}
              canPrint={!waiter}
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
