import React from 'react';
import { MoreHorizontal } from 'lucide-react';

const StatCard = ({ title, icon: Icon, colorClass, bgColorClass, barColorClass, value = "Rp 0,00" }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group">
      <div className="p-5 flex flex-col gap-4">
        {/* Top Section */}
        <div className="flex justify-between items-start">
          <div className={`p-3 rounded-full ${bgColorClass} ${colorClass}`}>
            <Icon size={20} strokeWidth={1.5} />
          </div>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer">
            <MoreHorizontal size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Middle Section */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
        </div>

        {/* Bottom Small Texts */}
        <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Realisasi Riil</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">Rp0,00</span>
          </div>
          <div className="flex justify-between">
            <span>Realisasi Rencana</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">Rp0,00</span>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-gray-100 dark:border-gray-700 my-1" />

        {/* Bottom Most Section */}
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${barColorClass}`}></span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${bgColorClass} ${colorClass}`}>
            0%
          </span>
        </div>
      </div>
      
      {/* Progress Bar at Bottom Edge */}
      <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 absolute bottom-0 left-0">
        <div className={`h-full ${barColorClass}`} style={{ width: '0%' }}></div>
      </div>
    </div>
  );
};

export default StatCard;
