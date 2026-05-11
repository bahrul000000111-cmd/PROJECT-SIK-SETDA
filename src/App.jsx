import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import BelanjaPage from './pages/BelanjaPage';
import ArsipPage from './pages/ArsipPage';
import PenggunaPage from './pages/PenggunaPage';
import DpaPage from './pages/DpaPage';
import LraPage from './pages/LraPage';
import LraProgramPage from './pages/LraProgramPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import { DpaProvider } from './context/DpaContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <DpaProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="pengguna" element={<PenggunaPage />} />
          <Route path="dpa" element={<DpaPage />} />
          <Route path="belanja" element={<BelanjaPage />} />
          <Route path="arsip" element={<ArsipPage />} />
          <Route path="lra" element={<LraPage />} />
          <Route path="lra-program" element={<LraProgramPage />} />
        </Route>
        </Routes>
      </BrowserRouter>
    </DpaProvider>
    </AuthProvider>
  );
}

export default App;
