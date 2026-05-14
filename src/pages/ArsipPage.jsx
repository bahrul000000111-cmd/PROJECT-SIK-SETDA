import React, { useState, useMemo, useContext } from 'react';
import { DpaContext } from '../context/DpaContext';
import { AuthContext } from '../context/AuthContext';
import { FolderOpen, Plus, Trash2, Search, X, AlertTriangle, FileText, File, Upload, Loader2 } from 'lucide-react';

const JENIS_DOKUMEN = ['SPM', 'Dokumen Lainnya'];

const JENIS_BADGE = {
  'SPM': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  'Dokumen Lainnya': 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
};

const JENIS_ICON = { 'SPM': FileText, 'Dokumen Lainnya': File };

const emptyForm = { nomorDokumen: '', jenisDokumen: 'SPM', tanggal: '', fileDokumen: null, fileNama: '', keterangan: '' };

const ArsipPage = () => {
  const { arsipDokumen: rawArsip, addArsip, deleteArsip } = useContext(DpaContext);
  const { currentUser } = useContext(AuthContext);
  const isPemeriksa = currentUser?.role === 'Pemeriksa';

  // Pastikan selalu berupa array agar tidak crash saat data sedang di-fetch
  const arsipDokumen = Array.isArray(rawArsip) ? rawArsip : [];


  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); // id yang sedang dihapus

  const filtered = useMemo(() =>
    (arsipDokumen || []).filter(a =>
      a.nomorDokumen.toLowerCase().includes(search.toLowerCase()) ||
      (a.keterangan || '').toLowerCase().includes(search.toLowerCase()) ||
      a.jenisDokumen.toLowerCase().includes(search.toLowerCase())
    ), [arsipDokumen, search]);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setFormError('Hanya file PDF yang diizinkan!');
      e.target.value = '';
      return;
    }
    setFormError('');
    setForm(p => ({ ...p, fileDokumen: file, fileNama: file.name }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.nomorDokumen || !form.jenisDokumen || !form.tanggal || !form.keterangan) {
      setFormError('Nomor Dokumen, Jenis, Tanggal, dan Keterangan wajib diisi!');
      return;
    }
    setIsSubmitting(true);
    try {
      // Kirim seluruh form (termasuk File object) ke addArsip di DpaContext
      const result = await addArsip({
        nomorDokumen: form.nomorDokumen,
        jenisDokumen: form.jenisDokumen,
        tanggal:      form.tanggal,
        keterangan:   form.keterangan,
        fileDokumen:  form.fileDokumen || null, // File object
      });
      if (result.success) {
        setForm(emptyForm);
        setIsModalOpen(false);
      } else {
        setFormError(result.message || 'Gagal menyimpan dokumen.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setIsDeleting(id);
    try {
      await deleteArsip(id);
    } finally {
      setIsDeleting(null);
      setDeleteTarget(null);
    }
  };

  const statByJenis = useMemo(() => JENIS_DOKUMEN.map(j => ({ jenis: j, count: (arsipDokumen || []).filter(a => a.jenisDokumen === j).length })), [arsipDokumen]);

  const iCls = "w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none";

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
        <span>Dashboard</span><span>/</span><span>Penatausahaan</span><span>/</span>
        <span className="text-gray-900 dark:text-white">Tambah Arsip Dokumen</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <FolderOpen size={24} className="text-amber-500" /> Tambah Arsip Dokumen
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Buku kendali digital untuk SPM dan dokumen penatausahaan lainnya.</p>
        </div>
        {!isPemeriksa && (
          <button onClick={() => { setForm(emptyForm); setFormError(''); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer">
            <Plus size={18} /> Tambah Dokumen
          </button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4">
        {statByJenis.map(({ jenis, count }) => {
          const Icon = JENIS_ICON[jenis] || File;
          return (
            <div key={jenis} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center shrink-0"><Icon size={20} className="text-gray-500 dark:text-gray-400" /></div>
              <div className="min-w-0"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{jenis}</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p></div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
            <FolderOpen size={16} className="text-amber-500" /> Daftar Arsip Dokumen
            <span className="text-xs font-normal text-gray-400">({filtered.length} dokumen)</span>
          </h3>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Cari nomor, jenis, keterangan..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none w-64 transition-all" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm whitespace-nowrap">
            <thead><tr className="bg-gray-100/80 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-700">
              {['No', 'Nomor Dokumen', 'Jenis Dokumen', 'Tanggal', 'File', 'Keterangan', ...(!isPemeriksa ? ['Aksi'] : [])].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={isPemeriksa ? 6 : 7} className="px-6 py-20 text-center">
                  <FolderOpen size={44} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    {(arsipDokumen || []).length === 0 ? 'Arsip masih kosong' : `Tidak ada hasil untuk "${search}"`}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {(arsipDokumen || []).length === 0 ? 'Klik "Tambah Dokumen" untuk mulai mengarsipkan.' : 'Coba kata kunci yang berbeda.'}
                  </p>
                </td></tr>
              ) : filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-colors">
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500 font-mono text-xs">{doc.no}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-gray-900 dark:text-white">{doc.nomorDokumen}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border ${JENIS_BADGE[doc.jenisDokumen] || JENIS_BADGE['Dokumen Lainnya']}`}>
                      {React.createElement(JENIS_ICON[doc.jenisDokumen] || File, { size: 11 })}
                      {doc.jenisDokumen}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{doc.tanggal}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs truncate max-w-[140px]" title={doc.fileNama}>{doc.fileNama || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[180px] truncate text-xs" title={doc.keterangan}>{doc.keterangan || '—'}</td>
                  {!isPemeriksa && (
                    <td className="px-4 py-3"><button onClick={() => setDeleteTarget(doc)} title="Hapus Arsip" className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"><Trash2 size={15} /></button></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(arsipDokumen?.length || 0) > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30">
            <p className="text-xs text-gray-400">Total {arsipDokumen?.length || 0} dokumen tersimpan</p>
          </div>
        )}
      </div>

      {/* Modal Tambah */}
      {isModalOpen && !isPemeriksa && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white">Tambah Dokumen Arsip</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
                  <AlertTriangle size={14} className="shrink-0" /> {formError}
                </div>
              )}
              {/* 1. Nomor Dokumen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nomor Dokumen <span className="text-red-500">*</span></label>
                <input name="nomorDokumen" value={form.nomorDokumen} onChange={handleChange} placeholder="SPM-001/2026" className={iCls} />
              </div>
              {/* 2. Jenis Dokumen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Jenis Dokumen <span className="text-red-500">*</span></label>
                <select name="jenisDokumen" value={form.jenisDokumen} onChange={handleChange} className={iCls + " appearance-none"}>
                  {JENIS_DOKUMEN.map(j => <option key={j}>{j}</option>)}
                </select>
              </div>
              {/* 3. Tanggal Dokumen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tanggal Dokumen <span className="text-red-500">*</span></label>
                <input type="date" name="tanggal" value={form.tanggal} onChange={handleChange} className={iCls} />
              </div>
              {/* 4. Upload Dokumen (PDF only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Upload Dokumen (PDF)</label>
                <div className="relative">
                  <input type="file" accept=".pdf,application/pdf" onChange={handleFileChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 dark:file:bg-amber-900/20 dark:file:text-amber-400 cursor-pointer border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800" />
                </div>
                {form.fileNama && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1"><Upload size={11} /> {form.fileNama}</p>}
              </div>
              {/* 5. Keterangan (Required) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Keterangan <span className="text-red-500">*</span></label>
                <textarea name="keterangan" value={form.keterangan} onChange={handleChange} rows={2} placeholder="Wajib diisi..." className={iCls + " resize-none"} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                  {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</> : 'Simpan Arsip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-gray-800 p-6 text-center">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={28} className="text-red-600 dark:text-red-400" /></div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Hapus Dokumen?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Dokumen <span className="font-bold text-gray-800 dark:text-white">{deleteTarget.nomorDokumen}</span></p>
            <p className="text-xs text-gray-400 mb-6">akan dihapus secara permanen dari arsip.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={isDeleting === deleteTarget?.id} className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">Batal</button>
              <button onClick={() => handleDelete(deleteTarget.id)} disabled={isDeleting === deleteTarget?.id} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60">
                {isDeleting === deleteTarget?.id ? <><Loader2 size={14} className="animate-spin" /> Menghapus...</> : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArsipPage;
