import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productAPI, getImgUrl } from '../api/products';
import { categoryAPI } from '../api/categories';
import { useAuthStore } from '../store/authStore';
import { Plus, Search, Edit2, Trash2, X, Upload, Package, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ToggleActiveButton from '../components/ToggleActiveButton';

const ProductsPage = () => {
  // --- STATE ---
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // MODAL STATE (Alohid fayl shart emas, shu yerda turadi)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // FORM DATA STATE
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    categoryId: '',
    description: '',
    isActive: true,
    terminalTag: 1, // Default 1 (Oshxona)
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const { hasPermission } = useAuthStore();
  const queryClient = useQueryClient();

  // --- DATA FETCHING ---
  const { data: products = [], isLoading: pLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productAPI.getAll,
  });

  const { data: categories = [], isLoading: cLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryAPI.getAll,
  });

  // --- API ACTIONS ---
  const createMutation = useMutation({
    mutationFn: productAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success("Mahsulot qo'shildi");
      closeModal();
    },
    onError: (err) => handleError(err)
  });

  const updateMutation = useMutation({
    mutationFn: productAPI.update,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success("Mahsulot yangilandi");
      closeModal();
    },
    onError: (err) => handleError(err)
  });

  const deleteMutation = useMutation({
    mutationFn: productAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success("Mahsulot o'chirildi");
    },
    onError: () => toast.error("O'chirishda xatolik")
  });

  // Optimistic toggle (darhol UI yangilanadi)
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ productId, isActive }) => {
      const products = queryClient.getQueryData(['products']) ?? [];
      const p = products.find(x => x.id === productId);
      const formData = new FormData();
      formData.append('Id', productId);
      formData.append('Name', p.name);
      formData.append('Description', p.description || '');
      formData.append('CategoryId', p.categoryId);
      formData.append('Price', p.price);
      formData.append('TerminalTag', parseInt(p.terminalTag));
      formData.append('IsActive', isActive);
      return productAPI.update(formData);
    },
    onMutate: async ({ productId, isActive }) => {
      await queryClient.cancelQueries(['products']);
      const prev = queryClient.getQueryData(['products']);
      queryClient.setQueryData(['products'], (old = []) =>
        old.map(p => p.id === productId ? { ...p, isActive } : p)
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['products'], context.prev);
      toast.error('Holatni yangilashda xatolik');
    },
    onSuccess: () => toast.success('Mahsulot holati yangilandi'),
    onSettled: () => queryClient.invalidateQueries(['products']),
  });

  // Xatolarni chiqarish funksiyasi
  const handleError = (err) => {
    console.error(err);
    const data = err.response?.data;
    const msg = data?.errors 
      ? Object.values(data.errors).flat().join('\n') 
      : (data?.title || "Xatolik yuz berdi");
    toast.error(msg);
  };

  // --- HANDLERS ---
  
  // Modalni ochish (Yangi qo'shish uchun)
  const openCreateModal = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({
      name: '',
      price: '',
      categoryId: '',
      description: '',
      isActive: true,
      terminalTag: 1,
    });
    setImagePreview(null);
    setImageFile(null);
    setIsModalOpen(true);
  };

  // Modalni ochish (Tahrirlash uchun)
  const openEditModal = (product) => {
    setIsEditing(true);
    setEditId(product.id);
    setFormData({
      name: product.name,
      price: product.price,
      categoryId: product.categoryId,
      description: product.description || '',
      isActive: product.isActive,
      // Agar terminalTag null kelsa, 1 ni oladi
      terminalTag: product.terminalTag || 1,
    });
    setImagePreview(getImgUrl(product.imageUrl));
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // FORM SUBMIT (Eng muhim joyi)
  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Validatsiya
    if (!formData.name || !formData.price || !formData.categoryId) {
      toast.error("Majburiy maydonlarni to'ldiring");
      return;
    }

    if (!isEditing && !imageFile) {
      toast.error("Rasm yuklash majburiy");
      return;
    }

    // 2. FormData yig'ish
    const payload = new FormData();
    if (isEditing) payload.append('Id', editId);

    payload.append('Name', formData.name);
    payload.append('Description', formData.description);
    payload.append('CategoryId', formData.categoryId);
    
    // 3. Type Conversion (Backend xato bermasligi uchun)
    const cleanPrice = formData.price.toString().replace(',', '.');
    payload.append('Price', parseFloat(cleanPrice));
    
    // TerminalTag raqam bo'lishi shart
    payload.append('TerminalTag', parseInt(formData.terminalTag));
    
    payload.append('IsActive', formData.isActive);

    if (imageFile) {
      payload.append('Image', imageFile);
    }

    // 4. Yuborish
    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  // --- RENDER ---
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory ? p.categoryId === selectedCategory : true;
    return matchSearch && matchCat;
  });

  if (pLoading || cLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-600"/></div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menyu</h1>
          <p className="text-gray-500">Mahsulotlarni boshqarish</p>
        </div>
        {hasPermission('Product_Create') && (
          <button 
            onClick={openCreateModal}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} /> Mahsulot qo'shish
          </button>
        )}
      </div>

      {/* --- FILTERS --- */}
      <div className="flex flex-col gap-4 mb-8">
        <div className=" w ">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Qidirish..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>
        <br />
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setSelectedCategory(null)} className={`px-4 py-2 rounded-xl border whitespace-nowrap ${!selectedCategory ? 'bg-gray-900 text-white' : 'bg-white'}`}>Barchasi</button>
          {categories.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => setSelectedCategory(cat.id)} 
              className={`px-4 py-2 rounded-xl border whitespace-nowrap ${selectedCategory === cat.id ? 'bg-gray-900 text-white' : 'bg-white'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* --- GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="relative aspect-[4/3] mb-4 bg-gray-50 rounded-xl overflow-hidden">
              {product.imageUrl ? (
                <img src={getImgUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={40}/></div>
              )}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditModal(product)} className="p-2 bg-white rounded-lg shadow-sm hover:text-indigo-600"><Edit2 size={16}/></button>
                <button onClick={() => { if(confirm("O'chirilsinmi?")) deleteMutation.mutate(product.id) }} className="p-2 bg-white rounded-lg shadow-sm hover:text-red-600"><Trash2 size={16}/></button>
              </div>
            </div>
            <h3 className="font-bold text-lg line-clamp-1">{product.name}</h3>
            <p className="text-gray-500 text-sm">{categories.find(c => c.id === product.categoryId)?.name}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="font-bold">{product.price?.toLocaleString()} so'm</span>
              <ToggleActiveButton
                isActive={product.isActive}
                size="sm"
                onToggle={(newVal) =>
                  toggleActiveMutation.mutateAsync({ productId: product.id, isActive: newVal })
                }
              />
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL (Shu faylning o'zida) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Tahrirlash' : 'Yangi mahsulot'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-500"/></button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Rasm */}
              <div className="space-y-2">
                <label className="font-bold text-sm text-gray-700">Rasm *</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`aspect-square border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer relative overflow-hidden transition-colors ${imagePreview ? 'border-indigo-500' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}
                >
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <Upload className="mx-auto mb-2" size={32}/>
                      <span className="text-sm font-medium">Rasm yuklash</span>
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
              </div>

              {/* Inputlar */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Nomlanishi *</label>
                  <input name="name" value={formData.name} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-bold mb-1 text-gray-700">Narxi *</label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" required />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold mb-1 text-gray-700">Kategoriya *</label>
                    <select 
                      name="categoryId" 
                      value={formData.categoryId || ""} 
                      onChange={handleInputChange} 
                      className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                      required
                    >
                      <option value="">Tanlang</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Bo'lim (Terminal) *</label>
                  <select 
                    name="terminalTag" 
                    value={formData.terminalTag || 1} 
                    onChange={handleInputChange} 
                    className="w-full p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="1">Oshxona</option>
                    <option value="2">Somsoxona</option>
                    <option value="3">Kassa</option>
                    <option value="4">Bar</option>
                    <option value="5">Extra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Tavsif</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-xl h-20 resize-none focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="w-5 h-5 accent-indigo-600" />
                  <span className="font-medium text-gray-700">Sotuvda mavjud</span>
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t mt-2">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-gray-100 rounded-xl font-medium text-gray-700 hover:bg-gray-200 transition-colors">Bekor qilish</button>
                <button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-lg shadow-indigo-200"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="animate-spin" size={18}/>}
                  Saqlash
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;