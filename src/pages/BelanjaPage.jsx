import React, { useState, useContext, useMemo, useEffect } from 'react';
import { DpaContext } from '../context/DpaContext';
import { AuthContext } from '../context/AuthContext';
import { Trash2, AlertCircle, Plus, Info, CheckCircle2, Receipt, ChevronDown, Eye } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const extractBagian = (nodes) =>
  (nodes || []).filter(n => n.tipe === 'Bagian');

const extractSubKegiatan = (nodes, bagianId) => {
  const bagian = (nodes || []).find(n => n.tipe === 'Bagian' && n.id === bagianId);
  if (!bagian) return [];
  const result = [];
  const walk = (children) => {
    for (const n of (children || [])) {
      if (n.tipe === 'Sub Kegiatan') result.push(n);
      if (n.children) walk(n.children);
    }
  };
  walk(bagian.children);
  return result;
};

const findSubKegiatan = (nodes, id) => {
  for (const n of (nodes || [])) {
    if (n.id === id) return n;
    if (n.children) { const f = findSubKegiatan(n.children, id); if (f) return f; }
  }
  return null;
};

const formatRupiah = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

const toNumeric = (s) => parseInt((s || '').replace(/\./g, ''), 10) || 0;

const rupiahInput = (raw) => {
  const n = raw.replace(/[^0-9]/g, '');
  return n ? parseInt(n, 10).toLocaleString('id-ID') : '';
};

const JENIS_SPM = ['GU', 'TU Nihil', 'LS', 'TU'];
const SPM_WITH_TBP = ['GU', 'TU Nihil'];
const JENIS_PAJAK = ['PPH21', 'PPH22', 'PPH23', 'PPHFINAL', 'PPN'];

const emptyForm = {
  nomorSpm: '', tanggalSpm: '', jenisSpm: 'GU', nomorTbp: '',
  bagianId: '', subKegiatanId: '', sumberDana: '',
  uraian: '', nominal: '',
  adaPajak: false, jenisPajak: 'PPN', ntpn: '', nominalPajak: '',
};

// ─── Field Component ─────────────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm outline-none";
const selectCls = inputCls + " appearance-none";

