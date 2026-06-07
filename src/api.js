/**
 * src/api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Axios instance terpusat untuk SIK SETDA.
 *
 * Fitur:
 * - Base URL dari environment variable VITE_API_URL
 * - Auto-inject Bearer token dari localStorage ke setiap request
 * - Interceptor response: tangkap 401 → paksa logout & redirect ke /login
 */

import axios from 'axios';

// ─── Instance Utama ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 detik timeout
});

// ─── Request Interceptor: Attach Token ───────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle SSL Block + 401 ────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ── Deteksi SSL self-signed block ─────────────────────────────────────
    // Ciri khas: error.message === 'Network Error' dan tidak ada error.response
    // (browser memblokir request sebelum server sempat membalas).
    // Timeout (ECONNABORTED) dikecualikan karena bukan kasus SSL.
    const isNetworkError =
      !error.response &&
      error.message === 'Network Error' &&
      error.code !== 'ECONNABORTED';

    if (isNetworkError) {
      // Dispatch CustomEvent ke window — dibaca oleh SslBlockContext
      // tanpa perlu mengimport React/Context di sini (zero circular dep).
      window.dispatchEvent(new CustomEvent('sik:ssl-blocked'));
      return Promise.reject(error);
    }

    // ── Handle 401 Unauthorized: paksa logout & redirect ─────────────────
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // Hindari redirect loop jika sudah di /login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);


export default api;

// ─── Helper: Ekstrak pesan error dari response API ───────────────────────────
/**
 * Mengubah error Axios menjadi string pesan yang ramah user.
 * Mendukung format: { message: "..." } dan { errors: { field: ["msg"] } }
 *
 * @param {unknown} error - Error dari Axios
 * @param {string} fallback - Pesan fallback jika tidak ada detail
 * @returns {string}
 */
export const getApiErrorMessage = (error, fallback = 'Terjadi kesalahan. Silakan coba lagi.') => {
  if (!error?.response) {
    // Network error / timeout
    if (error?.code === 'ECONNABORTED') return 'Request timeout. Periksa koneksi Anda.';
    return 'Tidak dapat terhubung ke server. Pastikan server API berjalan.';
  }

  const { data } = error.response;

  if (data?.errors) {
    // Ambil error pertama dari ValidationException Laravel
    const firstKey = Object.keys(data.errors)[0];
    return data.errors[firstKey]?.[0] || fallback;
  }

  return data?.message || fallback;
};
