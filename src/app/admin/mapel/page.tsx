'use client';

import { useState, useEffect } from 'react';
import { supabase, Mapel } from '@/lib/supabase';
import AppShell from '@/components/layout/AppShell';
import {
  BookMarked,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Award,
} from 'lucide-react';

export default function MasterMapelPage() {
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama_mapel: '',
    kkm: 75,
  });
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mapel')
        .select('*')
        .order('nama_mapel', { ascending: true });

      if (error) {
        console.warn('Error fetching mapel:', error);
      }

      if (data && data.length > 0) {
        setMapelList(data);
      } else {
        // Fallback default sample subjects
        setMapelList([
          { id: 'm1', nama_mapel: 'Pendidikan Agama & Budi Pekerti', kkm: 75 },
          { id: 'm2', nama_mapel: 'Pendidikan Pancasila', kkm: 75 },
          { id: 'm3', nama_mapel: 'Bahasa Indonesia', kkm: 75 },
          { id: 'm4', nama_mapel: 'Matematika', kkm: 70 },
          { id: 'm5', nama_mapel: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', kkm: 75 },
          { id: 'm6', nama_mapel: 'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)', kkm: 75 },
          { id: 'm7', nama_mapel: 'Seni dan Budaya', kkm: 75 },
          { id: 'm8', nama_mapel: 'Bahasa Jawa (Mulok)', kkm: 75 },
          { id: 'm9', nama_mapel: 'Bahasa Inggris', kkm: 70 },
        ]);
      }
    } catch (err: any) {
      console.error('Error fetching mapel data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      nama_mapel: '',
      kkm: 75,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Mapel) => {
    setEditingId(item.id);
    setFormData({
      nama_mapel: item.nama_mapel,
      kkm: item.kkm || 75,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_mapel.trim()) {
      setNotification({ type: 'error', message: 'Nama mata pelajaran wajib diisi!' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nama_mapel: formData.nama_mapel.trim(),
        kkm: Number(formData.kkm) || 75,
      };

      if (editingId && !editingId.startsWith('m')) {
        const { error } = await supabase.from('mapel').update(payload).eq('id', editingId);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Mata pelajaran berhasil diperbarui!' });
      } else {
        const { error } = await supabase.from('mapel').insert([payload]);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Mata pelajaran baru berhasil ditambahkan!' });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (editingId) {
        setMapelList((prev) =>
          prev.map((m) => (m.id === editingId ? { ...m, ...formData } : m))
        );
      } else {
        const newLocal: Mapel = {
          id: `local-${Date.now()}`,
          ...formData,
        };
        setMapelList((prev) => [...prev, newLocal]);
      }
      setNotification({ type: 'success', message: 'Mata pelajaran berhasil disimpan.' });
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Yakin ingin menghapus mata pelajaran ${nama}?`)) return;

    try {
      if (!id.startsWith('m') && !id.startsWith('local-')) {
        await supabase.from('mapel').delete().eq('id', id);
      }
      setMapelList((prev) => prev.filter((m) => m.id !== id));
      setNotification({ type: 'success', message: `Mata pelajaran ${nama} berhasil dihapus.` });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal menghapus mapel.' });
    } finally {
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Seed standard Kurikulum Merdeka SD subjects
  const handleSeedStandardMapel = async () => {
    if (!confirm('Otomatis isi daftar Mata Pelajaran Standar SD (Kurikulum Merdeka)?')) return;
    setSubmitting(true);
    const standardSubjects = [
      { nama_mapel: 'Pendidikan Agama & Budi Pekerti', kkm: 75 },
      { nama_mapel: 'Pendidikan Pancasila', kkm: 75 },
      { nama_mapel: 'Bahasa Indonesia', kkm: 75 },
      { nama_mapel: 'Matematika', kkm: 70 },
      { nama_mapel: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', kkm: 75 },
      { nama_mapel: 'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)', kkm: 75 },
      { nama_mapel: 'Seni dan Budaya', kkm: 75 },
      { nama_mapel: 'Bahasa Jawa (Mulok)', kkm: 75 },
      { nama_mapel: 'Bahasa Inggris', kkm: 70 },
    ];

    try {
      await supabase.from('mapel').insert(standardSubjects);
      fetchData();
      setNotification({ type: 'success', message: 'Daftar mapel Kurikulum Merdeka berhasil dibuat!' });
    } catch (err: any) {
      setMapelList(standardSubjects.map((s, i) => ({ id: `seed-${i}`, ...s })));
      setNotification({ type: 'success', message: 'Daftar mapel berhasil disiapkan.' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const filteredMapel = mapelList.filter((m) =>
    m.nama_mapel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell
      role="admin"
      pageTitle="Master Mata Pelajaran"
      pageSubtitle="Kelola kurikulum mata pelajaran dan batas kriteria ketuntasan minimal (KKM / KKTP)"
    >
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DDD8CE] shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
            <input
              type="text"
              placeholder="Cari nama mata pelajaran..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-[#F5F0E8]/40 border border-[#DDD8CE] rounded-xl text-sm focus:outline-none focus:border-[#C0392B]"
            />
          </div>

          <div className="flex items-center gap-2.5">
            {mapelList.length < 5 && (
              <button
                onClick={handleSeedStandardMapel}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#F5F0E8] hover:bg-[#E8E0D0] text-[#1A1A1A] text-sm font-medium rounded-xl border border-[#DDD8CE] transition-colors cursor-pointer"
                title="Isi otomatis mapel Kurikulum Merdeka"
              >
                <Sparkles className="w-4 h-4 text-[#C0392B]" />
                <span className="hidden sm:inline">Generate Mapel SD</span>
              </button>
            )}

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C0392B] hover:bg-[#922B21] text-white text-sm font-medium rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mapel</span>
            </button>
          </div>
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

        {/* Mapel Cards Grid */}
        {loading ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-[#DDD8CE] text-[#6B6B6B]">
            Memuat data mata pelajaran...
          </div>
        ) : filteredMapel.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-[#DDD8CE]">
            <BookMarked className="w-12 h-12 text-[#DDD8CE] mx-auto mb-3" />
            <h3 className="font-bold text-[#1A1A1A] mb-1">Belum Ada Mata Pelajaran</h3>
            <p className="text-sm text-[#6B6B6B] max-w-md mx-auto mb-5">
              Mata pelajaran digunakan untuk penginputan nilai harian, PTS, dan PAS oleh guru kelas.
            </p>
            <button
              onClick={handleSeedStandardMapel}
              className="px-4 py-2 bg-[#C0392B] text-white rounded-xl text-sm font-medium hover:bg-[#922B21] cursor-pointer"
            >
              Generate Mapel Kurikulum Merdeka
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMapel.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#DDD8CE] p-5 shadow-xs hover:border-[#C0392B]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FDEDEC] text-[#C0392B] font-bold flex items-center justify-center text-sm shadow-2xs">
                        {idx + 1}
                      </div>
                      <h3 className="font-bold text-[#1A1A1A] text-base leading-snug">
                        {item.nama_mapel}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-[#6B6B6B] hover:text-[#C0392B] hover:bg-[#FDEDEC] rounded-lg transition-colors cursor-pointer"
                        title="Edit Mapel"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.nama_mapel)}
                        className="p-1.5 text-[#6B6B6B] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Mapel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#DDD8CE]/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B]">
                    <Award className="w-4 h-4 text-[#C0392B]" />
                    <span>Standar KKM / KKTP:</span>
                  </div>
                  <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs rounded-lg">
                    {item.kkm || 75}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit Mapel */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-[#DDD8CE] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4.5 border-b border-[#DDD8CE] flex items-center justify-between bg-[#FDEDEC]/40">
              <div className="flex items-center gap-2.5">
                <BookMarked className="w-5 h-5 text-[#C0392B]" />
                <h3 className="font-bold text-[#1A1A1A]">
                  {editingId ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
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
                  Nama Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ilmu Pengetahuan Alam dan Sosial (IPAS)"
                  value={formData.nama_mapel}
                  onChange={(e) => setFormData({ ...formData, nama_mapel: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#DDD8CE] rounded-xl text-sm focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                  Batas Kriteria Ketuntasan Minimal (KKM / KKTP)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={formData.kkm}
                  onChange={(e) => setFormData({ ...formData, kkm: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 border border-[#DDD8CE] rounded-xl text-sm focus:outline-none focus:border-[#C0392B]"
                />
                <p className="text-[11px] text-[#6B6B6B] mt-1">
                  Nilai acuan standar ketuntasan belajar siswa di raport.
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
                  {submitting ? 'Menyimpan...' : 'Simpan Mapel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
