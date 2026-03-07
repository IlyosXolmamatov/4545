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
    const d = res.data;
    return Array.isArray(d) ? d : (Array.isArray(d?.topProducts) ? d.topProducts : []);
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
  /**
   * Ofitsantlar statistikasi
   * GET /Analytics/waiters?period=Daily
   * Response: { orderRankings: [{waiterId, waiterName, totalOrders, totalRevenue, rank}], revenueRankings: [...] }
   */
  getWaiters: async ({ period = 'Daily', startDate, endDate } = {}) => {
    const res = await api.get('/Analytics/waiters', { params: buildParams(period, startDate, endDate) });
    return res.data;
  },

  /**
   * Eng band soatlar
   * GET /Analytics/peak-time?period=Daily
   * Response: [{ hour, totalOrders, totalRevenue, uniqueCustomers }, ..., { startDate, endDate }]
   */
  getPeakTime: async ({ period = 'Daily', startDate, endDate } = {}) => {
    const res = await api.get('/Analytics/peak-time', { params: buildParams(period, startDate, endDate) });
    const d = res.data;
    if (!Array.isArray(d)) {
      // Response: { peakTimes: [...], startDate, endDate }
      const arr = d?.peakTimes ?? d?.peakHours ?? d?.data ?? d?.hours ?? [];
      return Array.isArray(arr) ? arr.filter((r) => r.hour != null) : [];
    }
    return d.filter((r) => r.hour != null);
  },

  getProductStats: async ({ period = 'Weekly', startDate, endDate } = {}) => {
    const res = await api.get('/Analytics/products', { params: buildParams(period, startDate, endDate, { topCount: 1000 }) });
    const d = res.data;
    return Array.isArray(d) ? d : (Array.isArray(d?.topProducts) ? d.topProducts : []);
  },

  /** POST /DailyClosing/Close — kunlik yopish */
  dailyClose: async () => {
    const res = await api.post('/DailyClosing/Close');
    return res.data;
  },
};
