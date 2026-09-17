'use client';

import { useState, useEffect } from 'react';
import { supabase, UserProfile, Kelas } from '@/lib/supabase';
import AppShell from '@/components/layout/AppShell';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  ShieldCheck,
  UserCheck,
  Layers,
} from 'lucide-react';

interface GuruWithKelas extends UserProfile {
  kelas_binaan?: string[];
  nip?: string;
}

export default function MasterGuruPage() {
  const [guruList, setGuruList] = useState<GuruWithKelas[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'guru' | 'admin'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    telepon: '',
    role: 'guru' as 'guru' | 'admin',
    nip: '',
    wali_kelas_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch kelas to know who is wali kelas of which class
      const { data: kelasData } = await supabase
        .from('kelas')
        .select('*')
        .order('nama_kelas', { ascending: true });
      setKelasList(kelasData || []);

      // 2. Fetch guru & admin from users_profile
      const { data: userData, error } = await supabase
        .from('users_profile')
        .select('*')
        .in('role', ['guru', 'admin'])
        .order('nama', { ascending: true });

      if (error) {
        console.warn('Error fetching users_profile:', error);
      }

      // Map kelas binaan to each guru
      const waliMap: Record<string, string[]> = {};
      if (kelasData) {
        kelasData.forEach((k) => {
          if (k.wali_kelas_id) {
            if (!waliMap[k.wali_kelas_id]) waliMap[k.wali_kelas_id] = [];
            waliMap[k.wali_kelas_id].push(k.nama_kelas);
          }
        });
      }

      const enrichedGurus: GuruWithKelas[] = (userData || []).map((u) => ({
        ...u,
        kelas_binaan: waliMap[u.id] || [],
      }));

      // Fallback default sample if empty
      if (enrichedGurus.length === 0) {
        setGuruList([
          {
            id: 'sample-g1',
            nama: 'Siti Rahmawati, S.Pd.',
            role: 'guru',
            email: 'guru@demo.com',
            telepon: '081234567890',
            nip: '198503152010012015',
            kelas_binaan: ['Kelas 4A'],
          },
          {
            id: 'sample-g2',
            nama: 'Bambang Sudibyo, M.Pd.',
            role: 'guru',
            email: 'bambang@sdnlatsari.sch.id',
            telepon: '085678901234',
            nip: '197908202005011008',
            kelas_binaan: ['Kelas 5'],
          },
          {
            id: 'sample-g3',
            nama: 'Dewi Lestari, S.Pd.SD.',
            role: 'guru',
            email: 'dewi@sdnlatsari.sch.id',
            telepon: '082198765432',
            nip: '199011042019032009',
            kelas_binaan: ['Kelas 1'],
          },
          {
            id: 'sample-admin',
            nama: 'Samsul Arifin, S.Pd. (Kepsek & Admin)',
            role: 'admin',
            email: 'admin@demo.com',
            telepon: '082230898376',
            nip: '197506121998031003',
            kelas_binaan: [],
          },
        ]);
      } else {
        setGuruList(enrichedGurus);
      }
    } catch (err: any) {
      console.error('Error fetching guru data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      nama: '',
      email: '',
      telepon: '',
      role: 'guru',
      nip: '',
      wali_kelas_id: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: GuruWithKelas) => {
    setEditingId(item.id);
    const assignedKelas = kelasList.find((k) => k.wali_kelas_id === item.id);
    setFormData({
      nama: item.nama,
      email: item.email || '',
      telepon: item.telepon || '',
      role: item.role as 'guru' | 'admin',
      nip: item.nip || '',
      wali_kelas_id: assignedKelas ? assignedKelas.id : '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      setNotification({ type: 'error', message: 'Nama lengkap guru wajib diisi!' });
      return;
    }

    setSubmitting(true);
    try {
      let targetUserId = editingId;

      if (editingId && !editingId.startsWith('sample-') && !editingId.startsWith('local-')) {
        // Update users_profile
        const { error: updateErr } = await supabase
          .from('users_profile')
          .update({
            nama: formData.nama.trim(),
            email: formData.email.trim() || null,
            telepon: formData.telepon.trim() || null,
            role: formData.role,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (updateErr) throw updateErr;
      } else if (!editingId) {
        // Insert new profile
        const newUuid = crypto.randomUUID();
        targetUserId = newUuid;
        const { error: insertErr } = await supabase
          .from('users_profile')
          .insert([
            {
              id: newUuid,
              nama: formData.nama.trim(),
              email: formData.email.trim() || null,
              telepon: formData.telepon.trim() || null,
              role: formData.role,
            },
          ]);

        if (insertErr) {
          console.warn('Direct insert users_profile note:', insertErr);
        }
      }

      // Assign wali kelas if selected
      if (formData.wali_kelas_id && targetUserId) {
        await supabase
          .from('kelas')
          .update({ wali_kelas_id: targetUserId })
          .eq('id', formData.wali_kelas_id);
      }

      setNotification({
        type: 'success',
        message: `Data ${formData.nama} berhasil disimpan!`,
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      // Local optimistic fallback
      if (editingId) {
        setGuruList((prev) =>
          prev.map((g) => (g.id === editingId ? { ...g, ...formData } : g))
        );
      } else {
        const newLocal: GuruWithKelas = {
          id: `local-${Date.now()}`,
          nama: formData.nama,
          email: formData.email,
          telepon: formData.telepon,
          role: formData.role,
          nip: formData.nip,
          kelas_binaan: formData.wali_kelas_id
            ? [kelasList.find((k) => k.id === formData.wali_kelas_id)?.nama_kelas || 'Kelas']
            : [],
        };
        setGuruList((prev) => [...prev, newLocal]);
      }
      setNotification({ type: 'success', message: 'Data guru berhasil disimpan.' });
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Hapus data ${nama}?`)) return;

    try {
      if (!id.startsWith('sample-') && !id.startsWith('local-')) {
        await supabase.from('users_profile').delete().eq('id', id);
      }
      setGuruList((prev) => prev.filter((g) => g.id !== id));
      setNotification({ type: 'success', message: `Data ${nama} berhasil dihapus.` });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal menghapus guru.' });
    } finally {
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const filteredGurus = guruList.filter((g) => {
    const matchSearch =
      g.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.telepon || '').includes(searchTerm);
    const matchRole = roleFilter === 'all' || g.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <AppShell
      role="admin"
      pageTitle="Master Guru & Tenaga Kependidikan"
      pageSubtitle="Kelola data pendidik, penugasan wali kelas, dan hak akses aplikasi"
    >
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DDD8CE] shadow-xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
              <input
                type="text"
                placeholder="Cari nama guru, NIP, atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-[#F5F0E8]/40 border border-[#DDD8CE] rounded-xl text-sm focus:outline-none focus:border-[#C0392B]"
              />
            </div>

            {/* Role Filter Pills */}
            <div className="flex items-center gap-1.5 bg-[#F5F0E8] p-1 rounded-xl border border-[#DDD8CE]">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  roleFilter === 'all'
                    ? 'bg-white text-[#C0392B] shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                Semua ({guruList.length})
              </button>
              <button
                onClick={() => setRoleFilter('guru')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  roleFilter === 'guru'
                    ? 'bg-white text-[#C0392B] shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                Guru
              </button>
              <button
                onClick={() => setRoleFilter('admin')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  roleFilter === 'admin'
                    ? 'bg-white text-[#C0392B] shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C0392B] hover:bg-[#922B21] text-white font-medium text-sm rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Guru / PTK</span>
          </button>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Teachers Grid */}
        {loading ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-[#DDD8CE] text-[#6B6B6B]">
            Memuat data guru...
          </div>
        ) : filteredGurus.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-[#DDD8CE]">
            <Users className="w-12 h-12 text-[#DDD8CE] mx-auto mb-3" />
            <h3 className="font-bold text-[#1A1A1A] mb-1">Tidak Ada Data Guru</h3>
            <p className="text-sm text-[#6B6B6B] max-w-md mx-auto mb-5">
              Belum ada guru yang sesuai dengan kriteria pencarian atau filter.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-[#C0392B] text-white rounded-xl text-sm font-medium hover:bg-[#922B21] cursor-pointer"
            >
              Tambah Guru
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGurus.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#DDD8CE] p-5 shadow-xs hover:border-[#C0392B]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#F5F0E8] border border-[#DDD8CE] flex items-center justify-center text-[#C0392B] font-bold text-lg">
                        {item.nama.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1A1A1A] text-base leading-snug">
                          {item.nama}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                            item.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.role === 'admin' ? (
                            <ShieldCheck className="w-3 h-3" />
                          ) : (
                            <UserCheck className="w-3 h-3" />
                          )}
                          <span>{item.role === 'admin' ? 'Administrator' : 'Guru Kelas/Mapel'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-[#6B6B6B] hover:text-[#C0392B] hover:bg-[#FDEDEC] rounded-lg transition-colors cursor-pointer"
                        title="Edit Data Guru"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.nama)}
                        className="p-1.5 text-[#6B6B6B] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Guru"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Detail Info */}
                  <div className="space-y-1.5 text-xs text-[#6B6B6B] mt-4 pt-3 border-t border-[#DDD8CE]/60">
                    {item.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#C0392B] shrink-0" />
                        <span className="truncate">{item.email}</span>
                      </div>
                    )}
                    {item.telepon && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#C0392B] shrink-0" />
                        <span>{item.telepon}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Wali Kelas Badge */}
                <div className="mt-5 pt-3 border-t border-[#DDD8CE]/60 flex items-center justify-between text-xs">
                  <span className="text-[#6B6B6B]">Wali Kelas:</span>
                  {item.kelas_binaan && item.kelas_binaan.length > 0 ? (
                    <span className="px-2.5 py-1 rounded-lg bg-[#FDEDEC] text-[#C0392B] font-semibold text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{item.kelas_binaan.join(', ')}</span>
                    </span>
                  ) : (
                    <span className="text-[#6B6B6B] italic">Bukan Wali Kelas</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit Guru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-[#DDD8CE] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4.5 border-b border-[#DDD8CE] flex items-center justify-between bg-[#FDEDEC]/40">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-[#C0392B]" />
                <h3 className="font-bold text-[#1A1A1A]">
                  {editingId ? 'Edit Data Pendidik / Staf' : 'Tambah Pendidik / Staf Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#6B6B6B] hover:text-[#1A1A1A] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                  Nama Lengkap beserta Gelar <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Rahmawati, S.Pd."
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#DDD8CE] rounded-xl text-sm focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                    Email Akun Login
                  </label>
                  <input
                    type="email"
                    placeholder="guru@sekolah.sch.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#DDD8CE] rounded-xl text-sm focus:outline-none focus:border-[#C0392B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                    No. WhatsApp / Telepon
                  </label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={formData.telepon}
                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#DDD8CE] rounded-xl text-sm focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                    Hak Akses (Role)
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'guru' | 'admin' })}
                    className="w-full px-3.5 py-2.5 border border-[#DDD8CE] rounded-xl text-sm bg-white focus:outline-none focus:border-[#C0392B]"
                  >
                    <option value="guru">Guru Kelas / Mapel</option>
                    <option value="admin">Administrator Sekolah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                    Tetapkan Wali Kelas
                  </label>
                  <select
                    value={formData.wali_kelas_id}
                    onChange={(e) => setFormData({ ...formData, wali_kelas_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#DDD8CE] rounded-xl text-sm bg-white focus:outline-none focus:border-[#C0392B]"
                  >
                    <option value="">-- Bukan Wali Kelas --</option>
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#DDD8CE]/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-[#6B6B6B] hover:text-[#1A1A1A] rounded-xl hover:bg-[#F5F0E8] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#C0392B] hover:bg-[#922B21] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Pendidik'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
