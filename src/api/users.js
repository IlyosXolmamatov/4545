import api from './axios';

// --- ENUMS ---

/** @enum {number} */
export const UserRole = {
  Admin:   1,
  Waiter:  2,
  Cashier: 3,
};

export const ROLE_LABELS = {
  [UserRole.Admin]:   'Admin',
  [UserRole.Waiter]:  'Ofitsant',
  [UserRole.Cashier]: 'Kassir',
};

/**
 * Role raqamidan nom qaytaradi
 * @param {number} role
 * @returns {string}
 */
export const getRoleName = (role) => ROLE_LABELS[role] ?? 'Noma\'lum';

// --- API FUNCTIONS ---

export const userAPI = {
  /**
   * Barcha xodimlarni olish
   * GET /User/GetAllUsers
   * @returns {Promise<Array>}
   */
  getAll: async () => {
    const response = await api.get('/User/GetAllUsers');
    return response.data;
  },

  /**
   * Username bo'yicha xodimni olish
   * GET /User/GetUser/id?username={username}
   * @param {string} username
   * @returns {Promise<Object>}
   */
  getByUsername: async (username) => {
    const response = await api.get('/User/GetUser/id', { params: { username } });
    return response.data;
  },

  /**
   * Yangi xodim yaratish
   * POST /User/CreateUser
   * @param {{ name: string, username: string, password: string, role: number }} data
   * @returns {Promise<any>}
   */
  create: async (data) => {
    const response = await api.post('/User/CreateUser', data);
    return response.data;
  },

  /**
   * Xodimni yangilash (username va password o'zgarmaydi)
   * PUT /User/UpdateUser/{id}
   * @param {string} id - UUID
   * @param {{ id: string, name: string, role: number, isActive: boolean }} data
   * @returns {Promise<any>}
   */
  update: async (id, data) => {
    const response = await api.put(`/User/UpdateUser/${id}`, data);
    return response.data;
  },

  /**
   * Xodimni o'chirish
   * DELETE /User/DeleteUser/{id}
   * @param {string} id - UUID
   * @returns {Promise<boolean>}
   */
  delete: async (id) => {
    const response = await api.delete(`/User/DeleteUser/${id}`);
    return response.data;
  },
};
