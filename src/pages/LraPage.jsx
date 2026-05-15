import React, { useContext, useMemo, useState, useCallback } from 'react';
import { DpaContext } from '../context/DpaContext';
import { AuthContext } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import {
  Printer, ChevronDown, ChevronRight, ChevronsDownUp,
  ChevronsUpDown, FileBarChart2, TrendingUp, TrendingDown, Minus, FileSpreadsheet
} from 'lucide-react';
import Swal from 'sweetalert2';

// ─── Format Helpers ───────────────────────────────────────────────────────────
const formatRupiah = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(v || 0);

const formatPersen = (v) =>
  isNaN(v) || !isFinite(v) ? '0.00%' : `${v.toFixed(2)}%`;

// ─── Component Helpers ────────────────────────────────────────────────────────
const CapaianBadge = ({ persen }) => {
  if (persen === undefined || persen === null) return null;
  let cls, Icon;
  if (persen >= 80) {
    cls = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
    Icon = TrendingUp;
  } else if (persen >= 40) {
    cls = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
    Icon = Minus;
  } else {
    cls = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    Icon = TrendingDown;
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold ${cls}`}>
      <Icon size={11} strokeWidth={2.5} />
      {formatPersen(persen)}
    </span>
  );
};

// ─── isRootNode Helper ────────────────────────────────────────────────────────
const isRootNode = (item, allItems) =>
  !allItems.some(
    (other) => other.kode !== item.kode && String(item.kode).startsWith(String(other.kode))
  );

// ─── Data Flattening & Global Aggregation ─────────────────────────────────────
const generateFlatLraData = (dpaTree, txList) => {
  const tree = Array.isArray(dpaTree) ? dpaTree : [];
  const txs  = Array.isArray(txList)  ? txList  : [];
  
  const allRootItems = [];

  // Traverse to collect local root nodes from every Sub Kegiatan
  const walk = (nodes, parentBagian = null, parentSubKeg = null) => {
    for (const n of nodes) {
      // Keep track of Bagian Name
      const currentBagian = n.tipe === 'Bagian' ? n.uraian : parentBagian;

      if (n.rincianBelanja && Array.isArray(n.rincianBelanja)) {
        // Extract roots LOCALLY within the Sub Kegiatan to maintain absolute ceiling
        const localRoots = n.rincianBelanja.filter(item => isRootNode(item, n.rincianBelanja));
        
        localRoots.forEach(item => {
          // Map realisasi from transactions if linked
          const realisasiTx = txs
            .filter(t => t.subKegiatanId === n.id || String(t.kode_rekening) === String(item.kode))
            .reduce((s, t) => s + (parseFloat(t.nominal) || 0), 0);
            
          allRootItems.push({
            ...item,
            id: `${n.id}-${item.kode}-${Math.random()}`, // Unique ID for flat list
            bagianUraian: currentBagian || 'Bagian Tidak Diketahui',
            subKegiatanUraian: n.uraian,
            anggaran: item.totalAnggaran || 0,
            realisasi: realisasiTx || item.realisasi || 0
          });
        });
      }
      if (n.children && n.children.length > 0) walk(n.children, currentBagian, n.tipe === 'Kegiatan' ? n.id : parentSubKeg);
    }
  };
  
  walk(tree);

  // Helper Grouping into Level 2 Categories
  const getGroup = (prefix, uraian) => {
    const items = allRootItems.filter(item => String(item.kode).startsWith(prefix));
    const anggaran = items.reduce((s, i) => s + i.anggaran, 0);
    const realisasi = items.reduce((s, i) => s + i.realisasi, 0);
    
    // Sort items by code
    const children = items.sort((a, b) => String(a.kode).localeCompare(String(b.kode))).map(i => ({
      ...i,
      sisaAnggaran: i.anggaran - i.realisasi,
      capaianPersen: i.anggaran > 0 ? (i.realisasi / i.anggaran) * 100 : 0
    }));

    return {
      id: prefix,
      kode: prefix,
      uraian,
      anggaran,
      realisasi,
      sisaAnggaran: anggaran - realisasi,
      capaianPersen: anggaran > 0 ? (realisasi / anggaran) * 100 : 0,
      children
    };
  };

  const pegawai = getGroup('5.1.01', 'Belanja Pegawai');
  const barjas = getGroup('5.1.02', 'Belanja Barang dan Jasa');
  const hibah = getGroup('5.1.05', 'Belanja Hibah');
  const permes = getGroup('5.2.02', 'Belanja Modal Peralatan dan Mesin');

  // Helper Grouping into Level 1
  const operasiGroup = {
     id: '5.1',
     kode: '5.1',
     uraian: 'BELANJA OPERASI',
     anggaran: pegawai.anggaran + barjas.anggaran + hibah.anggaran,
     realisasi: pegawai.realisasi + barjas.realisasi + hibah.realisasi,
     sisaAnggaran: (pegawai.sisaAnggaran + barjas.sisaAnggaran + hibah.sisaAnggaran),
     capaianPersen: (pegawai.anggaran + barjas.anggaran + hibah.anggaran) > 0 ? ((pegawai.realisasi + barjas.realisasi + hibah.realisasi) / (pegawai.anggaran + barjas.anggaran + hibah.anggaran)) * 100 : 0,
     children: [pegawai, barjas, hibah]
  };

  const modalGroup = {
     id: '5.2',
     kode: '5.2',
     uraian: 'BELANJA MODAL',
     anggaran: permes.anggaran,
     realisasi: permes.realisasi,
     sisaAnggaran: permes.sisaAnggaran,
     capaianPersen: permes.capaianPersen,
     children: [permes]
  };

  return [operasiGroup, modalGroup];
};

// ─── Level 2 & 3 Rows ────────────────────────────────────────────────────────
const Level2Row = ({ subCategory, expandedIds, toggleNode }) => {
  const isExpanded = expandedIds.has(subCategory.id);
  
  return (
    <>
      <tr 
        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 transition-colors border-b border-slate-200 dark:border-slate-700 cursor-pointer"
        onClick={() => toggleNode(subCategory.id)}
      >
        <td className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap pl-10">
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown size={14} className="text-blue-500" /> : <ChevronRight size={14} className="text-blue-500" />}
            {subCategory.kode}
          </div>
        </td>
        <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
          {subCategory.uraian}
          <span className="ml-2 text-[10px] bg-white dark:bg-slate-900 text-slate-500 py-0.5 px-2 rounded-full border border-slate-300 dark:border-slate-700">
            {subCategory.children.length} Item
          </span>
        </td>
        <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800 dark:text-slate-200">
          {formatRupiah(subCategory.anggaran)}
        </td>
        <td className="px-4 py-3 text-right text-sm font-semibold text-blue-600 dark:text-blue-400">
          {formatRupiah(subCategory.realisasi)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex flex-col items-end gap-1">
            <CapaianBadge persen={subCategory.capaianPersen} />
          </div>
        </td>
      </tr>

      {/* LEVEL 3: RINCIAN ITEMS */}
      {isExpanded && subCategory.children.length > 0 && (
        <tr>
          <td colSpan="5" className="p-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="overflow-x-auto shadow-inner bg-gray-50/50 dark:bg-gray-900/50 p-4 pl-14">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-[10px] uppercase text-gray-400 dark:text-gray-500 tracking-wider">
                    <th className="pb-2 pl-4 w-[180px]">Kode Rekening</th>
                    <th className="pb-2 pl-2">Uraian Belanja & Asal Bagian</th>
                    <th className="pb-2 pr-4 text-right w-[160px]">Anggaran</th>
                    <th className="pb-2 pr-4 text-right w-[160px]">Realisasi</th>
                    <th className="pb-2 pr-4 text-right w-[160px]">Sisa</th>
                    <th className="pb-2 pr-4 text-right w-[80px]">%</th>
                  </tr>
                </thead>
                <tbody>
                  {subCategory.children.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-2 pl-4 text-xs font-mono text-gray-500 dark:text-gray-400 align-top pt-3">{item.kode}</td>
                      <td className="py-2 pl-2 text-xs text-gray-700 dark:text-gray-300 font-medium">
                        {item.uraian}
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 font-normal mt-1 leading-tight flex flex-col gap-0.5">
                          <span><span className="font-medium text-gray-600 dark:text-gray-300">Bagian:</span> {item.bagianUraian}</span>
                          <span><span className="font-medium text-gray-600 dark:text-gray-300">Sub Keg:</span> {item.subKegiatanUraian}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-4 text-xs text-right text-gray-800 dark:text-gray-200 align-top pt-3">{formatRupiah(item.anggaran)}</td>
                      <td className="py-2 pr-4 text-xs text-right text-blue-600 dark:text-blue-400 font-medium align-top pt-3">{formatRupiah(item.realisasi)}</td>
                      <td className="py-2 pr-4 text-xs text-right text-red-500 dark:text-red-400 align-top pt-3">{formatRupiah(item.sisaAnggaran)}</td>
                      <td className="py-2 pr-4 text-xs text-right align-top pt-3">
                        <span className="font-bold text-gray-600 dark:text-gray-400">{formatPersen(item.capaianPersen)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─── Level 1 Row ─────────────────────────────────────────────────────────────
const Level1Row = ({ category, expandedIds, toggleNode }) => {
  const isExpanded = expandedIds.has(category.id);

  return (
    <>
      <tr 
        className="bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer border-b border-blue-800"
        onClick={() => toggleNode(category.id)}
      >
        <td className="px-4 py-4 text-sm font-bold whitespace-nowrap">
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {category.kode}
          </div>
        </td>
        <td className="px-4 py-4 text-sm font-bold uppercase tracking-wide">
          {category.uraian}
        </td>
        <td className="px-4 py-4 text-right text-sm font-bold">
          {formatRupiah(category.anggaran)}
        </td>
        <td className="px-4 py-4 text-right text-sm font-bold text-blue-100">
          {formatRupiah(category.realisasi)}
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          <div className="flex flex-col items-end gap-1.5">
             <span className="font-bold bg-white/20 px-2 py-0.5 rounded-md text-xs">{formatPersen(category.capaianPersen)}</span>
          </div>
        </td>
      </tr>

      {/* Render Level 2 Children */}
      {isExpanded && category.children.map(sub => (
         <Level2Row key={sub.id} subCategory={sub} expandedIds={expandedIds} toggleNode={toggleNode} />
      ))}
    </>
  );
};

// ─── Main LraPage ─────────────────────────────────────────────────────────────
const LraPage = () => {
  const { dpaData: rawDpaData, transactions: rawTransactions } = useContext(DpaContext);
  const { selectedYear } = useContext(AuthContext);

  const dpaData = Array.isArray(rawDpaData) ? rawDpaData : [];
  const transactions = Array.isArray(rawTransactions) ? rawTransactions : [];

  // Generate triple-level grouped data
  const flatCategories = useMemo(() => generateFlatLraData(dpaData, transactions), [dpaData, transactions]);

  // Grand totals
  const grandTotal = useMemo(() => {
    const anggaran = flatCategories.reduce((s, c) => s + c.anggaran, 0);
    const realisasi = flatCategories.reduce((s, c) => s + c.realisasi, 0);
    return {
      anggaran,
      realisasi,
      sisa: anggaran - realisasi,
      persen: anggaran > 0 ? (realisasi / anggaran) * 100 : 0,
    };
  }, [flatCategories]);

  // Expand/Collapse state (all IDs include Level 1 and Level 2)
  const allIds = useMemo(() => {
    let ids = [];
    flatCategories.forEach(cat => {
       ids.push(cat.id);
       cat.children.forEach(sub => ids.push(sub.id));
    });
    return ids;
  }, [flatCategories]);

  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const toggleNode = useCallback((id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const expandAll = () => {
    Swal.fire({ title: 'Memproses...', text: 'Membuka seluruh rincian laporan', timer: 500, showConfirmButton: false });
    setExpandedIds(new Set(allIds));
  };
  
  const collapseAll = () => setExpandedIds(new Set());

  const exportToExcel = () => {
    Swal.fire({
      icon: 'success',
      title: 'Fitur Export LRA',
      text: 'Fitur export sedang diproses...',
      timer: 1500,
      showConfirmButton: false
    });
  };

  // Helper untuk sapaan
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Pagi';
    if (hour < 15) return 'Siang';
    if (hour < 18) return 'Sore';
    return 'Malam';
  };

  return (
    <div className="flex flex-col gap-6 pb-10 print:pb-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium print:hidden">
        <span>Dashboard</span><span>/</span><span>Laporan</span><span>/</span>
        <span className="text-gray-900 dark:text-white">LRA (Nested Summary)</span>
      </div>

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileBarChart2 size={24} className="text-blue-600 dark:text-blue-400" />
            Laporan Realisasi Anggaran (LRA)
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Selamat {getGreeting()}! Laporan LRA Konsolidasi Tahun Anggaran <span className="font-bold text-blue-600 dark:text-blue-400">{selectedYear}</span>
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            onClick={expandAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <ChevronsUpDown size={14} /> Tampilkan Semua
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <ChevronsDownUp size={14} /> Tutup Semua
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <Printer size={14} /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {[
          { label: 'Total Anggaran', value: formatRupiah(grandTotal.anggaran), color: 'gray', sub: 'Pagu DPA Konsolidasi' },
          { label: 'Total Realisasi', value: formatRupiah(grandTotal.realisasi), color: 'blue', sub: 'Belanja Terserap' },
          { label: 'Sisa Anggaran', value: formatRupiah(grandTotal.sisa), color: grandTotal.sisa < 0 ? 'red' : 'emerald', sub: 'Belum Terserap' },
          { label: 'Capaian Keseluruhan', value: formatPersen(grandTotal.persen), color: grandTotal.persen >= 80 ? 'emerald' : grandTotal.persen >= 40 ? 'amber' : 'red', sub: 'Persentase Serapan' },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm`}>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-xl font-bold text-${color}-600 dark:text-${color}-400 leading-tight`}>{value}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Triple-Level Nested Table ───────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
            <FileBarChart2 size={16} className="text-blue-500" />
            Rekapitulasi Global Belanja LRA (Triple-Level)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100/80 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[180px]">KODE / PREFIX</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[280px]">KATEGORI BELANJA</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">TOTAL ANGGARAN</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">TOTAL REALISASI</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[120px]">% SERAPAN</th>
              </tr>
            </thead>
            <tbody>
              {flatCategories.map(cat => (
                <Level1Row
                  key={cat.id}
                  category={cat}
                  expandedIds={expandedIds}
                  toggleNode={toggleNode}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 dark:bg-gray-800/60 font-bold border-t-2 border-gray-200 dark:border-gray-700">
                <td colSpan="2" className="px-4 py-4 text-right text-gray-900 dark:text-white uppercase tracking-wider text-xs">
                  Grand Total
                </td>
                <td className="px-4 py-4 text-right text-gray-900 dark:text-white whitespace-nowrap">
                  {formatRupiah(grandTotal.anggaran)}
                </td>
                <td className="px-4 py-4 text-right text-blue-700 dark:text-blue-400 whitespace-nowrap">
                  {formatRupiah(grandTotal.realisasi)}
                </td>
                <td className="px-4 py-4 text-right whitespace-nowrap">
                  <CapaianBadge persen={grandTotal.persen} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LraPage;
