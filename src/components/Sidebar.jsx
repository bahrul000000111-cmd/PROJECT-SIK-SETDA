import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Wallet,
  ShoppingBag, 
  FolderOpen, 
  FileText,
  Activity,
  ClipboardList,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

// ─── Sub-components ────────────────────────────────────────────────────────────

const SidebarItem = ({ icon: Icon, label, to, hasChevron, isSidebarOpen }) => {
  return (
    <NavLink 
      to={to || '#'} 
      className={({ isActive }) => `flex items-center ${isSidebarOpen ? 'justify-between px-3' : 'justify-center px-0'} py-2.5 rounded-lg transition-colors mb-1 ${
        isActive && to !== '#'
          ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white font-medium'
      }`}
    >
      {({ isActive }) => (
        <>
          <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
            <Icon size={18} strokeWidth={1.5} className={(isActive && to !== '#') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} />
            <span className={`text-sm transition-opacity duration-300 ${!isSidebarOpen ? 'opacity-0 hidden w-0' : 'opacity-100'}`}>{label}</span>
          </div>
          {(hasChevron && isSidebarOpen) && <ChevronRight size={16} strokeWidth={1.5} className="text-gray-400 dark:text-gray-500" />}
        </>
      )}
    </NavLink>
  );
};

const SidebarHeader = ({ title, isSidebarOpen }) => (
  <div className={`px-3 pt-4 pb-2 transition-opacity duration-300 ${!isSidebarOpen ? 'opacity-0 hidden' : 'opacity-100'}`}>
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</span>
  </div>
);

// ─── Role Constants ────────────────────────────────────────────────────────────
const ROLE_ADMIN    = 'Admin';
const ROLE_PENGGUNA = 'Pengguna/Staf';
const ROLE_PEMERIKSA = 'Pemeriksa';

// ─── Main Sidebar ──────────────────────────────────────────────────────────────
const Sidebar = ({ isSidebarOpen }) => {
  const { currentUser } = useContext(AuthContext);
  const role = currentUser?.role || ROLE_PENGGUNA;

  const isAdmin    = role === ROLE_ADMIN;
  const isPengguna = role === ROLE_PENGGUNA;
  const isPemeriksa = role === ROLE_PEMERIKSA;

  return (
    <aside className={`fixed top-20 left-0 bottom-0 ${isSidebarOpen ? 'w-[260px] translate-x-0' : 'w-[80px] -translate-x-full md:translate-x-0'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-40 overflow-hidden shadow-[1px_0_10px_rgba(0,0,0,0.02)] transition-all duration-300`}>
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-4">
        <nav className="px-4">

          {/* ── ADMIN MENU: Kelola Pengguna (only Admin) ─── */}
          {isAdmin && (
            <SidebarItem
              icon={ShieldCheck}
              label="Kelola Pengguna"
              to="/kelola-pengguna"
              hasChevron
              isSidebarOpen={isSidebarOpen}
            />
          )}

          {/* ── Dashboard: semua role ─── */}
          <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/dashboard" isSidebarOpen={isSidebarOpen} />

          {/* ── Penganggaran ─── */}
          <SidebarHeader title="Penganggaran" isSidebarOpen={isSidebarOpen} />
          <SidebarItem icon={Wallet} label="DPA" to="/dpa" hasChevron isSidebarOpen={isSidebarOpen} />

          {/* ── Penatausahaan ─── */}
          <SidebarHeader title="Penatausahaan" isSidebarOpen={isSidebarOpen} />

          {/* Belanja: Admin & Pengguna/Staf saja (Pemeriksa tidak bisa input) */}
          {(isAdmin || isPengguna) && (
            <SidebarItem icon={ShoppingBag} label="Belanja" to="/belanja" hasChevron isSidebarOpen={isSidebarOpen} />
          )}

          {/* Arsip: semua role */}
          <SidebarItem icon={FolderOpen} label="Arsip" to="/arsip" hasChevron isSidebarOpen={isSidebarOpen} />

          {/* ── Laporan ─── */}
          <SidebarHeader title="Laporan" isSidebarOpen={isSidebarOpen} />

          {/* LRA: Admin & Pemeriksa (Pengguna/Staf tidak punya akses laporan LRA) */}
          {(isAdmin || isPemeriksa) && (
            <>
              <SidebarItem icon={FileText} label="LRA" to="/lra" isSidebarOpen={isSidebarOpen} />
              <SidebarItem icon={Activity} label="LRA Perprogram" to="/lra-program" isSidebarOpen={isSidebarOpen} />
            </>
          )}

          {/* Register SPM: semua role */}
          <SidebarItem icon={ClipboardList} label="Register SPM" to="/register-spm" isSidebarOpen={isSidebarOpen} />

        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
