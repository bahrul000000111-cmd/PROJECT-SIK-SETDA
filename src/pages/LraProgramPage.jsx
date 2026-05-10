import React from 'react';
import EmptyState from '../components/EmptyState';
import { BarChart3 } from 'lucide-react';

const LraProgramPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          LRA Per Program
        </h2>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-10 flex items-center justify-center min-h-[400px]">
        <EmptyState 
          icon={BarChart3} 
          title="Laporan Per Program Belum Tersedia" 
          description="Data laporan realisasi anggaran per program masih kosong." 
        />
      </div>
    </div>
  );
};

export default LraProgramPage;
