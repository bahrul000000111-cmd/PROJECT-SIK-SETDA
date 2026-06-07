/**
 * src/context/SslBlockContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Context tunggal untuk state isSslBlocked.
 *
 * Dipisahkan dari AuthContext (Separation of Concerns):
 *   - AuthContext  → identitas pengguna & sesi
 *   - SslBlockContext → status konektivitas SSL server
 *
 * Cara kerja:
 *   1. api.js membaca `sslBlockStore` (singleton di luar React) untuk set flag.
 *   2. Provider ini melakukan polling ringan (100ms) HANYA saat flag aktif,
 *      sehingga React state tersinkron tanpa circular import.
 *
 * Alternatif yang lebih sederhana dengan window event digunakan di sini:
 *   - api.js dispatch CustomEvent 'ssl-blocked'
 *   - SslBlockContext mendengarkan event tersebut via addEventListener
 *   Pendekatan ini 100% aman dari circular dependency karena api.js tidak
 *   perlu mengimport React sama sekali.
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';

export const SslBlockContext = createContext({
  isSslBlocked:  false,
  setSslBlocked: () => {},
});

export const SslBlockProvider = ({ children }) => {
  const [isSslBlocked, setIsSslBlocked] = useState(false);

  // ── Dengarkan CustomEvent yang di-dispatch oleh api.js ────────────────────
  useEffect(() => {
    const handleSslBlocked = () => setIsSslBlocked(true);
    window.addEventListener('sik:ssl-blocked', handleSslBlocked);
    return () => window.removeEventListener('sik:ssl-blocked', handleSslBlocked);
  }, []);

  // ── Fungsi untuk menutup modal (dipanggil dari SslWarningModal) ───────────
  const setSslBlocked = useCallback((value) => {
    setIsSslBlocked(value);
  }, []);

  return (
    <SslBlockContext.Provider value={{ isSslBlocked, setSslBlocked }}>
      {children}
    </SslBlockContext.Provider>
  );
};
