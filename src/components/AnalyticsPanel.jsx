import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../api/analytics';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { useState } from 'react';
import PeriodFilter from './PeriodFilter';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1'];

export default function AnalyticsPanel() {
  const [filter, setFilter] = useState({ period: 1, startDate: null, endDate: null });

  // Disable queries when period=5 and dates not yet applied
  const customReady = filter.period !== 5 || (!!filter.startDate && !!filter.endDate);

  const toArr = (d) => (Array.isArray(d) ? d : []);

  const { data: ordersData = [], isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['analytics', 'orders', filter],
    queryFn: () => analyticsAPI.getOrders(filter),
    enabled: customReady,
    select: toArr,
  });

  const { data: productsData = [], isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['analytics', 'products', filter],
    queryFn: () => analyticsAPI.getTopProducts({ ...filter, topCount: 5 }),
    enabled: customReady,
    select: toArr,
  });

  const { data: tablesData = [], isLoading: tablesLoading, error: tablesError } = useQuery({
    queryKey: ['analytics', 'tables', filter],
    queryFn: () => analyticsAPI.getTables(filter),
    enabled: customReady,
    select: toArr,
  });

  return (
    <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      {/* Header + Period Filter */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Analytics</h3>
        <PeriodFilter filter={filter} onChange={setFilter} />
      </div>

      {/* Orders Over Time */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Buyurtmalar</p>
        {!customReady ? (
          <div className="text-sm text-gray-400 dark:text-gray-500">Sanalarni tanlang va Qo'llash bosing</div>
        ) : ordersLoading ? (
          <div className="text-sm text-gray-500">Yuklanmoqda...</div>
        ) : ordersError ? (
          <div className="text-sm text-red-500">Analytics/orders yuklanmadi</div>
        ) : (
          <div style={{ width: '100%', height: 220, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="#8884d8" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Products */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Top mahsulotlar</p>
        {!customReady ? (
          <div className="text-sm text-gray-400 dark:text-gray-500">Sanalarni tanlang va Qo'llash bosing</div>
        ) : productsLoading ? (
          <div className="text-sm text-gray-500">Yuklanmoqda...</div>
        ) : productsError ? (
          <div className="text-sm text-red-500">Analytics/products yuklanmadi</div>
        ) : (
          <div style={{ width: '100%', height: 240, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tables Occupancy */}
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Stollar bandligi</p>
        {!customReady ? (
          <div className="text-sm text-gray-400 dark:text-gray-500">Sanalarni tanlang va Qo'llash bosing</div>
        ) : tablesLoading ? (
          <div className="text-sm text-gray-500">Yuklanmoqda...</div>
        ) : tablesError ? (
          <div className="text-sm text-red-500">Analytics/tables yuklanmadi</div>
        ) : (
          <div style={{ width: '100%', height: 220, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tablesData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={70} label>
                  {tablesData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
