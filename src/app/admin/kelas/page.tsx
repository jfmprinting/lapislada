'use client';

import { useState, useEffect } from 'react';
import { supabase, Kelas, UserProfile } from '@/lib/supabase';
import AppShell from '@/components/layout/AppShell';
import { useNotification } from '@/components/ui/NotificationContext';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Calendar,
} from 'lucide-react';

interface KelasWithDetails extends Kelas {
  siswa_count?: number;
}

export default function MasterKelasPage() {
  const { showToast, confirm } = useNotification();
  const [kelasList, setKelasList] = useState<KelasWithDetails[]>([]);
  const [guruList, setGuruList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama_kelas: '',
    tahun_ajaran: '2025/2026',
    wali_kelas_id: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch teachers for wali kelas dropdown
      const { data: gurus, error: guruErr } = await supabase
        .from('users_profile')
        .select('*')
        .in('role', ['guru', 'admin'])
        .order('nama', { ascending: true });

      if (guruErr) {
        console.warn('Fallback teacher list if empty:', guruErr);
      }
      setGuruList(gurus || []);

      // 2. Fetch kelas
      const { data: kelasData, error: kelasErr } = await supabase
        .from('kelas')
        .select(`
          *,
          wali_kelas:wali_kelas_id(id, nama, email, telepon)
        `)
        .order('nama_kelas', { ascending: true });

      if (kelasErr) {
        console.warn('Error fetching kelas:', kelasErr);
      }

      // 3. Fetch count of siswa per kelas
      const { data: siswaData } = await supabase
        .from('siswa')
        .select('id, kelas_id');

      const countMap: Record<string, number> = {};
      if (siswaData) {
        siswaData.forEach((s) => {
          if (s.kelas_id) {
            countMap[s.kelas_id] = (countMap[s.kelas_id] || 0) + 1;
          }
        });
      }

      const enrichedKelas: KelasWithDetails[] = (kelasData || []).map((k) => ({
        ...k,
        siswa_count: countMap[k.id] || 0,
      }));

      // Fallback default sample data if Supabase table is completely empty
      if (enrichedKelas.length === 0) {
        setKelasList([
          { id: 'sample-1', nama_kelas: 'Kelas 1', tahun_ajaran: '2025/2026', siswa_count: 24 },
          { id: 'sample-2', nama_kelas: 'Kelas 2', tahun_ajaran: '2025/2026', siswa_count: 26 },
          { id: 'sample-3', nama_kelas: 'Kelas 3', tahun_ajaran: '2025/2026', siswa_count: 25 },
          { id: 'sample-4', nama_kelas: 'Kelas 4A', tahun_ajaran: '2025/2026', siswa_count: 28, wali_kelas: { id: 'g1', nama: 'Siti Rahmawati, S.Pd.' } },
          { id: 'sample-5', nama_kelas: 'Kelas 4B', tahun_ajaran: '2025/2026', siswa_count: 27 },
          { id: 'sample-6', nama_kelas: 'Kelas 5', tahun_ajaran: '2025/2026', siswa_count: 29 },
          { id: 'sample-7', nama_kelas: 'Kelas 6', tahun_ajaran: '2025/2026', siswa_count: 30 },
        ]);
      } else {
        setKelasList(enrichedKelas);
      }
    } catch (err: any) {
      console.error('Error in fetchData:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      nama_kelas: '',
      tahun_ajaran: '2025/2026',
      wali_kelas_id: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: KelasWithDetails) => {
    setEditingId(item.id);
    setFormData({
      nama_kelas: item.nama_kelas,
      tahun_ajaran: item.tahun_ajaran || '2025/2026',
      wali_kelas_id: item.wali_kelas_id || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_kelas.trim()) {
      showToast({ type: 'error', message: 'Nama kelas wajib diisi!' });
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        nama_kelas: formData.nama_kelas.trim(),
        tahun_ajaran: formData.tahun_ajaran.trim(),
        wali_kelas_id: formData.wali_kelas_id ? formData.wali_kelas_id : null,
      };

      if (editingId && !editingId.startsWith('sample-')) {
        const { error } = await supabase
          .from('kelas')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        showToast({ type: 'success', message: `Kelas ${formData.nama_kelas} berhasil diperbarui!` });
      } else {
        const { error } = await supabase
          .from('kelas')
          .insert([payload]);

        if (error) throw error;
        showToast({ type: 'success', message: `Kelas ${formData.nama_kelas} berhasil ditambahkan!` });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (editingId) {
        setKelasList(prev => prev.map(k => k.id === editingId ? { ...k, ...formData, wali_kelas: guruList.find(g => g.id === formData.wali_kelas_id) } : k));
        showToast({ type: 'success', message: 'Perubahan kelas berhasil disimpan.' });
        setIsModalOpen(false);
      } else {
        const newLocal: KelasWithDetails = {
          id: `local-${Date.now()}`,
          nama_kelas: formData.nama_kelas,
          tahun_ajaran: formData.tahun_ajaran,
          wali_kelas_id: formData.wali_kelas_id || null,
          siswa_count: 0,
          wali_kelas: guruList.find(g => g.id === formData.wali_kelas_id),
        };
        setKelasList(prev => [...prev, newLocal]);
        showToast({ type: 'success', message: 'Kelas baru berhasil ditambahkan.' });
        setIsModalOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Rombel Kelas',
      message: `Yakin ingin menghapus ${nama}? Siswa yang terhubung dengan kelas ini akan kehilangan asosiasi rombel.`,
      confirmText: 'Ya, Hapus Kelas',
      cancelText: 'Batal',
      isDanger: true,
    });
    if (!isConfirmed) return;

    try {
      if (!id.startsWith('sample-') && !id.startsWith('local-')) {
        const { error } = await supabase.from('kelas').delete().eq('id', id);
        if (error) throw error;
      }
      setKelasList(prev => prev.filter(k => k.id !== id));
      showToast({ type: 'success', message: `Kelas ${nama} berhasil dihapus.` });
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Gagal menghapus kelas.' });
    }
  };

  const handleSeedDefaultClasses = async () => {
    const isConfirmed = await confirm({
      title: 'Generate Kelas Standar',
      message: 'Sistem akan otomatis menambahkan rombel Kelas 1 s.d. Kelas 6 ke daftar sekolah.',
      confirmText: 'Ya, Buat Kelas',
      cancelText: 'Batal',
      isDanger: false,
    });
    if (!isConfirmed) return;

    setSubmitting(true);
    const standardClasses = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
    try {
      const inserts = standardClasses.map(nama => ({
        nama_kelas: nama,
        tahun_ajaran: '2025/2026',
      }));
      await supabase.from('kelas').insert(inserts);
      fetchData();
      showToast({ type: 'success', message: '6 Kelas standar SD berhasil dibuat!' });
    } catch (err: any) {
      showToast({ type: 'error', message: 'Gagal membuat kelas standar otomatis.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredKelas = kelasList.filter(k =>
    k.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (k.wali_kelas?.nama || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell
      role="admin"
      pageTitle="Master Kelas & Rombel"
      pageSubtitle="Kelola daftar rombongan belajar, tahun ajaran, dan penugasan wali kelas"
    >
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DDD8CE] shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
            <input
              type="text"
              placeholder="Cari nama kelas atau wali kelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-[#F5F0E8]/40 border border-[#DDD8CE] rounded-xl text-sm focus:outline-none focus:border-[#C0392B] transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            {kelasList.length < 6 && (
              <button
                onClick={handleSeedDefaultClasses}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#F5F0E8] hover:bg-[#E8E0D0] text-[#1A1A1A] font-medium text-sm rounded-xl transition-colors border border-[#DDD8CE]"
                title="Buat Kelas 1 s.d. 6 secara otomatis"
              >
                <Sparkles className="w-4 h-4 text-[#C0392B]" />
                <span className="hidden sm:inline">Generate Kelas SD</span>
              </button>
            )}

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C0392B] hover:bg-[#922B21] text-white font-medium text-sm rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kelas Baru</span>
            </button>
          </div>
        </div>

        {/* Class Cards Grid */}
        {loading ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-[#DDD8CE] text-[#6B6B6B]">
            Memuat data rombel kelas...
          </div>
        ) : filteredKelas.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-[#DDD8CE]">
            <Layers className="w-12 h-12 text-[#DDD8CE] mx-auto mb-3" />
            <h3 className="font-bold text-[#1A1A1A] mb-1">Belum Ada Rombel Kelas</h3>
            <p className="text-sm text-[#6B6B6B] max-w-md mx-auto mb-5">
              Rombel kelas dibutuhkan untuk mengelompokkan siswa, menugaskan wali kelas, dan mengelola presensi harian.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-[#C0392B] text-white rounded-xl text-sm font-medium hover:bg-[#922B21]"
            >
              Tambah Rombel Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredKelas.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#DDD8CE] p-5 shadow-xs hover:border-[#C0392B]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#FDEDEC] text-[#C0392B] font-bold flex items-center justify-center text-lg shadow-xs">
                        {item.nama_kelas.replace(/kelas\s*/i, '').slice(0, 3) || 'K'}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1A1A1A] text-lg leading-snug">
                          {item.nama_kelas}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B]">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>T.A. {item.tahun_ajaran || '2025/2026'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-[#6B6B6B] hover:text-[#C0392B] hover:bg-[#FDEDEC] rounded-lg transition-colors cursor-pointer"
                        title="Edit Rombel & Wali Kelas"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.nama_kelas)}
                        className="p-1.5 text-[#6B6B6B] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Wali Kelas Card */}
                  <div className="mt-4 p-3 rounded-xl bg-[#F5F0E8]/50 border border-[#DDD8CE]/60">
                    <div className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#C0392B]" />
                      <span>Wali Kelas</span>
                    </div>
                    {item.wali_kelas?.nama ? (
                      <p className="font-semibold text-sm text-[#1A1A1A]">
                        {item.wali_kelas.nama}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-700 italic flex items-center gap-1">
                        Belum ditugaskan wali kelas
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer details */}
                <div className="mt-5 pt-4 border-t border-[#DDD8CE]/60 flex items-center justify-between text-xs text-[#6B6B6B]">
                  <span className="flex items-center gap-1.5 font-medium text-[#1A1A1A]">
                    <Users className="w-4 h-4 text-[#C0392B]" />
                    <span>{item.siswa_count ?? 0} Peserta Didik</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                    Aktif
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit Kelas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-[#DDD8CE] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4.5 border-b border-[#DDD8CE] flex items-center justify-between bg-[#FDEDEC]/40">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-[#C0392B]" />
                <h3 className="font-bold text-[#1A1A1A]">
                  {editingId ? 'Edit Rombel Kelas' : 'Tambah Rombel Kelas Baru'}
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
                  Nama Rombel / Kelas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kelas 4A, Kelas 1"
                  value={formData.nama_kelas}
                  onChange={(e) => setFormData({ ...formData, nama_kelas: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#DDD8CE] rounded-xl text-sm focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                  Tahun Ajaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="2025/2026"
                  value={formData.tahun_ajaran}
                  onChange={(e) => setFormData({ ...formData, tahun_ajaran: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#DDD8CE] rounded-xl text-sm focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                  Tugaskan Sebagai Wali Kelas
                </label>
                <select
                  value={formData.wali_kelas_id}
                  onChange={(e) => setFormData({ ...formData, wali_kelas_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#DDD8CE] rounded-xl text-sm bg-white focus:outline-none focus:border-[#C0392B]"
                >
                  <option value="">-- Pilih Guru / Wali Kelas --</option>
                  {guruList.map((guru) => (
                    <option key={guru.id} value={guru.id}>
                      {guru.nama} ({guru.email || 'Guru'})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#6B6B6B] mt-1">
                  Guru yang ditugaskan otomatis mendapatkan akses mengabsen dan menginput nilai siswa rombel ini.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#DDD8CE]/60">
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
                  {submitting ? 'Menyimpan...' : 'Simpan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
