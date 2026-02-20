import { useAuthStore } from '../store/authStore';
import { Users, UtensilsCrossed, Table2, Grid3x3 } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuthStore();

  const stats = [
    {
      label: 'Xodimlar',
      value: '12',
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Mahsulotlar',
      value: '156',
      icon: UtensilsCrossed,
      color: 'from-orange-500 to-amber-600'
    },
    {
      label: 'Stollar',
      value: '24',
      icon: Table2,
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Kategoriyalar',
      value: '8',
      icon: Grid3x3,
      color: 'from-purple-500 to-purple-600'
    },
  ];

  return (
    <div className="p-4 sm:p-8 bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Xush kelibsiz, {user?.name || 'Admin'}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Tezkor harakatlar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all">
            <Users className="w-6 h-6 text-gray-600 dark:text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Xodim qo'shish</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all">
            <UtensilsCrossed className="w-6 h-6 text-gray-600 dark:text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Mahsulot qo'shish</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all">
            <Table2 className="w-6 h-6 text-gray-600 dark:text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Stol qo'shish</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all">
            <Grid3x3 className="w-6 h-6 text-gray-600 dark:text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Kategoriya qo'shish</p>
          </button>
        </div>
      </div>

      {/* Permissions Display */}
      {user?.permissions?.length > 0 && (
        <div className="mt-8 bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Sizning ruxsatlaringiz</h3>
          <div className="flex flex-wrap gap-2">
            {user.permissions.slice(0, 50).map((perm) => (
              <span
                key={perm}
                className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm"
              >
                {perm}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
