import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [widgetVisibility, setWidgetVisibility] = useState({ grafik: true, jadwal: true });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleWidget = (key) => {
    setWidgetVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900 transition-colors duration-300 flex flex-col font-sans">
      <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} widgetVisibility={widgetVisibility} toggleWidget={toggleWidget} />
      <div className="flex flex-1 pt-20">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-[260px]' : 'ml-0'} p-6 lg:p-8 overflow-y-auto`}>
          <div className="max-w-7xl mx-auto">
            <Outlet context={{ widgetVisibility }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
