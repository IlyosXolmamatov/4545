import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Eye, Search, ShoppingBag, Plus, Pencil } from 'lucide-react';

import {
  orderAPI,
  OrderStatus,
  OrderType,
  ORDER_STATUS_COLORS,
} from '../api/orders';
import { useAuthStore } from '../store/authStore';
import OrderViewModal from '../components/OrderViewModal';

// ─── FILTERS ─────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { label: 'Barchasi',       value: 'all' },
  { label: 'Tayyorlanmoqda', value: '1' }, // OrderStatus[1]
  { label: 'Yetkazildi',     value: '2' }, // OrderStatus[2]
  { label: "To'landi",       value: '3' }, // OrderStatus[3]
];

const ORDER_TYPE_LABELS = {
  [OrderType.DineIn]: 'Ichida',
  [OrderType.TakeOut]: 'Olib ketish',
};

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const navigate = useNavigate();
  const { isWaiter, hasPermission } = useAuthStore();
  const waiter = isWaiter();

  const [statusFilter, setStatusFilter] = useState('all');
  const [search,       setSearch]       = useState('');
  const [viewingOrder, setViewingOrder] = useState(null);

  // Role asosida to'g'ri endpoint
  const { data: orders = [], isLoading } = useQuery({
    queryKey: waiter ? ['orders', 'my-active'] : ['orders'],
    queryFn:  waiter ? orderAPI.getMyActive : orderAPI.getAll,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });

  const filtered = orders.filter((order) => {
    const matchStatus =
      statusFilter === 'all' || order.orderStatus === Number(statusFilter);
    const matchSearch =
      !search || order.sku?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // ── Stats ──
  const total     = orders.length;
  const preparing = orders.filter((o) => o.orderStatus === 1).length; // Tayyorlanmoqda
  const delivered = orders.filter((o) => o.orderStatus === 2).length; // Yetkazildi
  const paid      = orders.filter((o) => o.orderStatus === 3).length; // To'landi

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Buyurtmalar</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {waiter ? 'Mening faol buyurtmalarim' : 'Barcha buyurtmalar'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Har 15 soniyada yangilanadi</span>
          </div>
          {hasPermission('Order_Create') && (
            <button
              onClick={() => navigate('/pos')}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600
                         text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus size={16} />
              Yangi buyurtma
            </button>
          )}
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Jami',           count: total,     color: 'text-gray-800 dark:text-gray-100'  },
          { label: 'Tayyorlanmoqda', count: preparing, color: 'text-blue-600 dark:text-blue-400'  },
          { label: 'Yetkazildi',     count: delivered, color: 'text-green-600 dark:text-green-400' },
          { label: "To'landi",       count: paid,      color: 'text-orange-600 dark:text-orange-400' },
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
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SKU qidirish..."
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
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white dark:bg-gray-900 rounded-2xl animate-pulse border border-gray-100 dark:border-gray-700" />
          ))}
        </div>

      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <ShoppingBag size={48} className="mb-3 opacity-30" />
          <p className="font-medium text-lg">Buyurtmalar yo'q</p>
        </div>

      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wide">SKU</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wide">Stol</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wide">Ofitsant</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wide">Mahsulotlar</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wide">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wide">To'lov</th>
                  <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wide">Summa</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-colors">

                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">#{order.sku}</span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {order.tableNumber ? `#${order.tableNumber}` : '—'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {order.waiterName || '—'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-52">
                        {order.items?.map((i) => `${i.count}x ${i.productName}`).join(', ')}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {order.items?.length ?? 0} xil mahsulot
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        ORDER_STATUS_COLORS[order.orderStatus] ?? 'bg-gray-100 text-gray-600'
                      }`}>
                        {OrderStatus[order.orderStatus] ?? '—'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {ORDER_TYPE_LABELS[order.orderType] ?? '—'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {order.totalAmount?.toLocaleString('ru-RU')} so'm
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasPermission('Order_ItemIncrease') && (
                          <button
                            onClick={() => navigate(`/pos?orderId=${order.id}`)}
                            className="p-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
                            title="Tahrirlash"
                          >
                            <Pencil size={15} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                          </button>
                        )}
                        <button
                          onClick={() => setViewingOrder(order)}
                          className="p-2 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors group"
                          title="Ko'rish"
                        >
                          <Eye size={15} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VIEW MODAL ── */}
      <OrderViewModal
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
      />
    </div>
  );
}
