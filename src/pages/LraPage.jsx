import React, { useContext, useMemo, useState, useCallback } from 'react';
import { DpaContext } from '../context/DpaContext';
import { AuthContext } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import {
  Printer, ChevronDown, ChevronRight, ChevronsDownUp,
  ChevronsUpDown, FileBarChart2, TrendingUp, TrendingDown, Minus, FileSpreadsheet
} from 'lucide-react';

// ─── Format Helpers ───────────────────────────────────────────────────────────
const formatRupiah = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(v || 0);

const formatPersen = (v) =>
  isNaN(v) || !isFinite(v) ? '0.00%' : `${v.toFixed(2)}%`;

// ─── LRA Brain: Recursive Enrichment ─────────────────────────────────────────
const enrichNode = (node, txList) => {
  const transactions = Array.isArray(txList) ? txList : [];
  const enriched = { ...node };

  if (node.children && node.children.length > 0) {
    enriched.children = node.children.map(child => enrichNode(child, transactions));
    enriched.realisasi = enriched.children.reduce((s, c) => s + (c.realisasi || 0), 0);
  } else {
    // Leaf node (Sub Kegiatan) — sum from transactions
    enriched.realisasi = transactions
      .filter(t => t.subKegiatanId === node.id)
      .reduce((s, t) => s + (t.nominal || 0), 0);
  }

  const anggaran = enriched.totalAnggaran || 0;
  enriched.sisaAnggaran  = anggaran - enriched.realisasi;
  enriched.capaianPersen = anggaran > 0 ? (enriched.realisasi / anggaran) * 100 : 0;

  return enriched;
};

const generateLraData = (dpaTree, txList) => {
  const tree = Array.isArray(dpaTree) ? dpaTree : [];
  const txs  = Array.isArray(txList)  ? txList  : [];
  return tree.map(node => enrichNode(node, txs));
};

