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

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import api, { getApiErrorMessage } from '../api';
import { AuthContext } from './AuthContext';

export const DpaContext = createContext();

// ─── Backward-compatible export (DpaPage.jsx still imports this) ──────────────
// Tree totals sekarang dihitung oleh transformHierarchyToTree saat load dari API.
// Fungsi ini dipertahankan sebagai pass-through agar tidak ada breaking change.
export const calculateTreeTotals = (tree) => (Array.isArray(tree) ? tree : []);

// ─── Universal Array Extractor ────────────────────────────────────────────────
/**
 * Laravel bisa mengembalikan dua format berbeda tergantung path:
 *   - per_page=-1 → $query->get()       → { success, data: [...] }        (plain array)
 *   - paginated   → $query->paginate()  → { success, data: { data: [...] } } (object)
 *
 * Fungsi ini menangani KEDUANYA secara aman dan selalu mengembalikan array.
 */
const extractArray = (responseData) => {
  // Sudah array langsung
  if (Array.isArray(responseData)) return responseData;
  // Paginated: { current_page, data: [...], total, ... }
  if (responseData && Array.isArray(responseData.data)) return responseData.data;
  // Fallback: kembalikan array kosong agar tidak crash
  console.warn('[DpaContext] extractArray: unexpected shape', responseData);
  return [];
};

// ─── Helper: Transform hierarchy API → format yang dipakai Front-End ──────────
/**
 * API /dpa/hierarchy mengembalikan format:
 *   [{ kode_program, kegiatans: [{ sub_kegiatans: [{ uraians: [...] }] }] }]
 *
 * Komponen React (BelanjaPage, LraPage, dll.) mengharapkan format lama:
 *   [{ id, tipe, uraian, totalAnggaran, children:[Program→Kegiatan→SubKegiatan] }]
 *
 * Fungsi ini melakukan mapping agar seluruh komponen tidak perlu diubah.
 */
