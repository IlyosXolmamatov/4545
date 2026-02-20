import { useQuery } from '@tanstack/react-query';
import { X, Printer, Loader2 } from 'lucide-react';

import { orderAPI, OrderStatus, OrderType, ORDER_STATUS_COLORS } from '../api/orders';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  // Backend default DateTime (0001-01-01) ni tekshirish
  if (date.getFullYear() < 1900) return '—';
  return date.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatPrice = (n) => `${(n || 0).toLocaleString('ru-RU')} so'm`;

const ORDER_TYPE_LABELS = {
  [OrderType.DineIn]: 'Ichida',
  [OrderType.TakeOut]: 'Olib ketish',
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

/**
 * @param {{ order: object|null, onClose: () => void }} props
 */
export default function OrderViewModal({ order, onClose }) {
  const isOpen = !!order;

  // GetById orqali to'liq detail — waiterName, tableNumber, createdAt olish uchun
  const { data: detail, isLoading } = useQuery({
    queryKey: ['order', order?.id],
    queryFn:  () => orderAPI.getById(order.id),
    enabled:  isOpen && !!order?.id,
  });

  if (!isOpen) return null;

  // API dan to'g'ridan-to'g'ri flat maydonlar keladi
  const waiterName = detail?.waiterName || '—';
  const tableNum   = detail?.tableNumber;
  const createdAt  = detail?.createdAt;

  // Detail yuklangunicha listdagi ma'lumot ko'rsatiladi
  const current = detail || order;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Buyurtma #{current.sku}
            </h2>
            <span className={`mt-1.5 inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
              ORDER_STATUS_COLORS[current.orderStatus] ?? 'bg-gray-100 text-gray-600'
            }`}>
              {OrderStatus[current.orderStatus] ?? '—'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* ── LOADING ── */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-orange-400" />
          </div>
        ) : (
          <>
            {/* ── META INFO ── */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-xs text-orange-500 font-medium mb-0.5">Stol</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {tableNum ? `#${tableNum}` : '— (TakeOut)'}
                </p>
              </div>
              <div>
                <p className="text-xs text-orange-500 font-medium mb-0.5">Ofitsant</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{waiterName}</p>
              </div>
              <div>
                <p className="text-xs text-orange-500 font-medium mb-0.5">Vaqt</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatDate(createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-orange-500 font-medium mb-0.5">To'lov turi</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {ORDER_TYPE_LABELS[current.orderType] ?? '—'}
                </p>
              </div>
            </div>

            {/* ── MAHSULOTLAR ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Mahsulotlar ({current.items?.length ?? 0})
              </p>
              <div className="space-y-3">
                {current.items?.map((item) => (
                  <div key={item.id}>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-gray-800 dark:text-gray-200">
                        <span className="font-semibold">{item.count}×</span> {item.productName}
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {((item.count || 1) * (item.priceAtTime || 0)).toLocaleString('ru-RU')} so'm
                      </span>
                    </div>
                    {/* Kelajakda extension products qo'shilganda ishlaydi */}
                    {item.extensionProducts?.length > 0 && (
                      <p className="text-xs text-orange-500 mt-0.5 pl-2">
                        +{item.extensionProducts.map((e) => e.name).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── TOTAL ── */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex justify-between">
                <span className="font-bold text-gray-900 dark:text-white">Umumiy:</span>
                <span className="font-bold text-gray-900 dark:text-white text-base">
                  {formatPrice(current.totalAmount)}
                </span>
              </div>
            </div>

            {/* ── FOOTER ── */}
            <div className="flex gap-3 px-5 pb-5 pt-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300
                           font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Yopish
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-medium
                           text-sm hover:bg-orange-600 transition-colors flex items-center
                           justify-center gap-2"
              >
                <Printer size={16} />
                Chop etish
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
