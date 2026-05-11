import React, { useState, useContext } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { Outlet, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [widgetVisibility, setWidgetVisibility] = useState({ grafik: true, jadwal: true });
  const { isAuthenticated } = useContext(AuthContext);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleWidget = (key) => {
    setWidgetVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900 transition-colors duration-300 flex flex-col font-sans">
      <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} widgetVisibility={widgetVisibility} toggleWidget={toggleWidget} />
      <div className="flex flex-1 pt-20">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-[260px]' : 'ml-[80px]'} p-6 lg:p-8 overflow-y-auto`}>
          <div className="max-w-7xl mx-auto">
            <Outlet context={{ widgetVisibility }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
