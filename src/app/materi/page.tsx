'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useNotification } from '@/components/ui/NotificationContext';
import { supabase } from '@/lib/supabase';
import {
  FolderOpen,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Search,
  BookOpen,
  Layers,
  Link2,
  FileText,
} from 'lucide-react';

interface MateriItem {
  id: string;
  judul: string;
  deskripsi?: string;
  kelas_id?: string;
  mapel_id?: string;
  link_gdrive: string;
  created_by?: string;
  created_at?: string;
  // UI-only
  kelas_nama?: string;
  mapel_nama?: string;
}

interface KelasOption { id: string; nama_kelas: string; }
interface MapelOption { id: string; nama_mapel: string; }

type ModalMode = 'add' | 'edit';
interface FormState {
  judul: string;
  deskripsi: string;
  kelas_id: string;
  mapel_id: string;
  link_gdrive: string;
}
const EMPTY_FORM: FormState = { judul: '', deskripsi: '', kelas_id: '', mapel_id: '', link_gdrive: '' };

const SAMPLE_MATERI: MateriItem[] = [
  { id: 's-m1', judul: 'Modul Ajar Matematika: Operasi Pecahan Campuran', deskripsi: 'Panduan belajar mandiri siswa dilengkapi soal latihan dan pembahasan.', link_gdrive: 'https://drive.google.com/file/d/demo-materi-mtk/view', kelas_nama: 'Kelas 4A', mapel_nama: 'Matematika' },
  { id: 's-m2', judul: 'Bahan Tayang IPAS: Rantai Makanan & Jaring-Jaring Kehidupan', deskripsi: 'Slide presentasi bergambar untuk dipelajari sebelum kuis.', link_gdrive: 'https://drive.google.com/file/d/demo-materi-ipa/view', kelas_nama: 'Kelas 4A', mapel_nama: 'IPAS' },
  { id: 's-m3', judul: 'LKS Bahasa Indonesia: Menulis Puisi Bertema Alam', deskripsi: 'Format latihan tugas menulis puisi bertema alam sekitar.', link_gdrive: 'https://drive.google.com/file/d/demo-materi-bind/view', kelas_nama: 'Kelas 4A', mapel_nama: 'Bahasa Indonesia' },
];

