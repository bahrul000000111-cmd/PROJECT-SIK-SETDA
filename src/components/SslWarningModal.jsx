/**
 * src/components/SslWarningModal.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Modal panduan bypass SSL self-signed untuk SIK SETDA DONGGALA.
 *
 * Ditampilkan secara global saat Axios mendeteksi Network Error tanpa response
 * (ciri khas pemblokiran sertifikat SSL self-signed oleh browser).
 *
 * Dipanggil dari: App.jsx (root level) via SslBlockContext.
 */

import React, { useContext } from 'react';
import { SslBlockContext } from '../context/SslBlockContext';

// ─── Konstanta ────────────────────────────────────────────────────────────────
const SSL_URL        = 'https://38.47.180.18:8443/student03/';
const INSTANCE_NAME  = 'SIK SETDA DONGGALA';

// ─── Sub-komponen: Badge langkah bernomor ─────────────────────────────────────
const Step = ({ number, children }) => (
  <li className="flex items-start gap-3">
    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center mt-0.5 shadow-sm">
      {number}
    </span>
    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
      {children}
    </span>
  </li>
);

// ─── Komponen Utama ───────────────────────────────────────────────────────────
const SslWarningModal = () => {
  const { isSslBlocked, setSslBlocked } = useContext(SslBlockContext);

  if (!isSslBlocked) return null;

  const handleOpenServer = () => {
    window.open(SSL_URL, '_blank', 'noopener,noreferrer');
  };

  const handleDismiss = () => {
    setSslBlocked(false);
  };

  return (
    // ── Overlay ──────────────────────────────────────────────────────────────
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ssl-modal-title"
    >
      {/* Backdrop blur */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* ── Panel Modal ──────────────────────────────────────────────────────── */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-amber-200 dark:border-amber-800/60 overflow-hidden animate-[fadeInScale_0.2s_ease-out]">

        {/* ── Header strip ─────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center gap-3">
          {/* Shield/Warning icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
              className="w-5 h-5 text-white">
              <path fillRule="evenodd"
                d="M11.484 2.17a.75.75 0 0 1 1.032 0 11.209 11.209 0 0 0 7.877 3.08.75.75 0 0 1 .722.515 12.74 12.74 0 0 1 .635 3.985c0 5.942-4.064 10.933-9.563 12.348a.749.749 0 0 1-.374 0C6.314 20.683 2.25 15.692 2.25 9.75c0-1.39.223-2.73.635-3.985a.75.75 0 0 1 .722-.516l.143.001c2.996 0 5.718-1.17 7.734-3.08ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75ZM12 15a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"
                clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-100 uppercase tracking-widest">
              {INSTANCE_NAME}
            </p>
            <h2 id="ssl-modal-title" className="text-base font-bold text-white leading-tight">
              Tindakan Diperlukan: Izin Keamanan Server
            </h2>
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div className="px-6 py-5 space-y-5">

          {/* Deskripsi masalah */}
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Sistem mendeteksi bahwa koneksi ke{' '}
            <strong className="text-gray-900 dark:text-gray-200">
              server penatausahaan daerah
            </strong>{' '}
            diblokir sementara oleh proteksi browser. Ini terjadi karena server
            menggunakan sertifikat keamanan internal. Lakukan izin sekali saja
            dengan mengikuti langkah berikut:
          </p>

          {/* Alert info box */}
          <div className="flex items-start gap-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl px-4 py-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
              className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5">
              <path fillRule="evenodd"
                d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                clipRule="evenodd" />
            </svg>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Izin ini hanya perlu dilakukan <strong>sekali</strong> per sesi browser.
              Setelah memberikan izin, klik <em>"Saya Sudah Melakukannya"</em> di bawah.
            </p>
          </div>

          {/* 3 langkah instruksi */}
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-4">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
              Panduan Langkah-demi-Langkah
            </p>
            <ol className="space-y-3">
              <Step number={1}>
                Klik tombol{' '}
                <strong className="text-amber-600 dark:text-amber-400">
                  "Buka Halaman Server"
                </strong>{' '}
                di bawah ini — tab baru akan terbuka menuju server penatausahaan.
              </Step>
              <Step number={2}>
                Di halaman peringatan browser, klik{' '}
                <strong className="font-mono text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[11px]">
                  Advanced
                </strong>{' '}
                atau{' '}
                <strong className="font-mono text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[11px]">
                  Lanjutan
                </strong>
                .
              </Step>
              <Step number={3}>
                Klik{' '}
                <strong className="font-mono text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[11px]">
                  Proceed to 38.47.180.18 (unsafe)
                </strong>{' '}
                untuk memberikan izin akses ke server.
              </Step>
            </ol>
          </div>
        </div>

        {/* ── Footer: tombol aksi ───────────────────────────────────────────── */}
        <div className="px-6 pb-5 flex flex-col sm:flex-row gap-3">
          {/* CTA Utama: buka server */}
          <button
            onClick={handleOpenServer}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
              className="w-4 h-4 flex-shrink-0">
              <path fillRule="evenodd"
                d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z"
                clipRule="evenodd" />
              <path fillRule="evenodd"
                d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z"
                clipRule="evenodd" />
            </svg>
            Buka Halaman Server
          </button>

          {/* Tombol konfirmasi selesai */}
          <button
            onClick={handleDismiss}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
              className="w-4 h-4 flex-shrink-0">
              <path fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clipRule="evenodd" />
            </svg>
            Saya Sudah Melakukannya
          </button>
        </div>
      </div>
    </div>
  );
};

export default SslWarningModal;
