import React from 'react';
import EmptyState from '../components/EmptyState';
import { BookOpen } from 'lucide-react';

const AkuntansiPage = () => {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
        <span>Dashboard</span>
        <span>/</span>
        <span>Laporan</span>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">Akuntansi</span>
      </div>
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Laporan Akuntansi
        </h2>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-10 flex items-center justify-center min-h-[400px]">
        <EmptyState 
          icon={BookOpen} 
          title="Laporan Belum Tersedia" 
          description="Laporan akuntansi sedang dalam proses penyusunan." 
        />
      </div>
    </div>
  );
};

export default AkuntansiPage;
