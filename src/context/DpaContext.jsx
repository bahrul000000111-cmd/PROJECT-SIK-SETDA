import React, { createContext, useState } from 'react';
import { dpaNestedData } from '../utils/dataStore';

export const DpaContext = createContext();

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

export const DpaProvider = ({ children }) => {
  const [dpaData, setDpaData] = useState(() => calculateTreeTotals(dpaNestedData));

  const [transactions, setTransactionsState] = useState(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

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

  return (
    <DpaContext.Provider value={{ dpaData, setDpaData, transactions, addTransaction, deleteTransaction }}>
      {children}
    </DpaContext.Provider>
  );
};
