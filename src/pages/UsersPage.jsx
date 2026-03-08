import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, X, Loader2,
  Users, Shield, User,
} from 'lucide-react';

import { userAPI, UserRole, ROLE_LABELS } from '../api/users';
import { useAuthStore } from '../store/authStore';
import ToggleActiveButton from '../components/ToggleActiveButton';
import ConfirmModal from '../components/ConfirmModal';

// --- BADGE COMPONENTS ---

const ROLE_STYLES = {
  [UserRole.Admin]:   'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  [UserRole.Waiter]:  'bg-blue-100   dark:bg-blue-900/30  text-blue-700   dark:text-blue-300',
  [UserRole.Cashier]: 'bg-amber-100  dark:bg-amber-900/30 text-amber-700  dark:text-amber-300',
};

const RoleBadge = ({ role }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_STYLES[role] ?? 'bg-slate-100 text-slate-600'}`}>
    {ROLE_LABELS[role] ?? role}
  </span>
);

// --- DEFAULT FORM ---
const DEFAULT_FORM = {
  name:     '',
  username: '',
  password: '',
  role:     UserRole.Waiter,
  isActive: true,
};

// --- MAIN COMPONENT ---

export default function UsersPage() {
  const queryClient  = useQueryClient();
  const { hasPermission } = useAuthStore();
  const [dlg, setDlg] = useState(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null = create mode
  const [formData, setFormData]       = useState(DEFAULT_FORM);
  const [filter, setFilter]           = useState('all'); // 'all' | 'active' | 'inactive'

  // ── DATA ──
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn:  userAPI.getAll,
  });

  // ── FILTER & STATS ──
  const filtered = users.filter((user) => {
    if (filter === 'active') return user.isActive;
    if (filter === 'inactive') return !user.isActive;
    return true;
  });

  const total    = users.length;
  const active   = users.filter((u) => u.isActive).length;
  const inactive = users.filter((u) => !u.isActive).length;

  // ── MUTATIONS ──
  const createMutation = useMutation({
    mutationFn: userAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success("Xodim qo'shildi");
      closeModal();
    },
    onError: (err) => handleError(err, "Qo'shishda xatolik"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Xodim yangilandi');
      closeModal();
    },
    onError: (err) => handleError(err, 'Yangilashda xatolik'),
  });

  const deleteMutation = useMutation({
    mutationFn: userAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success("Xodim o'chirildi");
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  // Optimistic toggle (darhol UI yangilanadi, xato bo'lsa qaytadi)
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }) => {
      const users = queryClient.getQueryData(['users']) ?? [];
      const user  = users.find(u => u.id === userId);
      return userAPI.update(userId, {
        id:       userId,
        name:     user.name,
        role:     user.role,
        isActive,
      });
    },
    onMutate: async ({ userId, isActive }) => {
      await queryClient.cancelQueries(['users']);
      const prev = queryClient.getQueryData(['users']);
      queryClient.setQueryData(['users'], (old = []) =>
        old.map(u => u.id === userId ? { ...u, isActive } : u)
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['users'], context.prev);
      toast.error('Holatni yangilashda xatolik');
    },
    onSuccess: () => toast.success('Holat yangilandi'),
    onSettled: () => queryClient.invalidateQueries(['users']),
  });

  // ── HELPERS ──
  const handleError = (err, fallback) => {
    const msg = err.response?.data?.message || fallback || 'Xatolik yuz berdi';
    toast.error(msg);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // ── MODAL ──
  const openCreateModal = () => {
    setEditingUser(null);
    setFormData(DEFAULT_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name:     user.name,
      username: user.username,
      password: '',
      role:     user.role,
      isActive: user.isActive,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // ── SUBMIT ──
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Ism kiritish majburiy');
      return;
    }

    if (!editingUser) {
      // CREATE validatsiya
      if (!formData.username.trim()) {
        toast.error('Username kiritish majburiy');
        return;
      }
      if (formData.password.length < 6) {
        toast.error("Parol kamida 6 belgi bo'lishi kerak");
        return;
      }
      createMutation.mutate({
        name:     formData.name.trim(),
        username: formData.username.trim(),
        password: formData.password,
        role:     Number(formData.role),
      });
    } else {
      // UPDATE (username va password yuborilmaydi)
      updateMutation.mutate({
        id: editingUser.id,
        data: {
          id:       editingUser.id,
          name:     formData.name.trim(),
          role:     Number(formData.role),
          isActive: formData.isActive,
        },
      });
    }
  };

  // ── DELETE ──
  const handleDelete = (user) => {
    setDlg({
      message: `"${user.name}" xodimi o'chirilsinmi?`,
      confirmText: "Ha, o'chirish",
      onConfirm: () => deleteMutation.mutate(user.id),
    });
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  // ── RENDER ──
  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Xodimlar</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Barcha xodimlarni boshqarish</p>
        </div>
        {hasPermission('User_Create') && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-basand-400 hover:bg-basand-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-brand-200 transition-colors"
          >
            <Plus size={20} />
            Xodim qo'shish
          </button>
        )}
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Jami',   count: total,   color: 'text-slate-800 dark:text-slate-100'  },
          { label: 'Faol',   count: active,  color: 'text-green-600 dark:text-green-400', bold: true },
          { label: 'Nofaol', count: inactive, color: 'text-red-600 dark:text-red-400', bold: true },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border ${stat.bold ? 'border-basand-200 dark:border-basand-600 shadow-md' : 'border-slate-100 dark:border-slate-700 shadow-sm'}`}
          >
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">{stat.label}</p>
            <p className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* ── FILTER BUTTONS ── */}
      <div className="flex gap-2 mb-6">
        {[
          { label: 'Barchasi',   value: 'all' },
          { label: 'Faol',       value: 'active' },
          { label: 'Nofaol',     value: 'inactive' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f.value
                ? 'bg-basand-400 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-basand-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── LOADING ── */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="animate-spin text-basand-400" size={40} />
        </div>

      /* ── EMPTY STATE ── */
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Users size={56} className="mb-4 opacity-40" />
          <p className="text-lg font-medium mb-4">Hali xodimlar yo'q</p>
          {hasPermission('User_Create') && (
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 bg-basand-400 hover:bg-basand-500 text-white rounded-xl font-medium transition-colors"
            >
              Birinchi xodimni qo'shish
            </button>
          )}
        </div>

      /* ── TABLE ── */
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {['#', 'ISM', 'USERNAME', 'ROL', 'STATUS', 'HARAKATLAR'].map((col) => (
                    <th
                      key={col}
                      className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">

                    {/* Index */}
                    <td className="px-6 py-4 text-sm text-slate-400 dark:text-slate-500 font-medium w-12">
                      {idx + 1}
                    </td>

                    {/* Ism */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-basand-100 dark:bg-basand-800/30 flex items-center justify-center flex-shrink-0">
                          <User size={16} className="text-basand-500 dark:text-basand-300" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</span>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-mono">
                      @{user.username}
                    </td>

                    {/* Rol */}
                    <td className="px-6 py-4">
                      <RoleBadge role={user.role} />
                    </td>

                    {/* Status — toggle button */}
                    <td className="px-6 py-4">
                      {hasPermission('User_Update') ? (
                        <ToggleActiveButton
                          isActive={user.isActive}
                          onToggle={(newVal) =>
                            toggleActiveMutation.mutateAsync({ userId: user.id, isActive: newVal })
                          }
                        />
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {user.isActive ? 'Faol' : 'Nofaol'}
                        </span>
                      )}
                    </td>

                    {/* Harakatlar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {hasPermission('User_Update') && (
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Tahrirlash"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {hasPermission('User_Delete') && (
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="O'chirish"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
            Jami: <span className="font-semibold text-slate-700 dark:text-slate-200">{users.length}</span> ta xodim
          </div>
        </div>
      )}

      {/* ── MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl flex flex-col">

            {/* Modal header */}
            <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-basand-100 dark:bg-basand-800/30 flex items-center justify-center">
                  <Shield size={20} className="text-basand-500 dark:text-basand-300" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  {editingUser ? 'Xodimni tahrirlash' : 'Yangi xodim qo\'shish'}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={22} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">

              {/* Ism */}
              <div>
                <label className="block text-sm font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                  Ism <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ism familiya"
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-basand-300 outline-none transition"
                  required
                />
              </div>

              {/* Username va Parol — faqat CREATE rejimida */}
              {!editingUser && (
                <>
                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="johndoe"
                      autoComplete="off"
                      className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-basand-300 outline-none transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                      Parol <span className="text-red-500">*</span>
                      <span className="ml-1 text-xs font-normal text-slate-400">(kamida 6 belgi)</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-basand-300 outline-none transition"
                      required
                      minLength={6}
                    />
                  </div>
                </>
              )}

              {/* Rol */}
              <div>
                <label className="block text-sm font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                  Rol <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-basand-300 outline-none transition"
                >
                  <option value={UserRole.Admin}>Admin</option>
                  <option value={UserRole.Waiter}>Ofitsant</option>
                  <option value={UserRole.Cashier}>Kassir</option>
                </select>
              </div>

              {/* Status — faqat EDIT rejimida */}
              {editingUser && (
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-5 h-5 accent-brand-400 cursor-pointer"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Faol xodim</p>
                    <p className="text-xs text-slate-400">Tizimga kirish huquqi</p>
                  </div>
                </label>
              )}

              {/* Edit rejimida username ko'rsatish (o'zgartirib bo'lmaydi) */}
              {editingUser && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-600">
                  <p className="text-xs text-slate-400 mb-0.5">Username (o'zgartirilmaydi)</p>
                  <p className="text-sm font-mono text-slate-600 dark:text-slate-300">@{editingUser.username}</p>
                </div>
              )}

              {/* Footer buttons */}
              <div className="flex gap-3 pt-2 border-t dark:border-slate-700">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="flex-1 px-5 py-2.5 bg-basand-400 hover:bg-basand-500 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-200"
                >
                  {isMutating && <Loader2 className="animate-spin" size={18} />}
                  {editingUser ? 'Saqlash' : "Qo'shish"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        open={!!dlg}
        message={dlg?.message}
        confirmText={dlg?.confirmText}
        danger={dlg?.danger ?? true}
        onConfirm={() => { dlg?.onConfirm?.(); setDlg(null); }}
        onCancel={() => setDlg(null)}
      />
    </div>
  );
}
