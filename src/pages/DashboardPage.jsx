import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import GuideBanner from '../components/GuideBanner';
import { belanjaData, arsipData, anggaranData } from '../utils/dataStore';
import { 
  ArrowLeft, 
  Wallet, 
  ShoppingBag,
  PiggyBank,
  CheckCircle,
  BarChart,
  Calendar,
  FileText,
  SearchX
} from 'lucide-react';

const DashboardPage = () => {
  const [activeStatTab, setActiveStatTab] = useState('Belanja');
  const { widgetVisibility } = useOutletContext();

  const totalAnggaran = anggaranData.reduce((sum, item) => sum + item.totalAnggaran, 0);
  const totalBelanja = belanjaData.reduce((sum, item) => sum + item.nilaiAngka, 0);
  const saldo = totalAnggaran - totalBelanja;

  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // Group belanja by bagian
  const belanjaPerBagian = belanjaData.reduce((acc, curr) => {
    acc[curr.bagian] = (acc[curr.bagian] || 0) + curr.nilaiAngka;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6 pb-10">
        
        {/* Breadcrumb & Top Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
            <span className="text-gray-900 dark:text-white">Dashboard</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm cursor-pointer">
            <ArrowLeft size={16} strokeWidth={2} />
            Kembali
          </button>
        </div>

        {/* Page Title */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Ringkasan APBD Sekretariat Daerah
          </h2>
        </div>

        {/* 3 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Total Anggaran" 
            icon={Wallet} 
            colorClass="text-blue-600 dark:text-blue-400" 
            bgColorClass="bg-blue-50 dark:bg-blue-900/30" 
            barColorClass="bg-blue-500" 
            value={formatCurrency(totalAnggaran)}
          />
          <StatCard 
            title="Realisasi Anggaran" 
            icon={ShoppingBag} 
            colorClass="text-orange-600 dark:text-orange-400" 
            bgColorClass="bg-orange-50 dark:bg-orange-900/30" 
            barColorClass="bg-orange-500" 
            value={formatCurrency(totalBelanja)}
          />
          <StatCard 
            title="Saldo (Sisa Anggaran)" 
            icon={PiggyBank} 
            colorClass="text-teal-600 dark:text-teal-400" 
            bgColorClass="bg-teal-50 dark:bg-teal-900/30" 
            barColorClass="bg-teal-500" 
            value={formatCurrency(saldo)}
          />
        </div>

        {/* Widgets Grid: 2/3 and 1/3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Grafik Anggaran & Realisasi Per Bagian */}
          {widgetVisibility.grafik && (
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col min-h-[384px] transition-all duration-300">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <BarChart size={20} strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Grafik Anggaran & Realisasi Per Bagian</h3>
              </div>
              <div className="flex-1 p-5 flex flex-col justify-center gap-6">
                {anggaranData.map((data) => {
                  const anggaran = data.totalAnggaran;
                  const realisasi = belanjaPerBagian[data.bagian] || 0;
                  
                  const maxVal = Math.max(...anggaranData.map(d => d.totalAnggaran));
                  const percentAnggaran = maxVal > 0 ? (anggaran / maxVal) * 100 : 0;
                  const percentRealisasi = maxVal > 0 ? (realisasi / maxVal) * 100 : 0;

                  return (
                    <div key={data.id} className="flex flex-col gap-2">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{data.bagian}</span>
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                          <div>Anggaran: <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(anggaran)}</span></div>
                          <div>Realisasi: <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(realisasi)}</span></div>
                        </div>
                      </div>
                      <div className="relative h-6 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                        {/* Anggaran Bar */}
                        <div 
                          className="absolute top-0 left-0 h-1/2 bg-blue-500 dark:bg-blue-600 rounded-tr-md rounded-br-md transition-all duration-500"
                          style={{ width: `${percentAnggaran}%` }}
                        ></div>
                        {/* Realisasi Bar */}
                        <div 
                          className="absolute bottom-0 left-0 h-1/2 bg-red-500 dark:bg-red-600 rounded-tr-md rounded-br-md transition-all duration-500"
                          style={{ width: `${percentRealisasi}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Right: Arsip Terbaru */}
          <div className="flex flex-col gap-6 transition-all duration-300">
            {widgetVisibility.jadwal && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col transition-all duration-300 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 shrink-0">
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                    <Calendar size={18} strokeWidth={2} />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Arsip Terbaru</h3>
                </div>
                <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
                  {arsipData.slice(0, 4).map((arsip) => (
                    <div key={arsip.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700 flex flex-col gap-1 overflow-hidden shrink-0">
                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate" title={arsip.nomorDokumen}>{arsip.nomorDokumen}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={`${arsip.jenisDokumen} • ${arsip.tanggalArsip}`}>{arsip.jenisDokumen} • {arsip.tanggalArsip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Statistik Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mt-2">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Statistik</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Menampilkan anggaran dan realisasi disetiap SKPD</p>
            
            {/* Toggle Switch */}
            <div className="inline-flex bg-gray-100 dark:bg-gray-900 p-1 rounded-full border border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setActiveStatTab('Pendapatan')}
                className={`px-5 py-1.5 text-sm font-medium rounded-full transition-all cursor-pointer ${
                  activeStatTab === 'Pendapatan' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Pendapatan
              </button>
              <button 
                onClick={() => setActiveStatTab('Belanja')}
                className={`px-5 py-1.5 text-sm font-medium rounded-full transition-all cursor-pointer ${
                  activeStatTab === 'Belanja' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Belanja
              </button>
            </div>
          </div>
          
          <div className="p-10 flex items-center justify-center min-h-[250px]">
             <EmptyState 
                icon={SearchX} 
                title="Data Tidak Ditemukan" 
                description={`Maaf, tidak ada data ${activeStatTab.toLowerCase()} yang dapat ditampilkan saat ini.`} 
              />
          </div>
        </div>

        {/* Guide Banner */}
        <div className="mt-4">
          <GuideBanner />
        </div>

    </div>
  );
};

export default DashboardPage;
