import React, { useState, useEffect, useRef } from 'react';
import { Menu, Layout, Moon, Sun, Maximize, Minimize, RefreshCw, ChevronDown, Shield, User, Settings, LogOut, X } from 'lucide-react';

const Navbar = ({ isSidebarOpen, toggleSidebar, widgetVisibility, toggleWidget }) => {
  const [greeting, setGreeting] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLayoutDrawerOpen, setIsLayoutDrawerOpen] = useState(false);
  const profileRef = useRef(null);

  const currentUser = {
    nama: "Bahrul Ulum",
    role: "Pemeriksa", 
    nip: "199001012026011001",
    instansi: "Sekretariat Daerah",
    tahun: "2026"
  };

  useEffect(() => {
    const date = new Date();
    const hour = date.getHours();
    const minute = date.getMinutes();
    
    if (hour >= 0 && hour < 11) {
      setGreeting('Selamat Pagi,');
    } else if (hour >= 11 && hour < 15) {
      setGreeting('Selamat Siang,');
    } else if ((hour >= 15 && hour < 18) || (hour === 18 && minute <= 29)) {
      setGreeting('Selamat Sore,');
    } else {
      setGreeting('Selamat Malam,');
    }
  }, []);

  // Sync Fullscreen State with ESC key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Click Outside Profile Dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Inisialisasi Dark Mode dari localStorage atau System Preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const roleColorClass = currentUser.role === "Pemeriksa" 
    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" 
    : "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-gray-200 z-50 flex items-center shadow-sm transition-colors duration-300 dark:bg-gray-900 dark:border-gray-800">
        
        {/* Area Kiri: Lebar Dinamis */}
        <div className={`h-full flex items-center px-4 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${isSidebarOpen ? 'w-[260px] justify-between' : 'w-[70px] justify-center'}`}>
          {isSidebarOpen && (
            <div className="flex flex-col overflow-hidden whitespace-nowrap">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  <div className="w-5 h-5 bg-blue-600 rounded-sm transform rotate-45"></div>
                  <div className="w-5 h-5 bg-yellow-400 rounded-sm transform rotate-45"></div>
                </div>
                <span className="font-bold text-2xl tracking-tight text-gray-900 dark:text-white">SIPD</span>
              </div>
              <span className="text-[9px] text-gray-500 font-medium leading-tight mt-0.5">
                Sistem Informasi<br/>Pemerintahan Daerah
              </span>
            </div>
          )}
          <button onClick={toggleSidebar} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer shrink-0">
            <Menu size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Area Kanan: Flex-1 */}
        <div className="flex-1 px-6 flex items-center justify-between h-full overflow-visible">
          
          {/* Kiri Kanan-Area: Sapaan & Deretan Badge */}
          <div className="flex flex-col justify-center gap-1.5">
            <h1 className="font-bold text-lg lg:text-xl text-gray-900 dark:text-white leading-none truncate transition-colors duration-300">
              {greeting}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleColorClass}`}>
                {currentUser.role}
              </span>
              <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-transparent dark:border-gray-700 text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors duration-300">
                {currentUser.instansi}
              </span>
              <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-transparent dark:border-gray-700 text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors duration-300">
                NIP: {currentUser.nip}
              </span>
              <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-800 transition-colors duration-300">
                Tahun {currentUser.tahun}
              </span>
            </div>
          </div>

          {/* Kanan Kanan-Area: Action Icons & Profil */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button onClick={() => setIsLayoutDrawerOpen(true)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 rounded-full transition-colors cursor-pointer">
                <Layout size={18} strokeWidth={1.5} />
              </button>
              <button onClick={toggleDarkMode} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 rounded-full transition-colors cursor-pointer">
                {isDarkMode ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
              </button>
              <button onClick={toggleFullscreen} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 rounded-full transition-colors cursor-pointer">
                {isFullscreen ? <Minimize size={18} strokeWidth={1.5} /> : <Maximize size={18} strokeWidth={1.5} />}
              </button>
              <button onClick={handleRefresh} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 rounded-full transition-colors cursor-pointer">
                <RefreshCw size={18} strokeWidth={1.5} />
              </button>
            </div>
            
            {/* Garis Pemisah Vertikal */}
            <div className="h-8 border-l border-gray-200 dark:border-gray-800 transition-colors duration-300"></div>
            
            {/* Profile Box */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1.5 pr-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-full transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-yellow-500 transition-colors duration-300">
                  <Shield size={14} strokeWidth={2} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block transition-colors duration-300">{currentUser.nama}</span>
                <ChevronDown size={14} strokeWidth={2} className="text-gray-500" />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  <div className="py-1">
                  <button onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <User size={16} className="text-gray-400" />
                    Profil Saya
                  </button>
                  <button onClick={() => setIsProfileOpen(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <Settings size={16} className="text-gray-400" />
                    Pengaturan
                  </button>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* Overlay untuk Layout Drawer */}
      {isLayoutDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[55] transition-opacity duration-300"
          onClick={() => setIsLayoutDrawerOpen(false)}
        />
      )}

      {/* Panel / Drawer Tata Letak */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 z-[60] shadow-2xl transition-transform duration-300 ${isLayoutDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white">Pengaturan Tata Letak</h3>
          <button 
            onClick={() => setIsLayoutDrawerOpen(false)}
            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tampilkan Grafik APBD</span>
            <button 
              onClick={() => toggleWidget('grafik')}
              className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${widgetVisibility.grafik ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${widgetVisibility.grafik ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tampilkan Jadwal</span>
            <button 
              onClick={() => toggleWidget('jadwal')}
              className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${widgetVisibility.jadwal ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${widgetVisibility.jadwal ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
          </div>
          <hr className="border-gray-100 dark:border-gray-800 my-2" />
          
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Pengaturan ini hanya memengaruhi tampilan dashboard pada perangkat Anda saat ini.
          </p>
        </div>
      </div>
    </>
  );
};

export default Navbar;
