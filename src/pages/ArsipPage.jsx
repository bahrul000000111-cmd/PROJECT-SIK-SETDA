import React from 'react';
import DataTable from '../components/DataTable';
import { Download, Eye } from 'lucide-react';
import { arsipData } from '../utils/dataStore';

const ArsipPage = () => {
  const columns = [
    { key: 'no', label: 'No' },
    { key: 'nomorDokumen', label: 'Nomor Dokumen' },
    { key: 'jenisDokumen', label: 'Jenis Dokumen' },
    { key: 'tanggalArsip', label: 'Tanggal Arsip' },
    { key: 'keterangan', label: 'Keterangan' },
    { 
      key: 'aksi', 
      label: 'Aksi',
      render: () => (
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors cursor-pointer" title="Lihat">
            <Eye size={16} strokeWidth={1.5} />
          </button>
          <button className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors cursor-pointer" title="Unduh">
            <Download size={16} strokeWidth={1.5} />
          </button>
        </div>
      )
    },
  ];

  const data = arsipData;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
        <span>Dashboard</span>
        <span>/</span>
        <span>Penatausahaan</span>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">Arsip</span>
      </div>
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Arsip Dokumen Penatausahaan
        </h2>
      </div>
      <DataTable title="Daftar Arsip Dokumen" columns={columns} data={data} />
    </div>
  );
};

export default ArsipPage;
