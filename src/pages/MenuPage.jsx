import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Plus, Search, Edit2, Trash2, X, Upload,
  Package, Loader2, UtensilsCrossed,
} from 'lucide-react';

import { productAPI, getImgUrl } from '../api/products';
import { categoryAPI } from '../api/categories';
import { useAuthStore } from '../store/authStore';
import ToggleActiveButton from '../components/ToggleActiveButton';
import ConfirmModal from '../components/ConfirmModal';

// ─── CATEGORY COLOR PALETTE ───────────────────────────────────────────────────
const CAT_PALETTE = [
  { active: 'bg-violet-500 shadow-violet-200 dark:shadow-violet-900/40', idle: 'border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20', dot: 'bg-violet-400', count: 'bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300' },
  { active: 'bg-blue-500 shadow-blue-200 dark:shadow-blue-900/40',       idle: 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',       dot: 'bg-blue-400',   count: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'   },
  { active: 'bg-emerald-500 shadow-emerald-200 dark:shadow-emerald-900/40', idle: 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20', dot: 'bg-emerald-400', count: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300' },
  { active: 'bg-amber-500 shadow-amber-200 dark:shadow-amber-900/40',    idle: 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',    dot: 'bg-amber-400',  count: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'  },
  { active: 'bg-rose-500 shadow-rose-200 dark:shadow-rose-900/40',       idle: 'border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20',       dot: 'bg-rose-400',   count: 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'   },
  { active: 'bg-cyan-500 shadow-cyan-200 dark:shadow-cyan-900/40',       idle: 'border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20',       dot: 'bg-cyan-400',   count: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300'   },
  { active: 'bg-fuchsia-500 shadow-fuchsia-200 dark:shadow-fuchsia-900/40', idle: 'border-fuchsia-200 dark:border-fuchsia-800 text-fuchsia-700 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-900/20', dot: 'bg-fuchsia-400', count: 'bg-fuchsia-100 dark:bg-fuchsia-900/60 text-fuchsia-700 dark:text-fuchsia-300' },
  { active: 'bg-indigo-500 shadow-indigo-200 dark:shadow-indigo-900/40', idle: 'border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20', dot: 'bg-indigo-400', count: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300' },
];

// ─── CATEGORY MODAL ───────────────────────────────────────────────────────────
const CategoryModal = ({ editing, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState(editing?.name ?? '');

  const saveMutation = useMutation({
    mutationFn: editing
      ? (data) => categoryAPI.update({ ...data, id: editing.id })
      : categoryAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(editing ? 'Kategoriya yangilandi' : "Kategoriya qo'shildi");
      onSuccess?.();
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Xatolik'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveMutation.mutate({ name: name.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {editing ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Kategoriya nomi *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Salatlar, Ichimliklar..."
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              required
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saveMutation.isPending && <Loader2 size={15} className="animate-spin" />}
              {editing ? 'Yangilash' : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── PRODUCT MODAL ────────────────────────────────────────────────────────────
const INITIAL_FORM = {
  name: '', price: '', categoryId: '', description: '', isActive: true, terminalTag: 1,
};

const ProductModal = ({ editing, categories, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(
    editing
      ? {
          name: editing.name,
          price: editing.price,
          categoryId: editing.categoryId,
          description: editing.description ?? '',
          isActive: editing.isActive,
          terminalTag: editing.terminalTag ?? 1,
        }
      : { ...INITIAL_FORM }
  );
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(getImgUrl(editing?.imageUrl) ?? null);

  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const buildPayload = () => {
    const fd = new FormData();
    if (editing) fd.append('Id', editing.id);
    fd.append('Name', form.name);
    fd.append('Description', form.description);
    fd.append('CategoryId', form.categoryId);
    fd.append('Price', parseFloat(form.price.toString().replace(',', '.')));
    fd.append('TerminalTag', parseInt(form.terminalTag));
    fd.append('IsActive', form.isActive);
    if (imageFile) fd.append('Image', imageFile);
    return fd;
  };

  const saveMutation = useMutation({
    mutationFn: editing ? productAPI.update : productAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(editing ? 'Mahsulot yangilandi' : "Mahsulot qo'shildi");
      onSuccess?.();
    },
    onError: (err) => {
      const data = err.response?.data;
      const msg = data?.errors
        ? Object.values(data.errors).flat().join('\n')
        : (data?.title ?? 'Xatolik yuz berdi');
      toast.error(msg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId) {
      toast.error("Majburiy maydonlarni to'ldiring");
      return;
    }
    if (!editing && !imageFile) {
      toast.error('Rasm yuklash majburiy');
      return;
    }
    saveMutation.mutate(buildPayload());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-gray-900 flex items-center justify-between p-5 border-b dark:border-gray-700 z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editing ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Image */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Rasm *</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`aspect-square border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer overflow-hidden transition-colors ${
                imagePreview ? 'border-orange-400' : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {imagePreview ? (
                <img src={imagePreview} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="text-center text-gray-400">
                  <Upload className="mx-auto mb-2" size={32} />
                  <span className="text-sm font-medium">Rasm yuklash</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
              }}
            />
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Nomlanishi *</label>
              <input
                name="name" value={form.name} onChange={handleInput} required
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Narxi *</label>
                <input
                  type="number" name="price" value={form.price} onChange={handleInput} required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Kategoriya *</label>
                <select
                  name="categoryId" value={form.categoryId || ''} onChange={handleInput} required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="">Tanlang</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Bo'lim (Terminal) *</label>
              <select
                name="terminalTag" value={form.terminalTag || 1} onChange={handleInput}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="1">Oshxona</option>
                <option value="2">Somsoxona</option>
                <option value="3">Kassa</option>
                <option value="4">Bar</option>
                <option value="5">Extra</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Tavsif</label>
              <textarea
                name="description" value={form.description} onChange={handleInput}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl h-20 resize-none focus:ring-2 focus:ring-orange-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <input
                type="checkbox" name="isActive" checked={form.isActive} onChange={handleInput}
                className="w-4 h-4 accent-orange-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sotuvda mavjud</span>
            </label>
          </div>

          {/* Footer */}
          <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t dark:border-gray-700">
            <button
              type="button" onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-orange-200"
            >
              {saveMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const MenuPage = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const [dlg, setDlg] = useState(null);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [catModal, setCatModal] = useState(null);
  const [prodModal, setProdModal] = useState(null);

  // ── Data ──
  const { data: products = [], isLoading: pLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productAPI.getAll,
  });
  const { data: categories = [], isLoading: cLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryAPI.getAll,
  });

  // ── Delete product ──
  const deleteProdMutation = useMutation({
    mutationFn: productAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Mahsulot o'chirildi");
    },
    onError: () => toast.error("O'chirishda xatolik"),
  });

  // ── Delete category ──
  const deleteCatMutation = useMutation({
    mutationFn: categoryAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (selectedCategory) setSelectedCategory(null);
      toast.success("Kategoriya o'chirildi");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "O'chirishda xatolik"),
  });

  // ── Toggle active (optimistic) ──
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ productId, isActive }) => {
      const all = queryClient.getQueryData(['products']) ?? [];
      const p = all.find((x) => x.id === productId);
      const fd = new FormData();
      fd.append('Id', productId);
      fd.append('Name', p.name);
      fd.append('Description', p.description ?? '');
      fd.append('CategoryId', p.categoryId);
      fd.append('Price', p.price);
      fd.append('TerminalTag', parseInt(p.terminalTag));
      fd.append('IsActive', isActive);
      return productAPI.update(fd);
    },
    onMutate: async ({ productId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const prev = queryClient.getQueryData(['products']);
      queryClient.setQueryData(['products'], (old = []) =>
        old.map((p) => (p.id === productId ? { ...p, isActive } : p))
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      queryClient.setQueryData(['products'], ctx.prev);
      toast.error('Holatni yangilashda xatolik');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  // ── Filtered products ──
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory ? p.categoryId === selectedCategory : true;
    const matchSearch = search.trim()
      ? p.name?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchCat && matchSearch;
  });

  const countFor = (catId) => products.filter((p) => p.categoryId === catId).length;

  const isLoading = pLoading || cLoading;

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-8 bg-gray-50 dark:bg-gray-950 min-h-screen">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Menyu boshqaruvi</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">Kategoriya va mahsulotlarni boshqaring</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {hasPermission('Category_Create') && (
            <button
              onClick={() => setCatModal('create')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-colors shadow-sm"
            >
              <Plus size={17} /> Kategoriya
            </button>
          )}
          {hasPermission('Product_Create') && (
            <button
              onClick={() => setProdModal('create')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-orange-200"
            >
              <Plus size={17} /> Mahsulot
            </button>
          )}
        </div>
      </div>

      {/* ── CATEGORY PILLS ── */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">

        {/* Hammasi */}
        <button
          onClick={() => setSelectedCategory(null)}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
            !selectedCategory
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-md shadow-gray-300 dark:shadow-gray-900/40'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${!selectedCategory ? 'bg-white/50 dark:bg-gray-900/50' : 'bg-gray-300 dark:bg-gray-600'}`} />
          Hammasi
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${!selectedCategory ? 'bg-white/20 dark:bg-black/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
            {products.length}
          </span>
        </button>

        {/* Har bir kategoriya */}
        {categories.map((cat, idx) => {
          const pal = CAT_PALETTE[idx % CAT_PALETTE.length];
          const count = countFor(cat.id);
          const isActive = selectedCategory === cat.id;
          const canEdit = hasPermission('Category_Update');
          const canDel  = hasPermission('Category_Delete');

          return (
            <div key={cat.id} className="flex-shrink-0 relative group/pill">
              <button
                onClick={() => setSelectedCategory(isActive ? null : cat.id)}
                className={`flex items-center gap-2 text-sm font-semibold transition-all border rounded-full whitespace-nowrap ${
                  canEdit || canDel ? 'pl-3.5 pr-10' : 'px-3.5'
                } py-2 ${
                  isActive
                    ? `${pal.active} text-white border-transparent shadow-md`
                    : `${pal.idle} border hover:shadow-sm`
                }`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-white/60' : pal.dot}`} />
                {cat.name}
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-white/25' : pal.count}`}>
                  {count}
                </span>
              </button>

              {/* Edit / Delete — hover da ko'rinadi */}
              {(canEdit || canDel) && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/pill:opacity-100 transition-opacity">
                  {canEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setCatModal(cat); }}
                      title="Tahrirlash"
                      className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                        isActive ? 'hover:bg-white/25 text-white' : 'hover:bg-black/10 dark:hover:bg-white/10 text-current'
                      }`}
                    >
                      <Edit2 size={11} />
                    </button>
                  )}
                  {canDel && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDlg({
                          message: `"${cat.name}" kategoriyasi o'chirilsinmi?`,
                          confirmText: "Ha, o'chirish",
                          onConfirm: () => deleteCatMutation.mutate(cat.id),
                        });
                      }}
                      title="O'chirish"
                      className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                        isActive ? 'hover:bg-white/25 text-white' : 'hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 text-current'
                      }`}
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── SEARCH ── */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Mahsulot qidirish..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-400 text-sm"
        />
      </div>

      {/* ── CONTENT ── */}
      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-orange-500" size={40} />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <Package size={56} className="mb-3 opacity-40" />
          <p className="font-medium">Mahsulotlar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => {
            const catName = categories.find((c) => c.id === product.categoryId)?.name;
            return (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group overflow-hidden"
              >
                <div className="relative aspect-[4/3] bg-gray-50 dark:bg-gray-800">
                  {product.imageUrl ? (
                    <img src={getImgUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UtensilsCrossed size={28} className="text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {hasPermission('Product_Update') && (
                      <button
                        onClick={() => setProdModal(product)}
                        className="p-2 bg-white rounded-xl shadow hover:text-orange-600 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    {hasPermission('Product_Delete') && (
                      <button
                        onClick={() => setDlg({
                          message: `"${product.name}" mahsuloti o'chirilsinmi?`,
                          confirmText: "Ha, o'chirish",
                          onConfirm: () => deleteProdMutation.mutate(product.id),
                        })}
                        className="p-2 bg-white rounded-xl shadow hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 mb-1">{product.name}</p>
                  {catName && (
                    <span className="inline-block bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-medium px-2 py-0.5 rounded-full mb-2">
                      {catName}
                    </span>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                      {product.price?.toLocaleString()} so'm
                    </span>
                    {hasPermission('Product_Update') ? (
                      <ToggleActiveButton
                        isActive={product.isActive}
                        size="sm"
                        onToggle={(newVal) =>
                          toggleActiveMutation.mutateAsync({ productId: product.id, isActive: newVal })
                        }
                      />
                    ) : (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                        {product.isActive ? 'Mavjud' : 'Yopiq'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CATEGORY MODAL ── */}
      {catModal && (
        <CategoryModal
          editing={catModal === 'create' ? null : catModal}
          onClose={() => setCatModal(null)}
          onSuccess={() => setCatModal(null)}
        />
      )}

      {/* ── PRODUCT MODAL ── */}
      {prodModal && (
        <ProductModal
          editing={prodModal === 'create' ? null : prodModal}
          categories={categories}
          onClose={() => setProdModal(null)}
          onSuccess={() => setProdModal(null)}
        />
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
};

export default MenuPage;
