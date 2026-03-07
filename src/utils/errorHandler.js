/**
 * Xato xabarini backenddan yoki network xatosidan ajratib oladi.
 * Barcha mutation onError handlerlarida ishlatiladi.
 */
export const extractErrorMessage = (err, fallback = 'Xatolik yuz berdi') => {
  if (!err) return fallback;

  // Network xatosi (internet yo'q)
  if (!err.response) return "Internet ulanishi yo'q";

  const status = err.response.status;
  const data = err.response.data;

  // Status bo'yicha standart xabarlar
  if (status === 404) return 'Topilmadi';
  if (status === 500) return 'Server xatosi';
  if (status === 422) return 'Ma\'lumotlar noto\'g\'ri';

  // Backend xabar qaytarsa — uni ishlatamiz
  if (typeof data === 'string' && data.length < 200) return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;
  if (data?.detail) return data.detail;
  if (data?.errors) return Object.values(data.errors).flat().join(', ');

  return fallback;
};
