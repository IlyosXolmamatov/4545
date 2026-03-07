import axiosClient from './axios';

// --- ENUMS (Backend bilan mos) ---

/** @enum {number} */
export const TableStatus = {
  // Backend enum uses: Empty=1, NotEmpty=2, Reserved=3
  Empty: 1,
  NotEmpty: 2,
  Reserved: 3,
  // Backwards-compatible aliases
  Free: 1,
  Occupied: 2,
};

export const TABLE_STATUS_LABELS = {
  [TableStatus.Empty]: 'Bo\'sh',
  [TableStatus.NotEmpty]: 'Band',
  [TableStatus.Reserved]: 'Rezerv',
};

/** @enum {number} */
export const TableType = {
  Simple: 1, // Oddiy
  Terrace: 2, // Terasa
  VIP: 3, // VIP
};

export const TABLE_TYPE_LABELS = {
  [TableType.Simple]: 'Oddiy',
  [TableType.Terrace]: 'Terasa',
  [TableType.VIP]: 'VIP',
};

// --- API FUNCTIONS ---

export const tableAPI = {
  /**
   * Barcha stollarni olish
   * GET /Table/GetAllTables
   */
  getAll: async () => {
    const response = await axiosClient.get('/Table/GetAllTables');

    return response.data;
  },

  /**
   * Bitta stolni olish
   * GET /Table/GetTable/{id}
   */
  getById: async (id) => {
    const response = await axiosClient.get(`/Table/GetTable/${id}`);


    return response.data;
  },

  /**
   * Yangi stol yaratish
   * POST /Table/CreateTable
   * @param {{ tableNumber: number, capacity: number, tableStatus: number, tableType: number }} data
   * @returns {Promise<boolean>}
   */
  create: async ({ tableNumber, capacity, tableStatus, tableType }) => {
    const response = await axiosClient.post('/Table/CreateTable', {
      tableNumber: Number(tableNumber),
      capacity: Number(capacity),
      tableStatus: Number(tableStatus),
      tableType: Number(tableType),
    });
    return response.data;
  },

  /**
   * Stolni yangilash
   * PUT /Table/UpdateTable
   * @param {{ id: string, tableNumber: number, capacity: number, tableStatus: number, tableType: number }} data
   */
  update: async ({ id, tableNumber, capacity, tableStatus, tableType }) => {
    const response = await axiosClient.put('/Table/UpdateTable', {
      id,
      tableNumber: Number(tableNumber),
      capacity: Number(capacity),
      tableStatus: Number(tableStatus),
      tableType: Number(tableType),
    });
    return response.data;
  },

  /**
   * Stol statusini yangilash
   * PATCH /Table/UpdateStatus/{id}?status=n
   */
  updateStatus: async (id, status) => {
    const response = await axiosClient.patch(`/Table/UpdateStatus/${id}`, null, { params: { status } });
    return response.data;
  },

  /**
   * Stolni o'chirish
   * DELETE /Table/DeleteTable/{id}
   */
  delete: async (id) => {
    const response = await axiosClient.delete(`/Table/DeleteTable/${id}`);
    return response.data;
  },
};