// ─── Capaian Badge ────────────────────────────────────────────────────────────
const CapaianBadge = ({ persen }) => {
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

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ persen }) => {
  const capped = Math.min(persen, 100);
  const color = persen >= 80 ? 'bg-emerald-500' : persen >= 40 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
      <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${capped}%` }} />
    </div>
  );
};

// ─── Row Depth Styling ────────────────────────────────────────────────────────
const DEPTH_STYLES = {
  Bagian:       { indent: 0,  rowCls: 'bg-slate-50 dark:bg-slate-800/60 font-bold',    textCls: 'text-slate-800 dark:text-slate-100 uppercase tracking-wide text-xs' },
  Program:      { indent: 20, rowCls: 'bg-blue-50/50 dark:bg-blue-900/10 font-semibold', textCls: 'text-blue-800 dark:text-blue-300 text-xs' },
  Kegiatan:     { indent: 40, rowCls: 'hover:bg-gray-50 dark:hover:bg-gray-800/40',     textCls: 'text-gray-700 dark:text-gray-300 text-xs font-medium' },
  'Sub Kegiatan': { indent: 60, rowCls: 'hover:bg-gray-50/50 dark:hover:bg-gray-800/20', textCls: 'text-gray-600 dark:text-gray-400 text-xs' },
};

// ─── Tree Row ─────────────────────────────────────────────────────────────────
const LraRow = ({ node, expandedIds, toggleNode, depth = 0, selectedYear }) => {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const style = DEPTH_STYLES[node.tipe] || DEPTH_STYLES['Sub Kegiatan'];

  return (
    <>
      <tr className={`border-b border-gray-100 dark:border-gray-800 transition-colors ${style.rowCls}`}>
        {/* KODE REKENING */}
        <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {node.kode}
        </td>

        {/* URAIAN (dengan indent & toggle) */}
        <td className="px-4 py-3 min-w-[280px] max-w-[400px]">
          <div className="flex items-start gap-2" style={{ paddingLeft: `${style.indent}px` }}>
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.id)}
                className="mt-0.5 shrink-0 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {isExpanded
                  ? <ChevronDown size={14} className="text-gray-500" />
                  : <ChevronRight size={14} className="text-gray-500" />}
              </button>
            ) : (
              <span className="w-5 shrink-0" />
            )}
            <span className={`leading-snug ${style.textCls}`}>{node.uraian}</span>
          </div>
        </td>

        {/* ANGGARAN */}
        <td className="px-4 py-3 text-right text-xs font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
          {formatRupiah(node.totalAnggaran)}
        </td>

        {/* REALISASI {selectedYear} */}
        <td className="px-4 py-3 text-right text-xs font-semibold text-blue-700 dark:text-blue-400 whitespace-nowrap">
          {formatRupiah(node.realisasi)}
        </td>

        {/* % {selectedYear} */}
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex flex-col items-end gap-1.5">
            <CapaianBadge persen={node.capaianPersen} />
            <ProgressBar persen={node.capaianPersen} />
          </div>
        </td>
      </tr>

      {/* Render children jika expanded */}
      {isExpanded && hasChildren && node.children.map(child => (
        <LraRow
          key={child.id}
          node={child}
          expandedIds={expandedIds}
          toggleNode={toggleNode}
          depth={depth + 1}
          selectedYear={selectedYear}
        />
      ))}
    </>
  );
};

// ─── Collect All Node IDs (for expand/collapse all) ──────────────────────────
const collectAllIds = (nodes) => {
  const ids = new Set();
  const walk = (list) => {
    for (const n of list) {
      if (n.children && n.children.length > 0) {
        ids.add(n.id);
        walk(n.children);
      }
    }
  };
  walk(nodes || []);
  return ids;
};

// ─── Main LraPage ─────────────────────────────────────────────────────────────
const LraPage = () => {
  const { dpaData: rawDpaData, transactions: rawTransactions } = useContext(DpaContext);
  const { selectedYear } = useContext(AuthContext);

  // Pastikan selalu berupa array sebelum diproses
  const dpaData     = Array.isArray(rawDpaData)      ? rawDpaData      : [];
  const transactions = Array.isArray(rawTransactions) ? rawTransactions : [];

  // Enrich tree with realisasi data
  const lraData = useMemo(() => generateLraData(dpaData, transactions), [dpaData, transactions]);

  // Grand totals
  const grandTotal = useMemo(() => {
    const anggaran = lraData.reduce((s, n) => s + (n.totalAnggaran || 0), 0);
    const realisasi = lraData.reduce((s, n) => s + (n.realisasi || 0), 0);
    return {
      anggaran,
      realisasi,
      sisa: anggaran - realisasi,
      persen: anggaran > 0 ? (realisasi / anggaran) * 100 : 0,
    };
  }, [lraData]);

  // Expand/Collapse state
  const allIds = useMemo(() => collectAllIds(lraData), [lraData]);
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const toggleNode = useCallback((id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const expandAll  = () => setExpandedIds(new Set(allIds));
  const collapseAll = () => setExpandedIds(new Set());

  // ─── Export to Excel ────────────────────────────────────────────────────────
  const exportToExcel = () => {
    // Flatten data for export
    const exportData = [];
    const flattenData = (nodes, depth = 0) => {
      nodes.forEach(node => {
        exportData.push({
          'KODE REKENING': node.kode,
          'URAIAN': '  '.repeat(depth * 2) + node.uraian,
          'ANGGARAN': node.totalAnggaran || 0,
          [`REALISASI ${selectedYear}`]: node.realisasi || 0,
          [`% ${selectedYear}`]: parseFloat((node.capaianPersen || 0).toFixed(2))
        });
        if (node.children && node.children.length > 0) {
          flattenData(node.children, depth + 1);
        }
      });
    };
    flattenData(lraData);

    // Add totals to the end of exportData
    exportData.push({
      'KODE REKENING': '',
      'URAIAN': 'TOTAL KESELURUHAN',
      'ANGGARAN': grandTotal.anggaran,
      [`REALISASI ${selectedYear}`]: grandTotal.realisasi,
      [`% ${selectedYear}`]: parseFloat(grandTotal.persen.toFixed(2))
    });

    // Create Worksheet
    const ws = XLSX.utils.json_to_sheet([], { skipHeader: true });

    // Calculate dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const startDateStr = startOfMonth.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const endDateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    // Headers 1-7
    const customHeader = [
      [],
      ['PEMERINTAHAN KAB. DONGGALA'],
      ['LAPORAN REALISASI ANGGARAN PENDAPATAN DAN BELANJA DAERAH'],
      [`TAHUN ANGGARAN ${selectedYear}`],
      [`${startDateStr} sampai ${endDateStr}`],
      [],
      ['KODE REKENING', 'URAIAN', 'ANGGARAN', `REALISASI ${selectedYear}`, `% ${selectedYear}`]
    ];

    XLSX.utils.sheet_add_aoa(ws, customHeader, { origin: 'A1' });
    
    // Add data starting from Row 8
    XLSX.utils.sheet_add_json(ws, exportData, { origin: 'A8', skipHeader: true });

    // Formatting: Adjust column widths
    ws['!cols'] = [
      { wch: 20 }, // KODE REKENING
      { wch: 60 }, // URAIAN
      { wch: 20 }, // ANGGARAN
      { wch: 20 }, // REALISASI
      { wch: 15 }  // %
    ];

    // Create Workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LRA");
    XLSX.writeFile(wb, `LRA_${selectedYear}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-6 pb-10 print:pb-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium print:hidden">
        <span>Dashboard</span><span>/</span><span>Laporan</span><span>/</span>
        <span className="text-gray-900 dark:text-white">LRA</span>
      </div>

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileBarChart2 size={24} className="text-blue-600 dark:text-blue-400" />
            Laporan Realisasi Anggaran (LRA)
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tahun Anggaran <span className="font-bold text-blue-600 dark:text-blue-400">{selectedYear}</span>
            &nbsp;·&nbsp;
            Data per <span className="font-medium">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
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
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <FileSpreadsheet size={14} /> Export Excel
          </button>
        </div>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {[
          { label: 'Total Anggaran', value: formatRupiah(grandTotal.anggaran), color: 'gray', sub: 'Pagu DPA' },
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

      {/* ── Tree Table ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between print:border-b print:pb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
            <FileBarChart2 size={16} className="text-blue-500" />
            Rekapitulasi Realisasi per Program dan Kegiatan
          </h3>
          <span className="text-xs text-gray-400 dark:text-gray-500 print:hidden">
            {transactions.length} transaksi tercatat
          </span>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100/80 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap w-[200px]">KODE REKENING</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[280px]">URAIAN</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">ANGGARAN</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">REALISASI {selectedYear}</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">% {selectedYear}</th>
              </tr>
            </thead>
            <tbody>
              {lraData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-sm text-gray-400 dark:text-gray-500">
                    <FileBarChart2 size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                    Data anggaran belum tersedia.
                  </td>
                </tr>
              ) : (
                lraData.map(node => (
                  <LraRow
                    key={node.id}
                    node={node}
                    expandedIds={expandedIds}
                    toggleNode={toggleNode}
                    depth={0}
                    selectedYear={selectedYear}
                  />
                ))
              )}
            </tbody>

            {/* Grand Total Footer */}
            {lraData.length > 0 && (
              <tfoot>
                <tr className="bg-gray-900 dark:bg-gray-950 border-t-2 border-gray-300 dark:border-gray-600">
                  <td colSpan="2" className="px-4 py-4 text-xs font-black text-white uppercase tracking-wider">
                    TOTAL KESELURUHAN
                  </td>
                  <td className="px-4 py-4 text-right text-xs font-black text-white whitespace-nowrap">
                    {formatRupiah(grandTotal.anggaran)}
                  </td>
                  <td className="px-4 py-4 text-right text-xs font-black text-blue-300 whitespace-nowrap">
                    {formatRupiah(grandTotal.realisasi)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <CapaianBadge persen={grandTotal.persen} />
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Keterangan Warna */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 print:hidden mt-4">
        <span className="font-semibold">Keterangan Capaian:</span>
        <span className="flex items-center gap-1.5"><TrendingUp size={12} className="text-emerald-600" /><span className="text-emerald-700 dark:text-emerald-400 font-medium">≥ 80%</span> — Baik</span>
        <span className="flex items-center gap-1.5"><Minus size={12} className="text-amber-600" /><span className="text-amber-700 dark:text-amber-400 font-medium">40% – 79%</span> — Perlu Perhatian</span>
        <span className="flex items-center gap-1.5"><TrendingDown size={12} className="text-red-600" /><span className="text-red-700 dark:text-red-400 font-medium">&lt; 40%</span> — Rendah</span>
      </div>
    </div>
  );
};

export default LraPage;
