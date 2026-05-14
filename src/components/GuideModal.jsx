import React from 'react';
import { X, BookOpen, PenTool, FolderUp, Printer } from 'lucide-react';

const GuideModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-emerald-50/50 dark:bg-emerald-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-400">
              <BookOpen size={20} strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Panduan Penggunaan SIK SETDA</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Langkah demi langkah menggunakan portal keuangan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0">1</div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><BookOpen size={16}/> Memahami Dashboard</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Setelah login, Dashboard akan menyajikan ringkasan keseluruhan APBD, termasuk total pagu anggaran, realisasi belanja, dan sisa saldo. Anda juga dapat melihat grafik perbandingan antar Unit Kerja (Bagian).
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 font-bold flex items-center justify-center shrink-0">2</div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><PenTool size={16}/> Input Penatausahaan Belanja</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Masuk ke menu <strong>Penatausahaan &gt; Belanja</strong>. Dalam melakukan input transaksi, Anda harus memilih hirarki secara berurutan:
                <br/><code>Bagian (Unit Kerja) → Program → Kegiatan → Sub Kegiatan → Rincian Uraian Belanja</code>.
                <br/>Setelah uraian dipilih, sisa anggaran akan muncul secara otomatis.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center shrink-0">3</div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><FolderUp size={16}/> Upload Arsip Dokumen</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Gunakan menu <strong>Arsip Digital</strong> untuk mengunggah berkas fisik. Pilih jenis dokumen (SPM, Bukti Bayar, Nota Dinas) dan unggah file dalam format PDF (maks. 5MB).
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center shrink-0">4</div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Printer size={16}/> Cetak Laporan Realisasi (LRA)</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                LRA menyajikan serapan anggaran secara real-time. Buka menu <strong>Laporan &gt; LRA</strong>, gunakan tombol "Tampilkan Semua" untuk membuka struktur pohon, lalu klik tombol "Print/PDF" untuk mengekspor data ke format cetak fisik.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuideModal;
