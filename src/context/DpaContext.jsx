import React, { createContext, useState } from 'react';
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

// ─── Provider ─────────────────────────────────────────────────────────────────
export const DpaProvider = ({ children }) => {

  // ── DPA Tree ──
  const [dpaData, setDpaData] = useState(() => calculateTreeTotals(dpaNestedData));

  // ── Transactions (Belanja) ──
  const [transactions, setTransactionsState] = useState(() => safeLoadLS('transactions'));

  const setTransactions = (txs) => {
    setTransactionsState(txs);
    localStorage.setItem('transactions', JSON.stringify(txs));
  };

  const addTransaction = (tx) => {
    setTransactions(prev => [...prev, tx]);
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // ── Arsip Dokumen (diangkat dari ArsipPage) ──
  const [arsipDokumen, setArsipState] = useState(() => safeLoadLS('arsipDokumen'));

  const setArsip = (data) => {
    setArsipState(data);
    localStorage.setItem('arsipDokumen', JSON.stringify(data));
  };

  const addArsip = (doc) => {
    setArsip(prev => [doc, ...prev]);
  };

  const deleteArsip = (id) => {
    setArsip(prev =>
      prev.filter(a => a.id !== id).map((a, i) => ({ ...a, no: i + 1 }))
    );
  };

  return (
    <DpaContext.Provider value={{
      // DPA
      dpaData,
      setDpaData,
      // Transaksi Belanja
      transactions,
      addTransaction,
      deleteTransaction,
      // Arsip Dokumen
      arsipDokumen,
      addArsip,
      deleteArsip,
    }}>
      {children}
    </DpaContext.Provider>
  );
};
