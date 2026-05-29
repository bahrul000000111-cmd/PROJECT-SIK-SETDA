import React, { useState, useContext, useMemo, useEffect } from 'react';
import { DpaContext } from '../context/DpaContext';
import { AuthContext } from '../context/AuthContext';
import { Trash2, AlertCircle, CheckCircle2, Receipt, Info, Loader2 } from 'lucide-react';

const formatRupiah = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);
const toNumeric = (s) => parseInt((s || '').replace(/\./g, ''), 10) || 0;
const rupiahInput = (raw) => { const n = raw.replace(/[^0-9]/g, ''); return n ? parseInt(n, 10).toLocaleString('id-ID') : ''; };

const findNode = (nodes, id) => {
  for (const n of nodes || []) {
    if (n.id === id) return n;
    if (n.children) { const f = findNode(n.children, id); if (f) return f; }
  }
  return null;
};
const collectByTipe = (nodes, tipe) => {
  const r = [];
  const w = (list) => { for (const n of list || []) { if (n.tipe === tipe) r.push(n); if (n.children) w(n.children); } };
  w(nodes); return r;
};
const findBagianName = (nodes, targetId) => {
  for (const b of nodes || []) {
    if (b.tipe === 'Bagian' && findNode(b.children, targetId)) return b.uraian;
  }
  return '-';
};

/**
 * Sebuah item dianggap LEAF (dapat dipilih) jika tidak ada item lain
 * dalam array yang sama yang kode-nya dimulai dengan kode item ini.
 * Contoh:
 *   '5.1.01'           → PARENT  (ada '5.1.01.01' di array)
 *   '5.1.01.01.01.0001'→ LEAF    (tidak ada anak yang lebih spesifik)
 */
const isLeafNode = (item, allItems) =>
  !allItems.some(
    (other) => other.kode !== item.kode && String(other.kode).startsWith(String(item.kode))
  );

const JENIS_SPM = ['GU', 'TU Nihil', 'LS', 'TU'];
const SPM_WITH_TBP = ['GU', 'TU Nihil'];
const JENIS_PAJAK = ['PPH21', 'PPH22', 'PPH23', 'PPHFINAL', 'PPN'];

const emptyForm = {
  nomorSpm: '', tanggalSpm: '', jenisSpm: 'GU', nomorTbp: '',
  programId: '', kegiatanId: '', subKegiatanId: '', uraianBelanjaId: '',
  sumberDana: '', uraian: '', nominal: '',
  adaPajak: false, jenisPajak: 'PPN', ntpn: '', nominalPajak: '', tanggalPajak: '',
};

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const iCls = "w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm outline-none";
const sCls = iCls + " appearance-none";
const dCls = " opacity-50 cursor-not-allowed";