export default function MateriPage() {
  const { showToast, confirm } = useNotification();

  const [materiList, setMateriList] = useState<MateriItem[]>([]);
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [mapelList, setMapelList] = useState<MapelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('guru');

  // Filter state
  const [filterKelas, setFilterKelas] = useState('');
  const [filterMapel, setFilterMapel] = useState('');
  const [search, setSearch] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Get session
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id || null;
      setCurrentUserId(uid);

      // Fetch user role
      if (uid) {
        const { data: profile } = await supabase.from('users_profile').select('role').eq('id', uid).single();
        if (profile?.role) setCurrentUserRole(profile.role);
      }

      // Fetch kelas
      const { data: kData } = await supabase.from('kelas').select('id, nama_kelas').order('nama_kelas');
      setKelasList(kData || []);

      // Fetch mapel
      const { data: mData } = await supabase.from('mapel').select('id, nama_mapel').order('nama_mapel');
      setMapelList(mData || []);

      // Fetch materi from Supabase
      const { data: matData } = await supabase.from('materi').select('*').order('created_at', { ascending: false });
      if (matData && matData.length > 0) {
        // Enrich with kelas and mapel names
        const enriched = matData.map((m: any) => ({
          ...m,
          kelas_nama: kData?.find((k) => k.id === m.kelas_id)?.nama_kelas || '',
          mapel_nama: mData?.find((mp) => mp.id === m.mapel_id)?.nama_mapel || '',
        }));
        setMateriList(enriched);
      } else {
        setMateriList(SAMPLE_MATERI);
      }
    } catch (err) {
      console.warn('Error loading materi:', err);
      setMateriList(SAMPLE_MATERI);
    } finally {
      setLoading(false);
    }
  }

  const openAddModal = () => { setForm(EMPTY_FORM); setEditingId(null); setModalMode('add'); setModalOpen(true); };
  const openEditModal = (item: MateriItem) => {
    setForm({ judul: item.judul, deskripsi: item.deskripsi || '', kelas_id: item.kelas_id || '', mapel_id: item.mapel_id || '', link_gdrive: item.link_gdrive });
    setEditingId(item.id); setModalMode('edit'); setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.judul.trim()) { showToast({ type: 'error', message: 'Judul materi tidak boleh kosong.' }); return; }
    if (!form.link_gdrive.trim()) { showToast({ type: 'error', message: 'Link Google Drive wajib diisi.' }); return; }
    setSaving(true);
    try {
      const payload = {
        judul: form.judul.trim(),
        deskripsi: form.deskripsi.trim() || null,
        kelas_id: form.kelas_id || null,
        mapel_id: form.mapel_id || null,
        link_gdrive: form.link_gdrive.trim(),
        created_by: currentUserId || null,
      };

      if (modalMode === 'add') {
        const { data, error } = await supabase.from('materi').insert(payload).select().single();
        if (error) throw error;
        const newItem: MateriItem = {
          ...data,
          kelas_nama: kelasList.find((k) => k.id === data.kelas_id)?.nama_kelas || '',
          mapel_nama: mapelList.find((m) => m.id === data.mapel_id)?.nama_mapel || '',
        };
        setMateriList((prev) => [newItem, ...prev.filter((m) => !m.id.startsWith('s-'))]);
        showToast({ type: 'success', title: 'Materi Ditambahkan', message: `"${newItem.judul}" berhasil disimpan.` });
      } else if (editingId && !editingId.startsWith('s-')) {
        const { data, error } = await supabase.from('materi').update(payload).eq('id', editingId).select().single();
        if (error) throw error;
        setMateriList((prev) => prev.map((m) => m.id === editingId ? {
          ...data,
          kelas_nama: kelasList.find((k) => k.id === data.kelas_id)?.nama_kelas || '',
          mapel_nama: mapelList.find((mp) => mp.id === data.mapel_id)?.nama_mapel || '',
        } : m));
        showToast({ type: 'success', title: 'Materi Diperbarui', message: 'Data materi berhasil diperbarui.' });
      } else {
        // Sample data / offline edit
        setMateriList((prev) => prev.map((m) => m.id === editingId ? {
          ...m, judul: form.judul, deskripsi: form.deskripsi, link_gdrive: form.link_gdrive,
          kelas_nama: kelasList.find((k) => k.id === form.kelas_id)?.nama_kelas || m.kelas_nama,
          mapel_nama: mapelList.find((mp) => mp.id === form.mapel_id)?.nama_mapel || m.mapel_nama,
        } : m));
        showToast({ type: 'success', message: 'Materi diperbarui.' });
      }
      closeModal();
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Gagal menyimpan materi.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: MateriItem) => {
    const confirmed = await confirm({
      title: 'Hapus Materi?',
      message: `"${item.judul}" akan dihapus secara permanen.`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      isDanger: true,
    });
    if (!confirmed) return;
    try {
      if (!item.id.startsWith('s-')) {
        const { error } = await supabase.from('materi').delete().eq('id', item.id);
        if (error) throw error;
      }
      setMateriList((prev) => prev.filter((m) => m.id !== item.id));
      showToast({ type: 'success', message: `"${item.judul}" berhasil dihapus.` });
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Gagal menghapus materi.' });
    }
  };

  const canEdit = (item: MateriItem) => {
    if (currentUserRole === 'admin') return true;
    if (!item.created_by) return item.id.startsWith('s-') ? false : true; // sample data is not editable
    return item.created_by === currentUserId;
  };

  // Filtered list
  const filtered = materiList.filter((m) => {
    const matchKelas = !filterKelas || m.kelas_id === filterKelas || m.kelas_nama?.toLowerCase().includes(filterKelas.toLowerCase());
    const matchMapel = !filterMapel || m.mapel_id === filterMapel || m.mapel_nama?.toLowerCase().includes(filterMapel.toLowerCase());
    const matchSearch = !search || m.judul.toLowerCase().includes(search.toLowerCase()) || m.deskripsi?.toLowerCase().includes(search.toLowerCase());
    return matchKelas && matchMapel && matchSearch;
  });

  return (
    <AppShell role="guru" pageTitle="Materi Pelajaran" pageSubtitle="Kelola link Google Drive materi belajar siswa (Zero Storage Server)">
      <div className="space-y-6">
        {/* Header Action Bar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#DDD8CE] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FDEDEC] text-[#922B21]">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">Materi &amp; Lembar Belajar Siswa</h2>
              <p className="text-xs text-[#6B6B6B]">{filtered.length} materi &middot; Wali murid dapat mengunduh langsung dari Google Drive</p>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Materi</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl px-5 py-4 border border-[#DDD8CE] shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#999]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul atau deskripsi..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DDD8CE] bg-[#FAF8F2] text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
              />
            </div>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#DDD8CE] bg-[#FAF8F2] text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
            >
              <option value="">Semua Kelas</option>
              {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
            </select>
            <select
              value={filterMapel}
              onChange={(e) => setFilterMapel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#DDD8CE] bg-[#FAF8F2] text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
            >
              <option value="">Semua Mata Pelajaran</option>
              {mapelList.map((m) => <option key={m.id} value={m.id}>{m.nama_mapel}</option>)}
            </select>
          </div>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-sm text-[#666] border border-[#DDD8CE]">Memuat materi...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#DDD8CE]">
            <FolderOpen className="w-10 h-10 mx-auto text-[#DDD8CE] mb-3" />
            <p className="text-sm font-bold text-[#666]">Belum ada materi</p>
            <p className="text-xs text-[#999] mt-1">Klik &ldquo;Tambah Materi&rdquo; untuk menambahkan yang pertama.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-5 shadow-xs border border-[#DDD8CE] hover:border-[#C0392B]/40 transition flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F0E8] text-[#922B21] border border-[#DDD8CE] truncate max-w-[120px]">
                      {item.mapel_nama || 'Umum'}
                    </span>
                    <span className="text-[11px] text-[#6B6B6B] font-medium shrink-0">
                      {item.kelas_nama || 'Semua Kelas'}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#1A1A1A] mb-2 leading-snug line-clamp-2">{item.judul}</h3>
                  {item.deskripsi && (
                    <p className="text-xs text-[#6B6B6B] mb-3 leading-relaxed line-clamp-2">{item.deskripsi}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#F5F0E8] flex items-center justify-between gap-2">
                  <a
                    href={item.link_gdrive}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold shadow-xs transition active:scale-95 flex-1 justify-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka di Google Drive</span>
                  </a>
                  {canEdit(item) && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-2 rounded-xl text-[#666] hover:text-[#922B21] hover:bg-[#FDEDEC] transition cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2 rounded-xl text-[#666] hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#DDD8CE] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDD8CE]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FDEDEC] text-[#922B21]"><FolderOpen className="w-4 h-4" /></div>
                <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                  {modalMode === 'add' ? 'Tambah Materi Baru' : 'Edit Materi'}
                </h3>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl text-[#666] hover:bg-[#F5F0E8] transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Judul */}
              <div>
                <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#922B21]" />
                  Judul Materi <span className="text-[#922B21]">*</span>
                </label>
                <input
                  type="text"
                  value={form.judul}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  placeholder="Contoh: Modul Ajar Matematika: Bilangan Desimal"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#DDD8CE] bg-[#FAF8F2] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                />
              </div>

              {/* Kelas & Mapel */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#922B21]" />
                    Kelas Tujuan
                  </label>
                  <select
                    value={form.kelas_id}
                    onChange={(e) => setForm({ ...form, kelas_id: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#DDD8CE] bg-[#FAF8F2] text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                  >
                    <option value="">Semua Kelas</option>
                    {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#922B21]" />
                    Mata Pelajaran
                  </label>
                  <select
                    value={form.mapel_id}
                    onChange={(e) => setForm({ ...form, mapel_id: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#DDD8CE] bg-[#FAF8F2] text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                  >
                    <option value="">Pilih Mapel</option>
                    {mapelList.map((m) => <option key={m.id} value={m.id}>{m.nama_mapel}</option>)}
                  </select>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5">
                  Deskripsi <span className="text-[#999] font-normal">(opsional)</span>
                </label>
                <textarea
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  placeholder="Penjelasan singkat tentang isi materi..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#DDD8CE] bg-[#FAF8F2] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21] resize-none"
                />
              </div>

              {/* Link GDrive */}
              <div>
                <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-[#922B21]" />
                  Link Google Drive <span className="text-[#922B21]">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.link_gdrive}
                    onChange={(e) => setForm({ ...form, link_gdrive: e.target.value })}
                    placeholder="https://drive.google.com/file/d/.../view"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-[#DDD8CE] bg-[#FAF8F2] text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                  />
                  {form.link_gdrive && (
                    <a
                      href={form.link_gdrive}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2.5 rounded-xl border border-[#DDD8CE] text-[#666] hover:text-[#922B21] hover:border-[#922B21]/30 transition flex items-center"
                      title="Cek link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-[#999] mt-1">Pastikan link dapat diakses publik atau oleh siapa saja yang memiliki link.</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#DDD8CE] bg-[#FAF8F2] rounded-b-2xl">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl text-xs font-bold text-[#666] border border-[#DDD8CE] hover:bg-white transition cursor-pointer">Batal</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.judul.trim() || !form.link_gdrive.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Menyimpan...' : 'Simpan Materi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}


