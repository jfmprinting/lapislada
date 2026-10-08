'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { Bell, Plus, Calendar, Pin, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/components/ui/NotificationContext';

interface Pengumuman {
  id: string;
  judul: string;
  konten: string;
  tanggal: string;
  isPinned?: boolean;
  kategori: string;
}

const INITIAL_ANNOUNCEMENTS: Pengumuman[] = [
  {
    id: 'p-1',
    judul: 'Pelaksanaan Asesmen Sumatif Tengah Semester (ASTS) Ganjil 2026',
    konten: 'Diberitahukan kepada seluruh wali murid kelas 1-6 bahwa Asesmen Sumatif Tengah Semester (ASTS) akan diselenggarakan mulai Senin, 22 September 2026. Jadwal mata pelajaran dan kisi-kisi dapat diakses melalui menu Materi.',
    tanggal: '16 September 2026',
    isPinned: true,
    kategori: 'Akademik',
  },
  {
    id: 'p-2',
    judul: 'Kegiatan Kerja Bakti Lingkungan Sekolah Bersama Komite',
    konten: 'Dalam rangka mewujudkan sekolah adiwiyata yang asri dan sehat, kami mengundang bapak/ibu wali murid untuk berpartisipasi dalam kerja bakti hari Sabtu pukul 07.00 WIB.',
    tanggal: '12 September 2026',
    isPinned: false,
    kategori: 'Kegiatan',
  },
  {
    id: 'p-3',
    judul: 'Libur Nasional Maulid Nabi Muhammad SAW 1448 H',
    konten: 'Kegiatan belajar mengajar ditiadakan pada hari Senin, 14 September 2026 dalam rangka peringatan Maulid Nabi. Siswa diharapkan belajar mandiri di rumah.',
    tanggal: '10 September 2026',
    isPinned: false,
    kategori: 'Libur',
  },
];

