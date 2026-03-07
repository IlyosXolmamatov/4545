import axios from 'axios';
import toast from 'react-hot-toast';

// Axios instance yaratish
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api',
  // Content-Type ni o'chirib tashlang! Axios o'zi avtomatik sozlaydi
});

// Request interceptor - har bir so'rovga token qo'shadi
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // MUHIM: FormData uchun Content-Type ni o'chirish
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      // Axios avtomatik ravishda to'g'ri Content-Type qo'yadi
    } else {
      // JSON uchun
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - faqat auth xatolarini global boshqaradi.
// Qolgan xatolar (4xx, 5xx, network) mutation onError'da ko'rsatiladi.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
      toast.error('Sessiya tugadi. Qaytadan kirish kerak');
    } else if (error.response?.status === 403) {
      toast.error("Sizda bu amalni bajarish uchun ruxsat yo'q");
    } else if (!error.response) {
      toast.error("Internet ulanishi yo'q");
    }
    return Promise.reject(error);
  }
);

export default api;