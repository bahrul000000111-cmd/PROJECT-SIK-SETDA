import React, { useState, useContext } from 'react';
import { Shield, ChevronDown, ChevronRight, Folder, FileText, Activity, Pencil, Plus, X, ListTree, Banknote, MapPin, Trash, RotateCcw } from 'lucide-react';
import { DpaContext, calculateTreeTotals } from '../context/DpaContext';

const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

const formatInputCurrency = (value) => {
  const numericValue = value.replace(/\D/g, '');
  if (!numericValue) return '';
  return new Intl.NumberFormat('id-ID').format(numericValue);
};

const SUMBER_DANA_OPTIONS = [
  "DAU (Dana Alokasi Umum)",
  "PAD (Pendapatan Asli Daerah)",
  "DBH (Dana Bagi Hasil)",
  "Pendapatan Transfer Antar Daerah",
  "DAU Bidang Kesehatan"
];

const CHILD_ADD_MAP = {
  'Bagian': { label: 'Program', mode: 'add_program' },
  'Program': { label: 'Kegiatan', mode: 'add_kegiatan' },
  'Kegiatan': { label: 'Sub Kegiatan', mode: 'add_sub_kegiatan' },
  'Sub Kegiatan': { label: 'Rincian Belanja', mode: 'add_rincian' },
};

const LEVEL_ORDER = {
  'Bagian': 1,
  'Program': 2,
  'Kegiatan': 3,
  'Sub Kegiatan': 4,
  'Rincian Belanja': 5
};

