import React, { useState, useContext, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { DpaContext } from '../context/DpaContext';
import { AuthContext } from '../context/AuthContext';

import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import GuideBanner from '../components/GuideBanner';
import {
  Wallet,
  ShoppingBag,
  PiggyBank,
  BarChart2,
  FolderOpen,
  Receipt,
  SearchX,
  ArrowRight,
  Clock,
  FileText,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (val) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val ?? 0);

const JENIS_BADGE = {
  SPM:          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  'Bukti Bayar':'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  'Nota Dinas': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  Lainnya:      'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
};

const JENIS_SPM_BADGE = {
  GU:       'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  LS:       'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800',
  TU:       'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  'TU Nihil':'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
};

// ─── Sub-components ────────────────────────────────────────────────────────────


/** Widget Card wrapper */
const WidgetCard = ({ icon: Icon, iconColor, iconBg, title, linkLabel, onLink, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col overflow-hidden h-full">
    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon size={18} strokeWidth={2} className={iconColor} />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h3>
      </div>
      {linkLabel && (
        <button
          onClick={onLink}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          {linkLabel} <ArrowRight size={12} />
        </button>
      )}
    </div>
    <div className="flex-1 overflow-y-auto">{children}</div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const DashboardPage = () => {
  const [activeStatTab, setActiveStatTab] = useState('Belanja');
  const { widgetVisibility } = useOutletContext();
  const navigate = useNavigate();

  const { dpaData, transactions, arsipDokumen } = useContext(DpaContext);
  const { currentUser } = useContext(AuthContext);

  const role = currentUser?.role;
  const isAdmin     = role === 'Admin';
  const isPengguna  = role === 'Pengguna/Staf';
  const isBendahara = role === 'Bendahara';
  const isPemeriksa = role === 'Pemeriksa';
  const canInput    = isAdmin || isPengguna || isBendahara;

  // ── Kalkulasi Keuangan (dari data nyata) ──
  const totalAnggaran = useMemo(
    () => dpaData.reduce((sum, item) => sum + (item.totalAnggaran || 0), 0),
    [dpaData]
  );
  const totalBelanja = useMemo(
    () => transactions.reduce((sum, t) => sum + (t.nominal || 0), 0),
    [transactions]
  );
  const saldo = totalAnggaran - totalBelanja;
  const percentTerpakai = totalAnggaran > 0
    ? ((totalBelanja / totalAnggaran) * 100).toFixed(1)
    : 0;

  // ── Arsip Terbaru (5 terbaru berdasarkan id/tanggal) ──
  const arsipTerbaru = useMemo(() => {
    if (!arsipDokumen?.length) return [];
    return [...arsipDokumen]
      .sort((a, b) => b.id - a.id) // id = Date.now() → terbaru di atas
      .slice(0, 5);
  }, [arsipDokumen]);

  // ── Transaksi Terbaru (5 terbaru) ──
  const transaksiTerbaru = useMemo(() => {
    if (!transactions?.length) return [];
    return [...transactions]
      .sort((a, b) => b.id - a.id)
      .slice(0, 5);
  }, [transactions]);

  // ── Grafik per Bagian ──
  const maxAnggaran = useMemo(
    () => Math.max(...dpaData.map(d => d.totalAnggaran || 0), 1),
    [dpaData]
  );

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* ── Page Title ───────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Ringkasan APBD Sekretariat Daerah
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tahun Anggaran {new Date().getFullYear()}</p>
      </div>

      {/* ── 3 Stat Cards ─────────────────────────────────────────────────── */}
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
          value={
            <div className="flex items-baseline gap-2">
              <span>{formatCurrency(totalBelanja)}</span>
              <span className="text-sm font-medium text-orange-600/80 dark:text-orange-400/80 tracking-normal">({percentTerpakai}%)</span>
            </div>
          }
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

      {/* ── Widgets Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Grafik (2/3) ── */}
        {widgetVisibility.grafik && (
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col min-h-[384px]">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 shrink-0">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <BarChart2 size={20} strokeWidth={2} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Grafik Anggaran & Realisasi Per Bagian</h3>
            </div>
            <div className="flex-1 p-5 flex flex-col justify-center gap-6">
              {dpaData.length === 0 ? (
                <EmptyState icon={SearchX} title="Belum Ada Data DPA" description="Tambahkan data DPA untuk melihat grafik anggaran." />
              ) : dpaData.map((data) => {
                const anggaran  = data.totalAnggaran || 0;
                const realisasi = transactions
                  .filter(t => t.bagianId === data.id)
                  .reduce((sum, t) => sum + (t.nominal || 0), 0);
                const pctAng = maxAnggaran > 0 ? (anggaran  / maxAnggaran) * 100 : 0;
                const pctRea = maxAnggaran > 0 ? (realisasi / maxAnggaran) * 100 : 0;
                const pctTerpakai = anggaran > 0 ? ((realisasi / anggaran) * 100).toFixed(1) : 0;

                return (
                  <div key={data.id} className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[55%]">{data.uraian}</span>
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                        <div>Anggaran: <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(anggaran)}</span></div>
                        <div>Realisasi: <span className="font-medium text-orange-600 dark:text-orange-400">{formatCurrency(realisasi)}</span> <span className="text-gray-400">({pctTerpakai}%)</span></div>
                      </div>
                    </div>
                    <div className="relative h-6 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                      <div className="absolute top-0 left-0 h-1/2 bg-blue-500 dark:bg-blue-600 rounded-tr-md rounded-br-md transition-all duration-500" style={{ width: `${pctAng}%` }} />
                      <div className="absolute bottom-0 left-0 h-1/2 bg-orange-500 dark:bg-orange-600 rounded-tr-md rounded-br-md transition-all duration-500" style={{ width: `${pctRea}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Legenda */}
            <div className="px-5 pb-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 shrink-0">
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-blue-500 inline-block" /> Anggaran</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-orange-500 inline-block" /> Realisasi</span>
            </div>
          </div>
        )}

        {/* ── Kolom Kanan: Arsip + Transaksi Terbaru ── */}
        {widgetVisibility.jadwal && (
          <div className="flex flex-col gap-6">

            {/* ── Widget: Arsip Terbaru ── */}
            <WidgetCard
              icon={FolderOpen}
              iconColor="text-amber-600 dark:text-amber-400"
              iconBg="bg-amber-50 dark:bg-amber-900/30"
              title="Arsip Terbaru"
              linkLabel="Lihat Semua"
              onLink={() => navigate('/arsip')}
            >
              {arsipTerbaru.length === 0 ? (
                <EmptyState
                  icon={FolderOpen}
                  title="Belum Ada Arsip"
                  description="Belum ada dokumen arsip yang tersimpan."
                />
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {arsipTerbaru.map((doc) => {
                    const badgeCls = JENIS_BADGE[doc.jenisDokumen] || JENIS_BADGE['Lainnya'];
                    return (
                      <li key={doc.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-700/20 transition-colors">
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                          <FileText size={15} className="text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{doc.nomorDokumen}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{doc.tanggal} {doc.namaSubKegiatan && doc.namaSubKegiatan !== '-' ? `• ${doc.namaSubKegiatan}` : ''}</p>
                        </div>
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeCls}`}>
                          {doc.jenisDokumen}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </WidgetCard>

            {/* ── Widget: Transaksi Belanja Terbaru ── */}
            <WidgetCard
              icon={Receipt}
              iconColor="text-violet-600 dark:text-violet-400"
              iconBg="bg-violet-50 dark:bg-violet-900/30"
              title="Transaksi Terbaru"
              linkLabel={canInput ? "Input Belanja" : "Lihat Semua"}
              onLink={() => navigate('/belanja')}
            >
              {transaksiTerbaru.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="Belum Ada Transaksi"
                  description={canInput ? 'Mulai input belanja dari menu Penatausahaan.' : 'Belum ada transaksi yang tercatat.'}
                />
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {transaksiTerbaru.map((tx) => {
                    const badgeCls = JENIS_SPM_BADGE[tx.jenisSpm] || JENIS_SPM_BADGE['GU'];
                    return (
                      <li key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 dark:hover:bg-gray-700/20 transition-colors">
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                          <Clock size={14} className="text-violet-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{tx.nomorSpm || '-'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tx.tanggalSpm} • {tx.uraian}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap">{formatCurrency(tx.nominal)}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${badgeCls}`}>{tx.jenisSpm}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </WidgetCard>

          </div>
        )}
      </div>

      {/* ── Statistik Section ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mt-2">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Statistik</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Menampilkan anggaran dan realisasi di setiap SKPD</p>
          <div className="inline-flex bg-gray-100 dark:bg-gray-900 p-1 rounded-full border border-gray-200 dark:border-gray-700">
            {['Pendapatan', 'Belanja'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveStatTab(tab)}
                className={`px-5 py-1.5 text-sm font-medium rounded-full transition-all cursor-pointer ${
                  activeStatTab === tab
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
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

      {/* ── Guide Banner ──────────────────────────────────────────────────── */}
      <div className="mt-2">
        <GuideBanner />
      </div>

    </div>
  );
};

export default DashboardPage;
