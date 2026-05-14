/**
 * src/context/DpaContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Single Source of Truth untuk semua data keuangan:
 *   - dpaData       → dari GET /api/dpa/hierarchy  (struktur berjenjang)
 *   - transactions  → dari GET /api/transactions   (flat list)
 *   - arsipDokumen  → dari GET /api/arsip           (flat list)
 *
 * TIDAK ada localStorage untuk data ini.
 * Semua mutasi (add/delete) memanggil API, lalu refresh state.
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import api, { getApiErrorMessage } from '../api';

export const DpaContext = createContext();

// ─── Backward-compatible export (DpaPage.jsx still imports this) ──────────────
// Tree totals sekarang dihitung oleh transformHierarchyToTree saat load dari API.
// Fungsi ini dipertahankan sebagai pass-through agar tidak ada breaking change.
export const calculateTreeTotals = (tree) => tree;

// ─── Helper: Transform hierarchy API → format yang dipakai Front-End ──────────
/**
 * API /dpa/hierarchy mengembalikan format:
 *   [{ kode_program, kegiatans: [{ sub_kegiatans: [{ uraians: [...] }] }] }]
 *
 * Komponen React (BelanjaPage, LraPage, dll.) mengharapkan format lama:
 *   [{ id, tipe:'Bagian', uraian, totalAnggaran, children:[Program→Kegiatan→SubKegiatan] }]
 *
 * Fungsi ini melakukan mapping agar seluruh komponen tidak perlu diubah.
 */
const transformHierarchyToTree = (hierarchy) => {
  if (!hierarchy || !Array.isArray(hierarchy)) return [];

  // Flatten semua data dari hierarchy untuk buat "Bagian" nodes
  // Kita wrap semua program dalam satu "Bagian" virtual jika diperlukan
  return hierarchy.map((program) => {
    const kegiatans = (program.kegiatans || []).map((kegiatan) => {
      const subKegiatans = (kegiatan.sub_kegiatans || []).map((subKeg) => {
        // Hitung total anggaran sub kegiatan dari uraian-uraiannya
        const rincianBelanja = (subKeg.uraians || []).map((u) => ({
          id:           u.id,
          kode:         u.kode_rekening || u.uraian?.substring(0, 20),
          uraian:       u.uraian,
          sumberDana:   u.sumber_dana,
          totalAnggaran: parseFloat(u.pagu_anggaran) || 0,
          total:        parseFloat(u.pagu_anggaran) || 0,
        }));

        const totalSubKeg = rincianBelanja.reduce((s, r) => s + r.totalAnggaran, 0);

        return {
          id:            subKeg.kode_sub_kegiatan,
          kode:          subKeg.kode_sub_kegiatan,
          uraian:        subKeg.nama_sub_kegiatan || subKeg.kode_sub_kegiatan,
          tipe:          'Sub Kegiatan',
          totalAnggaran: totalSubKeg,
          rencanaKas:    totalSubKeg,
          rincianBelanja,
        };
      });

      const totalKeg = subKegiatans.reduce((s, sk) => s + sk.totalAnggaran, 0);

      return {
        id:            kegiatan.kode_kegiatan,
        kode:          kegiatan.kode_kegiatan,
        uraian:        kegiatan.nama_kegiatan || kegiatan.kode_kegiatan,
        tipe:          'Kegiatan',
        totalAnggaran: totalKeg,
        rencanaKas:    totalKeg,
        children:      subKegiatans,
      };
    });

    const totalProg = kegiatans.reduce((s, k) => s + k.totalAnggaran, 0);

    return {
      id:            program.kode_program,
      kode:          program.kode_program,
      uraian:        program.nama_program || program.kode_program,
      tipe:          'Program',
      totalAnggaran: totalProg,
      rencanaKas:    totalProg,
      children:      kegiatans,
    };
  });
};