const ExpandableRow = ({ node, level = 0, forceExpandAll, onEdit, onAddChild, onDelete, activeLevelFilter }) => {
  const [isExpanded, setIsExpanded] = useState(forceExpandAll);

  React.useEffect(() => {
    if (activeLevelFilter === 'all' || !activeLevelFilter) {
      setIsExpanded(forceExpandAll);
    } else {
      const currentLevel = LEVEL_ORDER[node.tipe];
      const targetLevel = LEVEL_ORDER[activeLevelFilter];
      if (currentLevel < targetLevel) {
        setIsExpanded(true);
      } else {
        setIsExpanded(false);
      }
    }
  }, [activeLevelFilter, forceExpandAll, node.tipe]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const getIndentClass = (lvl) => {
    switch(lvl) {
      case 0: return 'pl-4';
      case 1: return 'pl-10';
      case 2: return 'pl-16';
      case 3: return 'pl-24';
      default: return 'pl-4';
    }
  };

  const getTypeStyles = (type) => {
    switch(type) {
      case 'Bagian': return { badge: 'bg-blue-900 text-white', icon: Folder, textClass: 'font-bold text-gray-900 dark:text-white', size: 16 };
      case 'Program': return { badge: 'bg-teal-600 text-white', icon: Folder, textClass: 'font-semibold text-gray-800 dark:text-gray-100', size: 16 };
      case 'Kegiatan': return { badge: 'bg-orange-500 text-white', icon: Activity, textClass: 'font-medium text-gray-700 dark:text-gray-200', size: 14 };
      case 'Sub Kegiatan': return { badge: 'bg-pink-500 text-white', icon: FileText, textClass: 'text-gray-700 dark:text-gray-300', size: 14 };
      default: return { badge: 'bg-gray-500 text-white', icon: FileText, textClass: 'text-gray-700', size: 14 };
    }
  };

  const getKeteranganBelanja = (n) => {
    const count = n.children?.length || 0;
    switch(n.tipe) {
      case 'Bagian': return `Total Belanja dari ${count} Program`;
      case 'Program': return `Total Belanja dari ${count} Kegiatan`;
      case 'Kegiatan': return `Total Belanja dari ${count} Sub Kegiatan`;
      case 'Sub Kegiatan': return 'Belanja';
      default: return 'Total Belanja';
    }
  };

  const isSubKegiatan = node.tipe === 'Sub Kegiatan';
  const styles = getTypeStyles(node.tipe);
  const IconType = styles.icon;

  return (
    <React.Fragment>
      <div 
        className={`group flex items-start justify-between py-4 pr-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!isSubKegiatan ? 'cursor-pointer' : ''} ${getIndentClass(level)}`}
        onClick={!isSubKegiatan ? toggleExpand : undefined}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0 pr-4 mt-1">
          <div className="mt-0.5 text-gray-400 dark:text-gray-500 shrink-0">
            {node.children || node.rincianBelanja ? (
              isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />
            ) : <span className="w-[18px] inline-block"></span>}
          </div>
          
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${styles.badge}`}>
                {node.tipe}
              </span>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded">
                {node.kode || '-'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <IconType size={styles.size} className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
              <span className={`text-sm ${styles.textClass} break-words`}>
                {node.uraian}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0 gap-3 mt-1">
          <div className="flex flex-col items-end min-w-[150px]">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {formatCurrency(node.totalAnggaran || node.total || 0)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {getKeteranganBelanja(node)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(node); }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors cursor-pointer"
              title="Edit"
            >
              <Pencil size={14} />
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(node.id, node.tipe); }}
              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-800 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-md transition-colors cursor-pointer"
              title="Hapus"
            >
              <Trash size={14} />
            </button>

            {CHILD_ADD_MAP[node.tipe] && (
              <button
                onClick={(e) => { e.stopPropagation(); onAddChild(CHILD_ADD_MAP[node.tipe].mode, node.id); }}
                className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                title={CHILD_ADD_MAP[node.tipe].label}
              >
                <Plus size={12} />
                {CHILD_ADD_MAP[node.tipe].label}
              </button>
            )}

            {isSubKegiatan && (
              <button 
                onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-1.5 rounded-md shadow-sm transition-colors cursor-pointer ml-2"
              >
                {isExpanded ? 'Tutup Detail' : 'Detail'}
              </button>
            )}
          </div>
        </div>
      </div>

      {isExpanded && node.children && (
        <div className="flex flex-col w-full bg-white dark:bg-gray-900 animate-in fade-in slide-in-from-top-2 duration-300">
          {node.children.map(child => (
            <ExpandableRow key={child.id} node={child} level={level + 1} forceExpandAll={forceExpandAll} onEdit={onEdit} onAddChild={onAddChild} onDelete={onDelete} activeLevelFilter={activeLevelFilter} />
          ))}
        </div>
      )}

      {isExpanded && isSubKegiatan && node.rincianBelanja && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 m-4 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <FileText size={16} className="text-blue-600 dark:text-blue-400"/>
              Detail Rincian Belanja
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 font-medium w-48">Kode Rekening</th>
                  <th className="px-4 py-3 font-medium">Uraian Belanja</th>
                  <th className="px-4 py-3 font-medium w-40">Sumber Dana</th>
                  <th className="px-4 py-3 font-medium text-right w-48">Alokasi Anggaran</th>
                  <th className="px-4 py-3 font-medium text-center w-16">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {node.rincianBelanja.map(rb => (
                  <tr key={rb.id} className="group/row hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors bg-white dark:bg-gray-800/30">
                    <td className="px-4 py-4 font-medium text-gray-700 dark:text-gray-300">{rb.kode}</td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{rb.uraian}</td>
                    <td className="px-4 py-4 text-gray-500 dark:text-gray-400">
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs font-medium">{rb.sumberDana}</span>
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(rb.total || rb.totalAnggaran || 0)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center items-center gap-2">
                         <button 
                            onClick={(e) => { e.stopPropagation(); onEdit({...rb, tipe: 'Rincian Belanja'}); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors cursor-pointer opacity-0 group-hover/row:opacity-100"
                            title="Edit Rincian"
                          >
                            <Pencil size={14} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(rb.id, 'Rincian Belanja'); }}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-800 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-md transition-colors cursor-pointer opacity-0 group-hover/row:opacity-100"
                            title="Hapus Rincian"
                          >
                            <Trash size={14} />
                          </button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600">
                  <td colSpan={3} className="px-4 py-4 font-bold text-gray-800 dark:text-gray-200 text-right">TOTAL BELANJA</td>
                  <td className="px-4 py-4 font-bold text-blue-600 dark:text-blue-400 text-right">
                    {formatCurrency(node.rincianBelanja.reduce((sum, item) => sum + (item.total || item.totalAnggaran || 0), 0))}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

const DpaPage = () => {
  const { dpaData, setDpaData } = useContext(DpaContext);
  const [forceExpandAll, setForceExpandAll] = useState(false);
  const [activeLevelFilter, setActiveLevelFilter] = useState('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null); // 'add_bagian','add_program','add_kegiatan','add_sub_kegiatan','add_rincian','edit'
  const [activeParentId, setActiveParentId] = useState(null);
  const [currentNode, setCurrentNode] = useState(null);

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    kode: '',
    uraian: '',
    totalAnggaran: '',
    sumberDana: ''
  });

  // Add Form State (Inline per-level)
  const [addFormData, setAddFormData] = useState({
    kode: '',
    uraian: '',
    sumberDana: '',
    nilaiAnggaran: ''
  });

  const totalAkumulasi = dpaData.reduce((sum, item) => sum + (item.totalAnggaran || 0), 0);

  const toggleExpandAll = () => {
    setForceExpandAll(!forceExpandAll);
  };

  const deleteNode = (tree, id) => {
    return tree.filter(node => node.id !== id).map(node => {
      const cloned = { ...node };
      if (cloned.children) {
        cloned.children = deleteNode(cloned.children, id);
      }
      if (cloned.rincianBelanja) {
        cloned.rincianBelanja = cloned.rincianBelanja.filter(rb => rb.id !== id);
      }
      return cloned;
    });
  };

  const handleDelete = (id, namaTipe) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${namaTipe} ini beserta seluruh isinya?`)) {
      const newData = deleteNode(dpaData, id);
      setDpaData(calculateTreeTotals(newData));
    }
  };

  const handleEdit = (node) => {
    setModalMode('edit');
    setCurrentNode(node);
    setActiveParentId(null);
    setEditFormData({
      kode: node.kode || '',
      uraian: node.uraian || '',
      totalAnggaran: formatInputCurrency((node.totalAnggaran || node.total || 0).toString()),
      sumberDana: node.sumberDana || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenAddModal = (mode, parentId = null) => {
    setModalMode(mode);
    setActiveParentId(parentId);
    setCurrentNode(null);
    setAddFormData({ kode: '', uraian: '', sumberDana: '', nilaiAnggaran: '' });
    setIsModalOpen(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'totalAnggaran') {
      setEditFormData({ ...editFormData, [name]: formatInputCurrency(value) });
    } else {
      setEditFormData({ ...editFormData, [name]: value });
    }
  };

  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'nilaiAnggaran') {
      setAddFormData(prev => ({ ...prev, [name]: formatInputCurrency(value) }));
    } else {
      setAddFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Recursive insert child into tree
  const insertChild = (tree, parentId, newNode) => {
    return tree.map(node => {
      if (node.id === parentId) {
        const cloned = { ...node };
        if (newNode._isRincian) {
          const { _isRincian, ...rincianData } = newNode;
          cloned.rincianBelanja = [...(cloned.rincianBelanja || []), rincianData];
        } else {
          cloned.children = [...(cloned.children || []), newNode];
        }
        return cloned;
      }
      let updated = node;
      if (node.children) {
        const newChildren = insertChild(node.children, parentId, newNode);
        if (newChildren !== node.children) updated = { ...updated, children: newChildren };
      }
      return updated;
    });
  };

  // Removed recalcTree as calculateTreeTotals takes over

  const recursiveUpdate = (tree, updatedNode) => {
    return tree.map(node => {
      if (node.id === updatedNode.id) {
        return { ...node, ...updatedNode };
      }
      
      let newChildren = node.children;
      let newRincian = node.rincianBelanja;
      
      if (node.children) {
        newChildren = recursiveUpdate(node.children, updatedNode);
      }
      if (node.rincianBelanja) {
        newRincian = node.rincianBelanja.map(rb => rb.id === updatedNode.id ? { ...rb, ...updatedNode } : rb);
      }
      
      return { ...node, children: newChildren, rincianBelanja: newRincian };
    });
  };

  const handleSaveEdit = () => {
    // allow empty kode for bagian etc. uraian and total are required
    const isFormValid = editFormData.uraian.trim() !== '' && editFormData.totalAnggaran.trim() !== '';
    if (!isFormValid) return;

    const numericAnggaran = parseInt(editFormData.totalAnggaran.replace(/\D/g, ''), 10);
    const updatedNode = {
      ...currentNode,
      kode: editFormData.kode || '-',
      uraian: editFormData.uraian,
    };
    
    if (currentNode.tipe === 'Rincian Belanja') {
      updatedNode.total = numericAnggaran;
      updatedNode.sumberDana = editFormData.sumberDana;
    } else {
      updatedNode.totalAnggaran = numericAnggaran;
    }
    
    const newData = recursiveUpdate(dpaData, updatedNode);
    setDpaData(calculateTreeTotals(newData));
    setIsModalOpen(false);
  };

  const handleSaveAdd = () => {
    const req = addFormData;
    const isRincian = modalMode === 'add_rincian';

    // Validation
    if (isRincian) {
      if (!req.uraian.trim() || !req.nilaiAnggaran.trim()) return;
    } else {
      if (!req.uraian.trim()) return;
    }

    const MODE_TO_TIPE = {
      add_bagian: 'Bagian',
      add_program: 'Program',
      add_kegiatan: 'Kegiatan',
      add_sub_kegiatan: 'Sub Kegiatan',
    };

    const PREFIX_MAP = {
      add_bagian: 'B',
      add_program: 'P',
      add_kegiatan: 'K',
      add_sub_kegiatan: 'SK',
    };

    if (isRincian) {
      const numericAnggaran = parseInt(req.nilaiAnggaran.replace(/\D/g, ''), 10) || 0;
      const rincianNode = {
        _isRincian: true,
        id: `RB-${Date.now()}`,
        kode: req.kode || '-',
        uraian: req.uraian,
        sumberDana: req.sumberDana,
        hargaSatuan: numericAnggaran,
        total: numericAnggaran,
        rak: numericAnggaran,
      };
      const newData = insertChild([...dpaData], activeParentId, rincianNode);
      setDpaData(calculateTreeTotals(newData));
    } else if (modalMode === 'add_bagian') {
      const newBagian = {
        id: `B-${Date.now()}`,
        tipe: 'Bagian',
        kode: req.kode || '-',
        uraian: req.uraian,
        totalAnggaran: 0,
        rencanaKas: 0,
        children: [],
      };
      const newData = [...dpaData, newBagian];
      setDpaData(calculateTreeTotals(newData));
    } else {
      const tipe = MODE_TO_TIPE[modalMode];
      const prefix = PREFIX_MAP[modalMode];
      const newNode = {
        id: `${prefix}-${Date.now()}`,
        tipe,
        kode: req.kode || '-',
        uraian: req.uraian,
        totalAnggaran: 0,
        rencanaKas: 0,
        ...(modalMode === 'add_sub_kegiatan' ? { rincianBelanja: [] } : { children: [] }),
      };
      const newData = insertChild([...dpaData], activeParentId, newNode);
      setDpaData(calculateTreeTotals(newData));
    }

    setIsModalOpen(false);
  };

  const isEditFormValid = editFormData.uraian.trim() !== '' && editFormData.totalAnggaran.trim() !== '';
  
  const isAddFormValid = (() => {
    if (modalMode === 'add_rincian') {
      return addFormData.uraian.trim() !== '' && addFormData.nilaiAnggaran.trim() !== '';
    }
    if (modalMode && modalMode.startsWith('add_')) {
      return addFormData.uraian.trim() !== '';
    }
    return false;
  })();

  const getModalTitle = () => {
    const titles = {
      add_bagian: 'Tambah Bagian Baru',
      add_program: 'Tambah Program Baru',
      add_kegiatan: 'Tambah Kegiatan Baru',
      add_sub_kegiatan: 'Tambah Sub Kegiatan Baru',
      add_rincian: 'Tambah Rincian Belanja Baru',
      edit: `Edit ${currentNode?.tipe || ''}`,
    };
    return titles[modalMode] || 'Form Data';
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      
      {/* Header & Breadcrumb */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
          <span className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Penganggaran</span>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">DPA</span>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Dokumen Pelaksanaan Anggaran (DPA)
        </h2>
      </div>

      {/* Header Card (Overview) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Lambang_Kabupaten_Donggala.png/410px-Lambang_Kabupaten_Donggala.png" 
            alt="Logo Donggala" 
            className="w-14 h-14 object-contain shrink-0" 
          />
          <div className="flex flex-col">
            <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Sekretariat Daerah</h3>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Keseluruhan Anggaran</span>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          <div className="flex flex-col items-start xl:items-end">
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Akumulasi Alokasi Anggaran</span>
            <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {formatCurrency(totalAkumulasi)}
            </span>
          </div>
        </div>
      </div>

      {/* Tree Table Container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col relative">
        
        {/* Action Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-900/20">
          <div className="flex items-center gap-2 text-sm font-bold tracking-wide flex-wrap">
            <button 
              onClick={() => setActiveLevelFilter(activeLevelFilter === 'Bagian' ? 'all' : 'Bagian')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${activeLevelFilter === 'Bagian' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-400 underline' : 'text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
            >BAGIAN</button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button 
              onClick={() => setActiveLevelFilter(activeLevelFilter === 'Program' ? 'all' : 'Program')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${activeLevelFilter === 'Program' ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 underline' : 'text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30'}`}
            >PROGRAM</button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button 
              onClick={() => setActiveLevelFilter(activeLevelFilter === 'Kegiatan' ? 'all' : 'Kegiatan')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${activeLevelFilter === 'Kegiatan' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 underline' : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30'}`}
            >KEGIATAN</button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button 
              onClick={() => setActiveLevelFilter(activeLevelFilter === 'Sub Kegiatan' ? 'all' : 'Sub Kegiatan')}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${activeLevelFilter === 'Sub Kegiatan' ? 'bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400 underline' : 'text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/30'}`}
            >SUB KEGIATAN</button>

            {activeLevelFilter !== 'all' && (
              <>
                <span className="text-gray-300 dark:text-gray-600 ml-1">|</span>
                <button 
                  onClick={() => {
                    setActiveLevelFilter('all');
                    setForceExpandAll(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                  title="Reset Filter"
                >
                  <RotateCcw size={14} />
                  Reset Filter
                </button>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleOpenAddModal('add_bagian')}
              className="px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-md shadow-blue-500/20 flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={16} strokeWidth={2.5} />
              Tambah Bagian
            </button>
            <button 
              onClick={toggleExpandAll}
              className="px-4 py-2.5 text-sm font-semibold text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              {forceExpandAll ? 'Tutup Semua Baris' : 'Tampilkan Semua Baris'}
            </button>
          </div>
        </div>

        {/* Tree Table Body */}
        <div className="flex flex-col w-full overflow-x-auto min-w-[800px] pb-4">
          {dpaData.map(node => (
            <ExpandableRow 
              key={node.id} 
              node={node} 
              level={0} 
              forceExpandAll={forceExpandAll} 
              onEdit={handleEdit}
              onAddChild={handleOpenAddModal}
              onDelete={handleDelete}
              activeLevelFilter={activeLevelFilter}
            />
          ))}
        </div>

      </div>

      {/* Modal Terpusat (Add / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 transition-opacity animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {modalMode === 'edit' ? (
                  <Pencil className="text-blue-600 dark:text-blue-400" size={20} />
                ) : (
                  <ListTree className="text-blue-600 dark:text-blue-400" size={20} />
                )}
                {getModalTitle()}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-6 custom-scrollbar">
              
              {modalMode === 'edit' ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kode {currentNode?.tipe}</label>
                    <input type="text" name="kode" value={editFormData.kode} onChange={handleEditInputChange} placeholder={`Kode ${currentNode?.tipe}`} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Uraian {currentNode?.tipe} <span className="text-red-500">*</span></label>
                    <input type="text" name="uraian" value={editFormData.uraian} onChange={handleEditInputChange} placeholder={`Nama ${currentNode?.tipe}`} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white" />
                  </div>
                  {currentNode?.tipe === 'Rincian Belanja' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sumber Dana</label>
                      <select name="sumberDana" value={editFormData.sumberDana} onChange={handleEditInputChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-shadow">
                        <option value="" disabled>-- Pilih Sumber Dana --</option>
                        {SUMBER_DANA_OPTIONS.map((opsi, idx) => <option key={idx} value={opsi}>{opsi}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Anggaran (Rp) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium text-sm">Rp</span>
                      <input type="text" name="totalAnggaran" value={editFormData.totalAnggaran} onChange={handleEditInputChange} placeholder="0" className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white font-semibold" />
                    </div>
                  </div>
                </div>
              ) : modalMode === 'add_rincian' ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kode Rekening</label>
                    <input type="text" name="kode" value={addFormData.kode} onChange={handleAddInputChange} placeholder="Contoh: 5.1.02.02" className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900 dark:text-white transition-shadow" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Uraian Belanja <span className="text-red-500">*</span></label>
                    <input type="text" name="uraian" value={addFormData.uraian} onChange={handleAddInputChange} placeholder="Contoh: Belanja Alat Tulis Kantor" className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-900 dark:text-white transition-shadow" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sumber Dana</label>
                    <select name="sumberDana" value={addFormData.sumberDana} onChange={handleAddInputChange} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-shadow">
                      <option value="" disabled>-- Pilih Sumber Dana --</option>
                      {SUMBER_DANA_OPTIONS.map((opsi, idx) => <option key={idx} value={opsi}>{opsi}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nilai Anggaran (Rp) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold text-sm">Rp</span>
                      <input type="text" name="nilaiAnggaran" value={addFormData.nilaiAnggaran} onChange={handleAddInputChange} placeholder="0" className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base text-gray-900 dark:text-white font-bold transition-shadow" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kode</label>
                    <input type="text" name="kode" value={addFormData.kode} onChange={handleAddInputChange} placeholder="Masukkan Kode" className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white transition-shadow" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Uraian <span className="text-red-500">*</span></label>
                    <input type="text" name="uraian" value={addFormData.uraian} onChange={handleAddInputChange} placeholder="Masukkan Uraian" className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white transition-shadow" />
                  </div>
                </div>
              )}

            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={modalMode === 'edit' ? handleSaveEdit : handleSaveAdd}
                disabled={modalMode === 'edit' ? !isEditFormValid : !isAddFormValid}
                className={`px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-colors shadow-sm ${(modalMode === 'edit' ? !isEditFormValid : !isAddFormValid) ? 'bg-blue-400 dark:bg-blue-500/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-blue-500/20'}`}
              >
                Simpan Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DpaPage;
