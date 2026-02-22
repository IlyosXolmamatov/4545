import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { useState } from 'react';

// Basic colors
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1'];

export default function AnalyticsPanel() {
  const [topCount] = useState(5);

  // These endpoints are expected to return chart-ready data. If backend doesn't
  // have these exact endpoints, the component will show an error message.
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['analytics', 'orders'],
    queryFn: async () => (await api.get('/Analytics/orders')).data,
  });

  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['analytics', 'products', topCount],
    queryFn: async () => (await api.get(`/Analytics/products?topCount=${topCount}`)).data,
  });

  const { data: tablesData, isLoading: tablesLoading, error: tablesError } = useQuery({
    queryKey: ['analytics', 'tables'],
    queryFn: async () => (await api.get('/Analytics/tables')).data,
  });

  return (
    <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Analytics</h3>

      {/* Orders Over Time */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">Buyurtmalar (so'nggi davr)</p>
        {ordersLoading ? (
          <div className="text-sm text-gray-500">Yuklanmoqda...</div>
        ) : ordersError ? (
          <div className="text-sm text-red-500">Analytics/orders yuklanmadi</div>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={ordersData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
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
        <p className="text-sm text-gray-600 mb-2">Top mahsulotlar</p>
        {productsLoading ? (
          <div className="text-sm text-gray-500">Yuklanmoqda...</div>
        ) : productsError ? (
          <div className="text-sm text-red-500">Analytics/products yuklanmadi</div>
        ) : (
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={productsData || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tables Occupancy */}
      <div>
        <p className="text-sm text-gray-600 mb-2">Stollar bandligi</p>
        {tablesLoading ? (
          <div className="text-sm text-gray-500">Yuklanmoqda...</div>
        ) : tablesError ? (
          <div className="text-sm text-red-500">Analytics/tables yuklanmadi</div>
        ) : (
          <div style={{ width: '100%', height: 220 }} className="flex items-center">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={tablesData || []} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={70} label />
                {(tablesData || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
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
