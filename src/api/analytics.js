import api from './axios';

// period: 1=Kunlik, 2=Haftalik, 3=Oylik, 4=Yillik, 5=Maxsus(startDate+endDate)
const buildParams = (period = 1, startDate, endDate, extra = {}) => {
  const params = { period, ...extra };
  if (period === 5) {
    if (startDate) params.startDate = startDate;
    if (endDate)   params.endDate   = endDate;
  }
  return params;
};

export const analyticsAPI = {
  /**
   * Buyurtmalar statistikasi (vaqt bo'yicha)
   * GET /Analytics/orders?period=&startDate=&endDate=
   */
  getOrders: async ({ period = 1, startDate, endDate } = {}) => {
    const res = await api.get('/Analytics/orders', { params: buildParams(period, startDate, endDate) });
    return res.data;
  },

  /**
   * Top mahsulotlar
   * GET /Analytics/products?period=&topCount=&startDate=&endDate=
   */
  getTopProducts: async ({ period = 1, startDate, endDate, topCount = 5 } = {}) => {
    const res = await api.get('/Analytics/products', { params: buildParams(period, startDate, endDate, { topCount }) });
    return res.data;
  },

  /**
   * Stollar bandligi
   * GET /Analytics/tables?period=&startDate=&endDate=
   */
  getTables: async ({ period = 1, startDate, endDate } = {}) => {
    const res = await api.get('/Analytics/tables', { params: buildParams(period, startDate, endDate) });
    return res.data;
  },

  /**
   * Barcha mahsulotlar statistikasi (cheksiz)
   * GET /Analytics/products?period=&topCount=1000&startDate=&endDate=
   */
  getProductStats: async ({ period = 1, startDate, endDate } = {}) => {
    const res = await api.get('/Analytics/products', { params: buildParams(period, startDate, endDate, { topCount: 1000 }) });
    return res.data;
  },
};
