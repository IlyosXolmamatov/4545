import axiosClient from './axios';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';


export const getImgUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BASE}${url}`;
};

// Backenddagi Enumga moslashamiz
export const TerminalTag = {
  Oshxona: 1,
  Somsaxona: 2,
  Kassa: 3,
  // Bar: 4,
  // Extra: 5
};

export const productAPI = {
  // [HttpGet] GetAllProductsAsync
  getAll: async () => {
    const response = await axiosClient.get('/Product/GetAllProducts');
    return response.data;
  },

  // [HttpPost] CreateProductAsync
  create: async (formData) => {
    // Diqqat: Headers yozmang! Axios FormData ni ko'rib o'zi Content-Type ni to'g'irlaydi

    const response = await axiosClient.post('/Product/CreateProduct', formData);
    return response.data;
  },

  // [HttpPut] UpdateProductAsync
  update: async (formData) => {
    const response = await axiosClient.put('/Product/UpdateProduct', formData);
    return response.data;
  },

  // [HttpDelete] Delete/{id}
  delete: async (id) => {
    const response = await axiosClient.delete(`/Product/Delete/${id}`);
    return response.data;
  }
};