const transformHierarchyToTree = (rawData) => {
  const hierarchy = extractArray(rawData);
  if (hierarchy.length === 0) return [];

  return hierarchy.map((bagian) => {
    const programs = (bagian.programs || []).map((program) => {
      const kegiatans = (program.kegiatans || []).map((kegiatan) => {
        const subKegiatans = (kegiatan.sub_kegiatans || []).map((subKeg) => {
          // ── Simpan SEMUA baris rincian (induk + leaf) untuk tampilan hirarki penuh ──
          const rincianBelanja = (subKeg.uraians || []).map((u) => ({
            id:            u.id,
            kode:          u.kode_rekening || String(u.uraian || '').substring(0, 20),
            uraian:        u.uraian,
            sumberDana:    u.sumber_dana,
            totalAnggaran: parseFloat(u.pagu_anggaran) || 0,
            total:         parseFloat(u.pagu_anggaran) || 0,
          }));

          // ── Total SubKegiatan: HANYA dari leaf node (tidak punya sub-kode di bawahnya) ──
          // Ini mencegah double-counting antara baris induk dan baris anak.
          const isLeaf = (item) =>
            !rincianBelanja.some(
              (other) => other.kode !== item.kode && String(other.kode).startsWith(String(item.kode))
            );

          const totalSubKeg = rincianBelanja
            .filter(isLeaf)
            .reduce((s, r) => s + r.totalAnggaran, 0);

          return {
            id:            subKeg.kode_sub_kegiatan,
            kode:          subKeg.kode_sub_kegiatan,
            uraian:        subKeg.nama_sub_kegiatan,
            tipe:          'Sub Kegiatan',
            totalAnggaran: totalSubKeg,
            rencanaKas:    totalSubKeg,
            rincianBelanja, // memuat seluruh level kode rekening
          };
        });

        const totalKeg = subKegiatans.reduce((s, sk) => s + sk.totalAnggaran, 0);

        return {
          id:            kegiatan.kode_kegiatan,
          kode:          kegiatan.kode_kegiatan,
          uraian:        kegiatan.nama_kegiatan,
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
        uraian:        program.nama_program,
        tipe:          'Program',
        totalAnggaran: totalProg,
        rencanaKas:    totalProg,
        children:      kegiatans,
      };
    });

    const totalBagian = programs.reduce((s, p) => s + p.totalAnggaran, 0);

    return {
      id:            bagian.kode_bagian,
      kode:          bagian.kode_bagian,
      uraian:        bagian.nama_bagian,
      tipe:          'Bagian',
      totalAnggaran: totalBagian,
      rencanaKas:    totalBagian,
      children:      programs,
    };
  });
};

// ─── Helper: Transform transactions API → format Front-End ────────────────────
const transformTransaction = (tx) => {
  if (!tx || typeof tx !== 'object') return null;
  return {
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
  };
};

// ─── Helper: Transform arsip API → format Front-End ──────────────────────────
const transformArsip = (doc, index) => {
  if (!doc || typeof doc !== 'object') return null;
  return {
    id:              doc.id,
    no:              index + 1,
    nomorDokumen:    doc.nomor_dokumen,
    jenisDokumen:    doc.jenis_dokumen,
    tanggal:         doc.tanggal_dokumen,
    fileNama:        doc.file_path ? doc.file_path.split('/').pop() : '-',
    fileUrl:         doc.file_url || null,
    keterangan:      doc.keterangan || '',
    namaSubKegiatan: doc.nama_sub_kegiatan || '-',
  };
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const DpaProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);

  const [dpaData,      setDpaData]      = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [arsipDokumen, setArsipDokumen] = useState([]);

  // Loading dan error states untuk UI feedback
  const [loading, setLoading] = useState({ dpa: false, transactions: false, arsip: false });
  const [errors,  setErrors]  = useState({ dpa: null,  transactions: null,  arsip: null });

  // ─── Fetch Functions ─────────────────────────────────────────────────────────

  const fetchDpa = useCallback(async () => {
    setLoading(prev => ({ ...prev, dpa: true }));
    setErrors(prev => ({ ...prev, dpa: null }));
    try {
      const { data } = await api.get('/dpa/hierarchy');
      if (data.success) {
        // data.data = array hierarchy (plain array dari controller)
        const tree = transformHierarchyToTree(data.data);
        setDpaData(Array.isArray(tree) ? tree : []);
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Gagal memuat data DPA.');
      setErrors(prev => ({ ...prev, dpa: msg }));
      setDpaData([]); // pastikan state tetap array
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
        // extractArray menangani: plain array (per_page=-1) ATAU paginated object
        const items = extractArray(data.data);
        setTransactions(items.map(transformTransaction).filter(Boolean));
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Gagal memuat data transaksi.');
      setErrors(prev => ({ ...prev, transactions: msg }));
      setTransactions([]); // pastikan state tetap array
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
        const items = extractArray(data.data);
        setArsipDokumen(items.map(transformArsip).filter(Boolean));
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Gagal memuat data arsip.');
      setErrors(prev => ({ ...prev, arsip: msg }));
      setArsipDokumen([]); // pastikan state tetap array
      console.error('[DpaContext] fetchArsip error:', msg);
    } finally {
      setLoading(prev => ({ ...prev, arsip: false }));
    }
  }, []);

  // ─── Initial Load: Trigger saat isAuthenticated berubah jadi true ─────────────
  // Ini menyelesaikan race condition: Context mount sebelum token tersedia.
  useEffect(() => {
    if (!isAuthenticated) {
      // Reset semua data saat logout
      setDpaData([]);
      setTransactions([]);
      setArsipDokumen([]);
      return;
    }

    // Fetch semua data setelah login sukses
    fetchDpa();
    fetchTransactions();
    fetchArsip();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Transaction Actions ─────────────────────────────────────────────────────

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
        // data.data adalah objek transaksi tunggal dari API (bukan array)
        const newTx = transformTransaction(data.data);
        if (newTx) {
          setTransactions(prev => {
            const base = Array.isArray(prev) ? prev : [];
            return [...base, newTx];
          });
        }
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      return { success: false, message: getApiErrorMessage(err, 'Gagal menyimpan transaksi.') };
    }
  }, []);

  const deleteTransaction = useCallback(async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(prev => {
        const base = Array.isArray(prev) ? prev : [];
        return base.filter(t => t.id !== id);
      });
      return { success: true };
    } catch (err) {
      return { success: false, message: getApiErrorMessage(err, 'Gagal menghapus transaksi.') };
    }
  }, []);

  const updateTransaction = useCallback(async (id, changes) => {
    try {
      const { data } = await api.put(`/transactions/${id}`, changes);
      if (data.success) {
        const updated = transformTransaction(data.data);
        if (updated) {
          setTransactions(prev => {
            const base = Array.isArray(prev) ? prev : [];
            return base.map(t => t.id === id ? updated : t);
          });
        }
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      return { success: false, message: getApiErrorMessage(err, 'Gagal memperbarui transaksi.') };
    }
  }, []);

  // ─── Arsip Actions ───────────────────────────────────────────────────────────

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
        if (newDoc) {
          setArsipDokumen(prev => {
            const base = Array.isArray(prev) ? prev : [];
            return [newDoc, ...base].map((d, i) => ({ ...d, no: i + 1 }));
          });
        }
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
      setArsipDokumen(prev => {
        const base = Array.isArray(prev) ? prev : [];
        return base.filter(a => a.id !== id).map((a, i) => ({ ...a, no: i + 1 }));
      });
      return { success: true };
    } catch (err) {
      return { success: false, message: getApiErrorMessage(err, 'Gagal menghapus arsip.') };
    }
  }, []);

  const updateArsip = useCallback(async (id, changes) => {
    try {
      const { data } = await api.post(`/arsip/${id}`, changes);
      if (data.success) {
        setArsipDokumen(prev => {
          const base = Array.isArray(prev) ? prev : [];
          return base.map((a, i) =>
            a.id === id ? { ...transformArsip(data.data, i), no: i + 1 } : a
          );
        });
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
      // Data — selalu berupa array
      dpaData:      Array.isArray(dpaData)      ? dpaData      : [],
      transactions: Array.isArray(transactions)  ? transactions : [],
      arsipDokumen: Array.isArray(arsipDokumen)  ? arsipDokumen : [],
      // Loading & Error States
      loading,
      errors,
      // Refetch manual (pull-to-refresh)
      fetchDpa,
      fetchTransactions,
      fetchArsip,
      // DPA setter (untuk DpaPage yang mengedit tree lokal)
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
