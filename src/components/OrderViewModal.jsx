import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { orderAPI, OrderStatus, ORDER_STATUS_COLORS, ORDER_TYPE_LABELS } from '../api/orders';
import { TableStatus } from '../api/tables';
import { useAuthStore } from '../store/authStore';
import ConfirmModal from './ConfirmModal';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

// Vositachilik haqqi (kerak bo'lsa shu yerdan o'zgartiring)
const COMMISSION_RATE = 0.15;

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (date.getFullYear() < 1900) return '—';
  return date.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatPrice = (n) => `${(n || 0).toLocaleString('ru-RU')} so'm`;

// ─── COMPONENT ───────────────────────────────────────────────────────────────

/**
 * @param {{ order: object|null, onClose: () => void }} props
 */
export default function OrderViewModal({ order, onClose }) {
  const isOpen = !!order;
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const [dlg, setDlg] = useState(null);

  // GetById orqali to'liq detail — waiterName, tableNumber, createdAt olish uchun
  const { data: detail, isLoading } = useQuery({
    queryKey: ['order', order?.id],
    queryFn:  () => orderAPI.getById(order.id),
    enabled:  isOpen && !!order?.id,
  });

  const changeStatusMutation = useMutation({
    mutationFn: (status) => orderAPI.changeStatus(order.id, status),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['order', order?.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'my-active'] });
      toast.success(status === OrderStatus.Finished ? "To'lov qabul qilindi!" : 'Status yangilandi');
      if (status === OrderStatus.Finished || status === OrderStatus.Cancelled) {
        // Free the table when order is completed or cancelled
        const tableId = detail?.tableId;
        if (tableId) {
          queryClient.setQueryData(['tables'], (old) =>
            Array.isArray(old)
              ? old.map(t => t.id === tableId ? { ...t, tableStatus: TableStatus.Empty } : t)
              : old
          );
        }
        onClose();
      }
    },
    onError: () => toast.error('Statusni yangilashda xatolik'),
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
              #{current.sku}
            </h2>
            <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
              ORDER_STATUS_COLORS[current.orderStatus] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {OrderStatus[current.orderStatus] ?? '—'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} className="text-gray-400 dark:text-gray-500" />
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
            <div className="grid grid-cols-2 gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              {[
                { label: 'Tur',        value: ORDER_TYPE_LABELS[current.orderType] ?? '—' },
                { label: 'Stol',       value: tableNum ? `#${tableNum}` : '—' },
                { label: 'Ofitsant',   value: waiterName, truncate: true },
                { label: 'Vaqt',       value: formatDate(createdAt) },
              ].map(({ label, value, truncate }) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                  <p
                    className={`text-sm font-semibold text-gray-900 dark:text-white ${truncate ? 'truncate' : ''}`}
                    title={truncate ? value : undefined}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* ── MAHSULOTLAR ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="text-xs text-orange-500 font-semibold mb-3">Mahsulotlar ({current.items?.length || 0})</p>
              <div className="space-y-2">
                {current.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.productName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.count}× @ {(item.priceAtTime || 0).toLocaleString('ru-RU')} so'm</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {((item.count || 1) * (item.priceAtTime || 0)).toLocaleString('ru-RU')} so'm
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── TOTAL ── */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-300">Jami:</span>
                <span className="font-semibold text-gray-800 dark:text-white">
                  {formatPrice(current.totalAmount)}
                </span>
              </div>
              {current.orderType === 1 && (
                <div className="flex justify-between text-sm">
                  <span className="text-rose-500">Xizmat haqqi ({COMMISSION_RATE * 100}%):</span>
                  <span className="font-semibold text-rose-500">
                    {formatPrice(Math.round((current.totalAmount || 0) * COMMISSION_RATE))}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                <span className="font-bold text-gray-900 dark:text-white">Umumiy to'lanadigan:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                  {current.orderType === 1
                    ? formatPrice(Math.round((current.totalAmount || 0) * (1 + COMMISSION_RATE)))
                    : formatPrice(current.totalAmount)}
                </span>
              </div>
            </div>

            {/* ── FOOTER ── */}
            <div className="flex flex-col gap-3 px-5 pb-5 pt-3">
              {/* STATUS CHANGE */}
              {current.orderStatus !== OrderStatus.Finished &&
               current.orderStatus !== OrderStatus.Cancelled &&
               hasPermission('Order_StatusChange') && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setDlg({
                      message: "To'lovni qabul qilasizmi?",
                      confirmText: "Ha, qabul qilish",
                      danger: false,
                      onConfirm: () => changeStatusMutation.mutate(OrderStatus.Finished),
                    })}
                    disabled={changeStatusMutation.isPending}
                    className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {changeStatusMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                    {current.orderType === 1 ? "To'lovni qabul qilish" : 'Yakunlash'}
                  </button>
                  <button
                    onClick={() => setDlg({
                      message: "Buyurtmani bekor qilasizmi? Bu amalni qaytarib bo'lmaydi.",
                      confirmText: "Ha, bekor qilish",
                      danger: true,
                      onConfirm: () => changeStatusMutation.mutate(OrderStatus.Cancelled),
                    })}
                    disabled={changeStatusMutation.isPending}
                    className="flex-1 py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 border border-red-200 dark:border-red-800 rounded-xl text-sm font-semibold disabled:opacity-50"
                  >
                    Bekor qilish
                  </button>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300
                             font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Yopish
                </button>
              </div>
            </div>

          </>
        )}

      </div>

      <ConfirmModal
        open={!!dlg}
        message={dlg?.message}
        confirmText={dlg?.confirmText}
        danger={dlg?.danger ?? true}
        onConfirm={() => { dlg?.onConfirm?.(); setDlg(null); }}
        onCancel={() => setDlg(null)}
      />
    </div>
  );
}
