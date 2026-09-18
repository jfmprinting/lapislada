'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { supabase, GaleriKegiatan } from '@/lib/supabase';
import { INITIAL_GALERI, KATEGORI_GALERI_LIST } from '@/lib/galeriData';
import { useNotification } from '@/components/ui/NotificationContext';
import {
  Camera,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Search,
  ExternalLink,
  X,
  Sparkles,
  Save,
  CheckCircle2,
} from 'lucide-react';

export default function MasterGaleriPage() {
  const { showToast, confirm } = useNotification();
  const [items, setItems] = useState<GaleriKegiatan[]>(INITIAL_GALERI);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    judul: '',
    kategori: 'Pramuka & Ekskul',
    tanggal: new Date().toISOString().split('T')[0],
    foto_url: '',
    deskripsi: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchGaleri() {
      setLoading(true);
      try {
        const local = localStorage.getItem('lapislada_galeri_items');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setItems(parsed);
            }
          } catch (e) {
            // ignore
          }
        }

        const { data } = await supabase
          .from('galeri_kegiatan')
          .select('*')
          .order('tanggal', { ascending: false });

        if (data && data.length > 0) {
          setItems(data);
        }
      } catch (err) {
        console.warn('Using local fallback for galeri');
      } finally {
        setLoading(false);
      }
    }
    fetchGaleri();
  }, []);

  const saveToLocal = (newItems: GaleriKegiatan[]) => {
    setItems(newItems);
    try {
      localStorage.setItem('lapislada_galeri_items', JSON.stringify(newItems));
    } catch (e) {
      console.warn('Failed to save to localStorage');
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      judul: '',
      kategori: 'Pramuka & Ekskul',
      tanggal: new Date().toISOString().split('T')[0],
      foto_url: '/galeri-pramuka.jpg',
      deskripsi: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: GaleriKegiatan) => {
    setEditingId(item.id);
    setFormData({
      judul: item.judul,
      kategori: item.kategori,
      tanggal: item.tanggal,
      foto_url: item.foto_url,
      deskripsi: item.deskripsi || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul.trim()) {
      showToast({ type: 'error', message: 'Judul kegiatan wajib diisi!' });
      return;
    }
    if (!formData.foto_url.trim()) {
      showToast({ type: 'error', message: 'Tautan / URL foto kegiatan wajib diisi!' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Edit existing
        try {
          await supabase
            .from('galeri_kegiatan')
            .update({
              judul: formData.judul.trim(),
              kategori: formData.kategori,
              tanggal: formData.tanggal,
              foto_url: formData.foto_url.trim(),
              deskripsi: formData.deskripsi.trim() || null,
            })
            .eq('id', editingId);
        } catch (dbErr) {
          console.info('Database update fallback');
        }

        const updated = items.map((it) =>
          it.id === editingId ? { ...it, ...formData } : it
        );
        saveToLocal(updated);
        showToast({ type: 'success', message: 'Dokumentasi kegiatan berhasil diperbarui!' });
      } else {
        // Add new
        const newId = `g-${Date.now()}`;
        const newRecord: GaleriKegiatan = {
          id: newId,
          judul: formData.judul.trim(),
          kategori: formData.kategori,
          tanggal: formData.tanggal,
          foto_url: formData.foto_url.trim(),
          deskripsi: formData.deskripsi.trim() || null,
        };

        try {
          await supabase.from('galeri_kegiatan').insert([newRecord]);
        } catch (dbErr) {
          console.info('Database insert fallback');
        }

        saveToLocal([newRecord, ...items]);
        showToast({ type: 'success', message: 'Dokumentasi kegiatan baru berhasil ditambahkan!' });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Gagal menyimpan data.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, judul: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Dokumentasi Kegiatan',
      message: `Apakah Anda yakin ingin menghapus "${judul}" dari galeri kegiatan sekolah?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      isDanger: true,
    });
    if (!isConfirmed) return;

    try {
      try {
        await supabase.from('galeri_kegiatan').delete().eq('id', id);
      } catch (dbErr) {
        console.info('Database delete fallback');
      }

      const filtered = items.filter((it) => it.id !== id);
      saveToLocal(filtered);
      showToast({ type: 'success', message: `Dokumentasi "${judul}" berhasil dihapus.` });
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Gagal menghapus dokumentasi.' });
    }
  };

  const filteredItems = items.filter((item) => {
    const matchKategori =
      selectedKategori === 'Semua' || item.kategori === selectedKategori;
    const matchSearch =
      item.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.deskripsi || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchKategori && matchSearch;
  });

  return (
    <AppShell
      role="admin"
      pageTitle="Kelola Galeri Kegiatan Sekolah"
      pageSubtitle="Unggah dokumentasi foto kegiatan sekolah untuk ditampilkan di portal publik"
    >
      <div className="space-y-6">
        {/* Top Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DDD8CE] shadow-xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7A7A]" />
              <input
                type="text"
                placeholder="Cari dokumentasi kegiatan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#F5F0E8]/50 border border-[#DDD8CE] rounded-xl text-xs sm:text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="px-3 py-2 bg-[#F5F0E8]/70 border border-[#DDD8CE] rounded-xl text-xs font-bold text-[#1A1A1A]"
            >
              {KATEGORI_GALERI_LIST.map((k) => (
                <option key={k} value={k}>
                  {k === 'Semua' ? 'Semua Kategori' : k}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/galeri"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#DDD8CE] bg-white hover:bg-[#FAF8F2] text-xs font-bold text-[#1A1A1A] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#922B21]" />
              <span>Lihat Tampilan Publik</span>
            </a>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Foto Kegiatan</span>
            </button>
          </div>
        </div>

        {/* Gallery Cards Grid View */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-[#DDD8CE] overflow-hidden shadow-xs flex flex-col justify-between hover:border-[#922B21]/50 transition-colors group"
            >
              <div>
                <div className="relative aspect-video w-full overflow-hidden bg-[#FAF8F2]">
                  <img
                    src={item.foto_url}
                    alt={item.judul}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                      {item.kategori}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#7A7A7A]">
                    <Calendar className="w-3.5 h-3.5 text-[#922B21]" />
                    <span>{item.tanggal}</span>
                  </div>
                  <h3 className="font-bold text-sm text-[#1A1A1A] leading-snug line-clamp-2">
                    {item.judul}
                  </h3>
                  <p className="text-xs text-[#666] line-clamp-2">
                    {item.deskripsi || '-'}
                  </p>
                </div>
              </div>

              {/* Card Action Buttons */}
              <div className="px-4 py-3 bg-[#FAF8F2] border-t border-[#DDD8CE]/60 flex items-center justify-between">
                <span className="text-[11px] text-[#7A7A7A]">ID: {item.id}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 text-[#666] hover:text-[#922B21] hover:bg-white rounded-lg transition-colors cursor-pointer"
                    title="Edit Kegiatan"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.judul)}
                    className="p-1.5 text-[#666] hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    title="Hapus Kegiatan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Tambah/Edit Kegiatan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#DDD8CE] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDD8CE] bg-[#FAF8F2]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FDEDEC] text-[#922B21]">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#1A1A1A]">
                  {editingId ? 'Edit Dokumentasi Kegiatan' : 'Tambah Foto Kegiatan Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#666] hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3D3D3D] mb-1">
                  Judul Kegiatan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Contoh: Upacara Hari Kemerdekaan RI Ke-81"
                  className="w-full px-3.5 py-2 border border-[#DDD8CE] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] mb-1">
                    Kategori Kegiatan
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DDD8CE] rounded-xl text-xs text-[#1A1A1A]"
                  >
                    <option value="Upacara & Nasionalisme">Upacara & Nasionalisme</option>
                    <option value="Keagamaan & Karakter">Keagamaan & Karakter</option>
                    <option value="Pramuka & Ekskul">Pramuka & Ekskul</option>
                    <option value="Akademik & Literasi">Akademik & Literasi</option>
                    <option value="Karya & Seni">Karya & Seni</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] mb-1">
                    Tanggal Pelaksanaan
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DDD8CE] rounded-xl text-xs text-[#1A1A1A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3D3D3D] mb-1">
                  Tautan / Link URL Foto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.foto_url}
                  onChange={(e) => setFormData({ ...formData, foto_url: e.target.value })}
                  placeholder="Contoh: /galeri-pramuka.jpg atau tautan https://..."
                  className="w-full px-3.5 py-2 border border-[#DDD8CE] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                />
                <span className="text-[10px] text-[#7A7A7A] mt-1 block">
                  Foto lokal bawaan tersedia: <code>/hero-upacara.jpg</code>, <code>/galeri-pramuka.jpg</code>, <code>/galeri-keagamaan.jpg</code>, <code>/galeri-literasi.jpg</code>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3D3D3D] mb-1">
                  Deskripsi / Keterangan Dokumentasi
                </label>
                <textarea
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Jelaskan secara singkat suasana dan tujuan kegiatan..."
                  className="w-full px-3.5 py-2 border border-[#DDD8CE] rounded-xl text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#DDD8CE] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DDD8CE] text-xs font-semibold text-[#666] hover:bg-[#FAF8F2] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Dokumentasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
