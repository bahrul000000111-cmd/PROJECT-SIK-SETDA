import React, { useState, useMemo, useContext } from 'react';
import { DpaContext } from '../context/DpaContext';
import { AuthContext } from '../context/AuthContext';
import { FolderOpen, Plus, Trash2, Search, X, AlertTriangle, FileText, Receipt, FileCheck, File } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const JENIS_DOKUMEN = ['SPM', 'Bukti Bayar', 'Nota Dinas', 'Lainnya'];

const JENIS_BADGE = {
  'SPM':        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  'Bukti Bayar': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  'Nota Dinas': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  'Lainnya':    'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
};

const JENIS_ICON = {
  'SPM': Receipt,
  'Bukti Bayar': FileCheck,
  'Nota Dinas': FileText,
  'Lainnya': File,
};

const emptyForm = { nomorDokumen: '', jenisDokumen: 'SPM', subKegiatanId: '', tanggal: '', keterangan: '' };

// ─── Recursive Sub Kegiatan Extractor ────────────────────────────────────────
const extractSubKegiatan = (nodes) => {
  const result = [];
  const walk = (list) => {
    for (const n of list || []) {
      if (n.tipe === 'Sub Kegiatan') result.push({ id: n.id, label: `${n.kode} – ${n.uraian}` });
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return result;
};

// ─── State arsip kini dikelola oleh DpaContext (lifted state) ────────────────

// ─── Main Component ───────────────────────────────────────────────────────────
const ArsipPage = () => {
  const { dpaData, arsipDokumen, addArsip, deleteArsip } = useContext(DpaContext);
  const { currentUser } = useContext(AuthContext);
  const isPemeriksa = currentUser?.role === 'Pemeriksa';
  const subKegiatanList = useMemo(() => extractSubKegiatan(dpaData), [dpaData]);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() =>
    (arsipDokumen || []).filter(a =>
      a.nomorDokumen.toLowerCase().includes(search.toLowerCase()) ||
      a.keterangan.toLowerCase().includes(search.toLowerCase()) ||
      a.jenisDokumen.toLowerCase().includes(search.toLowerCase())
    ), [arsipDokumen, search]);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.nomorDokumen || !form.jenisDokumen || !form.tanggal) {
      setFormError('Nomor Dokumen, Jenis, dan Tanggal wajib diisi!');
      return;
    }
    const subKeg = subKegiatanList.find(s => s.id === form.subKegiatanId);
    const newDoc = {
      id: Date.now(),
      no: (arsipDokumen?.length || 0) + 1,
      ...form,
      namaSubKegiatan: subKeg?.label || '-',
    };
    addArsip(newDoc);
    setForm(emptyForm);
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    deleteArsip(id);
    setDeleteTarget(null);
  };

  const statByJenis = useMemo(() => JENIS_DOKUMEN.map(j => ({ jenis: j, count: (arsipDokumen || []).filter(a => a.jenisDokumen === j).length })), [arsipDokumen]);

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
        <span>Dashboard</span><span>/</span><span>Penatausahaan</span><span>/</span>
        <span className="text-gray-900 dark:text-white">Tambah Arsip Dokumen</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <FolderOpen size={24} className="text-amber-500" />
            Tambah Arsip Dokumen
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Buku kendali digital untuk SPM, Bukti Bayar, dan dokumen penatausahaan lainnya.
          </p>
        </div>
        {/* Tombol Tambah: disembunyikan dari Pemeriksa */}
        {!isPemeriksa && (
        <button
          onClick={() => { setForm(emptyForm); setFormError(''); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          <Plus size={18} /> Tambah Dokumen
        </button>
        )}
      </div>

      {/* Stat Cards per Jenis */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statByJenis.map(({ jenis, count }) => {
          const Icon = JENIS_ICON[jenis] || File;
          const badgeCls = JENIS_BADGE[jenis];
          return (
            <div key={jenis} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-gray-500 dark:text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{jenis}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
            <FolderOpen size={16} className="text-amber-500" />
            Daftar Arsip Dokumen
            <span className="text-xs font-normal text-gray-400">({filtered.length} dokumen)</span>
          </h3>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nomor, jenis, keterangan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none w-64 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-gray-100/80 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-700">
                {['No', 'Nomor Dokumen', 'Jenis Dokumen', 'Sub Kegiatan', 'Tanggal', 'Keterangan', ...(!isPemeriksa ? ['Aksi'] : [])].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isPemeriksa ? 6 : 7} className="px-6 py-20 text-center">
                    <FolderOpen size={44} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      {arsip.length === 0 ? 'Arsip masih kosong' : `Tidak ada hasil untuk "${search}"`}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {arsip.length === 0 ? 'Klik "Tambah Dokumen" untuk mulai mengarsipkan.' : 'Coba kata kunci yang berbeda.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-amber-50/30 dark:hover:bg-amber-900/5 transition-colors">
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 font-mono text-xs">{doc.no}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-gray-900 dark:text-white">{doc.nomorDokumen}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border ${JENIS_BADGE[doc.jenisDokumen] || JENIS_BADGE['Lainnya']}`}>
                        {React.createElement(JENIS_ICON[doc.jenisDokumen] || File, { size: 11 })}
                        {doc.jenisDokumen}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[200px] truncate text-xs" title={doc.namaSubKegiatan}>
                      {doc.namaSubKegiatan}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{doc.tanggal}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[180px] truncate text-xs" title={doc.keterangan}>
                      {doc.keterangan || '—'}
                    </td>
                    {/* Tombol Hapus: disembunyikan dari Pemeriksa */}
                    {!isPemeriksa && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteTarget(doc)}
                        title="Hapus Arsip"
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {(arsipDokumen?.length || 0) > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30">
            <p className="text-xs text-gray-400">Total {arsipDokumen?.length || 0} dokumen tersimpan</p>
          </div>
        )}
      </div>

      {/* Modal Tambah: hanya tampil jika bukan Pemeriksa */}
      {isModalOpen && !isPemeriksa && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white">Tambah Dokumen Arsip</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
                  <AlertTriangle size={14} className="shrink-0" /> {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nomor Dokumen <span className="text-red-500">*</span></label>
                  <input name="nomorDokumen" value={form.nomorDokumen} onChange={handleChange} placeholder="SPM-001/2026" className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Jenis Dokumen <span className="text-red-500">*</span></label>
                  <select name="jenisDokumen" value={form.jenisDokumen} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none appearance-none">
                    {JENIS_DOKUMEN.map(j => <option key={j}>{j}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sub Kegiatan</label>
                <select name="subKegiatanId" value={form.subKegiatanId} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none appearance-none">
                  <option value="">-- Pilih Sub Kegiatan (opsional) --</option>
                  {subKegiatanList.map(sk => <option key={sk.id} value={sk.id}>{sk.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tanggal <span className="text-red-500">*</span></label>
                <input type="date" name="tanggal" value={form.tanggal} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Keterangan</label>
                <textarea name="keterangan" value={form.keterangan} onChange={handleChange} rows={2} placeholder="Catatan tambahan..." className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">Batal</button>
                <button type="submit" className="flex-1 px-4 py-2.5 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm active:scale-[0.98] transition-all cursor-pointer">Simpan Arsip</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL KONFIRMASI HAPUS ════════════════════════════════════════════ */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-gray-800 p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Hapus Dokumen?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Dokumen <span className="font-bold text-gray-800 dark:text-white">{deleteTarget.nomorDokumen}</span>
            </p>
            <p className="text-xs text-gray-400 mb-6">akan dihapus secara permanen dari arsip.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">Batal</button>
              <button onClick={() => handleDelete(deleteTarget.id)} className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl active:scale-[0.98] transition-all cursor-pointer">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArsipPage;
