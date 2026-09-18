'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useNotification } from '@/components/ui/NotificationContext';
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  FlaskConical,
  BookCheck,
  RotateCcw,
  Save,
  X,
} from 'lucide-react';

interface JenisAsesmen {
  id: string;
  nama: string;
  kategori: 'Formatif' | 'Sumatif';
  kode?: string;
  aktif: boolean;
  urutan: number;
}

const STORAGE_KEY = 'lapislada_jenis_asesmen';

const DEFAULT_LIST: JenisAsesmen[] = [
  { id: 'ja-1', nama: 'Formatif (Tujuan Pembelajaran 1)', kategori: 'Formatif', kode: 'FTP1', aktif: true, urutan: 1 },
  { id: 'ja-2', nama: 'Formatif (Tujuan Pembelajaran 2)', kategori: 'Formatif', kode: 'FTP2', aktif: true, urutan: 2 },
  { id: 'ja-3', nama: 'Sumatif Lingkup Materi (Bab 1)', kategori: 'Sumatif', kode: 'SLM1', aktif: true, urutan: 3 },
  { id: 'ja-4', nama: 'Sumatif Lingkup Materi (Bab 2)', kategori: 'Sumatif', kode: 'SLM2', aktif: true, urutan: 4 },
  { id: 'ja-5', nama: 'Sumatif Tengah Semester (STS / UTS)', kategori: 'Sumatif', kode: 'STS', aktif: true, urutan: 5 },
  { id: 'ja-6', nama: 'Sumatif Akhir Semester (SAS / PAS)', kategori: 'Sumatif', kode: 'SAS', aktif: true, urutan: 6 },
];

type ModalMode = 'add' | 'edit';

interface FormState {
  nama: string;
  kategori: 'Formatif' | 'Sumatif';
  kode: string;
  aktif: boolean;
}

const EMPTY_FORM: FormState = { nama: '', kategori: 'Formatif', kode: '', aktif: true };

