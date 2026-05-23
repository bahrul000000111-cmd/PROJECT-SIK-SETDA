/**
 * src/context/AuthContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Context autentikasi berbasis API (Laravel Sanctum).
 *
 * Storage Policy:
 *   - `auth_token`  → localStorage (persisten, untuk inject ke header Axios)
 *   - `auth_user`   → localStorage (persisten, untuk restore sesi saat refresh)
 *   - `selectedYear`→ localStorage (preferensi UI)
 *   - Semua data DPA/Transaksi/Arsip → TIDAK disimpan di sini (ada di DpaContext)
 */

import React, { createContext, useState, useCallback } from 'react';
import api, { getApiErrorMessage } from '../api';

export const AuthContext = createContext();

// ─── Safe localStorage reader ─────────────────────────────────────────────────
const safeGet = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {

  // Restore sesi dari localStorage (token + user masih valid jika belum expired)
  const [authToken,    setAuthToken]    = useState(() => localStorage.getItem('auth_token'));
  const [currentUser,  setCurrentUser]  = useState(() => safeGet('auth_user'));
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('auth_token') && !!safeGet('auth_user')
  );
  const [selectedYear, setSelectedYearState] = useState(
    () => localStorage.getItem('selectedYear') || new Date().getFullYear().toString()
  );

  // Loading state untuk menampilkan spinner di LoginPage
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // ─── setSelectedYear ────────────────────────────────────────────────────────
  const setSelectedYear = useCallback((year) => {
    setSelectedYearState(year);
    localStorage.setItem('selectedYear', year);
  }, []);

  // ─── login ──────────────────────────────────────────────────────────────────
  /**
   * POST /api/login
   * @param {string} username
   * @param {string} password
   * @returns {{ success: boolean, message?: string }}
   */
  const login = useCallback(async (username, password) => {
    setIsLoggingIn(true);
    try {
      const { data } = await api.post('login', { username, password });

      if (!data.success) {
        return { success: false, message: data.message || 'Login gagal.' };
      }

      const { token, user } = data.data;
      const defaultYear = new Date().getFullYear().toString();

      // Simpan token dan profil user ke localStorage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user',  JSON.stringify(user));
      localStorage.setItem('selectedYear', defaultYear);

      // Update state
      setAuthToken(token);
      setCurrentUser(user);
      setSelectedYearState(defaultYear);
      setIsAuthenticated(true);

      return { success: true };

    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, 'Username atau password salah.'),
      };
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  // ─── logout ─────────────────────────────────────────────────────────────────
  /**
   * POST /api/logout  (best-effort — jika gagal, tetap logout di client)
   */
  const logout = useCallback(async () => {
    try {
      await api.post('logout');
    } catch {
      // Abaikan error — prioritas adalah bersihkan sisi client
    } finally {
      // Hapus semua data sesi dari localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');

      // Reset state
      setAuthToken(null);
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // ─── Nilai Context ───────────────────────────────────────────────────────────
  const value = {
    isAuthenticated,
    isLoggingIn,
    authToken,
    currentUser,
    selectedYear,
    login,
    logout,
    setSelectedYear,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