function PengumumanContent() {
  const { showToast, confirm } = useNotification();
  const searchParams = useSearchParams();
  const queryRole = searchParams.get('role');
  const [role, setRole] = useState<'guru' | 'admin' | 'orangtua'>('guru');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [announcements, setAnnouncements] = useState<Pengumuman[]>(INITIAL_ANNOUNCEMENTS);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formJudul, setFormJudul] = useState('');
  const [formKonten, setFormKonten] = useState('');
  const [formKategori, setFormKategori] = useState('Akademik');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      if (user) setCurrentUserId(user.id);
      const detectedRole =
        (queryRole as 'guru' | 'admin' | 'orangtua') ||
        (user?.user_metadata?.role as 'guru' | 'admin' | 'orangtua') ||
        'guru';
      setRole(detectedRole);
    });
  }, [queryRole]);

  useEffect(() => {
    async function fetchPengumuman() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('pengumuman')
          .select('*')
          .order('created_at', { ascending: false });

        if (data && data.length > 0 && !error) {
          const mapped: Pengumuman[] = data.map((d: any) => ({
            id: d.id,
            judul: d.judul,
            konten: d.konten,
            tanggal: new Date(d.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
            isPinned: false,
            kategori: 'Umum',
          }));
          setAnnouncements(mapped);
        }
      } catch (err) {
        console.warn('Fallback to initial announcements:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPengumuman();
  }, []);

  const isOrangTua = role === 'orangtua';

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim() || !formKonten.trim()) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('pengumuman')
        .insert([
          {
            judul: formJudul.trim(),
            konten: formKonten.trim(),
            target_role: 'semua',
            created_by: currentUserId || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const newP: Pengumuman = {
        id: data.id,
        judul: data.judul,
        konten: data.konten,
        tanggal: 'Hari ini',
        isPinned: false,
        kategori: formKategori,
      };

      setAnnouncements((prev) => [newP, ...prev.filter((p) => !p.id.startsWith('p-'))]);
      setFormJudul('');
      setFormKonten('');
      setShowModal(false);
      showToast({
        type: 'success',
        title: 'Pengumuman Diterbitkan',
        message: 'Pengumuman baru berhasil disimpan ke database cloud dan tampil ke seluruh wali murid & staf!',
      });
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Gagal menerbitkan pengumuman.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, judul: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Pengumuman?',
      message: `Apakah Anda yakin ingin menghapus pengumuman "${judul}"?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      isDanger: true,
    });
    if (!isConfirmed) return;

    try {
      if (!id.startsWith('p-')) {
        await supabase.from('pengumuman').delete().eq('id', id);
      }
      setAnnouncements((prev) => prev.filter((p) => p.id !== id));
      showToast({ type: 'success', message: 'Pengumuman berhasil dihapus.' });
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Gagal menghapus pengumuman.' });
    }
  };

  return (
    <AppShell
      role={role}
      pageTitle={isOrangTua ? 'Pengumuman Sekolah' : 'Pengumuman Sekolah & Kelas'}
      pageSubtitle={
        isOrangTua
          ? 'Informasi resmi dari pihak sekolah dan wali kelas untuk wali murid'
          : 'Papan informasi resmi sekolah tanpa tenggelam di WA grup'
      }
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#DDD8CE] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FDEDEC] text-[#922B21]">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">
                Papan Informasi Resmi
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Total {announcements.length} Pengumuman Aktif
              </p>
            </div>
          </div>

          {!isOrangTua && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Pengumuman Baru</span>
            </button>
          )}
        </div>

        {/* ANNOUNCEMENT CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-2xl p-5 shadow-xs border transition flex flex-col justify-between ${
                p.isPinned ? 'border-[#C0392B]/50 ring-1 ring-[#C0392B]/20' : 'border-[#DDD8CE]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F0E8] text-[#922B21] border border-[#DDD8CE]">
                      {p.kategori}
                    </span>
                    {p.isPinned && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#C0392B]">
                        <Pin className="w-3 h-3" />
                        Disematkan
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#6B6B6B] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {p.tanggal}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-base text-[#1A1A1A] mb-2 leading-snug">
                  {p.judul}
                </h3>
                <p className="text-xs text-[#3D3D3D] leading-relaxed whitespace-pre-wrap">
                  {p.konten}
                </p>
              </div>

              {!isOrangTua && (
                <div className="pt-3 mt-3 border-t border-[#F5F0E8] flex justify-end">
                  <button
                    onClick={() => handleDelete(p.id, p.judul)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#999] hover:text-red-600 transition cursor-pointer"
                    title="Hapus pengumuman ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* MODAL BUAT PENGUMUMAN */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-[#DDD8CE] animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8E0D0]">
                <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                  Buat Pengumuman Baru
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-sm font-bold text-[#6B6B6B] hover:text-black p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#3D3D3D] mb-1">
                    Kategori
                  </label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A]"
                  >
                    <option value="Akademik">Akademik</option>
                    <option value="Kegiatan">Kegiatan Sekolah</option>
                    <option value="Libur">Libur & Jadwal</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#3D3D3D] mb-1">
                    Judul Pengumuman *
                  </label>
                  <input
                    type="text"
                    required
                    value={formJudul}
                    onChange={(e) => setFormJudul(e.target.value)}
                    placeholder="Misal: Pelaksanaan Ujian Semester"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#3D3D3D] mb-1">
                    Isi Pengumuman *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formKonten}
                    onChange={(e) => setFormKonten(e.target.value)}
                    placeholder="Tuliskan detail pengumuman secara jelas..."
                    className="w-full p-3 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#DDD8CE] text-[#6B6B6B] hover:bg-[#F5F0E8] font-semibold"
                  >
                    Batalkan
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white font-bold shadow active:scale-95 cursor-pointer"
                  >
                    Publikasikan →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function PengumumanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center text-xs text-[#6B6B6B]">Memuat Pengumuman...</div>}>
      <PengumumanContent />
    </Suspense>
  );
}