export default function JenisAsesmenPage() {
  const { showToast, confirm } = useNotification();
  const [list, setList] = useState<JenisAsesmen[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try { setList(JSON.parse(stored)); } catch { setList(DEFAULT_LIST); }
      } else {
        setList(DEFAULT_LIST);
      }
    }
    setLoading(false);
  }, []);

  const persist = (updated: JenisAsesmen[]) => {
    const sorted = [...updated].sort((a, b) => a.urutan - b.urutan);
    setList(sorted);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    }
  };

  const openAddModal = () => { setForm(EMPTY_FORM); setEditingId(null); setModalMode('add'); setModalOpen(true); };
  const openEditModal = (item: JenisAsesmen) => {
    setForm({ nama: item.nama, kategori: item.kategori, kode: item.kode || '', aktif: item.aktif });
    setEditingId(item.id); setModalMode('edit'); setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.nama.trim()) { showToast({ type: 'error', message: 'Nama Jenis Asesmen tidak boleh kosong.' }); return; }
    setSaving(true);
    try {
      if (modalMode === 'add') {
        const newItem: JenisAsesmen = { id: `ja-${Date.now()}`, nama: form.nama.trim(), kategori: form.kategori, kode: form.kode.trim() || undefined, aktif: form.aktif, urutan: list.length + 1 };
        persist([...list, newItem]);
        showToast({ type: 'success', title: 'Berhasil Ditambahkan', message: `"${newItem.nama}" ditambahkan.` });
      } else if (editingId) {
        const updated = list.map((j) => j.id === editingId ? { ...j, nama: form.nama.trim(), kategori: form.kategori, kode: form.kode.trim() || undefined, aktif: form.aktif } : j);
        persist(updated);
        showToast({ type: 'success', title: 'Berhasil Diperbarui', message: 'Jenis asesmen diperbarui.' });
      }
      closeModal();
    } finally { setSaving(false); }
  };

  const handleToggleAktif = (id: string) => {
    const updated = list.map((j) => (j.id === id ? { ...j, aktif: !j.aktif } : j));
    persist(updated);
    const item = updated.find((j) => j.id === id);
    showToast({ type: 'info', message: item?.aktif ? `"${item.nama}" diaktifkan.` : `"${item?.nama}" dinonaktifkan.` });
  };

  const handleDelete = async (item: JenisAsesmen) => {
    const confirmed = await confirm({ title: 'Hapus Jenis Asesmen?', message: `"${item.nama}" akan dihapus. Data nilai yang sudah tersimpan tidak terpengaruh.`, confirmText: 'Hapus', cancelText: 'Batal', isDanger: true });
    if (!confirmed) return;
    const updated = list.filter((j) => j.id !== item.id).map((j, i) => ({ ...j, urutan: i + 1 }));
    persist(updated);
    showToast({ type: 'success', message: `"${item.nama}" berhasil dihapus.` });
  };

  const handleReset = async () => {
    const confirmed = await confirm({ title: 'Reset ke Pengaturan Awal?', message: 'Seluruh kustomisasi akan dihapus dan diganti daftar bawaan sistem.', confirmText: 'Ya, Reset', cancelText: 'Batal', isDanger: true });
    if (!confirmed) return;
    persist(DEFAULT_LIST);
    showToast({ type: 'success', message: 'Berhasil direset ke pengaturan awal.' });
  };

  const formatifItems = list.filter((j) => j.kategori === 'Formatif');
  const sumatifItems = list.filter((j) => j.kategori === 'Sumatif');
  const activeCount = list.filter((j) => j.aktif).length;

  const ItemRow = ({ item }: { item: JenisAsesmen }) => (
    <li className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#FAF8F2]/50 transition group">
      <GripVertical className="w-4 h-4 text-[#CCC] shrink-0" />
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-bold leading-snug ${item.aktif ? 'text-[#1A1A1A]' : 'text-[#999] line-through'}`}>
          {item.nama}
        </div>
        {item.kode && <span className="text-[10px] text-[#999] font-mono">{item.kode}</span>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={() => handleToggleAktif(item.id)} title={item.aktif ? 'Nonaktifkan' : 'Aktifkan'}
          className={`p-1.5 rounded-lg transition cursor-pointer ${item.aktif ? 'text-emerald-600 hover:bg-emerald-50' : 'text-[#BBB] hover:bg-[#F5F0E8]'}`}>
          {item.aktif ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
        </button>
        <button onClick={() => openEditModal(item)} className="p-1.5 rounded-lg text-[#666] hover:text-[#922B21] hover:bg-[#FDEDEC] transition cursor-pointer" title="Edit">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => handleDelete(item)} className="p-1.5 rounded-lg text-[#666] hover:text-red-600 hover:bg-red-50 transition cursor-pointer" title="Hapus">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );

  return (
    <AppShell role="admin" pageTitle="Master Jenis Asesmen" pageSubtitle="Kelola jenis penilaian yang tersedia untuk guru saat menginput nilai siswa">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#DDD8CE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FDEDEC] text-[#922B21]"><ClipboardList className="w-6 h-6" /></div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">Jenis Asesmen / Ujian</h2>
              <p className="text-xs text-[#6B6B6B]">{list.length} jenis tersimpan &middot; {activeCount} aktif</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleReset} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#666] hover:text-[#922B21] border border-[#DDD8CE] hover:border-[#922B21]/40 bg-white transition cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5" /><span>Reset Default</span>
            </button>
            <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer">
              <Plus className="w-4 h-4" /><span>Tambah Jenis Asesmen</span>
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
          <BookCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <p>Daftar ini tampil sebagai pilihan dropdown <strong>&ldquo;Jenis Asesmen / Ujian&rdquo;</strong> pada halaman Input Nilai. Nonaktifkan jenis yang tidak digunakan agar tidak membingungkan guru. Data disimpan di browser (localStorage).</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-sm text-[#666] border border-[#DDD8CE]">Memuat data...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Formatif */}
            <div className="bg-white rounded-2xl border border-[#DDD8CE] shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#DDD8CE] flex items-center gap-2.5 bg-blue-50">
                <FlaskConical className="w-4 h-4 text-blue-700" />
                <h3 className="font-bold text-sm text-blue-800">Asesmen Formatif</h3>
                <span className="ml-auto text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">{formatifItems.length} jenis</span>
              </div>
              <ul className="divide-y divide-[#DDD8CE]/60">
                {formatifItems.length === 0 && <li className="px-5 py-6 text-xs text-center text-[#999]">Belum ada jenis asesmen formatif.</li>}
                {formatifItems.map((item) => <ItemRow key={item.id} item={item} />)}
              </ul>
            </div>

            {/* Sumatif */}
            <div className="bg-white rounded-2xl border border-[#DDD8CE] shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#DDD8CE] flex items-center gap-2.5 bg-amber-50">
                <BookCheck className="w-4 h-4 text-amber-700" />
                <h3 className="font-bold text-sm text-amber-800">Asesmen Sumatif</h3>
                <span className="ml-auto text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{sumatifItems.length} jenis</span>
              </div>
              <ul className="divide-y divide-[#DDD8CE]/60">
                {sumatifItems.length === 0 && <li className="px-5 py-6 text-xs text-center text-[#999]">Belum ada jenis asesmen sumatif.</li>}
                {sumatifItems.map((item) => <ItemRow key={item.id} item={item} />)}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#DDD8CE] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDD8CE]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FDEDEC] text-[#922B21]"><ClipboardList className="w-4 h-4" /></div>
                <h3 className="font-serif font-bold text-base text-[#1A1A1A]">{modalMode === 'add' ? 'Tambah' : 'Edit'} Jenis Asesmen</h3>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl text-[#666] hover:bg-[#F5F0E8] transition cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5">Nama Jenis Asesmen <span className="text-[#922B21]">*</span></label>
                <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Contoh: Formatif (Tujuan Pembelajaran 3)" className="w-full px-3 py-2.5 rounded-xl border border-[#DDD8CE] bg-[#FAF8F2] text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5">Kategori Asesmen</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Formatif', 'Sumatif'] as const).map((kat) => (
                    <button key={kat} type="button" onClick={() => setForm({ ...form, kategori: kat })}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        form.kategori === kat
                          ? kat === 'Formatif' ? 'bg-blue-600 text-white border-blue-600' : 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-[#666] border-[#DDD8CE]'
                      }`}>
                      {kat === 'Formatif' ? <FlaskConical className="w-3.5 h-3.5" /> : <BookCheck className="w-3.5 h-3.5" />}
                      {kat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5">Kode Singkat <span className="text-[#999] font-normal">(opsional)</span></label>
                <input type="text" value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value.toUpperCase() })} placeholder="FTP3, SAS, UTS" maxLength={8} className="w-full px-3 py-2.5 rounded-xl border border-[#DDD8CE] bg-[#FAF8F2] text-sm font-mono text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F2] border border-[#DDD8CE]">
                <div>
                  <p className="text-xs font-bold text-[#1A1A1A]">Status Aktif</p>
                  <p className="text-[11px] text-[#666]">Nonaktif tidak tampil di dropdown guru</p>
                </div>
                <button type="button" onClick={() => setForm({ ...form, aktif: !form.aktif })}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.aktif ? 'bg-emerald-500' : 'bg-[#CCC]'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${form.aktif ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#DDD8CE] bg-[#FAF8F2] rounded-b-2xl">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl text-xs font-bold text-[#666] border border-[#DDD8CE] hover:bg-white transition cursor-pointer">Batal</button>
              <button onClick={handleSave} disabled={saving || !form.nama.trim()} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50">
                <Save className="w-3.5 h-3.5" />{saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
