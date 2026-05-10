import React from 'react';
import EmptyState from '../components/EmptyState';
import { FileText } from 'lucide-react';

const LraPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Laporan Realisasi Anggaran (LRA)
        </h2>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-10 flex items-center justify-center min-h-[400px]">
        <EmptyState 
          icon={FileText} 
          title="Laporan Belum Tersedia" 
          description="Data laporan realisasi anggaran masih kosong." 
        />
      </div>
    </div>
  );
};

export default LraPage;
