import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, KeyRound, X, Users, Shield, Search, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../api';

// Admin tidak boleh membuat akun Admin baru via UI (prinsip keamanan otoritas utama)
const JABATAN_OPTIONS = ['Pengguna/Staf', 'Bendahara', 'Pemeriksa'];

const initialFormState = {
  nip: '',
  namaLengkap: '',
  role: 'Pengguna/Staf',
  instansi: 'Sekretariat Daerah',
  username: '',
  password: '',
};

const PenggunaPage = () => {
  const { currentUser } = useContext(AuthContext);

  // Guard: hanya Admin yang boleh mengakses halaman ini
  if (currentUser?.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit' | 'reset'
  const [form, setForm] = useState(initialFormState);
  const [editTarget, setEditTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id to delete
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError('Gagal mengambil data pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter(u =>
    u.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.nip?.includes(searchQuery)
  );

  const openAddModal = () => {
    setForm(initialFormState);
    setError('');
    setModalMode('add');
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditTarget(user);
    setForm({ ...user, password: '' });
    setError('');
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const openResetModal = (user) => {
    setEditTarget(user);
    setForm({ ...initialFormState, password: '' });
    setError('');
    setModalMode('reset');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
    setEditTarget(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (modalMode === 'add') {
        if (!form.namaLengkap || !form.username || !form.password) {
          setError('Semua field wajib diisi!');
          return;
        }
        await api.post('/users', {
          nama_lengkap: form.namaLengkap,
          username: form.username,
          password: form.password,
          role: form.role,
        });
        setSuccessMsg('Akun berhasil ditambahkan!');
      } else if (modalMode === 'edit') {
        if (!form.namaLengkap) {
          setError('Nama Lengkap wajib diisi!');
          return;
        }
        const payload = {
          nama_lengkap: form.namaLengkap,
          username: form.username,
          role: form.role,
        };
        await api.put(`/users/${editTarget.id}`, payload);
        setSuccessMsg('Data pengguna berhasil diperbarui!');
      } else if (modalMode === 'reset') {
        if (!form.password) {
          setError('Password baru wajib diisi!');
          return;
        }
        await api.put(`/users/${editTarget.id}`, { password: form.password });
        setSuccessMsg('Password berhasil direset!');
      }

      fetchUsers();
      closeModal();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Terjadi kesalahan pada server');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      setDeleteConfirm(null);
      setSuccessMsg('Akun berhasil dihapus!');
      fetchUsers();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Gagal menghapus akun');
    }
  };

  const roleColor = (role) => {
    switch(role) {
      case 'Admin': return 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'Bendahara': return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'Pemeriksa': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
      default: return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
        <span>Dashboard</span>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">Kelola Pengguna</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Kelola Pengguna</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kelola akun dan hak akses pengguna yang terdaftar di sistem.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200"
        >
          <Plus size={18} />
          Tambah Pengguna
        </button>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
          <Shield size={16} className="shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pengguna', value: users.length, color: 'blue' },
          { label: 'Admin', value: users.filter(u => u.role === 'Admin').length, color: 'red' },
          { label: 'Pemeriksa', value: users.filter(u => u.role === 'Pemeriksa').length, color: 'emerald' },
          { label: 'Pengguna/Staf', value: users.filter(u => u.role === 'Pengguna/Staf').length, color: 'indigo' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-3xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between gap-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={18} className="text-blue-500" />
            Daftar Akun Kelola Pengguna
          </h3>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, NIP, username..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-64 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jabatan</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">NIP</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama Lengkap</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Username</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <Loader2 size={32} className="mx-auto mb-3 animate-spin text-blue-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Memuat data pengguna...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-sm text-gray-400 dark:text-gray-500">
                    <Users size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                    {users.length === 0 ? 'Belum ada pengguna terdaftar.' : 'Tidak ada pengguna yang cocok dengan pencarian.'}
                  </td>
                </tr>
              ) : (
                filtered.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(user)}
                          title="Edit Data"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => openResetModal(user)}
                          title="Reset Password"
                          className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition-colors"
                        >
                          <KeyRound size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(user)}
                          title="Hapus Akun"
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${roleColor(user.role)}`}>
                        {user.role || 'Pengguna/Staf'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">{user.nip || '-'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{user.nama_lengkap}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">@{user.username}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Menampilkan {filtered.length} dari {users.length} akun terdaftar
            </p>
          </div>
        )}
      </div>

      {/* ====== MODAL TAMBAH/EDIT/RESET ====== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white">
                {modalMode === 'add' && 'Tambah Akun Pengguna'}
                {modalMode === 'edit' && `Edit Data: ${editTarget?.namaLengkap}`}
                {modalMode === 'reset' && `Reset Password: ${editTarget?.namaLengkap}`}
              </h3>
              <button onClick={closeModal} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                  <AlertTriangle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              {/* Fields untuk Add dan Edit */}
              {(modalMode === 'add' || modalMode === 'edit') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">NIP</label>
                      <input
                        type="text"
                        name="nip"
                        value={form.nip}
                        onChange={handleChange}
                        placeholder="1900000000000000"
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Jabatan</label>
                      <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none transition-all"
                      >
                        {JABATAN_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      name="namaLengkap"
                      value={form.namaLengkap}
                      onChange={handleChange}
                      placeholder="Contoh: Bahrul Ulum"
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      placeholder="username_unik"
                      readOnly={modalMode === 'edit'}
                      className={`w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl ${modalMode === 'edit' ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-gray-50 dark:bg-gray-800'} text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all`}
                    />
                  </div>
                </>
              )}

              {/* Password: show on Add mode, hide on Edit; for Reset only show password */}
              {(modalMode === 'add' || modalMode === 'reset') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {modalMode === 'reset' ? 'Password Baru' : 'Password'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  {modalMode === 'add' && 'Tambah Akun'}
                  {modalMode === 'edit' && 'Simpan Perubahan'}
                  {modalMode === 'reset' && 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== DELETE CONFIRMATION MODAL ====== */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-gray-800 p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Hapus Akun Pengguna?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Akun <span className="font-semibold text-gray-900 dark:text-white">@{deleteConfirm.username}</span> akan dihapus secara permanen dan tidak dapat dikembalikan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors active:scale-[0.98] cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PenggunaPage;
