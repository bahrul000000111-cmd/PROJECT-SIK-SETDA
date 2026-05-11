import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  
  const [selectedYear, setSelectedYear] = useState(() => {
    return localStorage.getItem('selectedYear') || new Date().getFullYear().toString();
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  });

  const [users, setUsersState] = useState(() => {
    return JSON.parse(localStorage.getItem('users') || '[]');
  });

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
