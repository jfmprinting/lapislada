'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  GraduationCap,
  Sparkles,
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

function MateriContent() {
  const { showToast, confirm } = useNotification();
  const searchParams = useSearchParams();
  const queryRole = searchParams.get('role');

  const [materiList, setMateriList] = useState<MateriItem[]>([]);
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [mapelList, setMapelList] = useState<MapelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'guru' | 'orangtua' | 'kepala_sekolah'>('guru');
  const [linkedStudent, setLinkedStudent] = useState<any>(null);

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
  }, [queryRole]);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Get session & profile
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user ?? null;
      const uid = user?.id || null;
      setCurrentUserId(uid);

      let resolvedRole: 'admin' | 'guru' | 'orangtua' | 'kepala_sekolah' = 'guru';
      const meta = user?.user_metadata || {};
      const metaRole = meta.role;

      if (queryRole && ['admin', 'guru', 'orangtua', 'kepala_sekolah'].includes(queryRole)) {
        resolvedRole = queryRole as any;
      } else if (metaRole && ['admin', 'guru', 'orangtua', 'kepala_sekolah'].includes(metaRole)) {
        resolvedRole = metaRole;
      }

      if (uid) {
        const { data: profile } = await supabase.from('users_profile').select('role').eq('id', uid).maybeSingle();
        if (profile?.role) {
          if (!queryRole) resolvedRole = profile.role as any;
        }
      }

      // If user email indicates parent pattern or wali
      if (!queryRole && user?.email && user.email.includes('@sdnlatsari.sch.id')) {
        const extractedDigits = user.email.split('@')[0].replace(/[^0-9]/g, '');
        if (extractedDigits.length >= 8) {
          resolvedRole = 'orangtua';
        }
      }

      setCurrentUserRole(resolvedRole);

      // 2. Fetch kelas
      const { data: kData } = await supabase.from('kelas').select('id, nama_kelas').order('nama_kelas');
      setKelasList(kData || []);

      // 3. Fetch mapel
      const { data: mData } = await supabase.from('mapel').select('id, nama_mapel').order('nama_mapel');
      setMapelList(mData || []);

      // 4. If parent, link student to detect child's class
      if (user && (resolvedRole === 'orangtua' || queryRole === 'orangtua')) {
        let student: any = null;
        // Attempt A: by wali_murid_id
        const { data: byWali } = await supabase
          .from('siswa')
          .select('id, nama_lengkap, kelas_id, kelas:kelas_id(id, nama_kelas)')
          .eq('wali_murid_id', user.id)
          .maybeSingle();
        student = byWali;

        // Attempt B: by meta.siswa_id
        if (!student && meta.siswa_id) {
          const { data: byMeta } = await supabase
            .from('siswa')
            .select('id, nama_lengkap, kelas_id, kelas:kelas_id(id, nama_kelas)')
            .eq('id', meta.siswa_id)
            .maybeSingle();
          student = byMeta;
        }

        // Attempt C: by email digits (NISN)
        if (!student && user.email) {
          const digits = user.email.split('@')[0].replace(/[^0-9]/g, '');
          if (digits.length >= 8) {
            const { data: byNisn } = await supabase
              .from('siswa')
              .select('id, nama_lengkap, kelas_id, kelas:kelas_id(id, nama_kelas)')
              .eq('nisn', digits)
              .maybeSingle();
            student = byNisn;
          }
        }

        if (student) {
          setLinkedStudent(student);
          // Auto-select child's class filter initially if available
          if (student.kelas_id) {
            setFilterKelas(student.kelas_id);
          }
        }
      }

      // 5. Fetch materi from Supabase
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
        const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `materi-${Date.now()}`;
        const { data, error } = await supabase.from('materi').insert({ id: generatedId, ...payload }).select().single();
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

  const isOrangTua = currentUserRole === 'orangtua';
  const canEdit = (_item: MateriItem) => {
    // Both admin and guru have full CRUD access to materials
    return currentUserRole === 'admin' || currentUserRole === 'guru';
  };

  // Filtered list
  const filtered = materiList.filter((m) => {
    const matchKelas = !filterKelas || m.kelas_id === filterKelas || m.kelas_nama?.toLowerCase().includes(filterKelas.toLowerCase());
    const matchMapel = !filterMapel || m.mapel_id === filterMapel || m.mapel_nama?.toLowerCase().includes(filterMapel.toLowerCase());
    const matchSearch = !search || m.judul.toLowerCase().includes(search.toLowerCase()) || m.deskripsi?.toLowerCase().includes(search.toLowerCase());
    return matchKelas && matchMapel && matchSearch;
  });

  return (
    <AppShell
      role={currentUserRole}
      pageTitle="Materi Pelajaran"
      pageSubtitle={
        isOrangTua
          ? 'Akses dan unduh materi pembelajaran serta lembar latihan ananda via Google Drive'
          : 'Kelola link Google Drive materi belajar siswa (Zero Storage Server)'
      }
    >
      <div className="space-y-6">
        {/* Orang Tua Guidance Banner */}
        {isOrangTua && (
          <div className="bg-[#FAF8F2] rounded-2xl p-4 sm:p-5 border border-[#DDD8CE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#FDEDEC] text-[#922B21] shrink-0 mt-0.5">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">
                  Portal Materi &amp; Lembar Belajar Siswa
                </h3>
                <p className="text-xs text-[#6B6B6B] mt-0.5 leading-relaxed">
                  Bapak/Ibu wali murid dapat langsung mengunduh bahan ajar, rangkuman, dan modul latihan mandiri siswa dari Google Drive untuk pendampingan belajar di rumah.
                </p>
              </div>
            </div>
            {linkedStudent && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#DDD8CE] shrink-0 text-xs shadow-2xs">
                <GraduationCap className="w-3.5 h-3.5 text-[#922B21]" />
                <span className="text-[#6B6B6B]">Ananda:</span>
                <span className="font-bold text-[#1A1A1A]">{linkedStudent.nama_lengkap}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FDEDEC] text-[#922B21] font-bold border border-[#F1948A]">
                  {linkedStudent.kelas?.nama_kelas || 'Siswa'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Header Action Bar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#DDD8CE] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FDEDEC] text-[#922B21]">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">Materi &amp; Lembar Belajar Siswa</h2>
              <p className="text-xs text-[#6B6B6B]">
                {filtered.length} materi ditampilkan &middot; Terbuka untuk diunduh langsung dari Google Drive
              </p>
            </div>
          </div>

          {/* Add button: visible ONLY for guru & admin */}
          {!isOrangTua && currentUserRole !== 'kepala_sekolah' && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Materi</span>
            </button>
          )}
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
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas}
                  {linkedStudent?.kelas_id === k.id ? ' (Kelas Ananda)' : ''}
                </option>
              ))}
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
            <p className="text-xs text-[#999] mt-1">
              {isOrangTua
                ? 'Belum ada berkas untuk kelas atau mata pelajaran yang dipilih.'
                : 'Klik "Tambah Materi" untuk menambahkan berkas pertama.'}
            </p>
            {filterKelas && (
              <button
                type="button"
                onClick={() => setFilterKelas('')}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAF8F2] border border-[#DDD8CE] text-xs font-bold text-[#922B21] hover:bg-[#FDEDEC] transition cursor-pointer"
              >
                <span>Tampilkan Materi Semua Kelas</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-5 shadow-xs border border-[#DDD8CE] hover:border-[#C0392B]/40 transition flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F0E8] text-[#922B21] border border-[#DDD8CE] truncate max-w-[140px]">
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

      {/* Add / Edit Modal (Admin & Guru Only) */}
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

export default function MateriPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center text-xs text-[#6B6B6B]">Memuat Materi...</div>}>
      <MateriContent />
    </Suspense>
  );
}
