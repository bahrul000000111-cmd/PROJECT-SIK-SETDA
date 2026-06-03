import React, { useState, useMemo, useContext } from 'react';
import { DpaContext } from '../context/DpaContext';
import { AuthContext } from '../context/AuthContext';
import { FolderOpen, Plus, Trash2, Search, X, AlertTriangle, FileText, File, Upload, Loader2, Eye, Pencil } from 'lucide-react';
import Swal from 'sweetalert2';

const JENIS_DOKUMEN = ['SPM', 'Dokumen Lainnya'];

const JENIS_BADGE = {
  'SPM': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  'Dokumen Lainnya': 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
};

const JENIS_ICON = { 'SPM': FileText, 'Dokumen Lainnya': File };

const emptyForm = { nomorDokumen: '', jenisDokumen: 'SPM', tanggal: '', fileDokumen: null, fileNama: '', keterangan: '' };

const ArsipPage = () => {
  const contextValue = useContext(DpaContext);
  console.log('[ArsipPage] useContext(DpaContext) value:', contextValue);
  const { arsipDokumen: rawArsip, addArsip, deleteArsip, updateArsip } = contextValue;
  const { currentUser } = useContext(AuthContext);
  const isPemeriksa = currentUser?.role === 'Pemeriksa';

  // Pastikan selalu berupa array agar tidak crash saat data sedang di-fetch
  const arsipDokumen = Array.isArray(rawArsip) ? rawArsip : [];


  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen]   = useState(false);
  const [editForm, setEditForm]                 = useState(emptyForm);
  const [editFormError, setEditFormError]       = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  // Preview Modal
  const [previewUrl, setPreviewUrl]             = useState(null);

  const filtered = useMemo(() => {
    const safe = Array.isArray(arsipDokumen) ? arsipDokumen : [];
    if (!search.trim()) return safe;
    const q = search.toLowerCase();
    return safe.filter(a =>
      (a?.nomorDokumen  || '').toLowerCase().includes(q) ||
      (a?.keterangan   || '').toLowerCase().includes(q) ||
      (a?.jenisDokumen || '').toLowerCase().includes(q)
    );
  }, [arsipDokumen, search]);

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

  // ── Lihat Dokumen ────────────────────────────────────────────────────────────
  const handleView = (doc) => {
    if (!doc.fileUrl) {
      Swal.fire({ icon: 'info', title: 'Tidak ada file', text: 'Dokumen ini belum memiliki file yang diunggah.', confirmButtonColor: '#f59e0b' });
      return;
    }
    setPreviewUrl(doc.fileUrl);
  };

  // ── Edit Arsip ───────────────────────────────────────────────────────────────
  const handleEdit = (doc) => {
    // FIX #1: Normalisasi tanggal ISO (2026-02-22T00:00:00.000000Z) → YYYY-MM-DD
    // agar <input type="date"> dapat membaca nilainya dengan benar.
    const tanggalNormalized = doc.tanggal ? String(doc.tanggal).split('T')[0] : '';
    setEditForm({
      nomorDokumen: doc.nomorDokumen || '',
      jenisDokumen: doc.jenisDokumen || 'SPM',
      tanggal:      tanggalNormalized,
      keterangan:   doc.keterangan   || '',
      fileDokumen:  null,
      fileNama:     '',
      _id:          doc.id,
    });
    setEditFormError('');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    // FIX #3: Pastikan preventDefault dipanggil pertama agar tidak ada page refresh.
    e.preventDefault();
    setEditFormError('');
    // FIX #2: Keterangan tidak lagi wajib diisi — hapus dari guard validasi.
    if (!editForm.nomorDokumen || !editForm.jenisDokumen || !editForm.tanggal) {
      setEditFormError('Nomor Dokumen, Jenis Dokumen, dan Tanggal wajib diisi!');
      return;
    }
    setIsEditSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('_method',         'PUT');
      fd.append('nomor_dokumen',   editForm.nomorDokumen);
      fd.append('jenis_dokumen',   editForm.jenisDokumen);
      fd.append('tanggal_dokumen', editForm.tanggal);
      fd.append('keterangan',      editForm.keterangan);
      if (editForm.fileDokumen instanceof window.File) fd.append('file_dokumen', editForm.fileDokumen);
      const result = await updateArsip(editForm._id, fd);
      if (result.success) {
        setIsEditModalOpen(false);
        Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Arsip berhasil diperbarui.', confirmButtonColor: '#f59e0b', timer: 1800, showConfirmButton: false });
      } else {
        setEditFormError(result.message || 'Gagal memperbarui arsip.');
      }
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // ── Hapus Arsip (SweetAlert2) ────────────────────────────────────────────────
  const handleDelete = async (doc) => {
    const result = await Swal.fire({
      title: 'Hapus Dokumen?',
      html: `Dokumen <strong>${doc.nomorDokumen}</strong> akan dihapus secara permanen dari arsip.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor:  '#6b7280',
      confirmButtonText:  'Ya, Hapus!',
      cancelButtonText:   'Batal',
    });
    if (!result.isConfirmed) return;
    const res = await deleteArsip(doc.id);
    if (res?.success === false) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: res.message, confirmButtonColor: '#f59e0b' });
    } else {
      Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Arsip berhasil dihapus.', timer: 1500, showConfirmButton: false });
    }
  };

  const statByJenis = useMemo(() => {
    const safe = Array.isArray(arsipDokumen) ? arsipDokumen : [];
    return JENIS_DOKUMEN.map(j => ({
      jenis: j,
      count: safe.filter(a => a?.jenisDokumen === j).length,
    }));
  }, [arsipDokumen]);

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
              {['No', 'Nomor Dokumen', 'Jenis Dokumen', 'Tanggal', 'File', 'Keterangan', 'Aksi'].map(h => (
                <th key={h} className={`px-4 py-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${ h === 'Aksi' ? 'text-center' : 'text-left'}`}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-20 text-center">
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-center">
                      {/* Lihat Dokumen */}
                      <button
                        onClick={() => handleView(doc)}
                        title="Lihat Dokumen"
                        className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-colors cursor-pointer"
                      >
                        <Eye size={15} />
                      </button>
                      {/* Edit — hanya non-Pemeriksa */}
                      {!isPemeriksa && (
                        <button
                          onClick={() => handleEdit(doc)}
                          title="Edit Arsip"
                          className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-md transition-colors cursor-pointer"
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                      {/* Hapus — hanya non-Pemeriksa */}
                      {!isPemeriksa && (
                        <button
                          onClick={() => handleDelete(doc)}
                          title="Hapus Arsip"
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
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

      {/* ── Modal Preview Dokumen ─────────────────────────────────────────────── */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <span className="text-sm font-semibold text-gray-700 dark:text-white flex items-center gap-2"><Eye size={15} className="text-blue-500" /> Preview Dokumen</span>
              <div className="flex items-center gap-2">
                <a href={previewUrl} target="_blank" rel="noreferrer"
                  className="text-xs font-semibold px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">Buka di Tab Baru</a>
                <button onClick={() => setPreviewUrl(null)} className="p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer"><X size={16} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <iframe src={previewUrl} title="Preview Dokumen" className="w-full" style={{ height: '75vh', border: 'none' }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Edit Arsip ─────────────────────────────────────────────────── */}
      {isEditModalOpen && !isPemeriksa && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Pencil size={16} className="text-amber-500" /> Edit Dokumen Arsip</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editFormError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
                  <AlertTriangle size={14} className="shrink-0" /> {editFormError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nomor Dokumen <span className="text-red-500">*</span></label>
                <input name="nomorDokumen" value={editForm.nomorDokumen}
                  onChange={e => setEditForm(p => ({ ...p, nomorDokumen: e.target.value }))}
                  placeholder="SPM-001/2026" className={iCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Jenis Dokumen <span className="text-red-500">*</span></label>
                <select name="jenisDokumen" value={editForm.jenisDokumen}
                  onChange={e => setEditForm(p => ({ ...p, jenisDokumen: e.target.value }))}
                  className={iCls + " appearance-none"}>
                  {JENIS_DOKUMEN.map(j => <option key={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tanggal Dokumen <span className="text-red-500">*</span></label>
                <input type="date" name="tanggal" value={editForm.tanggal}
                  onChange={e => setEditForm(p => ({ ...p, tanggal: e.target.value }))}
                  className={iCls} />
              </div>
              <div>
                {/* FIX #2: Label ubah jadi opsional, atribut required dihapus dari textarea */}
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Keterangan <span className="text-xs font-normal text-gray-400">(opsional)</span>
                </label>
                <textarea name="keterangan" value={editForm.keterangan} rows={2}
                  onChange={e => setEditForm(p => ({ ...p, keterangan: e.target.value }))}
                  placeholder="Keterangan tambahan..." className={iCls + " resize-none"} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Ganti File (PDF) — opsional</label>
                <input type="file" accept=".pdf,application/pdf"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.type !== 'application/pdf') { setEditFormError('Hanya file PDF!'); e.target.value = ''; return; }
                    setEditFormError('');
                    setEditForm(p => ({ ...p, fileDokumen: file, fileNama: file.name }));
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 dark:file:bg-amber-900/20 dark:file:text-amber-400 cursor-pointer border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800" />
                {editForm.fileNama && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1"><Upload size={11} /> {editForm.fileNama}</p>}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsEditModalOpen(false)} disabled={isEditSubmitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50">Batal</button>
                <button type="submit" disabled={isEditSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                  {isEditSubmitting ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</> : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArsipPage;
