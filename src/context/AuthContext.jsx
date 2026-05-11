import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  
  const [selectedYear, setSelectedYear] = useState(() => {
    return localStorage.getItem('selectedYear') || '2024';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  });

  const register = (userData) => {
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const userExists = existingUsers.some(u => u.username === userData.username);
    
    if (userExists) {
      return { success: false, message: 'Username sudah terdaftar!' };
    }
    
    existingUsers.push(userData);
    localStorage.setItem('users', JSON.stringify(existingUsers));
    return { success: true, message: 'Registrasi berhasil!' };
  };

  const login = (username, password, year) => {
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    // Jika belum ada user terdaftar (untuk testing awal), izinkan bypass atau harus daftar dulu.
    // Di sini kita wajibkan ada di DB kecuali admin default:
    let user = existingUsers.find(u => u.username === username && u.password === password);
    
    // Fallback default admin just in case testing is needed without register
    if (!user && username === 'admin' && password === 'admin') {
      user = { nama: 'Administrator', nip: '1234567890', username: 'admin' };
    }
    
    if (user) {
      setSelectedYear(year);
      setIsAuthenticated(true);
      setCurrentUser(user);
      localStorage.setItem('selectedYear', year);
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
    <AuthContext.Provider value={{ isAuthenticated, selectedYear, currentUser, register, login, logout, setSelectedYear }}>
      {children}
    </AuthContext.Provider>
  );
};
