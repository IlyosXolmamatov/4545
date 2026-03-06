import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  X, Loader2, Plus, Minus, Trash2,
  UtensilsCrossed, ShoppingBag, ArrowLeftRight,
} from 'lucide-react';

import {
  orderAPI,
  OrderStatus,
  OrderType,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
} from '../api/orders';
import { tableAPI } from '../api/tables';
import { useAuthStore } from '../store/authStore';
import ConfirmModal from './ConfirmModal';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-bold ${ORDER_STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
    {ORDER_STATUS_LABELS[status] ?? status}
  </span>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const OrderDetailModal = ({ orderId, onClose }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();

  const [changeTableMode, setChangeTableMode] = useState(false);
  const [newTableId, setNewTableId] = useState(null);
  const [dlg, setDlg] = useState(null);
  const [decreaseDialog, setDecreaseDialog] = useState(null); // { productId, productName }
  const [decreaseReason, setDecreaseReason] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderAPI.getById(orderId),
    refetchInterval: 10_000,
  });

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: tableAPI.getAll,
    enabled: changeTableMode,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['orders', 'my-active'] });
    queryClient.invalidateQueries({ queryKey: ['tables'] });
  };

  // qaysi productId pending ekanligini alohida kuzatish
  const [pendingIncrease, setPendingIncrease] = useState(null);
  const [pendingDecrease, setPendingDecrease] = useState(null);

  const increaseItemMutation = useMutation({
    mutationFn: ({ productId, count }) => {
      setPendingIncrease(productId);
      return orderAPI.increaseItem(orderId, productId, count);
    },
    onMutate: async ({ productId, count }) => {
      await queryClient.cancelQueries({ queryKey: ['order', orderId] });
      const previous = queryClient.getQueryData(['order', orderId]);
      queryClient.setQueryData(['order', orderId], (old) => {
        if (!old) return old;
        const items = (old.items || []).map(i =>
          i.productId === productId ? { ...i, count: i.count + count } : i
        );
        const total = items.reduce((s, i) => s + (i.priceAtTime || 0) * i.count, 0);
        return { ...old, items, totalAmount: total };
      });
      return { previous };
    },
    onError: (_, __, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['order', orderId], ctx.previous);
      toast.error('Oshirishda xatolik');
    },
    onSettled: (_, __, { productId }) => {
      setPendingIncrease(null);
      invalidate();
    },
  });

  const decreaseItemMutation = useMutation({
    mutationFn: ({ productId, count, aboutOfCancelled = '' }) => {
      setPendingDecrease(productId);
      return orderAPI.decreaseItem(orderId, productId, count, aboutOfCancelled);
    },
    onMutate: async ({ productId, count }) => {
      await queryClient.cancelQueries({ queryKey: ['order', orderId] });
      const previous = queryClient.getQueryData(['order', orderId]);
      queryClient.setQueryData(['order', orderId], (old) => {
        if (!old) return old;
        const items = (old.items || [])
          .map(i => i.productId === productId ? { ...i, count: Math.max(0, i.count - count) } : i)
          .filter(i => i.count > 0);
        const total = items.reduce((s, i) => s + (i.priceAtTime || 0) * i.count, 0);
        return { ...old, items, totalAmount: total };
      });
      return { previous };
    },
    onError: (_, __, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['order', orderId], ctx.previous);
      toast.error('Kamaytirishda xatolik');
    },
    onSettled: (_, __, { productId }) => {
      setPendingDecrease(null);
      invalidate();
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (productId) => {
      // Find the item to get its full count
      const item = order.items?.find(i => i.productId === productId);
      if (!item) return Promise.reject(new Error('Item not found'));
      // Decrease by full count to completely remove it
      return orderAPI.decreaseItem(orderId, productId, item.count, 'Xato mahsulot');
    },
    onSuccess: () => {
      invalidate();
      toast.success('Mahsulot o\'chirildi');
    },
    onError: () => toast.error("Mahsulotni o'chirishda xatolik"),
  });

  const changeStatusMutation = useMutation({
    mutationFn: (status) => orderAPI.changeStatus(orderId, status),
    onSuccess: (_, status) => {
      invalidate();
      toast.success(status === OrderStatus.Finished ? "To'lov qabul qilindi!" : 'Status yangilandi');
      if (status === OrderStatus.Finished || status === OrderStatus.Cancelled) onClose();
    },
    onError: () => toast.error('Statusni yangilashda xatolik'),
  });

  const changeTableMutation = useMutation({
    mutationFn: (tableId) => orderAPI.changeTable(orderId, tableId),
    onSuccess: () => {
      invalidate();
      toast.success('Stol almashtirildi');
      setChangeTableMode(false);
      setNewTableId(null);
    },
    onError: () => toast.error('Stolni almashtirishda xatolik'),
  });

  const isFinished = order?.orderStatus === OrderStatus.Finished;
  const isCancelled = order?.orderStatus === OrderStatus.Cancelled;
  const isLocked = isFinished || isCancelled;
  const currentTableId = tables.find(t => t.tableNumber === order?.tableNumber)?.id ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* HEADER */}
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
          {isLoading ? (
            <div className="h-7 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          ) : (
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">#{order?.sku}</h2>
              <StatusBadge status={order?.orderStatus} />
            </div>
          )}
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={22} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* CONTENT */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-orange-500" size={40} />
          </div>
        ) : !order ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">Buyurtma topilmadi</div>
        ) : (
          <>
            {/* SCROLLABLE */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              
              {/* INFO */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Tur</p>
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    {order.orderType === OrderType.DineIn
                      ? <><UtensilsCrossed size={14} /> Ichida</>
                      : <><ShoppingBag size={14} /> Olib ketish</>}
                  </div>
                </div>
                {order.orderType === OrderType.DineIn && order.tableNumber > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Stol</p>
                    <p className="text-sm font-semibold">#{order.tableNumber}</p>
                  </div>
                )}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Ofitsant</p>
                  <p className="text-sm font-semibold">{order.waiterName || '—'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Vaqt</p>
                  <p className="text-sm font-semibold">
                    {(!order.createdAt || new Date(order.createdAt).getFullYear() < 1900)
                      ? '—'
                      : new Date(order.createdAt).toLocaleTimeString('ru-RU')}
                  </p>
                </div>
              </div>

              {/* CHANGE TABLE */}
              {!isLocked && order.orderType === OrderType.DineIn && hasPermission('Order_TableChange') && (
                <div>
                  {!changeTableMode ? (
                    <button onClick={() => setChangeTableMode(true)} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                      <ArrowLeftRight size={15} /> Stolni almashtirish
                    </button>
                  ) : (
                    <div className="border border-dashed border-blue-300 dark:border-blue-700 rounded-xl p-4">
                      <p className="text-sm font-bold mb-3">Yangi stol tanlang</p>
                      <div className="grid grid-cols-5 gap-2 max-h-28 overflow-y-auto mb-3">
                        {tables.map(t => {
                          const isCurrent = t.id === currentTableId;
                          const isSelected = newTableId === t.id;
                          return (
                            <button
                              key={t.id}
                              disabled={isCurrent}
                              onClick={() => setNewTableId(isSelected ? null : t.id)}
                              className={`py-2 rounded-xl text-sm font-bold transition-all ${
                                isSelected ? 'bg-blue-500 text-white'
                                  : isCurrent ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200'
                              }`}
                            >
                              {t.tableNumber}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setChangeTableMode(false); setNewTableId(null); }}
                          className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium"
                        >
                          Bekor
                        </button>
                        <button
                          disabled={!newTableId || changeTableMutation.isPending}
                          onClick={() => changeTableMutation.mutate(newTableId)}
                          className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {changeTableMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <ArrowLeftRight size={14} />}
                          Almashtirish
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ITEMS */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  Mahsulotlar ({order.items?.length ?? 0})
                </h3>
                <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex items-center gap-3 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.productName ?? 'Mahsulot'}</p>
                        <p className="text-xs text-gray-400">
                          {item.priceAtTime?.toLocaleString()} so'm × {item.count}
                        </p>
                      </div>
                      <p className="text-sm font-bold w-28 text-right text-gray-900 dark:text-white">
                        {((item.priceAtTime ?? 0) * item.count).toLocaleString()} so'm
                      </p>
                      {!isLocked && (
                        <div className="flex items-center gap-1">
                          {hasPermission('Order_ItemDecrease') && (
                            <button
                              onClick={() => { setDecreaseReason(''); setDecreaseDialog({ productId: item.productId, productName: item.productName }); }}
                              disabled={pendingDecrease === item.productId || pendingIncrease === item.productId}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-red-100 hover:text-red-600 disabled:opacity-40"
                              title="Miqdorni kamaytirish"
                            >
                              {pendingDecrease === item.productId
                                ? <Loader2 size={10} className="animate-spin" />
                                : <Minus size={12} />}
                            </button>
                          )}
                          <span className="w-6 text-center text-sm font-bold text-gray-900 dark:text-white">{item.count}</span>
                          {hasPermission('Order_ItemIncrease') && (
                            <button
                              onClick={() => increaseItemMutation.mutate({ productId: item.productId, count: 1 })}
                              disabled={pendingIncrease === item.productId || pendingDecrease === item.productId}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-green-100 hover:text-green-600 disabled:opacity-40"
                              title="Miqdorni oshirish"
                            >
                              {pendingIncrease === item.productId
                                ? <Loader2 size={10} className="animate-spin" />
                                : <Plus size={12} />}
                            </button>
                          )}
                          {(hasPermission('Order_ItemDecrease') || hasPermission('Order_Delete')) && (
                            <button
                              onClick={() => setDlg({
                                message: `"${item.productName}" buyurtmadan o'chirilsinmi?`,
                                confirmText: "Ha, o'chirish",
                                onConfirm: () => deleteItemMutation.mutate(item.productId),
                              })}
                              disabled={deleteItemMutation.isPending}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-100 hover:text-red-600 ml-1"
                              title="Mahsulotni to'liq o'chirish"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* TOTAL */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex justify-between items-center">
                <span className="text-base font-bold text-gray-900 dark:text-white">Jami:</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{order.totalAmount?.toLocaleString()} so'm</span>
              </div>
            </div>

            {/* FOOTER */}
            {!isLocked && (
              <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/pos?orderId=${orderId}`);
                  }}
                  className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus size={18} />
                  POS Terminal'da Mahsulot Qo'shish
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Decrease reason dialog */}
      {decreaseDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">Kamaytirish sababi</h3>
            <p className="text-xs text-gray-400 mb-3">"{decreaseDialog.productName}"</p>
            <input
              type="text"
              autoFocus
              value={decreaseReason}
              onChange={e => setDecreaseReason(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && decreaseReason.trim()) {
                  decreaseItemMutation.mutate({ productId: decreaseDialog.productId, count: 1, aboutOfCancelled: decreaseReason.trim() });
                  setDecreaseDialog(null);
                }
              }}
              placeholder="Sabab kiriting..."
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700
                         bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:outline-none focus:border-orange-400 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setDecreaseDialog(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                           text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Bekor
              </button>
              <button
                disabled={!decreaseReason.trim()}
                onClick={() => {
                  decreaseItemMutation.mutate({ productId: decreaseDialog.productId, count: 1, aboutOfCancelled: decreaseReason.trim() });
                  setDecreaseDialog(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600
                           text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

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
};

export default OrderDetailModal;

