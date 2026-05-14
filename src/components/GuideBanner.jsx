import React from 'react';
import { DownloadCloud, BookCopy } from 'lucide-react';

const GuideBanner = ({ onOpenGuide }) => {
  return (
    <div className="w-full rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-800 to-cyan-900 overflow-hidden relative shadow-lg">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
      <div className="absolute bottom-0 right-40 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl"></div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-10">
        <div className="flex-1 text-white max-w-xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">Panduan Aplikasi</h2>
          <p className="text-emerald-50 text-sm md:text-base leading-relaxed mb-6 opacity-90">
            Pelajari cara menggunakan sistem Penatausahaan dengan mudah. Unduh panduan langkah demi langkah untuk membantu Anda mengelola data dan memahami alur kerja aplikasi secara menyeluruh.
          </p>
          <button onClick={onOpenGuide} className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-2.5 px-6 rounded-lg transition-all shadow-sm hover:shadow cursor-pointer">
            <BookCopy size={18} strokeWidth={2} />
            Lihat Panduan
          </button>
        </div>
        
        <div className="hidden md:flex flex-1 justify-end pr-8 relative">
          {/* Abstract Books Illustration */}
          <div className="relative w-40 h-40">
            <div className="absolute right-4 top-4 bg-white/10 backdrop-blur-md border border-white/20 w-28 h-32 rounded-xl transform rotate-12 shadow-xl flex items-center justify-center">
               <BookCopy size={48} className="text-white/40" strokeWidth={1} />
            </div>
            <div className="absolute right-12 top-8 bg-white/20 backdrop-blur-md border border-white/30 w-28 h-32 rounded-xl transform -rotate-6 shadow-2xl flex items-center justify-center">
               <BookCopy size={56} className="text-white/80" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideBanner;
