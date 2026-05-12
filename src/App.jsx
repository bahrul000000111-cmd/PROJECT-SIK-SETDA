import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import BelanjaPage from './pages/BelanjaPage';
import ArsipPage from './pages/ArsipPage';
import PenggunaPage from './pages/PenggunaPage';
import DpaPage from './pages/DpaPage';
import LraPage from './pages/LraPage';
import LraProgramPage from './pages/LraProgramPage';
import LoginPage from './pages/LoginPage';
import RegisterSpmPage from './pages/RegisterSpmPage';

import { DpaProvider } from './context/DpaContext';
import { AuthProvider, AuthContext } from './context/AuthContext';

// ─── Protected Route: hanya dapat diakses role tertentu ───────────────────────
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { currentUser, isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(currentUser?.role)) {
    // Jika role tidak punya izin, redirect ke dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <DpaProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="dpa" element={<DpaPage />} />
              <Route path="belanja" element={<BelanjaPage />} />
              <Route path="arsip" element={<ArsipPage />} />
              <Route path="lra" element={<LraPage />} />
              <Route path="lra-program" element={<LraProgramPage />} />
              <Route path="register-spm" element={<RegisterSpmPage />} />

              {/* Rute yang hanya boleh diakses Admin */}
              <Route
                path="kelola-pengguna"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <PenggunaPage />
                  </ProtectedRoute>
                }
              />
              {/* Legacy redirect: /pengguna → /kelola-pengguna */}
              <Route path="pengguna" element={<Navigate to="/kelola-pengguna" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DpaProvider>
    </AuthProvider>
  );
}

export default App;
