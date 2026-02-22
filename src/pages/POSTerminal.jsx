import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ShoppingCart, Plus, Minus, Trash2,
  Loader2, Package, UtensilsCrossed, ShoppingBag,
  ArrowLeft, Search, X, ClipboardList, ChevronRight,
  MapPin, Crown, Users,
} from 'lucide-react';

import { orderAPI, OrderType, ORDER_STATUS_STYLES, ORDER_STATUS_LABELS } from '../api/orders';
import { productAPI, getImgUrl } from '../api/products';
import { categoryAPI } from '../api/categories';
import { tableAPI, TableStatus, TableType } from '../api/tables';
import { useAuthStore } from '../store/authStore';
import OrderDetailModal from '../components/OrderDetailModal';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const getUserId = (user) => {
  if (!user) return null;
  return (
    user.nameid ?? user.sub ?? user.id ?? user.Id ?? user.userId ?? user.UserId ??
    user['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
    null
  );
};

// ─── STATICS ──────────────────────────────────────────────────────────────────

const TABLE_TYPE_FILTERS = [
  { value: 'all',              label: 'Hammasi', icon: null   },
  { value: TableType.Simple,   label: 'Ichkari', icon: MapPin },
  { value: TableType.Terrace,  label: 'Terasa',  icon: MapPin },
  { value: TableType.VIP,      label: 'VIP',     icon: Crown  },
];

const TABLE_STATUS_CFG = {
  [TableStatus.Free]:     { label: "Bo'sh",  border: 'border-emerald-300 hover:border-emerald-500', num: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  [TableStatus.Occupied]: { label: 'Band',   border: 'border-rose-300 hover:border-rose-500',       num: 'text-rose-600 dark:text-rose-400',       badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'       },
  [TableStatus.Reserved]: { label: 'Rezerv', border: 'border-amber-300 hover:border-amber-500',     num: 'text-amber-600 dark:text-amber-400',     badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'   },
};

// ─── TABLE CARD (POS uchun soddalashtirilgan) ─────────────────────────────────

const TableCard = ({ table, onClick }) => {
  const cfg = TABLE_STATUS_CFG[table.tableStatus] ?? TABLE_STATUS_CFG[TableStatus.Free];
  const typeLabel = table.tableType === TableType.Simple ? 'Ichkari'
    : table.tableType === TableType.Terrace ? 'Terasa' : 'VIP';

  return (
    <button
      onClick={onClick}
      className={`relative aspect-square rounded-2xl border-2 p-2 sm:p-3 flex flex-col items-center justify-center gap-1
                  transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 active:scale-95
                  bg-white dark:bg-gray-900 ${cfg.border}`}
    >
      {/* Type badge */}
      <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1 py-0.5 rounded
                       bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 uppercase tracking-wide">
        {typeLabel}
      </span>

      <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
        STOL
      </span>
      <span className={`text-xl sm:text-3xl font-black leading-none ${cfg.num}`}>
        #{table.tableNumber}
      </span>
      <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
        {cfg.label}
      </span>
      {table.capacity > 0 && (
        <span className="flex items-center gap-0.5 text-[9px] text-gray-400 mt-0.5">
          <Users size={8} /> {table.capacity}
        </span>
      )}
    </button>
  );
};

// ─── CART ROW ─────────────────────────────────────────────────────────────────

const CartRow = ({ item, onIncrease, onDecrease, onRemove }) => (
  <div className="flex items-center gap-2 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{item.name}</p>
      <p className="text-xs text-gray-400">{item.price.toLocaleString()} so'm × {item.count}</p>
    </div>
    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 shrink-0">
      {(item.price * item.count).toLocaleString()}
    </p>
    <div className="flex items-center gap-1 shrink-0">
      <button onClick={() => onDecrease(item.productId)}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition-colors">
        <Minus size={12} />
      </button>
      <span className="w-6 text-center text-sm font-bold text-gray-800 dark:text-gray-100">{item.count}</span>
      <button onClick={() => onIncrease(item.productId)}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 transition-colors">
        <Plus size={12} />
      </button>
      <button onClick={() => onRemove(item.productId)}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors ml-0.5">
        <Trash2 size={12} />
      </button>
    </div>
  </div>
);

// ─── ACTIVE ORDER ROW ─────────────────────────────────────────────────────────

const ActiveOrderRow = ({ order, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left flex items-center gap-3 px-5 py-3.5 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
  >
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">#{order.sku}</span>
        {order.tableNumber > 0 && (
          <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">
            Stol {order.tableNumber}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 truncate">
        {order.items?.map(i => `${i.count}× ${i.productName}`).join(', ')}
      </p>
    </div>
    <div className="shrink-0 text-right">
      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
        {order.totalAmount?.toLocaleString()} so'm
      </p>
    </div>
    <ChevronRight size={16} className="text-gray-300 shrink-0" />
  </button>
);

// ─── DRAWER ───────────────────────────────────────────────────────────────────

const Drawer = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 flex flex-col shadow-2xl">
        {children}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const POSTerminal = () => {
  const queryClient = useQueryClient();
  const { user, isCashier, isWaiter } = useAuthStore();
  const cashier = isCashier();
  const waiter  = isWaiter();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Step: 'tables' | 'menu' ──
  const [step, setStep]                       = useState('tables');
  const [cartOpen, setCartOpen]               = useState(false);
  const [activeOrdersOpen, setActiveOrdersOpen] = useState(false);
  const [editingOrderId, setEditingOrderId]   = useState(null);

  // ── Table filter ──
  const [tableTypeFilter, setTableTypeFilter] = useState('all');
  const [tableSearch, setTableSearch]         = useState('');

  // ── Order state ──
  const [cart, setCart]                       = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [orderType, setOrderType]             = useState(OrderType.DineIn);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // ── URL: orderId ──
  useEffect(() => {
    const orderIdFromUrl = searchParams.get('orderId');
    if (orderIdFromUrl) {
      setEditingOrderId(orderIdFromUrl);
      const np = new URLSearchParams(searchParams);
      np.delete('orderId');
      setSearchParams(np, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Queries ──
  const { data: products = [],  isLoading: pLoading }      = useQuery({ queryKey: ['products'],   queryFn: productAPI.getAll });
  const { data: categories = [] }                           = useQuery({ queryKey: ['categories'], queryFn: categoryAPI.getAll });
  const { data: tables = [],    isLoading: tablesLoading }  = useQuery({ queryKey: ['tables'],     queryFn: tableAPI.getAll, refetchInterval: 15_000 });

  const { data: activeOrders = [] } = useQuery({
    queryKey: waiter ? ['orders', 'my-active'] : ['orders'],
    queryFn:  waiter ? orderAPI.getMyActive : orderAPI.getAll,
    refetchInterval: 15_000,
  });
  const visibleActiveOrders = activeOrders.filter(o => o.orderStatus === 1);

  const { data: editingOrder } = useQuery({
    queryKey: ['order', editingOrderId],
    queryFn:  () => orderAPI.getById(editingOrderId),
    enabled:  !!editingOrderId,
  });

  // Mavjud buyurtma cartga yuklansin
  useEffect(() => {
    if (editingOrder && editingOrderId) {
      setCart((editingOrder.items || []).map(item => ({
        productId: item.productId,
        name:      item.productName,
        price:     item.priceAtTime || 0,
        count:     item.count,
      })));
      if (editingOrder.tableNumber > 0) {
        const t = tables.find(t => t.tableNumber === editingOrder.tableNumber);
        if (t) setSelectedTableId(t.id);
      }
      setOrderType(editingOrder.orderType || OrderType.DineIn);
      setStep('menu');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingOrder, tables]);

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: orderAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['orders', 'my-active']);
      queryClient.invalidateQueries(['tables']);
      toast.success("Buyurtma qabul qilindi!");
      clearAll();
    },
    onError: (err) =>
      toast.error(err?.response?.data?.title || err?.response?.data?.message || "Buyurtma yuborishda xatolik"),
  });

  const updateOrderMutation = useMutation({
    mutationFn: async () => {
      const originalItems = editingOrder?.items || [];
      const origMap = new Map(originalItems.map(i => [i.productId, i]));
      const currMap = new Map(cart.map(i => [i.productId, i]));
      const updates = [];

      for (const [pid, ci] of currMap) {
        const oi = origMap.get(pid);
        if (!oi) { updates.push({ type: 'increase', pid, count: ci.count }); }
        else if (oi.count !== ci.count) {
          const d = ci.count - oi.count;
          updates.push({ type: d > 0 ? 'increase' : 'decrease', pid, count: Math.abs(d) });
        }
      }
      for (const [pid, oi] of origMap) {
        if (!currMap.has(pid)) updates.push({ type: 'decrease', pid, count: oi.count });
      }
      for (const u of updates) {
        if (u.type === 'increase') await orderAPI.increaseItem(editingOrderId, u.pid, u.count);
        else await orderAPI.decreaseItem(editingOrderId, u.pid, u.count, 'Tahrir qilindi');
      }
      queryClient.invalidateQueries(['order', editingOrderId]);
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['orders', 'my-active']);
      return updates;
    },
    onSuccess: (updates) => {
      toast.success(updates.length === 0 ? "O'zgarish yo'q" : "Buyurtma yangilandi!");
      clearAll();
    },
    onError: (err) =>
      toast.error(err?.response?.data?.title || err?.response?.data?.message || "Yangilashda xatolik"),
  });

  // ── Cart helpers ──
  const addToCart = (product) =>
    setCart(prev => {
      const ex = prev.find(i => i.productId === product.id);
      if (ex) return prev.map(i => i.productId === product.id ? { ...i, count: i.count + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, price: product.price, count: 1 }];
    });

  const increaseCart = (pid) =>
    setCart(prev => prev.map(i => i.productId === pid ? { ...i, count: i.count + 1 } : i));

  const decreaseCart = (pid) =>
    setCart(prev => {
      const it = prev.find(i => i.productId === pid);
      if (it.count <= 1) return prev.filter(i => i.productId !== pid);
      return prev.map(i => i.productId === pid ? { ...i, count: i.count - 1 } : i);
    });

  const removeFromCart = (pid) =>
    setCart(prev => prev.filter(i => i.productId !== pid));

  const clearAll = () => {
    setCart([]);
    setSelectedTableId(null);
    setOrderType(OrderType.DineIn);
    setSelectedCategory(null);
    setEditingOrderId(null);
    setCartOpen(false);
    setStep('tables');
  };

  const totalAmount = useMemo(
    () => cart.reduce((s, i) => s + i.price * i.count, 0),
    [cart]
  );

  // ── Submit ──
  const handleSubmit = () => {
    if (cart.length === 0) { toast.error("Savatcha bo'sh"); return; }

    if (editingOrderId) { updateOrderMutation.mutate(); return; }

    if (orderType === OrderType.DineIn && !selectedTableId) {
      toast.error("Stol tanlang"); return;
    }

    const userId = getUserId(user);
    if (!userId) { toast.error("Foydalanuvchi ma'lumotlari topilmadi"); return; }

    createMutation.mutate({
      userId,
      tableId:   selectedTableId ?? null,
      orderType,
      items:     cart.map(i => ({ productId: i.productId, count: i.count })),
    });
  };

  // ── Navigation ──
  const handleSelectTable = (table) => {
    setSelectedTableId(table.id);
    setOrderType(OrderType.DineIn);
    setStep('menu');
  };

  const handleTakeOut = () => {
    setSelectedTableId(null);
    setOrderType(OrderType.TakeOut);
    setStep('menu');
  };

  const handleBack = () => {
    setStep('tables');
    setCartOpen(false);
  };

  // ── Filtered data ──
  const filteredTables = useMemo(() => {
    let r = tables;
    if (tableTypeFilter !== 'all') r = r.filter(t => t.tableType === tableTypeFilter);
    if (tableSearch.trim())        r = r.filter(t => String(t.tableNumber).includes(tableSearch.trim()));
    return r;
  }, [tables, tableTypeFilter, tableSearch]);

  const visibleProducts = useMemo(() =>
    products.filter(p => p.isActive && (!selectedCategory || p.categoryId === selectedCategory)),
    [products, selectedCategory]
  );

  const selectedTable = tables.find(t => t.id === selectedTableId);
  const isPending     = editingOrderId ? updateOrderMutation.isPending : createMutation.isPending;
  const cartCount     = cart.reduce((s, i) => s + i.count, 0);

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">

      {/* ══ HEADER ════════════════════════════════════════════════════════════ */}
      <header className="flex-shrink-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3">

          {/* Back button — faqat menyu stepida */}
          {step === 'menu' && (
            <button
              onClick={handleBack}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors -ml-1 shrink-0"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
          )}

          {/* Title / Order type toggle */}
          <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
            {step === 'tables' ? (
              <div>
                <h1 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white leading-tight">POS Terminal</h1>
                <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">Stol tanlang yoki olib ketish</p>
              </div>
            ) : (
              <>
                <h1 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight shrink-0">
                  {orderType === OrderType.TakeOut
                    ? 'Olib ketish'
                    : selectedTable
                    ? `Stol #${selectedTable.tableNumber}`
                    : 'Menyu'}
                </h1>

                {/* Order type — faqat kassa va admin */}
                {!waiter && (
                  <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 text-xs shrink-0">
                    <button
                      onClick={() => setOrderType(OrderType.DineIn)}
                      className={`px-2.5 sm:px-3 py-1.5 font-semibold flex items-center gap-1 transition-colors ${
                        orderType === OrderType.DineIn
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <UtensilsCrossed size={12} />
                      <span className="hidden sm:inline">Ichida</span>
                    </button>
                    <button
                      onClick={() => { setOrderType(OrderType.TakeOut); setSelectedTableId(null); }}
                      className={`px-2.5 sm:px-3 py-1.5 font-semibold flex items-center gap-1 transition-colors ${
                        orderType === OrderType.TakeOut
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <ShoppingBag size={12} />
                      <span className="hidden sm:inline">Olib ketish</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Active orders button */}
          <button
            onClick={() => setActiveOrdersOpen(true)}
            className="relative p-2 sm:px-3 sm:py-2 flex items-center gap-2
                       bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                       rounded-xl transition-colors shrink-0"
          >
            <ClipboardList size={17} className="text-gray-600 dark:text-gray-300" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 hidden sm:block">Faol</span>
            {visibleActiveOrders.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-blue-500 text-white
                               text-[10px] rounded-full flex items-center justify-center font-bold">
                {visibleActiveOrders.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ══ STEP: STOLLAR ═════════════════════════════════════════════════════ */}
      {step === 'tables' && (
        <div className="flex-1 overflow-y-auto">

          {/* Filter + Search */}
          <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm px-4 sm:px-6 py-2.5 flex items-center gap-2 flex-wrap">
            {TABLE_TYPE_FILTERS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTableTypeFilter(value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                             border transition-all shrink-0 ${
                  tableTypeFilter === value
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                }`}
              >
                {Icon && <Icon size={11} />}
                {label}
              </button>
            ))}

            {/* Search */}
            <div className="relative ml-auto">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Stol raqami..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-36 sm:w-44
                           focus:outline-none focus:border-orange-400"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-6">

            {/* TakeOut — kassa/admin uchun */}
            {!waiter && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                  Maxsus
                </p>
                <button
                  onClick={handleTakeOut}
                  className="flex items-center gap-3 px-5 py-4 rounded-2xl border-2 border-dashed
                             border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900
                             hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10
                             transition-all group w-full sm:w-auto"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30
                                  flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <ShoppingBag size={20} className="text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Olib ketish</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Stol kerak emas</p>
                  </div>
                </button>
              </div>
            )}

            {/* Tables grid */}
            {tablesLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {[...Array(16)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <span className="text-4xl mb-3">🪑</span>
                <p className="font-medium text-sm">Stol topilmadi</p>
              </div>
            ) : tableTypeFilter === 'all' ? (
              // Guruhlab ko'rsatish
              [TableType.Simple, TableType.Terrace, TableType.VIP].map(type => {
                const group = filteredTables.filter(t => t.tableType === type);
                if (!group.length) return null;
                const lbl = type === TableType.Simple ? 'Ichkari' : type === TableType.Terrace ? 'Terasa' : 'VIP';
                return (
                  <div key={type}>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{lbl}</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                      {group.map(t => <TableCard key={t.id} table={t} onClick={() => handleSelectTable(t)} />)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {filteredTables.map(t => <TableCard key={t.id} table={t} onClick={() => handleSelectTable(t)} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ STEP: MENYU ═══════════════════════════════════════════════════════ */}
      {step === 'menu' && (
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* Category filter */}
          <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 px-4 py-2 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                !selectedCategory
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Barchasi
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-28">
            {pLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="animate-spin text-orange-500" size={36} />
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Package size={48} className="mb-3 opacity-40" />
                <p className="text-sm">Mahsulotlar topilmadi</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {visibleProducts.map(product => {
                  const inCart = cart.find(i => i.productId === product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`relative text-left p-3 rounded-2xl border-2 transition-all hover:shadow-md active:scale-95 ${
                        inCart
                          ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {inCart && (
                        <span className="absolute -top-2 -right-2 min-w-[24px] h-6 px-1 bg-orange-500 text-white
                                         text-xs rounded-full flex items-center justify-center font-bold shadow">
                          {inCart.count}
                        </span>
                      )}
                      <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-2">
                        {product.imageUrl ? (
                          <img src={getImgUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UtensilsCrossed size={24} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 mb-1">{product.name}</p>
                      <p className="text-xs font-bold text-orange-600">{product.price?.toLocaleString()} so'm</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Floating cart button ── */}
          {cart.length > 0 && (
            <div className="absolute bottom-5 right-4 sm:right-6 z-20">
              <button
                onClick={() => setCartOpen(true)}
                className="flex items-center gap-3 pl-4 pr-5 py-3.5 bg-orange-500 hover:bg-orange-600
                           text-white rounded-2xl shadow-xl shadow-orange-200 dark:shadow-orange-900/40
                           transition-all hover:scale-105 active:scale-95"
              >
                <div className="relative shrink-0">
                  <ShoppingCart size={20} />
                  <span className="absolute -top-2.5 -right-2.5 min-w-[20px] h-5 px-1 bg-white text-orange-500
                                   text-[10px] rounded-full flex items-center justify-center font-black">
                    {cartCount}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-semibold opacity-80 leading-tight">Savatcha</p>
                  <p className="text-sm font-black leading-tight">{totalAmount.toLocaleString()} so'm</p>
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ SAVATCHA DRAWER ═══════════════════════════════════════════════════ */}
      <Drawer open={cartOpen} onClose={() => setCartOpen(false)}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white">Savatcha</h2>
            <p className="text-xs text-gray-400">{cartCount} ta mahsulot</p>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
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

        {/* Footer */}
        <div className="px-5 py-4 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Jami:</span>
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {totalAmount.toLocaleString()} so'm
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { clearAll(); }}
              className="flex-1 py-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700
                         text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-colors"
            >
              Tozalash
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-[2] py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold
                         text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2
                         shadow-lg shadow-orange-200 dark:shadow-orange-900/30"
            >
              {isPending
                ? <><Loader2 size={16} className="animate-spin" /> Yuborilmoqda...</>
                : editingOrderId
                ? <><ShoppingCart size={16} /> Yangilash</>
                : <><ShoppingCart size={16} /> Buyurtma berish</>
              }
            </button>
          </div>
        </div>
      </Drawer>

      {/* ══ FAOL BUYURTMALAR DRAWER ═══════════════════════════════════════════ */}
      <Drawer open={activeOrdersOpen} onClose={() => setActiveOrdersOpen(false)}>
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white">Faol buyurtmalar</h2>
            <p className="text-xs text-gray-400">{visibleActiveOrders.length} ta</p>
          </div>
          <button
            onClick={() => setActiveOrdersOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {visibleActiveOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
              <ClipboardList size={40} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">Faol buyurtmalar yo'q</p>
            </div>
          ) : (
            visibleActiveOrders.map(order => (
              <ActiveOrderRow
                key={order.id}
                order={order}
                onClick={() => {
                  setEditingOrderId(order.id);
                  setActiveOrdersOpen(false);
                }}
              />
            ))
          )}
        </div>
      </Drawer>

      {/* ══ ORDER DETAIL MODAL ════════════════════════════════════════════════ */}
      {editingOrderId && !updateOrderMutation.isPending && (
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