const BelanjaPage = () => {
  const { dpaData: rawDpaData, transactions: rawTransactions, addTransaction, deleteTransaction } = useContext(DpaContext);
  const { currentUser } = useContext(AuthContext);
  const isPemeriksa = currentUser?.role === 'Pemeriksa';

  // Pastikan selalu berupa array agar tidak crash saat data sedang di-fetch
  const dpaData      = Array.isArray(rawDpaData)      ? rawDpaData      : [];
  const transactions = Array.isArray(rawTransactions) ? rawTransactions : [];

  const [form, setForm] = useState(emptyForm);

  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [submitError, setSubmitError]       = useState('');
  const [nominalFieldError, setNominalFieldError] = useState(''); // Phase 3: 422 sisa anggaran

  // Phase 2: Filter & Pagination states untuk Riwayat Transaksi
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');
  const [filterActive, setFilterActive] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage]   = useState(1);
  const PAGE_SIZE = 10;

  const programList = useMemo(() => collectByTipe(dpaData, 'Program'), [dpaData]);
  const kegiatanList = useMemo(() => {
    const p = findNode(dpaData, form.programId);
    return (p?.children || []).filter(c => c.tipe === 'Kegiatan');
  }, [dpaData, form.programId]);
  const subKegList = useMemo(() => {
    const k = findNode(dpaData, form.kegiatanId);
    return (k?.children || []).filter(c => c.tipe === 'Sub Kegiatan');
  }, [dpaData, form.kegiatanId]);
  // Hanya tampilkan leaf node (kode paling spesifik) di dropdown Uraian Belanja.
  // Parent codes (e.g. "5.1.01") disembunyikan agar user tidak memilih kode yang salah.
  const uraianList = useMemo(() => {
    const sk = findNode(dpaData, form.subKegiatanId);
    const all = sk?.rincianBelanja || [];
    return all.filter((item) => isLeafNode(item, all));
  }, [dpaData, form.subKegiatanId]);

  useEffect(() => { setForm(p => ({ ...p, kegiatanId: '', subKegiatanId: '', uraianBelanjaId: '', sumberDana: '', uraian: '' })); }, [form.programId]);
  useEffect(() => { setForm(p => ({ ...p, subKegiatanId: '', uraianBelanjaId: '', sumberDana: '', uraian: '' })); }, [form.kegiatanId]);
  useEffect(() => { setForm(p => ({ ...p, uraianBelanjaId: '', sumberDana: '', uraian: '' })); }, [form.subKegiatanId]);
  useEffect(() => {
    if (!form.uraianBelanjaId) { setForm(p => ({ ...p, sumberDana: '', uraian: '' })); return; }
    const rb = uraianList.find(r => r.id === form.uraianBelanjaId);
    if (rb) setForm(p => ({ ...p, sumberDana: rb.sumberDana || 'APBD', uraian: rb.uraian || '' }));
  }, [form.uraianBelanjaId, uraianList]);

  const set = (name, value) => setForm(p => ({ ...p, [name]: value }));
  const handleChange = (e) => set(e.target.name, e.target.type === 'checkbox' ? e.target.checked : e.target.value);

  const selectedSk = useMemo(() => findNode(dpaData, form.subKegiatanId), [dpaData, form.subKegiatanId]);
  const totalDpa = selectedSk?.totalAnggaran || 0;
  const totalTerpakai = (Array.isArray(transactions) ? transactions : [])
    .filter(t => t?.subKegiatanId === form.subKegiatanId)
    .reduce((s, t) => s + (t?.nominal || 0), 0);
  const sisaPagu = totalDpa - totalTerpakai;
  const numNominal = toNumeric(form.nominal);
  const numPajak = toNumeric(form.nominalPajak);
  const isOverBudget = !!selectedSk && numNominal > sisaPagu;
  const showTbp = SPM_WITH_TBP.includes(form.jenisSpm);
  const isComplete =
    form.nomorSpm &&
    form.tanggalSpm &&
    form.programId &&
    form.kegiatanId &&           // ← Fix #1: kegiatanId was missing from the guard
    form.subKegiatanId &&
    form.uraianBelanjaId &&
    form.uraian &&
    numNominal > 0 &&
    (!form.adaPajak || (form.jenisPajak && form.ntpn && numPajak > 0 && form.tanggalPajak));
  const isDisabled = !isComplete || isOverBudget;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // ── Frontend validation: give the user a clear visible error instead of a silent lock ──
    if (!form.nomorSpm.trim())        { setSubmitError('Nomor SPM wajib diisi.');              return; }
    if (!form.tanggalSpm)             { setSubmitError('Tanggal SPM wajib diisi.');            return; }
    if (!form.programId)              { setSubmitError('Program wajib dipilih.');              return; }
    if (!form.kegiatanId)             { setSubmitError('Kegiatan wajib dipilih.');             return; }
    if (!form.subKegiatanId)          { setSubmitError('Sub Kegiatan wajib dipilih.');         return; }
    if (!form.uraianBelanjaId)        { setSubmitError('Uraian Belanja wajib dipilih.');       return; }
    if (!form.uraian)                 { setSubmitError('Uraian belanja belum terisi — pilih Uraian Belanja terlebih dahulu.'); return; }
    if (numNominal <= 0)              { setSubmitError('Nominal Belanja wajib diisi dan harus lebih dari 0.'); return; }
    if (isOverBudget)                 { setSubmitError(`Nominal melebihi sisa pagu anggaran (${formatRupiah(sisaPagu)}).`); return; }
    if (form.adaPajak) {
      if (!form.jenisPajak)           { setSubmitError('Jenis Pajak wajib dipilih.');          return; }
      if (!form.ntpn.trim())          { setSubmitError('NTPN wajib diisi.');                   return; }
      if (numPajak <= 0)              { setSubmitError('Nominal Pajak harus lebih dari 0.');   return; }
      if (!form.tanggalPajak)         { setSubmitError('Tanggal Pajak wajib diisi.');          return; }
    }

    setSubmitError('');
    setNominalFieldError('');
    setIsSubmitting(true);
    try {
      const result = await addTransaction({
        nomorSpm:       form.nomorSpm,
        tanggalSpm:     form.tanggalSpm,
        jenisSpm:       form.jenisSpm,
        nomorTbp:       showTbp ? form.nomorTbp : '-',
        programId:      form.programId,
        kegiatanId:     form.kegiatanId,
        subKegiatanId:  form.subKegiatanId,
        bagianId:       form.programId,
        bagianName:     findBagianName(dpaData, form.subKegiatanId),
        namaSubKegiatan:`${selectedSk?.kode || ''} - ${selectedSk?.uraian || ''}`,
        sumberDana:     form.sumberDana,
        uraian:         form.uraian,
        nominal:        numNominal,
        adaPajak:       form.adaPajak,
        jenisPajak:     form.adaPajak ? form.jenisPajak : null,
        ntpn:           form.adaPajak ? form.ntpn : null,
        nominalPajak:   form.adaPajak ? numPajak : 0,
        tanggalPajak:   form.adaPajak ? form.tanggalPajak : null,
      });
      if (result.success) {
        setForm(emptyForm);
      } else if (result.fieldError === 'nominal') {
        // 422 sisa anggaran — tampilkan di bawah input nominal
        setNominalFieldError(result.message || 'Nominal melebihi sisa anggaran.');
      } else {
        // Semua error lain (nomor_spm duplikat, 500, network) — tampilkan di alert box
        setSubmitError(result.message || 'Gagal menyimpan transaksi. Periksa kembali data Anda.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSeluruh = (Array.isArray(transactions) ? transactions : []).reduce((s, t) => s + (t?.nominal || 0), 0);

  // ── Phase 2: Filter & Pagination logic (client-side on global transactions) ──
  const filteredTx = (Array.isArray(transactions) ? transactions : []).filter(tx => {
    if (!filterActive.start && !filterActive.end) return true;
    const txDate = tx.tanggalSpm || '';
    if (filterActive.start && txDate < filterActive.start) return false;
    if (filterActive.end   && txDate > filterActive.end)   return false;
    return true;
  });
  const totalPages   = Math.max(1, Math.ceil(filteredTx.length / PAGE_SIZE));
  const safePage     = Math.min(currentPage, totalPages);
  const pagedTx      = filteredTx.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const applyFilter = () => {
    setFilterActive({ start: startDate, end: endDate });
    setCurrentPage(1);
  };
  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    setFilterActive({ start: '', end: '' });
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
        <span>Dashboard</span><span>/</span><span>Penatausahaan</span><span>/</span>
        <span className="text-gray-900 dark:text-white">Input Belanja</span>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Input Belanja</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Input SPM dan pantau transaksi pengeluaran secara real-time.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {!isPemeriksa && (
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Receipt size={18} className="text-blue-500" /> Input SPM Baru
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Data SPM</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nomor SPM" required><input name="nomorSpm" value={form.nomorSpm} onChange={handleChange} placeholder="SPM-001" className={iCls} /></Field>
                <Field label="Tanggal SPM" required><input type="date" name="tanggalSpm" value={form.tanggalSpm} onChange={handleChange} className={iCls} /></Field>
              </div>
              <Field label="Jenis SPM" required>
                <select name="jenisSpm" value={form.jenisSpm} onChange={handleChange} className={sCls}>{JENIS_SPM.map(j => <option key={j}>{j}</option>)}</select>
              </Field>
              {showTbp && (<Field label="Nomor TBP"><input name="nomorTbp" value={form.nomorTbp} onChange={handleChange} placeholder="TBP-001" className={iCls} /></Field>)}

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">Data Kegiatan (Hierarki DPA)</p>
              <Field label="Program" required>
                <select name="programId" value={form.programId} onChange={handleChange} className={sCls}><option value="">-- Pilih Program --</option>{programList.map(p => <option key={p.id} value={p.id}>{p.kode} – {p.uraian}</option>)}</select>
              </Field>
              <Field label="Kegiatan" required>
                <select name="kegiatanId" value={form.kegiatanId} onChange={handleChange} disabled={!form.programId} className={sCls + (!form.programId ? dCls : '')}><option value="">-- Pilih Kegiatan --</option>{kegiatanList.map(k => <option key={k.id} value={k.id}>{k.kode} – {k.uraian}</option>)}</select>
              </Field>
              <Field label="Sub Kegiatan" required>
                <select name="subKegiatanId" value={form.subKegiatanId} onChange={handleChange} disabled={!form.kegiatanId} className={sCls + (!form.kegiatanId ? dCls : '')}><option value="">-- Pilih Sub Kegiatan --</option>{subKegList.map(sk => <option key={sk.id} value={sk.id}>{sk.kode} – {sk.uraian}</option>)}</select>
              </Field>
              <Field label="Uraian Belanja" required>
                <select name="uraianBelanjaId" value={form.uraianBelanjaId} onChange={handleChange} disabled={!form.subKegiatanId} className={sCls + (!form.subKegiatanId ? dCls : '')}><option value="">-- Pilih Uraian Belanja --</option>{uraianList.map(rb => <option key={rb.id} value={rb.id}>{rb.kode} – {rb.uraian}</option>)}</select>
              </Field>
              <Field label="Sumber Dana"><input value={form.sumberDana || '-'} readOnly className={iCls + ' bg-gray-50 dark:bg-gray-800 cursor-default text-gray-500 dark:text-gray-400'} /></Field>

              {selectedSk && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800/50 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Pagu DPA</span><span className="font-medium">{formatRupiah(totalDpa)}</span></div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Terpakai</span><span className="font-medium text-orange-600 dark:text-orange-400">-{formatRupiah(totalTerpakai)}</span></div>
                  <div className="flex justify-between border-t border-blue-200 dark:border-blue-800/50 pt-1.5"><span className="font-bold text-gray-900 dark:text-white">Sisa Pagu</span><span className={`font-bold ${sisaPagu < 0 ? 'text-red-600' : 'text-emerald-600 dark:text-emerald-400'}`}>{formatRupiah(sisaPagu)}</span></div>
                </div>
              )}

              <Field label="Nominal Belanja (Rp)" required>
                <input name="nominal" value={form.nominal} onChange={e => set('nominal', rupiahInput(e.target.value))} placeholder="0" className={iCls + ((isOverBudget || nominalFieldError) ? ' border-red-400 dark:border-red-500 focus:ring-red-500' : '')} />
                {isOverBudget && <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={12} /> Melebihi sisa pagu!</p>}
                {nominalFieldError && !isOverBudget && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {nominalFieldError}
                  </p>
                )}
              </Field>

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">Pajak</p>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className={`w-10 h-5 rounded-full relative transition-colors ${form.adaPajak ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}><div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.adaPajak ? 'translate-x-5' : 'translate-x-0'}`} /></div>
                <input type="checkbox" name="adaPajak" checked={form.adaPajak} onChange={handleChange} className="sr-only" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{form.adaPajak ? 'Ada Pajak' : 'Tidak Ada Pajak'}</span>
              </label>
              {form.adaPajak && (
                <div className="space-y-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Detail Pajak</p>
                  <Field label="Jenis Pajak" required><select name="jenisPajak" value={form.jenisPajak} onChange={handleChange} className={sCls}>{JENIS_PAJAK.map(j => <option key={j}>{j}</option>)}</select></Field>
                  <Field label="NTPN" required><input name="ntpn" value={form.ntpn} onChange={handleChange} placeholder="Nomor Transaksi Penerimaan Negara" className={iCls} /></Field>
                  <Field label="Nominal Pajak (Rp)" required><input name="nominalPajak" value={form.nominalPajak} onChange={e => set('nominalPajak', rupiahInput(e.target.value))} placeholder="0" className={iCls} /></Field>
                  <Field label="Tanggal Pajak" required><input type="date" name="tanggalPajak" value={form.tanggalPajak} onChange={handleChange} className={iCls} /></Field>
                </div>
              )}
              {submitError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
                  <AlertCircle size={12} className="shrink-0" /> {submitError}
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center items-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 mt-2 ${
                  isSubmitting
                    ? 'bg-blue-400 dark:bg-blue-500 text-white cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer'
                }`}
              >
                {isSubmitting
                  ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                  : <><CheckCircle2 size={18} /> Simpan Transaksi</>
                }
              </button>
            </form>
          </div>
        </div>
        )}

        <div className={isPemeriksa ? 'xl:col-span-3' : 'xl:col-span-2'}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Toolbar: judul + filter tanggal */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Info size={18} className="text-emerald-500" /> Riwayat Transaksi</h3>
              {/* Phase 2: Date Filter UI */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-xs text-gray-400">s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  onClick={applyFilter}
                  className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-[#1e293b] text-white hover:bg-slate-700 transition-colors"
                >Filter</button>
                {(filterActive.start || filterActive.end) && (
                  <button
                    onClick={clearFilter}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >Reset</button>
                )}
                <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-md">
                  {filteredTx.length} Transaksi
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead><tr className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                  {['Tanggal', 'No. SPM', 'Jenis', 'Bagian', 'Uraian', 'Nominal', 'Pajak', ...(!isPemeriksa ? ['Aksi'] : [])].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pagedTx.length === 0 ? (
                    <tr><td colSpan={isPemeriksa ? 7 : 8} className="px-6 py-14 text-center text-sm text-gray-400">
                      {filterActive.start || filterActive.end ? 'Tidak ada transaksi untuk rentang tanggal ini.' : 'Belum ada transaksi yang dicatat.'}
                    </td></tr>
                  ) : pagedTx.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{tx.tanggalSpm || '-'}</td>
                      <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white">{tx.nomorSpm || '-'}</td>
                      <td className="px-4 py-3"><span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800">{tx.jenisSpm || '-'}</span></td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[150px] truncate" title={tx.bagianName}>{tx.bagianName || '-'}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{tx.uraian}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white text-right">{formatRupiah(tx.nominal)}</td>
                      <td className="px-4 py-3">{tx.adaPajak ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-100 dark:border-amber-800">{tx.jenisPajak}</span> : <span className="text-xs text-gray-400">–</span>}</td>
                      {!isPemeriksa && (<td className="px-4 py-3"><button onClick={() => deleteTransaction(tx.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors cursor-pointer" title="Hapus"><Trash2 size={15} /></button></td>)}
                    </tr>
                  ))}
                </tbody>
                {filteredTx.length > 0 && (<tfoot><tr className="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700"><td colSpan="5" className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white text-right">Total Seluruh Belanja</td><td className="px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400 text-right">{formatRupiah(totalSeluruh)}</td><td colSpan={isPemeriksa ? 1 : 2} /></tr></tfoot>)}
              </table>
            </div>

            {/* Phase 2: Pagination UI */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30 flex items-center justify-between gap-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Halaman {safePage} dari {totalPages} &bull; {filteredTx.length} data
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >← Prev</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setCurrentPage(item)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            item === safePage
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >{item}</button>
                      )
                    )
                  }
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >Next →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BelanjaPage;
