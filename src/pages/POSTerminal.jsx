import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ShoppingCart, Plus, Minus, Trash2,
  Loader2, Package, UtensilsCrossed, ShoppingBag, Info,
  ClipboardList, ChevronRight,
} from 'lucide-react';

import { orderAPI, OrderType, OrderStatus, ORDER_STATUS_STYLES, ORDER_STATUS_LABELS } from '../api/orders';
import { productAPI, getImgUrl } from '../api/products';
import { categoryAPI } from '../api/categories';
import { tableAPI, TableStatus, capacityHelpers } from '../api/tables';
import { useAuthStore } from '../store/authStore';
import OrderDetailModal from '../components/OrderDetailModal';

// JWT'dan user ID ni olish
const getUserId = (user) => {
  if (!user) return null;
  const id =
    user.nameid ??
    user.sub ??
    user.id ??
    user.Id ??
    user.userId ??
    user.UserId ??
    user['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
    null;
  if (!id) {
    console.warn('[POSTerminal] userId topilmadi. JWT payload kalitlari:', Object.keys(user));
  }
  return id;
};

// ─── CART ITEM ROW ───────────────────────────────────────────────────────────
const CartRow = ({ item, onIncrease, onDecrease, onRemove }) => (
  <div className="flex items-center gap-2 py-2.5 border-b border-gray-100 last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
      <p className="text-xs text-gray-400">
        {item.price.toLocaleString()} so'm × {item.count}
      </p>
    </div>
    <p className="text-sm font-bold text-gray-800 w-24 text-right">
      {(item.price * item.count).toLocaleString()}
    </p>
    <div className="flex items-center gap-1">
      <button
        onClick={() => onDecrease(item.productId)}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <Minus size={13} />
      </button>
      <span className="w-6 text-center text-sm font-bold">{item.count}</span>
      <button
        onClick={() => onIncrease(item.productId)}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <Plus size={13} />
      </button>
      <button
        onClick={() => onRemove(item.productId)}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors ml-1"
      >
        <Trash2 size={13} />
      </button>
    </div>
  </div>
);

// ─── ACTIVE ORDER CARD ───────────────────────────────────────────────────────
const ActiveOrderCard = ({ order, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-0"
  >
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-sm font-bold text-gray-800">#{order.sku}</span>
        {order.tableNumber > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
            Stol {order.tableNumber}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 truncate">
        {order.items?.map(i => `${i.count}× ${i.productName}`).join(', ')}
      </p>
    </div>
    <div className="flex flex-col items-end gap-1 flex-shrink-0">
      <span className="text-sm font-bold text-gray-800">
        {order.totalAmount?.toLocaleString()} so'm
      </span>
      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ORDER_STATUS_STYLES[order.orderStatus] ?? 'bg-gray-100 text-gray-600'}`}>
        {ORDER_STATUS_LABELS[order.orderStatus] ?? '—'}
      </span>
    </div>
    <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
  </button>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const POSTerminal = () => {
  const queryClient = useQueryClient();
  const { user, isCashier, isWaiter } = useAuthStore();
  const cashier = isCashier();
  const waiter  = isWaiter();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Tab: 'new' | 'active' ──
  const [activeTab, setActiveTab]       = useState('new');
  const [editingOrderId, setEditingOrderId] = useState(null);

  // URL dan orderId ni tekshirish va avtomatik ochish
  useEffect(() => {
    const orderIdFromUrl = searchParams.get('orderId');
    if (orderIdFromUrl) {
      setEditingOrderId(orderIdFromUrl);
      setActiveTab('active');
      // URL dan orderId ni olib tashlash
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('orderId');
      setSearchParams(newParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cart state ──
  const [cart, setCart]                      = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [orderType, setOrderType]            = useState(OrderType.DineIn); // Boshlang'ich qiymat har doim DineIn
  const [selectedCategory, setSelectedCategory] = useState(null);

  // ── Queries ──
  const { data: products = [], isLoading: pLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productAPI.getAll,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryAPI.getAll,
  });

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: tableAPI.getAll,
  });

  const { data: busyTableIds = [] } = useQuery({
    queryKey: ['busy-tables'],
    queryFn: orderAPI.getBusyTables,
    refetchInterval: 20_000,
  });

  // Faol buyurtmalar — ofitsant o'z buyurtmalarini, kassir/admin barchasini ko'radi
  // enabled: true — badge har doim to'g'ri soni ko'rsatish uchun
  const { data: activeOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: waiter ? ['orders', 'my-active'] : ['orders'],
    queryFn:  waiter ? orderAPI.getMyActive : orderAPI.getAll,
    refetchInterval: 15_000,
  });

  // Faqat yakunlanmagan va bekor qilinmagan buyurtmalar
  const visibleActiveOrders = activeOrders.filter(
    o => o.orderStatus !== OrderStatus.Finished && o.orderStatus !== OrderStatus.Cancelled
  );

  // ── Create order mutation ──
  const createMutation = useMutation({
    mutationFn: orderAPI.create,
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['orders', 'my-active']);
      queryClient.invalidateQueries(['busy-tables']);
      queryClient.invalidateQueries(['tables']);
      if (variables.tableId && variables.orderType === OrderType.DineIn) {
        try {
          await tableAPI.updateStatus(variables.tableId, TableStatus.Occupied);
          queryClient.invalidateQueries(['tables']);
        } catch {}
      }
      toast.success("Buyurtma qabul qilindi!");
      clearCart();
    },
    onError: (error) => {
      console.error('=== ORDER CREATE ERROR ===');
      console.error('Error object:', error);
      console.error('Response:', error?.response);
      console.error('Response data:', error?.response?.data);
      console.error('VALIDATION ERRORS:', error?.response?.data?.errors);
      console.error('Status:', error?.response?.status);

      // Validation errorlarni batafsil ko'rsatish
      const errors = error?.response?.data?.errors;
      if (errors) {
        console.error('=== VALIDATION ERRORS DETAILS ===');
        Object.keys(errors).forEach(key => {
          console.error(`Field "${key}":`, errors[key]);
        });
      }

      toast.error(error?.response?.data?.title || error?.response?.data?.message || "Buyurtma yuborishda xatolik");
    },
  });

  // ── Cart helpers ──
  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i.productId === product.id);
      if (exists) {
        return prev.map(i =>
          i.productId === product.id ? { ...i, count: i.count + 1 } : i
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, count: 1 }];
    });
  };

  const increaseCart = (productId) => {
    setCart(prev =>
      prev.map(i => i.productId === productId ? { ...i, count: i.count + 1 } : i)
    );
  };

  const decreaseCart = (productId) => {
    setCart(prev => {
      const item = prev.find(i => i.productId === productId);
      if (item.count <= 1) return prev.filter(i => i.productId !== productId);
      return prev.map(i => i.productId === productId ? { ...i, count: i.count - 1 } : i);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedTableId(null);
    setOrderType(OrderType.DineIn); // Har doim DineIn ga qaytarish
    setSelectedCategory(null);
  };

  // ── Total ──
  const totalAmount = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * i.count, 0),
    [cart]
  );

  // ── Submit ──
  const handleCreateOrder = () => {
    if (cart.length === 0) {
      toast.error("Savatcha bo'sh");
      return;
    }
    if (orderType === OrderType.DineIn && !selectedTableId) {
      toast.error("Stol tanlang");
      return;
    }

    const userId = getUserId(user);
    if (!userId) {
      toast.error("Foydalanuvchi ma'lumotlari topilmadi");
      return;
    }

    const payload = {
      userId,
      tableId: selectedTableId ?? null,
      orderType,
      items: cart.map(i => ({ productId: i.productId, count: i.count })),
    };

    console.log('=== ORDER PAYLOAD ===');
    console.log('userId:', userId);
    console.log('tableId:', selectedTableId);
    console.log('orderType:', orderType, 'DineIn:', OrderType.DineIn, 'TakeOut:', OrderType.TakeOut);
    console.log('items:', payload.items);
    console.log('Full payload:', JSON.stringify(payload, null, 2));

    createMutation.mutate(payload);
  };

  // ── Filtered products ──
  const visibleProducts = useMemo(() =>
    products.filter(p => {
      if (!p.isActive) return false;
      if (selectedCategory) return p.categoryId === selectedCategory;
      return true;
    }),
    [products, selectedCategory]
  );

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* ── HEADER ── */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">POS Terminal</h1>
          <p className="text-sm text-gray-500">
            {activeTab === 'new' ? 'Yangi buyurtma qabul qilish' : 'Faol buyurtmalar'}
          </p>
        </div>
        {activeTab === 'new' && cart.length > 0 && (
          <span className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-xl text-sm font-semibold">
            Savatcha: {cart.length} ta mahsulot
          </span>
        )}
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden gap-0">

        {/* ══ LEFT: PRODUCTS ════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col overflow-hidden border-r bg-white">

          {/* Category filter */}
          <div className="px-5 py-3 border-b flex gap-2 overflow-x-auto flex-shrink-0">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                !selectedCategory ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Barchasi
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto p-5">
            {pLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin text-orange-500" size={36} />
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Package size={48} className="mb-3 opacity-40" />
                <p>Mahsulotlar topilmadi</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {visibleProducts.map(product => {
                  const inCart = cart.find(i => i.productId === product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`relative text-left p-3 rounded-xl border-2 transition-all hover:shadow-md active:scale-95 ${
                        inCart
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {inCart && (
                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {inCart.count}
                        </span>
                      )}
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 mb-2">
                        {product.imageUrl ? (
                          <img src={getImgUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UtensilsCrossed size={24} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1">{product.name}</p>
                      <p className="text-xs font-bold text-orange-600">
                        {product.price?.toLocaleString()} so'm
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ══ RIGHT: TABS ═══════════════════════════════════════════════════ */}
        <div className="w-80 flex flex-col bg-white flex-shrink-0 overflow-hidden">

          {/* ── Tab switcher ── */}
          <div className="flex border-b flex-shrink-0">
            <button
              onClick={() => setActiveTab('new')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'new'
                  ? 'text-orange-600 border-b-2 border-orange-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShoppingCart size={15} />
              Yangi
              {cart.length > 0 && (
                <span className="w-4 h-4 bg-orange-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {cart.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'active'
                  ? 'text-orange-600 border-b-2 border-orange-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ClipboardList size={15} />
              Faol
              {visibleActiveOrders.length > 0 && (
                <span className="w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {visibleActiveOrders.length}
                </span>
              )}
            </button>
          </div>

          {/* ══ TAB: YANGI BUYURTMA ══════════════════════════════════════════ */}
          {activeTab === 'new' && (
            <>
              {/* Order type toggle (Kassa va Admin uchun) */}
              {!waiter && (
                <div className="p-4 border-b">
                  <div className="flex rounded-xl overflow-hidden border border-gray-200">
                    <button
                      onClick={() => setOrderType(OrderType.DineIn)}
                      className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        orderType === OrderType.DineIn
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <UtensilsCrossed size={15} /> Ichida
                    </button>
                    <button
                      onClick={() => { setOrderType(OrderType.TakeOut); setSelectedTableId(null); }}
                      className={`flex-1 py-2 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        orderType === OrderType.TakeOut
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <ShoppingBag size={15} /> Olib ketish
                    </button>
                  </div>
                </div>
              )}

              {/* Table selector (faqat DineIn uchun) */}
              {orderType === OrderType.DineIn && (
                <div className="p-4 border-b">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Stol tanlang</p>
                  <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto">
                    {tables.map(table => {
                      const isBusy = busyTableIds.includes(table.id);
                      const isSelected = selectedTableId === table.id;
                      return (
                        <button
                          key={table.id}
                          onClick={() => !isBusy && setSelectedTableId(isSelected ? null : table.id)}
                          disabled={isBusy}
                          className={`py-2 px-1 rounded-xl text-sm font-bold transition-all flex flex-col items-center gap-0.5 ${
                            isSelected
                              ? 'bg-orange-500 text-white shadow-md'
                              : isBusy
                              ? 'bg-red-100 text-red-400 cursor-not-allowed'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          <span>{table.tableNumber}</span>
                          {capacityHelpers.get(table.id) && (
                            <span className="text-[10px] font-medium opacity-70 leading-none">
                              👥{capacityHelpers.get(table.id)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedTableId && (
                    <p className="text-xs text-orange-600 font-medium mt-1.5">
                      ✓ Stol {tables.find(t => t.id === selectedTableId)?.tableNumber} tanlandi
                    </p>
                  )}
                </div>
              )}

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto px-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-300 py-8">
                    <ShoppingCart size={48} className="mb-3 opacity-40" />
                    <p className="text-sm">Savatcha bo'sh</p>
                    <p className="text-xs mt-1">Mahsulot tanlang</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {cart.map(item => (
                      <CartRow
                        key={item.productId}
                        item={item}
                        onIncrease={increaseCart}
                        onDecrease={decreaseCart}
                        onRemove={removeFromCart}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t bg-gray-50 flex-shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-base font-bold text-gray-700">Jami:</span>
                  <span className="text-xl font-bold text-gray-900">
                    {totalAmount.toLocaleString()} so'm
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40"
                  >
                    Tozalash
                  </button>
                  <button
                    onClick={handleCreateOrder}
                    disabled={createMutation.isPending || cart.length === 0}
                    className="flex-[2] py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
                  >
                    {createMutation.isPending
                      ? <><Loader2 size={16} className="animate-spin" /> Yuborilmoqda...</>
                      : <><ShoppingCart size={16} /> Buyurtma berish</>
                    }
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ══ TAB: FAOL BUYURTMALAR ════════════════════════════════════════ */}
          {activeTab === 'active' && (
            <div className="flex-1 overflow-y-auto flex flex-col">
              {ordersLoading ? (
                <div className="flex justify-center items-center flex-1 py-16">
                  <Loader2 className="animate-spin text-orange-500" size={32} />
                </div>
              ) : visibleActiveOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-gray-300 py-16">
                  <ClipboardList size={48} className="mb-3 opacity-40" />
                  <p className="text-sm font-medium text-gray-400">Faol buyurtmalar yo'q</p>
                </div>
              ) : (
                visibleActiveOrders.map(order => (
                  <ActiveOrderCard
                    key={order.id}
                    order={order}
                    onClick={() => setEditingOrderId(order.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── ORDER DETAIL MODAL ── */}
      {editingOrderId && (
        <OrderDetailModal
          orderId={editingOrderId}
          onClose={() => {
            setEditingOrderId(null);
            queryClient.invalidateQueries(['orders']);
            queryClient.invalidateQueries(['orders', 'my-active']);
          }}
        />
      )}
    </div>
  );
};

export default POSTerminal;
