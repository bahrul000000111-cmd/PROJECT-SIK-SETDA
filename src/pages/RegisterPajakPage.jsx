import React, { useContext, useMemo } from 'react';
import { DpaContext } from '../context/DpaContext';
import { Landmark, Receipt, Search } from 'lucide-react';

const formatRupiah = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

const RegisterPajakPage = () => {
  const { transactions } = useContext(DpaContext);

  // Filter hanya transaksi yang ada pajak
  const pajakList = useMemo(() =>
    transactions
      .filter(t => t.adaPajak)
      .sort((a, b) => b.id - a.id),
    [transactions]
  );

  const totalPajak = useMemo(() => pajakList.reduce((s, t) => s + (t.nominalPajak || 0), 0), [pajakList]);

  const countByJenis = useMemo(() => pajakList.reduce((acc, t) => {
    const j = t.jenisPajak || 'Lainnya';
    acc[j] = (acc[j] || 0) + 1;
    return acc;
  }, {}), [pajakList]);

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
        <span>Dashboard</span><span>/</span><span>Laporan</span><span>/</span>
        <span className="text-gray-900 dark:text-white">Register Pajak</span>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
          <Landmark size={24} className="text-rose-500" /> Register Pajak
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Daftar seluruh pajak yang tercatat dari transaksi belanja.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center shrink-0">
            <Receipt size={22} className="text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Pajak Tercatat</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{pajakList.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center shrink-0">
            <Landmark size={22} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Nominal Pajak</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatRupiah(totalPajak)}</p>
          </div>
        </div>
      </div>

      {/* Ringkasan per Jenis Pajak */}
      {Object.keys(countByJenis).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Rekapitulasi per Jenis Pajak</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(countByJenis).map(([jenis, count]) => (
              <span key={jenis} className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800 rounded-xl text-sm font-semibold">
                {jenis} <span className="bg-amber-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabel Register Pajak */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Landmark size={18} className="text-rose-500" /> Daftar Register Pajak
            <span className="text-xs font-normal text-gray-400">({pajakList.length} record)</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                {['No', 'Tanggal Pajak', 'Jenis Pajak', 'NTPN', 'Nominal Pajak'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {pajakList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-sm text-gray-400 dark:text-gray-500">
                    <Landmark size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                    Belum ada data pajak. Pajak akan muncul otomatis saat transaksi belanja memiliki input pajak.
                  </td>
                </tr>
              ) : pajakList.map((tx, idx) => (
                <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{tx.tanggalPajak || tx.tanggalSpm || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-100 dark:border-amber-800">{tx.jenisPajak}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{tx.ntpn || '-'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white text-right">{formatRupiah(tx.nominalPajak)}</td>
                </tr>
              ))}
            </tbody>
            {pajakList.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700">
                  <td colSpan="4" className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white text-right">TOTAL PAJAK</td>
                  <td className="px-4 py-3 text-sm font-bold text-amber-600 dark:text-amber-400 text-right">{formatRupiah(totalPajak)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default RegisterPajakPage;
