import React, { createContext, useState, useEffect, useCallback } from 'react';
import { dpaNestedData } from '../utils/dataStore';

export const DpaContext = createContext();

// ─── Tree Totals Calculator ───────────────────────────────────────────────────
export const calculateTreeTotals = (tree) => {
  return tree.map(node => {
    const cloned = { ...node };

    if (cloned.children) {
      cloned.children = calculateTreeTotals(cloned.children);
      const sum = cloned.children.reduce((acc, curr) => acc + (curr.totalAnggaran || 0), 0);
      cloned.totalAnggaran = sum;
      cloned.rencanaKas = sum;
    } else if (cloned.rincianBelanja) {
      const sum = cloned.rincianBelanja.reduce((acc, curr) => acc + (curr.total || curr.totalAnggaran || 0), 0);
      cloned.totalAnggaran = sum;
      cloned.rencanaKas = sum;
    }

    return cloned;
  });
};

// ─── Safe localStorage Helper ─────────────────────────────────────────────────
const safeLoadLS = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`[DpaContext] localStorage parse error for key "${key}":`, e);
    localStorage.removeItem(key); // hapus data corrupt agar tidak White Screen
    return fallback;
  }
};

const safeSaveLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[DpaContext] localStorage save error for key "${key}":`, e);
  }
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const DpaProvider = ({ children }) => {

  // ── DPA Tree ──
  const [dpaData, setDpaData] = useState(() => calculateTreeTotals(dpaNestedData));

  // ── Transactions (Belanja) ──
  const [transactions, setTransactionsState] = useState(() => safeLoadLS('transactions'));

  // ── Arsip Dokumen ──
  const [arsipDokumen, setArsipState] = useState(() => safeLoadLS('arsipDokumen'));

  // ─── useEffect: Sinkronisasi Persisten ke localStorage ───────────────────
  // Setiap kali `transactions` berubah (tambah/hapus), otomatis simpan ke storage.
  useEffect(() => {
    safeSaveLS('transactions', transactions);
  }, [transactions]);

  // Setiap kali `arsipDokumen` berubah (tambah/hapus), otomatis simpan ke storage.
  useEffect(() => {
    safeSaveLS('arsipDokumen', arsipDokumen);
  }, [arsipDokumen]);

  // ─── Transaction Actions ──────────────────────────────────────────────────
  const setTransactions = useCallback((txs) => {
    // Mendukung functional updater maupun nilai langsung
    setTransactionsState(txs);
  }, []);

  const addTransaction = useCallback((tx) => {
    setTransactionsState(prev => [...prev, tx]);
  }, []);

  const deleteTransaction = useCallback((id) => {
    setTransactionsState(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateTransaction = useCallback((id, changes) => {
    setTransactionsState(prev =>
      prev.map(t => t.id === id ? { ...t, ...changes } : t)
    );
  }, []);

  // ─── Arsip Actions ────────────────────────────────────────────────────────
  const setArsip = useCallback((data) => {
    setArsipState(data);
  }, []);

  const addArsip = useCallback((doc) => {
    setArsipState(prev => [doc, ...prev]);
  }, []);

  const updateArsip = useCallback((id, changes) => {
    setArsipState(prev =>
      prev.map(a => a.id === id ? { ...a, ...changes } : a)
    );
  }, []);

  const deleteArsip = useCallback((id) => {
    setArsipState(prev =>
      prev.filter(a => a.id !== id).map((a, i) => ({ ...a, no: i + 1 }))
    );
  }, []);

  return (
    <DpaContext.Provider value={{
      // DPA
      dpaData,
      setDpaData,
      // Transaksi Belanja
      transactions,
      setTransactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      // Arsip Dokumen
      arsipDokumen,
      setArsip,
      addArsip,
      updateArsip,
      deleteArsip,
    }}>
      {children}
    </DpaContext.Provider>
  );
};
