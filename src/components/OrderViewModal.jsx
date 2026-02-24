import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Printer, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { orderAPI, OrderStatus, ORDER_STATUS_COLORS, ORDER_TYPE_LABELS, ORDER_STATUS_LABELS } from '../api/orders';
import { useAuthStore } from '../store/authStore';
import ConfirmModal from './ConfirmModal';

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
      queryClient.invalidateQueries(['order', order?.id]);
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['orders', 'my-active']);
      toast.success(status === OrderStatus.Finished ? "To'lov qabul qilindi!" : 'Status yangilandi');
      if (status === OrderStatus.Finished || status === OrderStatus.Cancelled) {
        onClose();
      }
    },
    onError: () => toast.error('Statusni yangilashda xatolik'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => orderAPI.delete(order.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['orders', 'my-active']);
      queryClient.invalidateQueries(['tables']);
      toast.success("Buyurtma o'chirildi");
      onClose();
    },
    onError: () => toast.error("O'chirishda xatolik"),
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
              <p className="text-xs text-orange-500 font-semibold mb-3">Mahsulotlar ({current.items?.length || 0})</p>
              <div className="space-y-2">
                {current.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.productName}</p>
                      <p className="text-xs text-gray-500">{item.count}× @ {(item.priceAtTime || 0).toLocaleString('ru-RU')} so'm</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {((item.count || 1) * (item.priceAtTime || 0)).toLocaleString('ru-RU')} so'm
                    </p>
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

              {/* DELETE */}
              {hasPermission('Order_Delete') && (
                <button
                  onClick={() => setDlg({
                    title: `Buyurtma #${current.sku}`,
                    message: "Buyurtma bazadan butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.",
                    confirmText: "Ha, o'chirish",
                    danger: true,
                    onConfirm: () => deleteMutation.mutate(),
                  })}
                  disabled={deleteMutation.isPending}
                  className="w-full py-2.5 flex items-center justify-center gap-2 rounded-xl
                             border border-red-200 dark:border-red-800
                             bg-red-50 dark:bg-red-900/20
                             hover:bg-red-100 dark:hover:bg-red-900/40
                             text-red-600 dark:text-red-400
                             text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Trash2 size={14} />}
                  Buyurtmani o'chirish
                </button>
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
                <button
                onClick={() => {
                  try {
                    const statusLabel = ORDER_STATUS_LABELS[current.orderStatus] ?? '';
                    const html = `
                      <html>
                        <head>
                          <title>Buyurtma #${current.sku}</title>
                          <style>
                            body{ font-family: Arial, Helvetica, sans-serif; padding:20px }
                            h1{ font-size:20px }
                            table{ width:100%; border-collapse:collapse; margin-top:12px }
                            td,th{ padding:8px; border-bottom:1px solid #eee }
                          </style>
                        </head>
                        <body>
                          <h1>Buyurtma #${current.sku}</h1>
                          <p>Status: ${statusLabel}</p>
                          <p>Stol: ${tableNum ? '#'+tableNum : 'TakeOut'}</p>
                          <p>Ofitsant: ${waiterName}</p>
                          <p>Vaqt: ${formatDate(createdAt)}</p>
                          <table>
                            <thead><tr><th>Mahsulot</th><th>Soni</th><th>Narx</th></tr></thead>
                            <tbody>
                              ${ (current.items || []).map(i => `<tr><td>${i.productName}</td><td>${i.count}</td><td>${(i.priceAtTime||0).toLocaleString('ru-RU')} so'm</td></tr>`).join('') }
                            </tbody>
                          </table>
                          <p style="margin-top:12px; font-weight:bold">Jami: ${formatPrice(current.totalAmount)}</p>
                        </body>
                      </html>`;

                    const printWindow = window.open('', '_blank', 'width=600,height=800');
                    if (printWindow) {
                      printWindow.document.open();
                      printWindow.document.write(html);
                      printWindow.document.close();
                      printWindow.focus();
                      setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
                    } else {
                      window.print();
                    }
                  } catch (e) {
                    console.error('Print error', e);
                    window.print();
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-medium
                           text-sm hover:bg-orange-600 transition-colors flex items-center
                           justify-center gap-2"
              >
                <Printer size={16} />
                Chop etish
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
