import React, { useState, useContext, useMemo } from 'react';
import { DpaContext } from '../context/DpaContext';
import { Trash2, AlertCircle, Plus, Info, CheckCircle2 } from 'lucide-react';

// Fungsi utilitas untuk ekstraksi Sub Kegiatan
const extractSubKegiatan = (nodes) => {
  let result = [];
  if (!nodes) return result;
  for (const node of nodes) {
    if (node.tipe === 'Sub Kegiatan' && node.totalAnggaran > 0) {
      result.push({
        id: node.id,
        kode: node.kode,
        uraian: node.uraian,
        totalAnggaran: node.totalAnggaran
      });
    }
    if (node.children) {
      result = result.concat(extractSubKegiatan(node.children));
    }
  }
  return result;
};

// Fungsi format Rupiah
const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(angka);
};

const BelanjaPage = () => {
  const { dpaData } = useContext(DpaContext);
  const subKegiatanList = useMemo(() => extractSubKegiatan(dpaData), [dpaData]);

  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    tanggal: '',
    subKegiatanId: '',
    uraian: '',
    nominal: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNominalChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value) {
      value = parseInt(value, 10).toLocaleString('id-ID');
    }
    setForm((prev) => ({ ...prev, nominal: value }));
  };

  const getNumericNominal = (formatted) => {
    return parseInt(formatted.replace(/\./g, ''), 10) || 0;
  };

  // Kalkulasi Saldo
  const selectedSubKegiatan = subKegiatanList.find((sk) => sk.id === form.subKegiatanId);
  const totalDpa = selectedSubKegiatan ? selectedSubKegiatan.totalAnggaran : 0;
  
  const totalTerpakai = transactions
    .filter((t) => t.subKegiatanId === form.subKegiatanId)
    .reduce((sum, t) => sum + t.nominal, 0);
    
  const sisaPagu = totalDpa - totalTerpakai;
  const numericNominal = getNumericNominal(form.nominal);
  
  // Validasi
  const isOverBudget = selectedSubKegiatan && numericNominal > sisaPagu;
  const isFormComplete = form.tanggal && form.subKegiatanId && form.uraian && numericNominal > 0;
  const isSubmitDisabled = !isFormComplete || isOverBudget;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    const newTx = {
      id: Date.now(),
      tanggal: form.tanggal,
      subKegiatanId: form.subKegiatanId,
      namaSubKegiatan: `${selectedSubKegiatan.kode} - ${selectedSubKegiatan.uraian}`,
      uraian: form.uraian,
      nominal: numericNominal
    };

    setTransactions((prev) => [...prev, newTx]);
    setForm({
      tanggal: '',
      subKegiatanId: '',
      uraian: '',
      nominal: ''
    });
  };

  const handleDelete = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const totalSeluruhBelanja = transactions.reduce((sum, t) => sum + t.nominal, 0);

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
        <span>Dashboard</span>
        <span>/</span>
        <span>Penatausahaan</span>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">Belanja</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Pencatatan Belanja
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Catat dan pantau transaksi pengeluaran secara langsung.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Form Kiri */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus size={18} className="text-blue-500" />
                Input Transaksi Baru
              </h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Tanggal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Tanggal Transaksi
                  </label>
                  <input
                    type="date"
                    name="tanggal"
                    value={form.tanggal}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm outline-none"
                  />
                </div>

                {/* Sub Kegiatan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Pilih Sub Kegiatan
                  </label>
                  <select
                    name="subKegiatanId"
                    value={form.subKegiatanId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm outline-none appearance-none"
                  >
                    <option value="">-- Pilih Sub Kegiatan --</option>
                    {subKegiatanList.map((sk) => (
                      <option key={sk.id} value={sk.id}>
                        {sk.kode} - {sk.uraian}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kalkulator Saldo (Muncul jika Sub Kegiatan dipilih) */}
                {selectedSubKegiatan && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/50 space-y-2 text-sm">
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                      <span>Pagu DPA</span>
                      <span className="font-medium">{formatRupiah(totalDpa)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                      <span>Total Terpakai</span>
                      <span className="font-medium text-orange-600 dark:text-orange-400">
                        -{formatRupiah(totalTerpakai)}
                      </span>
                    </div>
                    <div className="border-t border-blue-200 dark:border-blue-800/50 pt-2 flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">Sisa Pagu</span>
                      <span className={`font-bold ${sisaPagu < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatRupiah(sisaPagu)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Uraian */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Uraian Belanja
                  </label>
                  <input
                    type="text"
                    name="uraian"
                    value={form.uraian}
                    onChange={handleInputChange}
                    placeholder="Contoh: Pembelian ATK"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm outline-none"
                  />
                </div>

                {/* Nominal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Nominal Belanja (Rp)
                  </label>
                  <input
                    type="text"
                    name="nominal"
                    value={form.nominal}
                    onChange={handleNominalChange}
                    placeholder="0"
                    className={`w-full px-3 py-2 border rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:outline-none transition-all sm:text-sm ${
                      isOverBudget 
                        ? 'border-red-300 dark:border-red-500/50 focus:ring-red-500 focus:border-transparent' 
                        : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500 focus:border-transparent'
                    }`}
                  />
                  {isOverBudget && (
                    <div className="flex items-center gap-1.5 mt-2 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle size={14} />
                      <span>Nominal melebihi sisa pagu anggaran!</span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className={`w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isSubmitDisabled
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md active:scale-[0.98]'
                  }`}
                >
                  <CheckCircle2 size={18} />
                  Simpan Transaksi
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Kolom Tabel Kanan */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Info size={18} className="text-emerald-500" />
                Riwayat Transaksi
              </h3>
              <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-md">
                {transactions.length} Transaksi
              </span>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sub Kegiatan</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Uraian</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Nominal</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                        Belum ada transaksi yang dicatat.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                          {tx.tanggal}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300 truncate max-w-[200px]" title={tx.namaSubKegiatan}>
                          {tx.namaSubKegiatan}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                          {tx.uraian}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white text-right">
                          {formatRupiah(tx.nominal)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                            title="Hapus Transaksi"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {transactions.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700">
                      <td colSpan="3" className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white text-right">
                        Total Seluruh Belanja
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-blue-600 dark:text-blue-400 text-right">
                        {formatRupiah(totalSeluruhBelanja)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BelanjaPage;