// ─── Main Component ───────────────────────────────────────────────────────────
const BelanjaPage = () => {
  const { dpaData, transactions, addTransaction, deleteTransaction } = useContext(DpaContext);
  const { currentUser } = useContext(AuthContext);
  const isPemeriksa = currentUser?.role === 'Pemeriksa';
  const [form, setForm] = useState(emptyForm);

  const bagianList = useMemo(() => extractBagian(dpaData), [dpaData]);
  const subKegiatanList = useMemo(() => extractSubKegiatan(dpaData, form.bagianId), [dpaData, form.bagianId]);

  // Auto-fill Sumber Dana saat Sub Kegiatan dipilih
  useEffect(() => {
    if (!form.subKegiatanId) { setForm(p => ({ ...p, sumberDana: '' })); return; }
    const sk = findSubKegiatan(dpaData, form.subKegiatanId);
    setForm(p => ({ ...p, sumberDana: sk?.sumberDana || sk?.kode?.split('.')[0] || 'APBD' }));
  }, [form.subKegiatanId, dpaData]);

  // Reset Sub Kegiatan saat Bagian berubah
  useEffect(() => {
    setForm(p => ({ ...p, subKegiatanId: '', sumberDana: '' }));
  }, [form.bagianId]);

  const set = (name, value) => setForm(p => ({ ...p, [name]: value }));
  const handleChange = (e) => set(e.target.name, e.target.type === 'checkbox' ? e.target.checked : e.target.value);

  const selectedSk = useMemo(() => findSubKegiatan(dpaData, form.subKegiatanId), [dpaData, form.subKegiatanId]);
  const totalDpa = selectedSk?.totalAnggaran || 0;
  const totalTerpakai = transactions.filter(t => t.subKegiatanId === form.subKegiatanId).reduce((s, t) => s + t.nominal, 0);
  const sisaPagu = totalDpa - totalTerpakai;
  const numNominal = toNumeric(form.nominal);
  const numPajak = toNumeric(form.nominalPajak);
  const isOverBudget = !!selectedSk && numNominal > sisaPagu;
  const showTbp = SPM_WITH_TBP.includes(form.jenisSpm);
  const isComplete = form.nomorSpm && form.tanggalSpm && form.jenisSpm && form.bagianId && form.subKegiatanId && form.uraian && numNominal > 0 && (!form.adaPajak || (form.jenisPajak && form.ntpn && numPajak > 0));
  const isDisabled = !isComplete || isOverBudget;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isDisabled) return;
    addTransaction({
      id: Date.now(),
      nomorSpm: form.nomorSpm, tanggalSpm: form.tanggalSpm, jenisSpm: form.jenisSpm,
      nomorTbp: showTbp ? form.nomorTbp : '-',
      subKegiatanId: form.subKegiatanId,
      bagianId: selectedSk?.bagianId || form.bagianId,
      namaSubKegiatan: `${selectedSk?.kode || ''} - ${selectedSk?.uraian || ''}`,
      sumberDana: form.sumberDana,
      uraian: form.uraian, nominal: numNominal,
      adaPajak: form.adaPajak,
      jenisPajak: form.adaPajak ? form.jenisPajak : null,
      ntpn: form.adaPajak ? form.ntpn : null,
      nominalPajak: form.adaPajak ? numPajak : 0,
    });
    setForm(emptyForm);
  };

  const totalSeluruh = transactions.reduce((s, t) => s + t.nominal, 0);

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
        <span>Dashboard</span><span>/</span><span>Penatausahaan</span><span>/</span>
        <span className="text-gray-900 dark:text-white">Belanja</span>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Pencatatan Belanja</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Input SPM dan pantau transaksi pengeluaran secara real-time.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Form Kiri: hanya tampil untuk non-Pemeriksa ──────────────── */}
        {!isPemeriksa && (
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Receipt size={18} className="text-blue-500" /> Input SPM Baru
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              {/* ── Seksi 1: Data SPM ── */}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Data SPM</p>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Nomor SPM" required>
                  <input name="nomorSpm" value={form.nomorSpm} onChange={handleChange} placeholder="SPM-001" className={inputCls} />
                </Field>
                <Field label="Tanggal SPM" required>
                  <input type="date" name="tanggalSpm" value={form.tanggalSpm} onChange={handleChange} className={inputCls} />
                </Field>
              </div>

              <Field label="Jenis SPM" required>
                <select name="jenisSpm" value={form.jenisSpm} onChange={handleChange} className={selectCls}>
                  {JENIS_SPM.map(j => <option key={j}>{j}</option>)}
                </select>
              </Field>

              {/* Kondisional: TBP hanya muncul untuk GU & TU Nihil */}
              {showTbp && (
                <Field label="Nomor TBP">
                  <input name="nomorTbp" value={form.nomorTbp} onChange={handleChange} placeholder="TBP-001" className={inputCls} />
                </Field>
              )}

              {/* ── Seksi 2: Data Kegiatan ── */}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">Data Kegiatan</p>

              <Field label="Bagian" required>
                <select name="bagianId" value={form.bagianId} onChange={handleChange} className={selectCls}>
                  <option value="">-- Pilih Bagian --</option>
                  {bagianList.map(b => <option key={b.id} value={b.id}>{b.kode} – {b.uraian}</option>)}
                </select>
              </Field>

              <Field label="Sub Kegiatan" required>
                <select name="subKegiatanId" value={form.subKegiatanId} onChange={handleChange} disabled={!form.bagianId} className={selectCls + (!form.bagianId ? ' opacity-50 cursor-not-allowed' : '')}>
                  <option value="">-- Pilih Sub Kegiatan --</option>
                  {subKegiatanList.map(sk => <option key={sk.id} value={sk.id}>{sk.kode} – {sk.uraian}</option>)}
                </select>
              </Field>

              <Field label="Sumber Dana">
                <input value={form.sumberDana || '-'} readOnly className={inputCls + ' bg-gray-50 dark:bg-gray-800 cursor-default text-gray-500 dark:text-gray-400'} />
              </Field>

              {/* Kalkulator Saldo */}
              {selectedSk && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800/50 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Pagu DPA</span><span className="font-medium">{formatRupiah(totalDpa)}</span></div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Terpakai</span><span className="font-medium text-orange-600 dark:text-orange-400">-{formatRupiah(totalTerpakai)}</span></div>
                  <div className="flex justify-between border-t border-blue-200 dark:border-blue-800/50 pt-1.5">
                    <span className="font-bold text-gray-900 dark:text-white">Sisa Pagu</span>
                    <span className={`font-bold ${sisaPagu < 0 ? 'text-red-600' : 'text-emerald-600 dark:text-emerald-400'}`}>{formatRupiah(sisaPagu)}</span>
                  </div>
                </div>
              )}

              <Field label="Uraian Belanja" required>
                <input name="uraian" value={form.uraian} onChange={handleChange} placeholder="Contoh: Pembelian ATK" className={inputCls} />
              </Field>

              <Field label="Nominal Belanja (Rp)" required>
                <input name="nominal" value={form.nominal} onChange={e => set('nominal', rupiahInput(e.target.value))} placeholder="0"
                  className={inputCls + (isOverBudget ? ' border-red-400 dark:border-red-500 focus:ring-red-500' : '')} />
                {isOverBudget && <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={12} /> Melebihi sisa pagu!</p>}
              </Field>

              {/* ── Seksi 3: Pajak ── */}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">Pajak</p>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className={`w-10 h-5 rounded-full relative transition-colors ${form.adaPajak ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.adaPajak ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <input type="checkbox" name="adaPajak" checked={form.adaPajak} onChange={handleChange} className="sr-only" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{form.adaPajak ? 'Ada Pajak' : 'Tidak Ada Pajak'}</span>
              </label>

              {/* Kondisional: Form Pajak */}
              {form.adaPajak && (
                <div className="space-y-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Detail Pajak</p>
                  <Field label="Jenis Pajak" required>
                    <select name="jenisPajak" value={form.jenisPajak} onChange={handleChange} className={selectCls}>
                      {JENIS_PAJAK.map(j => <option key={j}>{j}</option>)}
                    </select>
                  </Field>
                  <Field label="NTPN" required>
                    <input name="ntpn" value={form.ntpn} onChange={handleChange} placeholder="Nomor Transaksi Penerimaan Negara" className={inputCls} />
                  </Field>
                  <Field label="Nominal Pajak (Rp)" required>
                    <input name="nominalPajak" value={form.nominalPajak} onChange={e => set('nominalPajak', rupiahInput(e.target.value))} placeholder="0" className={inputCls} />
                  </Field>
                </div>
              )}

              <button type="submit" disabled={isDisabled}
                className={`w-full flex justify-center items-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 mt-2 ${isDisabled ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md active:scale-[0.98]'}`}>
                <CheckCircle2 size={18} /> Simpan Transaksi
              </button>
            </form>
          </div>
        </div>
        )} {/* end !isPemeriksa */}

        {/* ── Tabel Kanan ────────────────────────────────────────────── */}
        <div className={isPemeriksa ? 'xl:col-span-3' : 'xl:col-span-2'}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Info size={18} className="text-emerald-500" /> Riwayat Transaksi
              </h3>
              <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-md">{transactions.length} Transaksi</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                    {['Tanggal', 'No. SPM', 'Jenis', 'No. TBP', 'Sub Kegiatan', 'Uraian', 'Nominal', 'Pajak', ...(!isPemeriksa ? ['Aksi'] : [])].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {transactions.length === 0 ? (
                    <tr><td colSpan={isPemeriksa ? 8 : 9} className="px-6 py-14 text-center text-sm text-gray-400">Belum ada transaksi yang dicatat.</td></tr>
                  ) : transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{tx.tanggalSpm || tx.tanggal || '-'}</td>
                      <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white">{tx.nomorSpm || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800">{tx.jenisSpm || '-'}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">{tx.nomorTbp || '-'}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[160px] truncate" title={tx.namaSubKegiatan}>{tx.namaSubKegiatan}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{tx.uraian}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white text-right">{formatRupiah(tx.nominal)}</td>
                      <td className="px-4 py-3">
                        {tx.adaPajak
                          ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-100 dark:border-amber-800">{tx.jenisPajak}</span>
                          : <span className="text-xs text-gray-400">–</span>}
                      </td>
                      {/* Tombol Hapus: disembunyikan dari Pemeriksa */}
                      {!isPemeriksa && (
                      <td className="px-4 py-3">
                        <button onClick={() => deleteTransaction(tx.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors" title="Hapus">
                          <Trash2 size={15} />
                        </button>
                      </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                {transactions.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700">
                      <td colSpan="6" className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white text-right">Total Seluruh Belanja</td>
                      <td className="px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400 text-right">{formatRupiah(totalSeluruh)}</td>
                      <td colSpan={isPemeriksa ? 1 : 2} />
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
