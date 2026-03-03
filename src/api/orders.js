import api from './axios';

// ─── ENUMS ───────────────────────────────────────────────────────────────────

/** @enum {number} */
export const OrderStatus = {
  // Backend enum: Accepted=1, Cancelled=2, Finished=3
  1: 'Accepted',
  2: 'Cancelled',
  3: 'Finished',
};

// Numeric constants
OrderStatus.Accepted = 1;
OrderStatus.Cancelled = 2;
OrderStatus.Finished = 3;

// ─── NORMALIZER (backend string enums → numbers) ──────────────────────────────
// Backend returns orderStatus:"Accepted", orderType:"DineIn" as strings.
// Frontend compares with numbers everywhere, so we normalize at API layer.

const ORDER_STATUS_STR = { Accepted: 1, Cancelled: 2, Canselled: 2, Finished: 3 };
const ORDER_TYPE_STR = { DineIn: 1, TakeOut: 2 };

const normalizeOrder = (o) => {
  if (!o || typeof o !== 'object') return o;
  let orderStatus = typeof o.orderStatus === 'string'
    ? (ORDER_STATUS_STR[o.orderStatus] ?? o.orderStatus)
    : o.orderStatus;
  // 0 (LegacyCancelled) → 2 (Cancelled) ga normallashtirish
  if (orderStatus === 0) orderStatus = 2;
  return {
    ...o,
    orderStatus,
    orderType: typeof o.orderType === 'string'
      ? (ORDER_TYPE_STR[o.orderType] ?? o.orderType)
      : o.orderType,
  };
};

export const ORDER_STATUS_COLORS = {
  1: 'bg-blue-100 text-blue-700',    // Accepted
  2: 'bg-red-100 text-red-700',      // Cancelled
  3: 'bg-green-100 text-green-700',  // Finished
};

// Backward compatibility aliases
export const ORDER_STATUS_LABELS = OrderStatus;
export const ORDER_STATUS_STYLES = ORDER_STATUS_COLORS;

/** @enum {number} */
export const OrderType = {
  DineIn: 1,   // Ichida
  TakeOut: 2,  // Olib ketish
};

// Order Type Labels
export const ORDER_TYPE_LABELS = {
  [OrderType.DineIn]: 'Ichida',
  [OrderType.TakeOut]: 'Olib ketish',
};

// ─── API ─────────────────────────────────────────────────────────────────────

export const orderAPI = {
  /**
   * Barcha buyurtmalarni olish
   * GET /Order/GetAll
   */
  getAll: async () => {
    const res = await api.get('/Order/GetAll');
    return Array.isArray(res.data) ? res.data.map(normalizeOrder) : res.data;
  },

  /**
   * Bitta buyurtmani olish (FLAT struktura)
   * GET /Order/GetById/{orderId}
   * Response: { id, sku, orderType, orderStatus, totalAmount, waiterName, createdAt, tableNumber, items[] }
   */
  getById: async (orderId) => {
    const res = await api.get(`/Order/GetById/${orderId}`);
    return normalizeOrder(res.data);
  },

  /**
   * Ofitsantning faol buyurtmalari
   * GET /Order/GetMyActiveOrders/my-active
   */
  getMyActive: async () => {
    const res = await api.get('/Order/GetMyActiveOrders/my-active');
    return Array.isArray(res.data) ? res.data.map(normalizeOrder) : res.data;
  },

  /**
   * Yangi buyurtma yaratish
   * POST /Order/Create
   * @param {{ userId: string, tableId: string|null, orderType: number, items: {productId:string, count:number}[] }} data
   */
  create: async (data) => {
    console.log(data);
    const res = await api.post('/Order/Create', data);

    return res.data;
  },

  /**
   * Buyurtma itemini oshirish
   * PATCH /Order/IncreaseItem/{orderId}/items/increase?productId=x&count=n
   */
  increaseItem: async (orderId, productId, count = 1) => {
    const res = await api.patch(
      `/Order/IncreaseItem/${orderId}/items/increase`,
      null,
      { params: { productId, count } }
    );
    return res.data;
  },

  /**
   * Buyurtma itemini kamaytirish
   * PATCH /Order/DecreaseItem/{orderId}/items/decrease?productId=x&count=n&aboutOfCancelled=reason
   */
  decreaseItem: async (orderId, productId, count = 1, aboutOfCancelled = '') => {
    const res = await api.patch(
      `/Order/DecreaseItem/${orderId}/items/decrease`,
      null,
      { params: { productId, count, aboutOfCancelled } }
    );
    return res.data;
  },

  /**
   * Stolni almashtirish
   * PATCH /Order/ChangeTable/{orderId}/table?newTableId=x
   */
  changeTable: async (orderId, newTableId) => {
    const res = await api.patch(
      `/Order/ChangeTable/${orderId}/table`,
      null,
      { params: { newTableId } }
    );
    return res.data;
  },

  /**
   * Statusni o'zgartirish
   * PATCH /Order/ChangeStatus/{orderId}/status?status=n
   * MUHIM: status faqat 1, 2, 3 bo'lishi mumkin (0 ga o'tkazib bo'lmaydi!)
   */
  changeStatus: async (orderId, status) => {
    if (![1, 2, 3].includes(Number(status))) {
      throw new Error('Status faqat  1, 2, 3 qiymatlarni qabul qiladi');
    }
    const res = await api.patch(
      `/Order/ChangeStatus/${orderId}/status`,
      null,
      { params: { status } }
    );
    return res.data;
  },

  /**
   * Buyurtmani o'chirish (to'liq DB dan)
   * DELETE /Order/Delete/{orderId}
   */
  delete: async (orderId) => {
    const res = await api.delete(`/Order/Delete/${orderId}`);
    return res.data;
  },

  /**
   * Buyurtma itemini bekor qilish
   * PATCH /Order/CancelItem/{orderId}/items/cancel?productId=x
   */
  cancelItem: async (orderId, productId, reason = '') => {
    const res = await api.patch(
      `/Order/CancelItem/${orderId}/items/cancel`,
      null,
      { params: { productId, ...(reason && { reason }) } }
    );
    return res.data;
  },
};
