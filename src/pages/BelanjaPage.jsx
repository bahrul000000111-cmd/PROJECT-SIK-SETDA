import React from 'react';
import DataTable, { Badge } from '../components/DataTable';
import { belanjaData } from '../utils/dataStore';

const BelanjaPage = () => {
  const columns = [
    { key: 'no', label: 'No' },
    { key: 'tanggal', label: 'Tanggal' },
    { key: 'uraian', label: 'Uraian Belanja' },
    { key: 'bagian', label: 'Bagian Terkait' },
    { key: 'nilai', label: 'Nilai (Rp)' },
    { 
      key: 'status', 
      label: 'Status',
      render: (row) => {
        let variant = 'default';
        if (row.status === 'Disetujui') variant = 'success';
        if (row.status === 'Verifikasi') variant = 'warning';
        if (row.status === 'Draft') variant = 'default';
        return <Badge variant={variant}>{row.status}</Badge>;
      }
    },
  ];

  const data = belanjaData;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
        <span>Dashboard</span>
        <span>/</span>
        <span>Penatausahaan</span>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">Belanja</span>
      </div>
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Data Realisasi Belanja Bagian
        </h2>
      </div>
      <DataTable title="Daftar Realisasi Belanja" columns={columns} data={data} />
    </div>
  );
};

export default BelanjaPage;
