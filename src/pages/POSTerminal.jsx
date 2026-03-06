import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ShoppingCart, Plus, Minus, Trash2,
  Loader2, Package, UtensilsCrossed, ShoppingBag,
  ArrowLeft, Search, X, ClipboardList, ChevronRight,
  MapPin, Crown, Users, Clock, Percent,
} from 'lucide-react';

import { orderAPI, OrderType } from '../api/orders';
import { productAPI, getImgUrl } from '../api/products';
import { categoryAPI } from '../api/categories';
import { tableAPI, TableStatus, TableType } from '../api/tables';
import { useAuthStore } from '../store/authStore';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const getUserId = (user) => {
  if (!user) return null;
  return (
    user.nameid ?? user.sub ?? user.id ?? user.Id ?? user.userId ?? user.UserId ??
    user['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
    null
  );
};

const getUserName = (u) => {
  if (!u) return '';
  return (
    u.name ?? u.unique_name ?? u.UserName ?? u.userName ??
    u.fullName ?? u.FullName ?? u.Name ?? ''
  );
};

const TERMINAL_TAG_STR = { Oshxona: 1, Somsaxona: 2, Kassa: 3, Bar: 4, Extra: 5 };
const resolveTag = (tag) => typeof tag === 'number' ? tag : (TERMINAL_TAG_STR[tag] ?? 1);

const autoPrint = (orderId) => {
  if (!orderId) return;
  orderAPI.printCashier(orderId).catch(() => {});
};

const fmtTime = (d) => {
  if (!d) return null;
  const date = new Date(d);
  if (date.getFullYear() < 1900) return null;
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const nowTime = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

// ─── NORMALIZE (backend strings → numbers) ───────────────────────────────────
const STATUS_STR = { Empty: 1, NotEmpty: 2, Reserved: 3 };
const TYPE_STR   = { Simple: 1, Terrace: 2, VIP: 3 };
const normalizeTable = (t) => ({
  ...t,
  tableStatus: typeof t.tableStatus === 'string' ? (STATUS_STR[t.tableStatus] ?? t.tableStatus) : t.tableStatus,
  tableType:   typeof t.tableType   === 'string' ? (TYPE_STR[t.tableType]     ?? t.tableType)   : t.tableType,
});

// ─── TABLE FILTER CONFIG ──────────────────────────────────────────────────────

const TABLE_TYPE_FILTERS = [
  { value: 'all',             label: 'Hammasi', icon: null   },
  { value: TableType.Simple,  label: 'Ichkari', icon: MapPin },
  { value: TableType.Terrace, label: 'Terasa',  icon: MapPin },
  { value: TableType.VIP,     label: 'VIP',     icon: Crown  },
];

const TABLE_STATUS_CFG = {
  [TableStatus.Free]:     { label: "Bo'sh",  border: 'border-emerald-300 hover:border-emerald-500', num: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  [TableStatus.Occupied]: { label: 'Band',   border: 'border-rose-300 hover:border-rose-500',       num: 'text-rose-600 dark:text-rose-400',       badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'       },
  [TableStatus.Reserved]: { label: 'Rezerv', border: 'border-amber-300 hover:border-amber-500',     num: 'text-amber-600 dark:text-amber-400',     badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'   },
};

// ─── TABLE CARD ───────────────────────────────────────────────────────────────

const TableCard = ({ table, onClick, hasActiveOrder = false }) => {
  // Agar table statusi Empty bo'lsayam, aktiv order bo'lsa Band ko'rsatamiz
  const effectiveStatus = hasActiveOrder && (table.tableStatus === TableStatus.Free || table.tableStatus === 1)
    ? TableStatus.Occupied
    : table.tableStatus;
  const cfg = TABLE_STATUS_CFG[effectiveStatus] ?? TABLE_STATUS_CFG[TableStatus.Free];
  const typeLabel = table.tableType === TableType.Simple ? 'Ichkari'
    : table.tableType === TableType.Terrace ? 'Terasa' : 'VIP';
  const isFree = !hasActiveOrder && (table.tableStatus === TableStatus.Free || table.tableStatus === 1);

  return (
    <button
      onClick={onClick}
      className={`relative aspect-square rounded-2xl border-2 p-2 sm:p-3 flex flex-col items-center justify-center gap-1
                  transition-all duration-150 ${cfg.border}
                  ${isFree
                    ? 'bg-white dark:bg-gray-900 hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer'
                    : 'bg-rose-50 dark:bg-rose-950/40 cursor-pointer'
                  }`}
    >
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

// ─── CART ROW (yangi itemlar uchun — tahrirlash mumkin) ───────────────────────

const CartRow = ({ item, onIncrease, onDecrease, onRemove }) => (
  <div className="flex items-center gap-2 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{item.name}</p>
      <p className="text-xs text-gray-400">{item.price.toLocaleString()} so'm × {item.count}</p>
    </div>
    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 shrink-0 min-w-[70px] text-right">
      {(item.price * item.count).toLocaleString()}
    </p>
    <div className="flex items-center gap-1 shrink-0">
      <button onClick={() => onDecrease(item.productId)}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
        <Minus size={12} />
      </button>
      <span className="w-5 text-center text-sm font-bold text-gray-800 dark:text-gray-100">{item.count}</span>
      <button onClick={() => onIncrease(item.productId)}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
        <Plus size={12} />
      </button>
      <button onClick={() => onRemove(item.productId)}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors ml-0.5">
        <Trash2 size={12} />
      </button>
    </div>
  </div>
);

// ─── EXISTING ITEM ROW (read-only — o'chirish/kamaytirish yo'q) ───────────────

const ExistingItemRow = ({ item }) => (
  <div className="flex items-center gap-2 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{item.productName}</p>
      <p className="text-xs text-gray-400">{item.priceAtTime?.toLocaleString()} so'm × {item.count}</p>
    </div>
    <p className="text-sm font-semibold text-gray-500 dark:text-gray-500 shrink-0 min-w-[70px] text-right">
      {((item.priceAtTime || 0) * item.count).toLocaleString()}
    </p>
    <div className="w-[88px] shrink-0" /> {/* alignment spacer */}
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
    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 shrink-0">
      {order.totalAmount?.toLocaleString()} so'm
    </p>
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
  const { user, isWaiter } = useAuthStore();
  const waiter = isWaiter();
  const [searchParams, setSearchParams] = useSearchParams();

  const printQueueRef = useRef(null);

  // ── Navigation ──
  const [step, setStep]                       = useState('tables');
  const [cartOpen, setCartOpen]               = useState(false);
  const [activeOrdersOpen, setActiveOrdersOpen] = useState(false);

  // ── addMode: band stol ustiga bosish → mavjud orderga qo'shish ──
  const [addMode, setAddMode]               = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);

  // ── Table filter ──
  const [tableTypeFilter, setTableTypeFilter] = useState('all');
  const [tableSearch, setTableSearch]         = useState('');

  // ── Order state ──
  const [cart, setCart]                         = useState([]);
  const [selectedTableId, setSelectedTableId]   = useState(null);
  const [orderType, setOrderType]               = useState(OrderType.DineIn);
  const [serviceCharge, setServiceCharge]       = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // URL dan orderId (OrdersPage → POS)
  useEffect(() => {
    const id = searchParams.get('orderId');
    if (id) {
      setEditingOrderId(id);
      setAddMode(true);
      setCart([]);
      setStep('menu');
      const np = new URLSearchParams(searchParams);
      np.delete('orderId');
      setSearchParams(np, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Queries ──
  const { data: products = [],  isLoading: pLoading }     = useQuery({ queryKey: ['products'],   queryFn: productAPI.getAll });
  const { data: categories = [] }                          = useQuery({ queryKey: ['categories'], queryFn: categoryAPI.getAll });
  const { data: tables = [],    isLoading: tablesLoading } = useQuery({ queryKey: ['tables'], queryFn: tableAPI.getAll, select: (d) => Array.isArray(d) ? d.map(normalizeTable) : [], staleTime: 10_000, refetchInterval: 60_000, refetchOnMount: true });

  // Polling yo'q — useOrderHub (AppLayout) SignalR orqali invalidate qiladi.
  // 60s stale fallback (SignalR ulanmagan holat uchun).
  const { data: activeOrders = [] } = useQuery({
    queryKey: waiter ? ['orders', 'my-active'] : ['orders'],
    queryFn:  waiter ? orderAPI.getMyActive : orderAPI.getAll,
    staleTime: 10_000,
    refetchInterval: 60_000,
  });
  const visibleActiveOrders = activeOrders.filter(o => o.orderStatus === 1);

  // Stol bloklash uchun BARCHA aktiv orderlar — ruxsat bo'lmasa bo'sh qaytadi
  const { data: allOrdersRaw = [] } = useQuery({
    queryKey: ['orders', 'all-for-blocking'],
    queryFn: async () => {
      try { return await orderAPI.getAll(); }
      catch { return []; }
    },
    staleTime: 10_000,
    refetchInterval: 60_000,
  });
  const allActiveOrders = allOrdersRaw.filter(o => o.orderStatus === 1);

  // addMode uchun: mavjud orderni yuklash
  const { data: editingOrder, isLoading: editingLoading } = useQuery({
    queryKey: ['order', editingOrderId],
    queryFn:  () => orderAPI.getById(editingOrderId),
    enabled:  !!editingOrderId && addMode,
  });

  // addMode + URL flow: table info ni orderdan olish
  useEffect(() => {
    if (editingOrder && addMode && !selectedTableId) {
      if (editingOrder.tableNumber > 0) {
        const t = tables.find(t => t.tableNumber === editingOrder.tableNumber);
        if (t) setSelectedTableId(t.id);
      }
      setOrderType(editingOrder.orderType || OrderType.DineIn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingOrder, tables]);

  // ── Mutations ──

  // 1. Yangi buyurtma yaratish — 5 marta retry, exponential backoff
  const createMutation = useMutation({
    mutationFn: async (data) => {
      let lastErr;
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          const res = await orderAPI.create(data);
          lastErr = null;
          return res;
        } catch (err) {
          lastErr = err;
          if (attempt < 5) await new Promise(r => setTimeout(r, 400 * attempt));
        }
      }
      throw lastErr;
    },
    onSuccess: (data, variables) => {
      if (printQueueRef.current) {
        autoPrint(data?.id ?? data?.Id);
        printQueueRef.current = null;
      }

      // Stol statusini Band (NotEmpty=2) qilib yangilash.
      // Backend order yaratganda tableStatus ni avtomatik o'zgartirmaydi —
      // shuning uchun biz PATCH /Table/UpdateStatus/{id} ni chaqiramiz.
      if (variables.tableId) {
        // 1. Optimistic update — boshqa foydalanuvchilar uchun SignalR event kelgunicha
        //    cache'ni darhol yangilaymiz (UI'da stol "Band" ko'rinadi)
        queryClient.setQueryData(['tables'], (old) =>
          Array.isArray(old)
            ? old.map(t =>
                t.id === variables.tableId
                  ? { ...t, tableStatus: TableStatus.NotEmpty }
                  : t
              )
            : old
        );
      }

      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'my-active'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success("Buyurtma qabul qilindi!");
      clearAll();
    },
    onError: (err) => {
      const detail = err?.response?.data?.detail;
      const title  = err?.response?.data?.title || err?.response?.data?.message;
      toast.error(detail || title || "Buyurtma yuborishda xatolik");
    },
  });

  // 2. Mavjud buyurtmaga mahsulot qo'shish (addMode)
  // EF Core optimistic concurrency: har bir item uchun 6 marta retry,
  // exponential backoff (400ms, 800ms, 1200ms, 1600ms, 2000ms).
  // Itemlar orasida 200ms kutiladi.
  const addToExistingMutation = useMutation({
    mutationFn: async () => {
      const sleep = (ms) => new Promise(r => setTimeout(r, ms));
      const MAX_ATTEMPTS = 6;

      for (let idx = 0; idx < cart.length; idx++) {
        const item = cart[idx];
        let lastErr = null;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          try {
            await orderAPI.increaseItem(editingOrderId, item.productId, item.count);
            lastErr = null;
            break;
          } catch (err) {
            lastErr = err;
            // 400 = server validatsiya xatosi, retry foydasi yo'q
            if (err?.response?.status === 400) break;
            if (attempt < MAX_ATTEMPTS) {
              await sleep(400 * attempt); // 400, 800, 1200, 1600, 2000ms
            }
          }
        }

        if (lastErr) throw lastErr;

        // Itemlar orasida kichik pauza (keyingi item uchun DB versiyasi yangilansin)
        if (idx < cart.length - 1) await sleep(200);
      }
    },
    onSuccess: () => {
      if (printQueueRef.current) {
        autoPrint(editingOrderId);
        printQueueRef.current = null;
      }
      queryClient.invalidateQueries({ queryKey: ['order', editingOrderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'my-active'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success("Mahsulotlar qo'shildi!");
      clearAll();
    },
    onError: (err) => {
      const status = err?.response?.status;
      const data   = err?.response?.data;
      const msg    = (typeof data === 'string' ? data : null)
                  || data?.detail
                  || data?.message
                  || data?.title
                  || err?.message
                  || '';
      if (status === 400) {
        toast.error(msg || "Mahsulot qo'shib bo'lmadi (400)");
      } else if (msg.toLowerCase().includes('concurren') || msg.toLowerCase().includes('affect')) {
        toast.error("Server band, iltimos bir necha soniyadan keyin qayta urining.");
      } else {
        toast.error(msg || "Qo'shishda xatolik");
      }
    },
  });

  // 3. Vositachilik haqqini o'zgartirish (admin/kassa, addMode)
  const serviceChargeMutation = useMutation({
    mutationFn: ({ orderId, value }) => orderAPI.changeServiceCharge(orderId, value),
    onMutate: ({ orderId, value }) => {
      // Optimistic: UI ni darhol yangilaymiz
      queryClient.setQueryData(['order', orderId], (old) =>
        old ? { ...old, serviceCharge: value } : old
      );
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err, { orderId, value }) => {
      // Rollback
      queryClient.setQueryData(['order', orderId], (old) =>
        old ? { ...old, serviceCharge: !value } : old
      );
      const msg = err?.response?.data?.message || err?.response?.data || "Xatolik";
      toast.error(typeof msg === 'string' ? msg : "Xizmat haqqini o'zgartirish mum'kin emas");
    },
  });

  // ── Cart helpers ──
  const addToCart = (product) => {
    // Admin / kassa addMode da: orderdagi mavjud mahsulotni qo'shib bo'lmaydi
    if (!waiter && addMode) {
      const alreadyInOrder = editingOrder?.items?.some(i => i.productId === product.id);
      if (alreadyInOrder) {
        toast.error(`"${product.name}" mahsuloti buyurtmada band`);
        return;
      }
    }
    setCart(prev => {
      const ex = prev.find(i => i.productId === product.id);
      if (ex) return prev.map(i => i.productId === product.id ? { ...i, count: i.count + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, price: product.price, count: 1, terminalTag: resolveTag(product.terminalTag ?? 1) }];
    });
  };

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
    setServiceCharge(true);
    setSelectedCategory(null);
    setEditingOrderId(null);
    setAddMode(false);
    setCartOpen(false);
    setStep('tables');
  };

  const totalAmount = useMemo(
    () => cart.reduce((s, i) => s + i.price * i.count, 0),
    [cart]
  );

  const existingTotal = useMemo(
    () => (editingOrder?.items || []).reduce((s, i) => s + (i.priceAtTime || 0) * i.count, 0),
    [editingOrder]
  );

  // ── Submit ──
  const handleSubmit = () => {
    if (addMode) {
      if (cart.length === 0) { toast.error("Yangi mahsulot qo'shmadingiz"); return; }
      printQueueRef.current = {
        cart: [...cart],
        tableNumber: editingOrder?.tableNumber ?? 0,
        sku: editingOrder?.sku ?? '',
      };
      addToExistingMutation.mutate();
      return;
    }

    if (cart.length === 0) { toast.error("Savatcha bo'sh"); return; }

    if (orderType === OrderType.DineIn && !selectedTableId) {
      toast.error("Stol tanlang"); return;
    }

    // Yakuniy blok: stol hali ham band emasligini tekshir (race condition)
    if (orderType === OrderType.DineIn && selectedTableId) {
      const activeForTable = allActiveOrders.find(o => o.tableNumber === selectedTable?.tableNumber);
      if (activeForTable) {
        toast.error(`Stol #${selectedTable?.tableNumber} allaqachon band!`);
        return;
      }
    }

    const userId = getUserId(user);
    if (!userId) { toast.error("Foydalanuvchi ma'lumotlari topilmadi"); return; }

    printQueueRef.current = {
      cart: [...cart],
      tableNumber: selectedTable?.tableNumber ?? 0,
    };

    createMutation.mutate({
      userId,
      ...(orderType === OrderType.DineIn && selectedTableId ? { tableId: selectedTableId } : {}),
      orderType: orderType === OrderType.DineIn ? 'DineIn' : 'TakeOut',
      serviceCharge,
      items: cart.map(i => ({ productId: i.productId, count: i.count })),
    });
  };


  // ── Navigation ──
  const handleSelectTable = (table) => {
    setSelectedTableId(table.id);
    setOrderType(OrderType.DineIn);

    // Stol band: tableStatus bo'yicha YOKI istalgan foydalanuvchining aktiv orderi mavjud
    const statusBusy    = table.tableStatus !== TableStatus.Empty && table.tableStatus !== 1;
    const existingOrder = allActiveOrders.find(o => o.tableNumber === table.tableNumber);

    if (statusBusy || existingOrder) {
      if (existingOrder) {
        if (!waiter) {
          // Admin / kassa: stol buyurtmada band — kirish yo'q
          toast.error(`Stol #${table.tableNumber} buyurtmada band`);
          return;
        }
        // Ofitsant: mavjud orderni tahrirlash rejiimga o'tish
        setEditingOrderId(existingOrder.id);
        setAddMode(true);
        setCart([]);
        setStep('menu');
      } else {
        toast.error(`Stol #${table.tableNumber} band`);
      }
      return;
    }

    // Bo'sh stol — yangi order
    setEditingOrderId(null);
    setAddMode(false);
    setCart([]);
    setStep('menu');
  };

  const handleTakeOut = () => {
    setSelectedTableId(null);
    setOrderType(OrderType.TakeOut);
    setAddMode(false);
    setEditingOrderId(null);
    setCart([]);
    setStep('menu');
  };

  const handleBack = () => {
    setAddMode(false);
    setEditingOrderId(null);
    setCart([]);
    setSelectedTableId(null);
    setCartOpen(false);
    setStep('tables');
  };

  // Active orders: band stol bo'lsa → addMode, aks holda normal
  const handleActiveOrderClick = (order) => {
    setEditingOrderId(order.id);
    setAddMode(true);
    setCart([]);
    if (order.tableNumber > 0) {
      const t = tables.find(t => t.tableNumber === order.tableNumber);
      if (t) setSelectedTableId(t.id);
      else setSelectedTableId(null);
    } else {
      setSelectedTableId(null);
    }
    setOrderType(order.orderType || OrderType.DineIn);
    setStep('menu');
    setActiveOrdersOpen(false);
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

  // Aktiv buyurtma (status=1) bo'lgan stollarning raqamlari → blok uchun (barcha userlar uchun)
  const busyTableNumbers = useMemo(
    () => new Set(allActiveOrders.map(o => o.tableNumber)),
    [allActiveOrders]
  );
  const cartCount     = cart.reduce((s, i) => s + i.count, 0);
  const isPending     = addMode ? addToExistingMutation.isPending : createMutation.isPending;

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">

      {/* ══ HEADER ════════════════════════════════════════════════════════════ */}
      <header className="flex-shrink-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3">

          {step === 'menu' && (
            <button onClick={handleBack}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors -ml-1 shrink-0">
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
          )}

          <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
            {step === 'tables' ? (
              <div>
                <h1 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white leading-tight">POS Terminal</h1>
                <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">Stol tanlang yoki olib ketish</p>
              </div>
            ) : (
              <>
                <div>
                  <h1 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight">
                    {orderType === OrderType.TakeOut
                      ? 'Olib ketish'
                      : selectedTable
                      ? `Stol #${selectedTable.tableNumber}`
                      : 'Menyu'}
                  </h1>
                  {addMode && editingOrder && (
                    <p className="text-xs text-orange-500 font-semibold">
                      #{editingOrder.sku} · Qo'shish rejimi
                    </p>
                  )}
                </div>

                {/* Order type toggle — faqat kassa/admin, yangi order uchun */}
                {!waiter && !addMode && (
                  <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 text-xs shrink-0">
                    <button
                      onClick={() => setOrderType(OrderType.DineIn)}
                      className={`px-2.5 sm:px-3 py-1.5 font-semibold flex items-center gap-1 transition-colors ${
                        orderType === OrderType.DineIn ? 'bg-orange-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <UtensilsCrossed size={12} /><span className="hidden sm:inline">Ichida</span>
                    </button>
                    <button
                      onClick={() => { setOrderType(OrderType.TakeOut); setSelectedTableId(null); }}
                      className={`px-2.5 sm:px-3 py-1.5 font-semibold flex items-center gap-1 transition-colors ${
                        orderType === OrderType.TakeOut ? 'bg-orange-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <ShoppingBag size={12} /><span className="hidden sm:inline">Olib ketish</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>


          {/* Faol buyurtmalar tugmasi */}
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
                  tableTypeFilter === value
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                }`}
              >
                {Icon && <Icon size={11} />}
                {label}
              </button>
            ))}
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

          <div className="p-4 sm:p-6 space-y-6">
            {/* Olib ketish — kassa/admin */}
            {!waiter && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Maxsus</p>
                <button
                  onClick={handleTakeOut}
                  className="flex items-center gap-3 px-5 py-4 rounded-2xl border-2 border-dashed
                             border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900
                             hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10
                             transition-all group w-full sm:w-auto"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <ShoppingBag size={20} className="text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Olib ketish</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Stol kerak emas</p>
                  </div>
                </button>
              </div>
            )}

            {/* Stollar grid */}
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
              [TableType.Simple, TableType.Terrace, TableType.VIP].map(type => {
                const group = filteredTables.filter(t => t.tableType === type);
                if (!group.length) return null;
                const lbl = type === TableType.Simple ? 'Ichkari' : type === TableType.Terrace ? 'Terasa' : 'VIP';
                return (
                  <div key={type}>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{lbl}</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                      {group.map(t => <TableCard key={t.id} table={t} onClick={() => handleSelectTable(t)} hasActiveOrder={busyTableNumbers.has(t.tableNumber)} />)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {filteredTables.map(t => <TableCard key={t.id} table={t} onClick={() => handleSelectTable(t)} hasActiveOrder={busyTableNumbers.has(t.tableNumber)} />)}
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
                !selectedCategory ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Barchasi
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  selectedCategory === cat.id ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
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
                        {product.imageUrl
                          ? <img src={getImgUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed size={24} className="text-gray-300" /></div>
                        }
                      </div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 mb-1">{product.name}</p>
                      <p className="text-xs font-bold text-orange-600">{product.price?.toLocaleString()} so'm</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Floating savatcha tugmasi ── */}
          {/* addMode: doim ko'rinadí (mavjud order bor); yangi order: faqat cart>0 da */}
          {(addMode || cart.length > 0) && (
            <div className="absolute bottom-5 right-4 sm:right-6 z-20">
              <button
                onClick={() => setCartOpen(true)}
                className={`flex items-center gap-3 pl-4 pr-5 py-3.5 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 ${
                  cart.length > 0
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200 dark:shadow-orange-900/40'
                    : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-gray-200 dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="relative shrink-0">
                  <ShoppingCart size={20} />
                  {cart.length > 0 && (
                    <span className={`absolute -top-2.5 -right-2.5 min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center font-black text-[10px] ${
                      cart.length > 0 ? 'bg-white text-orange-500' : 'bg-orange-500 text-white'
                    }`}>
                      {cartCount}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  {cart.length > 0 ? (
                    <>
                      <p className="text-[10px] font-semibold opacity-80 leading-tight">
                        {addMode ? 'Yangi qo\'shilmoqda' : 'Savatcha'}
                      </p>
                      <p className="text-sm font-black leading-tight">+{totalAmount.toLocaleString()} so'm</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] font-semibold opacity-70 leading-tight">Mavjud buyurtma</p>
                      <p className="text-sm font-black leading-tight">Ko'rish</p>
                    </>
                  )}
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ SAVATCHA DRAWER ═══════════════════════════════════════════════════ */}
      <Drawer open={cartOpen} onClose={() => setCartOpen(false)}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-800 flex-shrink-0">
          <div>
            {addMode && editingOrder ? (
              <>
                <h2 className="text-base font-black text-gray-900 dark:text-white">
                  {editingOrder.orderType === OrderType.TakeOut
                    ? 'Olib ketish'
                    : selectedTable
                    ? `Stol #${selectedTable.tableNumber}`
                    : 'Buyurtma'} · #{editingOrder.sku}
                </h2>
                <p className="text-xs text-orange-500 font-semibold">Mavjud buyurtmaga qo'shish</p>
              </>
            ) : addMode ? (
              <>
                <h2 className="text-base font-black text-gray-900 dark:text-white">Buyurtma yuklanmoqda</h2>
                <p className="text-xs text-gray-400">Iltimos kuting...</p>
              </>
            ) : (
              <>
                <h2 className="text-base font-black text-gray-900 dark:text-white">Savatcha</h2>
                <p className="text-xs text-gray-400">{cartCount} ta mahsulot</p>
              </>
            )}
          </div>
          <button onClick={() => setCartOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* ── Items ── */}
        <div className="flex-1 overflow-y-auto px-5">

          {addMode ? (
            editingLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-orange-500" size={28} />
              </div>
            ) : editingOrder ? (
              <>
                {/* ── MAVJUD BUYURTMA (read-only) ── */}
                <div className="pt-4 pb-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      Mavjud buyurtma
                    </span>
                    {fmtTime(editingOrder.createdAt) && (
                      <span className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Clock size={9} /> {fmtTime(editingOrder.createdAt)}
                      </span>
                    )}
                  </div>

                  {(editingOrder.items || []).length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-2">Mahsulotlar yo'q</p>
                  ) : (
                    (editingOrder.items || []).map(item => (
                      <ExistingItemRow key={item.id ?? item.productId} item={item} />
                    ))
                  )}

                  {/* Mavjud jami */}
                  <div className="flex items-center justify-between pt-2 mt-1">
                    <span className="text-xs text-gray-400 dark:text-gray-500">Mavjud jami:</span>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                      {existingTotal.toLocaleString()} so'm
                    </span>
                  </div>
                </div>

                {/* ── AJRATUVCHI CHIZIQ ── */}
                <div className="my-3 border-t-2 border-dashed border-gray-200 dark:border-gray-700" />

                {/* ── YANGI QO'SHILMOQDA ── */}
                <div className="pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                      Yangi qo'shilmoqda
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock size={9} /> {nowTime()}
                    </span>
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                      <ShoppingCart size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Yangi mahsulot tanlang</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <CartRow
                        key={item.productId}
                        item={item}
                        onIncrease={increaseCart}
                        onDecrease={decreaseCart}
                        onRemove={removeFromCart}
                      />
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <p className="text-sm">Buyurtma topilmadi</p>
              </div>
            )
          ) : (
            // Normal mode
            cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <ShoppingCart size={36} className="mb-3 opacity-30" />
                <p className="text-sm">Savatcha bo'sh</p>
              </div>
            ) : (
              cart.map(item => (
                <CartRow
                  key={item.productId}
                  item={item}
                  onIncrease={increaseCart}
                  onDecrease={decreaseCart}
                  onRemove={removeFromCart}
                />
              ))
            )
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-4 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex-shrink-0">

          {/* Jami ko'rsatish */}
          {addMode && editingOrder ? (
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Mavjud jami:</span>
                <span className="font-semibold">{existingTotal.toLocaleString()} so'm</span>
              </div>
              {cart.length > 0 && (
                <div className="flex justify-between text-xs text-orange-500 font-semibold">
                  <span>Yangi:</span>
                  <span>+{totalAmount.toLocaleString()} so'm</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Jami:</span>
                <span className="text-xl font-black text-gray-900 dark:text-white">
                  {(existingTotal + totalAmount).toLocaleString()} so'm
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              {serviceCharge && (
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400 dark:text-gray-500">Xizmat haqqi (15%):</span>
                  <span className="text-rose-500 font-semibold">
                    +{Math.round(totalAmount * 0.15).toLocaleString()} so'm
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Jami:</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {serviceCharge
                    ? Math.round(totalAmount * 1.15).toLocaleString()
                    : totalAmount.toLocaleString()} so'm
                </span>
              </div>
            </div>
          )}

          {/* Xizmat haqqi toggle */}
          {!waiter && !addMode && (
            // Yangi order uchun: lokal state
            <button
              onClick={() => setServiceCharge(p => !p)}
              className={`w-full mb-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                serviceCharge
                  ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              <Percent size={12} />
              {serviceCharge ? "Xizmat haqqi: 15% (o'chirish)" : "Xizmat haqqi: yo'q (yoqish)"}
            </button>
          )}
          {!waiter && addMode && editingOrder && (
            // Mavjud order uchun: backend ga PATCH
            <button
              disabled={serviceChargeMutation.isPending}
              onClick={() => serviceChargeMutation.mutate({
                orderId: editingOrderId,
                value: !(editingOrder.serviceCharge ?? true),
              })}
              className={`w-full mb-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors disabled:opacity-50 ${
                (editingOrder.serviceCharge ?? true)
                  ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              <Percent size={12} />
              {(editingOrder.serviceCharge ?? true)
                ? "Xizmat haqqi: 15% (o'chirish)"
                : "Xizmat haqqi: yo'q (yoqish)"}
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={clearAll}
              className="flex-1 py-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700
                         text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-colors"
            >
              Bekor
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || (addMode && cart.length === 0)}
              className="flex-[2] py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold
                         text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2
                         shadow-lg shadow-orange-200 dark:shadow-orange-900/30"
            >
              {isPending
                ? <><Loader2 size={16} className="animate-spin" /> Yuborilmoqda...</>
                : addMode
                ? <><Plus size={16} /> Qo'shish</>
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
          <button onClick={() => setActiveOrdersOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
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
                onClick={() => handleActiveOrderClick(order)}
              />
            ))
          )}
        </div>
      </Drawer>

    </div>
  );
};

export default POSTerminal;
