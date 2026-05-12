import React, { useContext, useMemo } from 'react';
import { DpaContext } from '../context/DpaContext';
import { ClipboardList, BarChart2, Receipt } from 'lucide-react';

const formatRupiah = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

const RegisterSpmPage = () => {
  const { transactions } = useContext(DpaContext);

  const totalNominal = useMemo(() => transactions.reduce((s, t) => s + (t.nominal || 0), 0), [transactions]);
  const countByJenis = useMemo(() => transactions.reduce((acc, t) => {
    const j = t.jenisSpm || 'Lainnya';
    acc[j] = (acc[j] || 0) + 1;
    return acc;
  }, {}), [transactions]);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
        <span>Dashboard</span><span>/</span>
        <span className="text-gray-900 dark:text-white">Register SPM</span>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Register SPM</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Daftar seluruh Surat Perintah Membayar yang telah diinput ke sistem.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center shrink-0"><Receipt size={22} className="text-blue-600 dark:text-blue-400" /></div>
          <div><p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total SPM</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{transactions.length}</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center shrink-0"><BarChart2 size={22} className="text-emerald-600 dark:text-emerald-400" /></div>
          <div><p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Belanja</p><p className="text-lg font-bold text-gray-900 dark:text-white">{formatRupiah(totalNominal)}</p></div>
        </div>
      </div>

      {/* Ringkasan per Jenis */}
      {Object.keys(countByJenis).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Rekapitulasi per Jenis SPM</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(countByJenis).map(([jenis, count]) => (
              <span key={jenis} className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800 rounded-xl text-sm font-semibold">
                {jenis} <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabel */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><ClipboardList size={18} className="text-blue-500" /> Daftar Register SPM</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead><tr className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
              {['No', 'Tanggal SPM', 'Nomor SPM', 'Jenis SPM', 'Bagian', 'Uraian', 'Nominal'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {transactions.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-16 text-center text-sm text-gray-400 dark:text-gray-500">
                  <ClipboardList size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                  Belum ada data SPM. Input transaksi melalui menu Input Belanja.
                </td></tr>
              ) : transactions.map((tx, idx) => (
                <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{tx.tanggalSpm || '-'}</td>
                  <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white">{tx.nomorSpm || '-'}</td>
                  <td className="px-4 py-3"><span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800">{tx.jenisSpm || '-'}</span></td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[160px] truncate" title={tx.bagianName}>{tx.bagianName || '-'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{tx.uraian}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white text-right">{formatRupiah(tx.nominal)}</td>
                </tr>
              ))}
            </tbody>
            {transactions.length > 0 && (
              <tfoot><tr className="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700">
                <td colSpan="6" className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white text-right">TOTAL</td>
                <td className="px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400 text-right">{formatRupiah(totalNominal)}</td>
              </tr></tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default RegisterSpmPage;
