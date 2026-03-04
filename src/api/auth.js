import api from './axios';

export const authAPI = {
  // Login qilish
  login: async (username, password) => {
    const response = await api.post('/Auth/Login/login', {
      username,
      password,
    });
    return response.data;
  },

  // JWT token'ni decode qilish (payload'ni olish)
  decodeToken: (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  },

  // Token tekshirish (muddati tugaganmi)
  isTokenValid: (token) => {
    if (!token) return false;
    const decoded = authAPI.decodeToken(token);
    if (!decoded) return false;
    
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  },
};
