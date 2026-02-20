import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryAPI } from '../api/categories';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Grid3x3 } from 'lucide-react';

export default function CategoriesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
  });

  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();

  // Get all categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryAPI.getAll,
    enabled: hasPermission('Categories_Read'),
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: categoryAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast.success('Kategoriya qo\'shildi');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: categoryAPI.update,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast.success('Kategoriya yangilandi');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: categoryAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast.success('Kategoriya o\'chirildi');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const categoryData = {
      name: formData.name,
    };

    if (editingCategory) {
      // Update
      updateMutation.mutate({
        ...categoryData,
        id: editingCategory.id,
      });
    } else {
      // Create
      createMutation.mutate(categoryData);
    }
  };

  const handleDelete = (id) => {
    if (confirm('Rostdan ham o\'chirmoqchimisiz?')) {
      deleteMutation.mutate(id);
    }
  };

  if (!hasPermission('Categories_Read')) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Sizda kategoriyalarni ko'rish huquqi yo'q</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kategoriyalar</h1>
          <p className="text-gray-600 mt-2">Mahsulot kategoriyalari</p>
        </div>
        {hasPermission('Category_Create') && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span>Kategoriya qo'shish</span>
          </button>
        )}
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all group"
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Grid3x3 className="w-8 h-8 text-purple-600" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                {category.name}
              </h3>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {hasPermission('Category_Update') && (
                  <button
                    onClick={() => handleOpenModal(category)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                    <span className="text-sm font-medium">Tahrirlash</span>
                  </button>
                )}
                {hasPermission('Category_Delete') && (
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
            <Grid3x3 className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-600">Kategoriyalar yo'q</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCategory ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategoriya nomi *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Birinchi taomlar, Salatlar, Ichimliklar..."
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {editingCategory ? 'Yangilash' : 'Qo\'shish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