// ─── Helper: Transform transactions API → format Front-End ────────────────────
const transformTransaction = (tx) => ({
  id:              tx.id,
  nomorSpm:        tx.nomor_spm,
  tanggalSpm:      tx.tanggal_spm,
  jenisSpm:        tx.jenis_spm,
  nomorTbp:        tx.nomor_tbp || '-',
  bagianName:      tx.bagian,
  bagianId:        tx.bagian,
  uraian:          tx.uraian_belanja,
  sumberDana:      tx.sumber_dana,
  nominal:         parseFloat(tx.nominal) || 0,
  subKegiatanId:   tx.kode_sub_kegiatan || null,
  namaSubKegiatan: tx.nama_sub_kegiatan || '-',
  adaPajak:        !!(tx.pajaks && tx.pajaks.length > 0),
  jenisPajak:      tx.pajaks?.[0]?.jenis_pajak || null,
  ntpn:            tx.pajaks?.[0]?.ntpn || null,
  nominalPajak:    parseFloat(tx.pajaks?.[0]?.nominal_pajak) || 0,
  tanggalPajak:    tx.pajaks?.[0]?.tanggal_pajak || null,
});

// ─── Helper: Transform arsip API → format Front-End ──────────────────────────
const transformArsip = (doc, index) => ({
  id:              doc.id,
  no:              index + 1,
  nomorDokumen:    doc.nomor_dokumen,
  jenisDokumen:    doc.jenis_dokumen,
  tanggal:         doc.tanggal_dokumen,
  fileNama:        doc.file_path ? doc.file_path.split('/').pop() : '-',
  fileUrl:         doc.file_url || null,
  keterangan:      doc.keterangan || '',
  namaSubKegiatan: doc.nama_sub_kegiatan || '-',
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export const DpaProvider = ({ children }) => {

  const [dpaData,      setDpaData]      = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [arsipDokumen, setArsipDokumen] = useState([]);

  // Loading dan error states untuk UI feedback
  const [loading, setLoading] = useState({ dpa: false, transactions: false, arsip: false });
  const [errors,  setErrors]  = useState({ dpa: null,  transactions: null,  arsip: null  });

  // ─── Fetch Functions ─────────────────────────────────────────────────────────

  const fetchDpa = useCallback(async () => {
    setLoading(prev => ({ ...prev, dpa: true }));
    setErrors(prev => ({ ...prev, dpa: null }));
    try {
      const { data } = await api.get('/dpa/hierarchy');
      if (data.success) {
        setDpaData(transformHierarchyToTree(data.data));
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Gagal memuat data DPA.');
      setErrors(prev => ({ ...prev, dpa: msg }));
      console.error('[DpaContext] fetchDpa error:', msg);
    } finally {
      setLoading(prev => ({ ...prev, dpa: false }));
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(prev => ({ ...prev, transactions: true }));
    setErrors(prev => ({ ...prev, transactions: null }));
    try {
      const { data } = await api.get('/transactions', { params: { per_page: -1 } });
      if (data.success) {
        const items = data.data?.data ?? data.data ?? [];
        setTransactions(items.map(transformTransaction));
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Gagal memuat data transaksi.');
      setErrors(prev => ({ ...prev, transactions: msg }));
      console.error('[DpaContext] fetchTransactions error:', msg);
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  }, []);

  const fetchArsip = useCallback(async () => {
    setLoading(prev => ({ ...prev, arsip: true }));
    setErrors(prev => ({ ...prev, arsip: null }));
    try {
      const { data } = await api.get('/arsip', { params: { per_page: -1 } });
      if (data.success) {
        const items = data.data?.data ?? data.data ?? [];
        setArsipDokumen(items.map(transformArsip));
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Gagal memuat data arsip.');
      setErrors(prev => ({ ...prev, arsip: msg }));
      console.error('[DpaContext] fetchArsip error:', msg);
    } finally {
      setLoading(prev => ({ ...prev, arsip: false }));
    }
  }, []);

  // ─── Initial Load (ketika user sudah login / token tersedia) ─────────────────
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return; // Jangan fetch jika belum login

    fetchDpa();
    fetchTransactions();
    fetchArsip();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Transaction Actions ─────────────────────────────────────────────────────

  /**
   * Kirim transaksi baru ke API.
   * @param {object} formData - Data dari BelanjaPage (format Front-End)
   * @returns {{ success: boolean, message?: string }}
   */
  const addTransaction = useCallback(async (formData) => {
    try {
      const payload = {
        nomor_spm:      formData.nomorSpm,
        tanggal_spm:    formData.tanggalSpm,
        jenis_spm:      formData.jenisSpm,
        bagian:         formData.bagianName || formData.bagianId || null,
        uraian_belanja: formData.uraian,
        sumber_dana:    formData.sumberDana,
        nominal:        formData.nominal,
        // Sertakan pajak jika ada
        ...(formData.adaPajak && {
          pajak: {
            tanggal_pajak: formData.tanggalPajak,
            jenis_pajak:   formData.jenisPajak,
            ntpn:          formData.ntpn || null,
            nominal_pajak: formData.nominalPajak,
          },
        }),
      };

      const { data } = await api.post('/transactions', payload);
      if (data.success) {
        // Optimistic: tambahkan langsung ke state tanpa refetch
        setTransactions(prev => [...prev, transformTransaction(data.data)]);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      return { success: false, message: getApiErrorMessage(err, 'Gagal menyimpan transaksi.') };
    }
  }, []);

  /**
   * Hapus transaksi dari API.
   * @param {number} id
   */
  const deleteTransaction = useCallback(async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      // Optimistic: hapus dari state langsung
      setTransactions(prev => prev.filter(t => t.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, message: getApiErrorMessage(err, 'Gagal menghapus transaksi.') };
    }
  }, []);

  const updateTransaction = useCallback(async (id, changes) => {
    try {
      const { data } = await api.put(`/transactions/${id}`, changes);
      if (data.success) {
        setTransactions(prev => prev.map(t => t.id === id ? transformTransaction(data.data) : t));
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      return { success: false, message: getApiErrorMessage(err, 'Gagal memperbarui transaksi.') };
    }
  }, []);

  // ─── Arsip Actions ───────────────────────────────────────────────────────────

  /**
   * Kirim arsip baru ke API dengan FormData (karena ada file PDF).
   * @param {object} formData - { nomorDokumen, jenisDokumen, tanggal, keterangan, fileDokumen }
   * @returns {{ success: boolean, message?: string }}
   */
  const addArsip = useCallback(async (formData) => {
    try {
      const fd = new FormData();
      fd.append('nomor_dokumen',   formData.nomorDokumen);
      fd.append('jenis_dokumen',   formData.jenisDokumen);
      fd.append('tanggal_dokumen', formData.tanggal);
      fd.append('keterangan',      formData.keterangan || '');
      if (formData.fileDokumen instanceof File) {
        fd.append('file_dokumen', formData.fileDokumen);
      }

      const { data } = await api.post('/arsip', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        const newDoc = transformArsip(data.data, 0);
        // Tambah di awal array (terbaru di atas) & renomor ulang
        setArsipDokumen(prev => [newDoc, ...prev].map((d, i) => ({ ...d, no: i + 1 })));
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      return { success: false, message: getApiErrorMessage(err, 'Gagal menyimpan arsip.') };
    }
  }, []);

  const deleteArsip = useCallback(async (id) => {
    try {
      await api.delete(`/arsip/${id}`);
      setArsipDokumen(prev =>
        prev.filter(a => a.id !== id).map((a, i) => ({ ...a, no: i + 1 }))
      );
      return { success: true };
    } catch (err) {
      return { success: false, message: getApiErrorMessage(err, 'Gagal menghapus arsip.') };
    }
  }, []);

  const updateArsip = useCallback(async (id, changes) => {
    try {
      const { data } = await api.post(`/arsip/${id}`, changes);
      if (data.success) {
        setArsipDokumen(prev => prev.map((a, i) =>
          a.id === id ? { ...transformArsip(data.data, i), no: i + 1 } : a
        ));
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      return { success: false, message: getApiErrorMessage(err, 'Gagal memperbarui arsip.') };
    }
  }, []);

  // ─── Context Value ───────────────────────────────────────────────────────────
  return (
    <DpaContext.Provider value={{
      // Data
      dpaData,
      transactions,
      arsipDokumen,
      // Loading & Error States
      loading,
      errors,
      // Refetch (untuk pull-to-refresh manual)
      fetchDpa,
      fetchTransactions,
      fetchArsip,
      // DPA (setDpaData dipertahankan untuk DpaPage yang mengedit tree lokal)
      setDpaData,
      // Transaksi
      addTransaction,
      deleteTransaction,
      updateTransaction,
      setTransactions,
      // Arsip
      addArsip,
      deleteArsip,
      updateArsip,
      setArsip: setArsipDokumen,
    }}>
      {children}
    </DpaContext.Provider>
  );
};
