import axiosClient from './axios';

export const categoryAPI = {
  // 1. GET ALL
  getAll: async () => {
    const response = await axiosClient.get('/Category/GetAllCategories');
    return response.data;
  },

  // 2. CREATE (Qo'shish)
  create: async (text) => {
    const response = await axiosClient.post(
      '/Category/AddCategory',
      JSON.stringify(text),
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
    const response = await axiosClient.put('/Category/UpdateCatigory', {
      id: id,
      name: name,

    });
    return response.data;
  },

  // 4. DELETE (O'chirish)
  delete: async (id) => {
    const response = await axiosClient.delete(`/Category/DeleteCategory/${id}`);
    return response.data;
  },
};