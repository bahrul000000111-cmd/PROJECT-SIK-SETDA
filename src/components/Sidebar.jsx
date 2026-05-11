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
  ChevronRight,
  Menu
} from 'lucide-react';

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

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  return (
    <aside className={`fixed top-20 left-0 bottom-0 ${isSidebarOpen ? 'w-[260px] translate-x-0' : 'w-[80px] -translate-x-full md:translate-x-0'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-40 overflow-hidden shadow-[1px_0_10px_rgba(0,0,0,0.02)] transition-all duration-300`}>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Top Section Sidebar (Header Sidebar) */}
        <div className="flex items-center justify-between p-4 mb-2 border-b border-gray-100 dark:border-gray-800">
          {/* Kelompok KIRI (Brand) */}
          <div className="flex items-center gap-3">
            <img
              src={logoDonggala}
              alt="Logo Kab. Donggala"
              className="w-10 h-10 object-contain shrink-0"
            />
            <div className={`flex flex-col min-w-0 transition-opacity duration-300 ${!isSidebarOpen ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
              <span
                className="font-bold text-base tracking-tight text-gray-900 dark:text-white leading-none"
                style={{ fontFamily: 'Urbanist, Inter, sans-serif' }}
              >
                SIK SETDA
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 leading-tight mt-0.5 whitespace-nowrap">
                Sistem Informasi Keuangan<br />Setda Kab. Donggala
              </span>
            </div>
          </div>

          {/* Kelompok KANAN (Toggle) */}
          <button 
            onClick={toggleSidebar}
            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer shrink-0"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
        </div>
        <nav className="px-4">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/dashboard" isSidebarOpen={isSidebarOpen} />
          <SidebarItem icon={Users} label="Pengguna" to="/pengguna" hasChevron isSidebarOpen={isSidebarOpen} />
          
          <SidebarHeader title="Penganggaran" isSidebarOpen={isSidebarOpen} />
          <SidebarItem icon={Wallet} label="DPA" to="/dpa" hasChevron isSidebarOpen={isSidebarOpen} />
          
          <SidebarHeader title="Penatausahaan" isSidebarOpen={isSidebarOpen} />
          <SidebarItem icon={ShoppingBag} label="Belanja" to="/belanja" hasChevron isSidebarOpen={isSidebarOpen} />
          <SidebarItem icon={Archive} label="Arsip" to="/arsip" hasChevron isSidebarOpen={isSidebarOpen} />
          
          <SidebarHeader title="Laporan" isSidebarOpen={isSidebarOpen} />
          <SidebarItem icon={FileText} label="LRA" to="/lra" isSidebarOpen={isSidebarOpen} />
          <SidebarItem icon={BarChart3} label="LRA Perprogram" to="/lra-program" isSidebarOpen={isSidebarOpen} />
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
