import React, { useContext, useMemo, useState } from 'react';
import { DpaContext } from '../context/DpaContext';
import { AuthContext } from '../context/AuthContext';
import { Activity, TrendingUp, TrendingDown, Minus, Search, Printer, BarChart3 } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatRupiah = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

const formatPersen = (v) =>
  isNaN(v) || !isFinite(v) ? '0.00%' : `${Math.min(v, 999.99).toFixed(2)}%`;

// Rekursif: kumpulkan semua node bertipe 'Program' beserta sub-kegiatannya
const collectPrograms = (nodes) => {
  const programs = [];
  const walk = (list) => {
    for (const n of list || []) {
      if (n.tipe === 'Program') programs.push(n);
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return programs;
};

// Rekursif: kumpulkan semua Sub Kegiatan di bawah sebuah node
const collectSubKegiatan = (node) => {
  const result = [];
  const walk = (n) => {
    if (n.tipe === 'Sub Kegiatan') { result.push(n); return; }
    for (const c of n.children || []) walk(c);
  };
  walk(node);
  return result;
};

// ─── Capaian Badge ────────────────────────────────────────────────────────────
const CapaianBadge = ({ persen }) => {
  let cls, Icon;
  if (persen >= 80)       { cls = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'; Icon = TrendingUp; }
  else if (persen >= 40)  { cls = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'; Icon = Minus; }
  else                    { cls = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'; Icon = TrendingDown; }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold ${cls}`}>
      <Icon size={11} strokeWidth={2.5} />{formatPersen(persen)}
    </span>
  );
};

const ProgressBar = ({ persen }) => {
  const capped = Math.min(persen, 100);
  const color = persen >= 80 ? 'bg-emerald-500' : persen >= 40 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden mt-1.5">
      <div className={`${color} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${capped}%` }} />
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const LraProgramPage = () => {
  const { dpaData, transactions } = useContext(DpaContext);
  const { selectedYear } = useContext(AuthContext);
  const [search, setSearch] = useState('');

  // Hitung data LRA per Program
  const programData = useMemo(() => {
    const programs = collectPrograms(dpaData);
    return programs.map(prog => {
      const subKegiatans = collectSubKegiatan(prog);
      const realisasi = subKegiatans.reduce((sum, sk) => {
        return sum + transactions
          .filter(t => t.subKegiatanId === sk.id)
          .reduce((s, t) => s + (t.nominal || 0), 0);
      }, 0);
      const anggaran = prog.totalAnggaran || 0;
      return {
        id: prog.id,
        kode: prog.kode,
        uraian: prog.uraian,
        anggaran,
        realisasi,
        sisa: anggaran - realisasi,
        persen: anggaran > 0 ? (realisasi / anggaran) * 100 : 0,
        jumlahSubKegiatan: subKegiatans.length,
      };
    });
  }, [dpaData, transactions]);

  const filtered = useMemo(() =>
    programData.filter(p =>
      p.uraian.toLowerCase().includes(search.toLowerCase()) ||
      p.kode.toLowerCase().includes(search.toLowerCase())
    ), [programData, search]);

  // Grand totals
  const totals = useMemo(() => {
    const anggaran  = programData.reduce((s, p) => s + p.anggaran, 0);
    const realisasi = programData.reduce((s, p) => s + p.realisasi, 0);
    const avgCapaian = programData.length > 0
      ? programData.reduce((s, p) => s + p.persen, 0) / programData.length
      : 0;
    return { anggaran, realisasi, sisa: anggaran - realisasi, avgCapaian };
  }, [programData]);

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
        <span>Dashboard</span><span>/</span><span>Laporan</span><span>/</span>
        <span className="text-gray-900 dark:text-white">LRA Per Program</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Activity size={24} className="text-indigo-500" />
            LRA Per Program
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Ringkasan serapan anggaran per program — Tahun{' '}
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedYear}</span>
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer print:hidden"
        >
          <Printer size={14} /> Cetak Ringkasan
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {[
          { label: 'Total Program', value: String(programData.length), unit: 'program aktif', color: 'indigo' },
          { label: 'Total Anggaran', value: formatRupiah(totals.anggaran), unit: 'Pagu DPA', color: 'gray' },
          { label: 'Total Realisasi', value: formatRupiah(totals.realisasi), unit: 'Terserap', color: 'blue' },
          { label: 'Rata-rata Capaian', value: formatPersen(totals.avgCapaian), unit: 'Keseluruhan program', color: totals.avgCapaian >= 80 ? 'emerald' : totals.avgCapaian >= 40 ? 'amber' : 'red' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-xl font-bold text-${color}-600 dark:text-${color}-400 leading-tight break-all`}>{value}</p>
            <p className="text-[10px] text-gray-400 mt-1">{unit}</p>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
            <BarChart3 size={16} className="text-indigo-500" />
            Rekapitulasi per Program
            <span className="text-xs font-normal text-gray-400 ml-1">({filtered.length} program)</span>
          </h3>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau kode program..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none w-64 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100/80 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-700">
                {['Kode Program', 'Nama Program', 'Sub Kegiatan', 'Pagu Anggaran (Rp)', 'Realisasi (Rp)', 'Sisa (Rp)', 'Capaian'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                    <Activity size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      {search ? `Tidak ada program yang cocok dengan "${search}"` : 'Data program belum tersedia.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((prog, idx) => (
                  <tr key={prog.id} className={`border-b border-gray-100 dark:border-gray-800 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/30 dark:bg-gray-800/20'}`}>
                    <td className="px-4 py-4 text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">{prog.kode}</td>
                    <td className="px-4 py-4 min-w-[260px] max-w-[360px]">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug">{prog.uraian}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md">{prog.jumlahSubKegiatan}</span>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">{formatRupiah(prog.anggaran)}</td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-blue-700 dark:text-blue-400 whitespace-nowrap">{formatRupiah(prog.realisasi)}</td>
                    <td className={`px-4 py-4 text-right text-sm font-medium whitespace-nowrap ${prog.sisa < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{formatRupiah(prog.sisa)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-start gap-0.5">
                        <CapaianBadge persen={prog.persen} />
                        <ProgressBar persen={prog.persen} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-gray-900 dark:bg-gray-950 border-t-2 border-gray-300 dark:border-gray-600">
                  <td colSpan="3" className="px-4 py-4 text-xs font-black text-white uppercase">TOTAL</td>
                  <td className="px-4 py-4 text-right text-xs font-black text-white whitespace-nowrap">{formatRupiah(totals.anggaran)}</td>
                  <td className="px-4 py-4 text-right text-xs font-black text-blue-300 whitespace-nowrap">{formatRupiah(totals.realisasi)}</td>
                  <td className={`px-4 py-4 text-right text-xs font-black whitespace-nowrap ${totals.sisa < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatRupiah(totals.sisa)}</td>
                  <td className="px-4 py-4"><CapaianBadge persen={totals.avgCapaian} /></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default LraProgramPage;
