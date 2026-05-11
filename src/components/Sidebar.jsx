import React from 'react';
import { NavLink } from 'react-router-dom';
import logoDonggala from '../assets/images/logo-donggala.png';
import { 
  LayoutDashboard, 
  Users, 
  Wallet,
  ShoppingBag, 
  Archive, 
  FileText,
  BarChart3,
  ChevronRight
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, to, hasChevron }) => {
  return (
    <NavLink 
      to={to || '#'} 
      className={({ isActive }) => `flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors mb-1 ${
        isActive && to !== '#'
          ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white font-medium'
      }`}
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-3">
            <Icon size={18} strokeWidth={1.5} className={(isActive && to !== '#') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} />
            <span className="text-sm">{label}</span>
          </div>
          {hasChevron && <ChevronRight size={16} strokeWidth={1.5} className="text-gray-400 dark:text-gray-500" />}
        </>
      )}
    </NavLink>
  );
};

const SidebarHeader = ({ title }) => (
  <div className="px-3 pt-4 pb-2">
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</span>
  </div>
);

const Sidebar = ({ isSidebarOpen }) => {
  return (
    <aside className={`fixed top-20 left-0 bottom-0 w-[260px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-40 overflow-hidden shadow-[1px_0_10px_rgba(0,0,0,0.02)] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* Identitas Utama Aplikasi — terpusat di sini saja */}
        <div className="flex items-center gap-3 px-3 py-4 mb-2 border-b border-gray-100 dark:border-gray-800">
          <img
            src={logoDonggala}
            alt="Logo Kab. Donggala"
            className="w-10 h-10 object-contain shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span
              className="font-bold text-base tracking-tight text-gray-900 dark:text-white leading-none"
              style={{ fontFamily: 'Urbanist, Inter, sans-serif' }}
            >
              SIK SETDA
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 leading-tight mt-0.5">
              Sistem Informasi Keuangan<br />Setda Kab. Donggala
            </span>
          </div>
        </div>
        <nav>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/dashboard" />
          <SidebarItem icon={Users} label="Pengguna" to="/pengguna" hasChevron />
          
          <SidebarHeader title="Penganggaran" />
          <SidebarItem icon={Wallet} label="DPA" to="/dpa" hasChevron />
          
          <SidebarHeader title="Penatausahaan" />
          <SidebarItem icon={ShoppingBag} label="Belanja" to="/belanja" hasChevron />
          <SidebarItem icon={Archive} label="Arsip" to="/arsip" hasChevron />
          
          <SidebarHeader title="Laporan" />
          <SidebarItem icon={FileText} label="LRA" to="/lra" />
          <SidebarItem icon={BarChart3} label="LRA Perprogram" to="/lra-program" />
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
