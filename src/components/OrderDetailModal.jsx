import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  X, Loader2, Plus, Minus,
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

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-bold ${ORDER_STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
    {ORDER_STATUS_LABELS[status] ?? status}
  </span>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

/**
 * @param {{ orderId: string, onClose: () => void }} props
 */
const OrderDetailModal = ({ orderId, onClose }) => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();

  const [changeTableMode, setChangeTableMode] = useState(false);
  const [newTableId, setNewTableId]           = useState(null);

  // ── Fetch fresh order data ──
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderAPI.getById(orderId),
    refetchInterval: 10_000,
  });

  // ── Fetch tables (for change table) ──
  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: tableAPI.getAll,
    enabled: changeTableMode,
  });

  const { data: busyTableIds = [] } = useQuery({
    queryKey: ['busy-tables'],
    queryFn: orderAPI.getBusyTables,
    enabled: changeTableMode,
  });

  // ─── MUTATIONS ───────────────────────────────────────────────────────────

  const invalidate = () => {
    queryClient.invalidateQueries(['order', orderId]);
    queryClient.invalidateQueries(['orders']);
    queryClient.invalidateQueries(['orders', 'my-active']);
    queryClient.invalidateQueries(['busy-tables']);
    queryClient.invalidateQueries(['tables']);
  };

  const increaseItemMutation = useMutation({
    mutationFn: ({ productId, count }) => orderAPI.increaseItem(orderId, productId, count),
    onSuccess: invalidate,
    onError:   () => toast.error('Oshirishda xatolik'),
  });

  const decreaseItemMutation = useMutation({
    mutationFn: ({ productId, count }) => orderAPI.decreaseItem(orderId, productId, count),
    onSuccess: invalidate,
    onError:   () => toast.error('Kamaytirishda xatolik'),
  });

  const changeStatusMutation = useMutation({
    mutationFn: (status) => orderAPI.changeStatus(orderId, status),
    onSuccess: (_, status) => {
      invalidate();
      toast.success(
        status === OrderStatus.Finished ? "To'lov qabul qilindi!" : 'Status yangilandi'
      );
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

  // ─── RENDER ──────────────────────────────────────────────────────────────

  const isFinished  = order?.orderStatus === OrderStatus.Finished;
  const isCancelled = order?.orderStatus === OrderStatus.Cancelled;
  const isLocked    = isFinished || isCancelled;

  // Joriy stolni tables ro'yxatidan topish (changeTable rejimi uchun)
  const currentTableId = tables.find(t => t.tableNumber === order?.tableNumber)?.id ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">

        {/* ── HEADER ── */}
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
          {isLoading ? (
            <div className="h-7 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          ) : (
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">#{order?.sku}</h2>
              <StatusBadge status={order?.orderStatus} />
            </div>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={22} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-orange-500" size={40} />
          </div>
        ) : !order ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            Buyurtma topilmadi
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-5">

            {/* ── INFO ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-medium mb-0.5">Tur</p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {order.orderType === OrderType.DineIn
                    ? <><UtensilsCrossed size={14} /> Ichida</>
                    : <><ShoppingBag size={14} /> Olib ketish</>}
                </div>
              </div>

              {/* Stol (faqat DineIn) */}
              {order.orderType === OrderType.DineIn && order.tableNumber > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium mb-0.5">Stol</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    #{order.tableNumber}
                  </p>
                </div>
              )}

              {/* Ofitsant */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-medium mb-0.5">Ofitsant</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {order.waiterName || '—'}
                </p>
              </div>

              {/* Vaqt */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-medium mb-0.5">Vaqt</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {(() => {
                    if (!order.createdAt) return '—';
                    const date = new Date(order.createdAt);
                    // Backend default DateTime (0001-01-01) ni tekshirish
                    if (date.getFullYear() < 1900) return '—';
                    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                  })()}
                </p>
              </div>
            </div>

            {/* ── CHANGE TABLE ── */}
            {!isLocked && order.orderType === OrderType.DineIn && hasPermission('Order_TableChange') && (
              <div>
                {!changeTableMode ? (
                  <button
                    onClick={() => setChangeTableMode(true)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <ArrowLeftRight size={15} /> Stolni almashtirish
                  </button>
                ) : (
                  <div className="border border-dashed border-blue-300 dark:border-blue-700 rounded-xl p-4">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Yangi stol tanlang</p>
                    <div className="grid grid-cols-5 gap-2 max-h-28 overflow-y-auto mb-3">
                      {tables.map(t => {
                        const isBusy     = busyTableIds.includes(t.id) && t.id !== currentTableId;
                        const isCurrent  = t.id === currentTableId;
                        const isSelected = newTableId === t.id;
                        return (
                          <button
                            key={t.id}
                            disabled={isBusy || isCurrent}
                            onClick={() => setNewTableId(isSelected ? null : t.id)}
                            className={`py-2 rounded-xl text-sm font-bold transition-all ${
                              isSelected ? 'bg-blue-500 text-white'
                              : isCurrent ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                              : isBusy    ? 'bg-red-100 dark:bg-red-900/30 text-red-400 cursor-not-allowed'
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
                        className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors"
                      >
                        Bekor
                      </button>
                      <button
                        disabled={!newTableId || changeTableMutation.isPending}
                        onClick={() => changeTableMutation.mutate(newTableId)}
                        className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {changeTableMutation.isPending
                          ? <Loader2 size={14} className="animate-spin" />
                          : <ArrowLeftRight size={14} />}
                        Almashtirish
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ITEMS ── */}
            <div>
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">
                Mahsulotlar ({order.items?.length ?? 0})
              </h3>
              <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
                {order.items?.map(item => (
                  <div key={item.id} className="flex items-center gap-3 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {item.productName ?? 'Mahsulot'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {item.priceAtTime?.toLocaleString()} so'm × {item.count}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 w-28 text-right">
                      {((item.priceAtTime ?? 0) * item.count).toLocaleString()} so'm
                    </p>

                    {/* +/- tugmalari — faqat faol buyurtmalarda va permission bo'lsa */}
                    {!isLocked && (
                      <div className="flex items-center gap-1">
                        {/* Kamaytirish — faqat kassir va admin */}
                        {hasPermission('Order_ItemDecrease') && (
                          <button
                            onClick={() => decreaseItemMutation.mutate({ productId: item.productId, count: 1 })}
                            disabled={decreaseItemMutation.isPending}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-red-100 hover:text-red-600 transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                        )}
                        <span className="w-6 text-center text-sm font-bold text-gray-800 dark:text-gray-100">
                          {item.count}
                        </span>
                        {/* Oshirish — ofitsant, kassir va admin */}
                        {hasPermission('Order_ItemIncrease') && (
                          <button
                            onClick={() => increaseItemMutation.mutate({ productId: item.productId, count: 1 })}
                            disabled={increaseItemMutation.isPending}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-green-100 hover:text-green-600 transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── TOTAL ── */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex justify-between items-center">
              <span className="text-base font-bold text-gray-700 dark:text-gray-200">Jami:</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {order.totalAmount?.toLocaleString()} so'm
              </span>
            </div>

            {/* ── STATUS CHANGE ── */}
            {!isLocked && hasPermission('Order_StatusChange') && (
              <div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Statusni o'zgartirish</p>
                <div className="flex gap-2">
                  {order.orderStatus !== OrderStatus.Finished && (
                    <button
                      onClick={() => {
                        if (confirm("To'lovni qabul qilasizmi?"))
                          changeStatusMutation.mutate(OrderStatus.Finished);
                      }}
                      disabled={changeStatusMutation.isPending}
                      className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {changeStatusMutation.isPending
                        ? <Loader2 size={14} className="animate-spin" />
                        : null}
                      {order.orderType === OrderType.DineIn ? "To'lovni qabul qilish" : 'Yakunlash'}
                    </button>
                  )}
                  {order.orderStatus !== OrderStatus.Cancelled && (
                    <button
                      onClick={() => {
                        if (confirm("Buyurtmani bekor qilasizmi?"))
                          changeStatusMutation.mutate(OrderStatus.Cancelled);
                      }}
                      disabled={changeStatusMutation.isPending}
                      className="flex-1 py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 border border-red-200 dark:border-red-800 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                    >
                      Bekor qilish
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailModal;
