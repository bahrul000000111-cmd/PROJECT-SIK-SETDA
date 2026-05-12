import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

// ─── Safe localStorage Helper ─────────────────────────────────────────────────
const safeGet = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`[AuthContext] localStorage parse error for key "${key}":`, e);
    localStorage.removeItem(key); // hapus data corrupt
    return fallback;
  }
};

// ─── Akun Default (Seed) ──────────────────────────────────────────────────────
// Digunakan sebagai fallback ketika localStorage kosong (perangkat/browser baru).
const DEFAULT_USERS = [
  {
    id: 'admin-001',
    namaLengkap: 'Hapsa, SE',
    nip: '197001012000122001',
    role: 'Admin',
    instansi: 'Sekretariat Daerah',
    username: 'Hapsa',
    password: '12345678',
  },
  {
    id: 'staf-001',
    namaLengkap: 'Bahrul Ulum',
    nip: '199501012020121001',
    role: 'Pengguna/Staf',
    instansi: 'Sekretariat Daerah',
    username: 'bahrul',
    password: '12345678',
  },
  {
    id: 'pemeriksa-001',
    namaLengkap: 'Inspektur Utama',
    nip: '198001012005011001',
    role: 'Pemeriksa',
    instansi: 'Inspektorat Daerah',
    username: 'inspektur',
    password: '12345678',
  },
  {
    id: 'bendahara-001',
    namaLengkap: 'Bendahara Pengeluaran',
    nip: '198506152010011001',
    role: 'Bendahara',
    instansi: 'Sekretariat Daerah',
    username: 'bendahara',
    password: '12345678',
  },
];

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  
  const [selectedYear, setSelectedYear] = useState(() => {
    return localStorage.getItem('selectedYear') || new Date().getFullYear().toString();
  });

  const [currentUser, setCurrentUser] = useState(() => safeGet('currentUser', null));

  const [users, setUsersState] = useState(() => safeGet('users', DEFAULT_USERS));

  const saveUsers = (updatedUsers) => {
    setUsersState(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  const register = (userData) => {
    const userExists = users.some(u => u.username === userData.username);
    if (userExists) {
      return { success: false, message: 'Username sudah terdaftar!' };
    }
    saveUsers([...users, userData]);
    return { success: true, message: 'Akun berhasil ditambahkan!' };
  };

  const updateUser = (updatedUser) => {
    const updated = users.map(u => u.username === updatedUser.username ? { ...u, ...updatedUser } : u);
    saveUsers(updated);
    return { success: true };
  };

  const deleteUser = (username) => {
    saveUsers(users.filter(u => u.username !== username));
  };

  const login = (username, password) => {
    const defaultYear = new Date().getFullYear().toString();
    let user = users.find(u => u.username === username && u.password === password);
    
    // Fallback default admin
    if (!user && username === 'admin' && password === 'admin') {
      user = { namaLengkap: 'Administrator', nip: '0000000000', username: 'admin', role: 'Admin', instansi: 'Sekretariat Daerah' };
    }
    
    if (user) {
      setSelectedYear(defaultYear);
      setIsAuthenticated(true);
      setCurrentUser(user);
      localStorage.setItem('selectedYear', defaultYear);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('currentUser', JSON.stringify(user));
      return { success: true };
    }
    return { success: false, message: 'Username atau Password salah!' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, selectedYear, currentUser, users, register, updateUser, deleteUser, login, logout, setSelectedYear }}>
      {children}
    </AuthContext.Provider>
  );
};
