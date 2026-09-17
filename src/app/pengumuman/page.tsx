'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { ArrowLeft, Bell, Plus, Calendar, Pin } from 'lucide-react';

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

export default function PengumumanPage() {
  const [announcements, setAnnouncements] = useState<Pengumuman[]>(INITIAL_ANNOUNCEMENTS);
  const [showModal, setShowModal] = useState(false);
  const [formJudul, setFormJudul] = useState('');
  const [formKonten, setFormKonten] = useState('');
  const [formKategori, setFormKategori] = useState('Akademik');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim() || !formKonten.trim()) return;

    const newP: Pengumuman = {
      id: `p-${Date.now()}`,
      judul: formJudul.trim(),
      konten: formKonten.trim(),
      tanggal: 'Hari ini',
      isPinned: false,
      kategori: formKategori,
    };

    setAnnouncements([newP, ...announcements]);
    setFormJudul('');
    setFormKonten('');
    setShowModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8] pb-24 text-[#1A1A1A]">
      <Navbar schoolName="Pengumuman Sekolah" />

      <main className="w-full max-w-md mx-auto sm:max-w-xl md:max-w-2xl px-4 py-4 flex-1">
        <div className="flex items-center justify-between gap-2 mb-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#6B6B6B] hover:text-[#922B21]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C0392B] hover:bg-[#a93226] text-white text-xs font-bold shadow transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Pengumuman</span>
          </button>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#DDD8CE] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#FDEDEC] text-[#922B21]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-base text-[#1A1A1A]">
                Papan Informasi Sekolah
              </h1>
              <p className="text-[11px] text-[#6B6B6B]">
                Pengumuman resmi dari sekolah & wali kelas (tidak tenggelam di grup WA)
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {announcements.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-xl p-4 shadow-sm border transition ${
                p.isPinned ? 'border-[#C0392B]/50 ring-1 ring-[#C0392B]/20' : 'border-[#DDD8CE]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F5F0E8] text-[#922B21] border border-[#DDD8CE]">
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
                  <Calendar className="w-3 h-3" />
                  {p.tanggal}
                </span>
              </div>

              <h3 className="font-serif font-bold text-sm text-[#1A1A1A] mb-1.5">
                {p.judul}
              </h3>
              <p className="text-xs text-[#3D3D3D] leading-relaxed whitespace-pre-wrap">
                {p.konten}
              </p>
            </div>
          ))}
        </div>

        {/* Modal Buat Pengumuman */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 border border-[#DDD8CE] animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E0D0]">
                <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                  Buat Pengumuman Baru
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-xs font-bold text-[#6B6B6B] hover:text-black p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#3D3D3D] mb-1">
                    Kategori
                  </label>
                  <select
                    value={formKategori}
                    onChange={(e) => setFormKategori(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A]"
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
                    className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
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
                    className="w-full p-3 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg border border-[#DDD8CE] text-[#6B6B6B] hover:bg-[#F5F0E8] font-semibold"
                  >
                    Batalkan
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#C0392B] hover:bg-[#a93226] text-white font-bold shadow active:scale-95 cursor-pointer"
                  >
                    Publikasikan →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <BottomNav role="guru" />
    </div>
  );
}
