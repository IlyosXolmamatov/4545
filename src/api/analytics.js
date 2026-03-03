import api from './axios';

// period string qiymatlari backend bilan mos:
// 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'Custom'
const buildParams = (period = 'Weekly', startDate, endDate, extra = {}) => {
  const params = { period, ...extra };
  if (period === 'Custom') {
    if (startDate) params.startDate = startDate;
    if (endDate)   params.endDate   = endDate;
  }
  return params;
};

export const analyticsAPI = {
  /**
   * Buyurtmalar statistikasi
   * GET /Analytics/orders?period=Weekly
   * Response: { totalOrders, totalRevenue, averageOrderValue, startDate, endDate }
   */
  getOrders: async ({ period = 'Weekly', startDate, endDate } = {}) => {
    const res = await api.get('/Analytics/orders', { params: buildParams(period, startDate, endDate) });
    return res.data;
  },

  /**
   * Top mahsulotlar
   * GET /Analytics/products?period=Weekly&topCount=5
   */
  getTopProducts: async ({ period = 'Weekly', startDate, endDate, topCount = 5 } = {}) => {
    const res = await api.get('/Analytics/products', { params: buildParams(period, startDate, endDate, { topCount }) });
    return res.data;
  },

  /**
   * Stollar bandligi
   * GET /Analytics/tables?period=Weekly
   * Response: { tables:[], averageOccupancyRate, averageTableDuration, startDate, endDate }
   */
  getTables: async ({ period = 'Weekly', startDate, endDate } = {}) => {
    const res = await api.get('/Analytics/tables', { params: buildParams(period, startDate, endDate) });
    return res.data;
  },

  /**
   * Barcha mahsulotlar statistikasi
   * GET /Analytics/products?period=Weekly&topCount=1000
   */
  getProductStats: async ({ period = 'Weekly', startDate, endDate } = {}) => {
    const res = await api.get('/Analytics/products', { params: buildParams(period, startDate, endDate, { topCount: 1000 }) });
    return res.data;
  },
};
