import axiosClient from './axios';

// --- ENUMS (Backend bilan mos) ---

/** @enum {number} */
export const TableStatus = {
  Free: 1, // Bo'sh
  Occupied: 2, // Band
  Reserved: 3, // Rezerv
};

export const TABLE_STATUS_LABELS = {
  [TableStatus.Free]: 'Bo\'sh',
  [TableStatus.Occupied]: 'Band',
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

// --- CAPACITY HELPERS (localStorage) ---
// Backend hozir capacity field'ni qabul qilmaydi.
// Keyinchalik backend yangilanganda bu helper'larni API call'larga almashtirish kifoya.

const CAPACITY_KEY = 'table_capacities';

export const capacityHelpers = {
  get: (tableId) => {
    try {
      const caps = JSON.parse(localStorage.getItem(CAPACITY_KEY) || '{}');
      return caps[tableId] ?? null;
    } catch {
      return null;
    }
  },

  set: (tableId, capacity) => {
    try {
      const caps = JSON.parse(localStorage.getItem(CAPACITY_KEY) || '{}');
      caps[tableId] = capacity;
      localStorage.setItem(CAPACITY_KEY, JSON.stringify(caps));
    } catch { }
  },

  delete: (tableId) => {
    try {
      const caps = JSON.parse(localStorage.getItem(CAPACITY_KEY) || '{}');
      delete caps[tableId];
      localStorage.setItem(CAPACITY_KEY, JSON.stringify(caps));
    } catch { }
  },
};

// --- API FUNCTIONS ---

export const tableAPI = {
  /**
   * Barcha stollarni olish
   * GET /Table/GetAllTables
   */
  getAll: async () => {
    const response = await axiosClient.get('/Table/GetAllTables');
    console.log(response.data);
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
   * @param {{ tableNumber: number, tableStatus: number, tableType: number }} data
   * @returns {Promise<boolean>}
   */
  create: async ({ tableNumber, tableStatus, tableType }) => {
    const response = await axiosClient.post('/Table/CreateTable', {
      tableNumber,
      tableStatus,
      tableType,
    });
    return response.data;
  },

  /**
   * Stolni yangilash
   * PUT /Table/UpdateTable
   * @param {{ id: string, tableNumber: number, tableStatus: number, tableType: number }} data
   */
  update: async ({ id, tableNumber, tableStatus, tableType }) => {
    const payload = {
      id,
      tableNumber: Number(tableNumber),
      tableStatus: Number(tableStatus),
      tableType: Number(tableType),
    };
    console.log('Update table request:', payload);
    const response = await axiosClient.put('/Table/UpdateTable', payload);
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
