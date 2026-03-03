import axiosClient from './axios';

export const categoryAPI = {
  // 1. GET ALL
  getAll: async () => {
    const response = await axiosClient.get('/Category/GetAllCategories');
    // console.log(response.data)
    return response.data;
  },

  // 2. CREATE (Qo'shish)
  create: async (data) => {
    const payload = typeof data === 'string' ? { name: data } : { name: data.name };
    const response = await axiosClient.post(
      '/Category/AddCategory',
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  },

  // 3. UPDATE (Yangilash)

  update: async ({ id, name }) => {
    // NOTE: endpoint name fixed to UpdateCategory — confirm with backend if different
    const response = await axiosClient.put('/Category/UpdateCatigory', {
      id,
      name,
    });
    return response.data;
  },

  // 4. DELETE (O'chirish)
  delete: async (id) => {
    const response = await axiosClient.delete(`/Category/DeleteCategory/${id}`);
    return response.data;
  },
};