'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import AppShell from '@/components/layout/AppShell';
import { supabase, GaleriKegiatan } from '@/lib/supabase';
import { INITIAL_GALERI, KATEGORI_GALERI_LIST } from '@/lib/galeriData';
import {
  Camera,
  Calendar,
  Search,
  X,
  Share2,
  Download,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useNotification } from '@/components/ui/NotificationContext';

export default function GaleriPage() {
  const { showToast } = useNotification();
  const [items, setItems] = useState<GaleriKegiatan[]>(INITIAL_GALERI);
  const [loading, setLoading] = useState(true);
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'kepala_sekolah' | 'guru' | 'orangtua' | null>(null);

  // Lightbox Modal State
  const [activeItem, setActiveItem] = useState<GaleriKegiatan | null>(null);

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (user) {
          const role = user?.user_metadata?.role;
          const jabatan = user?.user_metadata?.jabatan;
          const email = user?.email?.toLowerCase().trim();
          if (role === 'kepala_sekolah' || jabatan === 'kepala_sekolah' || email === 'kepsek@demo.com') {
            setCurrentUserRole('kepala_sekolah');
          } else if (role === 'admin' || email === 'admin@demo.com') {
            setCurrentUserRole('admin');
          } else if (role === 'orangtua') {
            setCurrentUserRole('orangtua');
          } else {
            setCurrentUserRole('guru');
          }
        } else {
          setCurrentUserRole(null);
        }
      } catch (e) {
        setCurrentUserRole(null);
      }
    }
    checkUser();
  }, []);

  useEffect(() => {
    async function fetchGaleri() {
      try {
        // Try local storage first
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

        // Fetch from Supabase table if exists
        const { data, error } = await supabase
          .from('galeri_kegiatan')
          .select('*')
          .order('tanggal', { ascending: false });

        if (data && data.length > 0 && !error) {
          setItems(data);
        }
      } catch (err) {
        console.info('Using default/cached gallery data');
      } finally {
        setLoading(false);
      }
    }
    fetchGaleri();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchKategori =
        selectedKategori === 'Semua' || item.kategori === selectedKategori;
      const matchSearch =
        item.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.deskripsi || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchKategori && matchSearch;
    });
  }, [items, selectedKategori, searchTerm]);

  const handleShare = async (item: GaleriKegiatan) => {
    const shareText = `${item.judul} - UPT SD Negeri Latsari 2 Bancar. Lihat dokumentasi di https://lapislada.pages.dev/galeri`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.judul,
          text: shareText,
          url: window.location.href,
        });
      } catch (e) {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast({ type: 'success', message: 'Tautan dokumentasi berhasil disalin!' });
      } catch {
        showToast({ type: 'error', message: 'Gagal menyalin tautan.' });
      }
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Reusable Gallery Content Grid & Lightbox
  const galleryBody = (
    <div className="space-y-6">
      {/* CONTROLS: SEARCH & CATEGORY PILLS */}
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A7A7A]" />
          <input
            type="text"
            placeholder="Cari dokumentasi kegiatan (misal: pramuka, upacara, sholat)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DDD8CE] rounded-xl text-xs sm:text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {KATEGORI_GALERI_LIST.map((kat) => (
            <button
              key={kat}
              onClick={() => setSelectedKategori(kat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedKategori === kat
                  ? 'bg-[#922B21] text-white shadow-xs'
                  : 'bg-white text-[#555] border border-[#DDD8CE] hover:bg-[#FAF8F2]'
              }`}
            >
              {kat}
            </button>
          ))}
        </div>
      </div>

      {/* GALLERY GRID */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#DDD8CE]">
          <Camera className="w-12 h-12 text-[#DDD8CE] mx-auto mb-3" />
          <h3 className="font-bold text-base text-[#1A1A1A] mb-1">
            Tidak Ada Dokumentasi Ditemukan
          </h3>
          <p className="text-xs text-[#666]">
            Coba gunakan kata kunci pencarian lain atau pilih kategori &quot;Semua&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveItem(item)}
              className="bg-white rounded-2xl border border-[#DDD8CE] overflow-hidden shadow-xs hover:shadow-md hover:border-[#922B21]/50 transition-all cursor-pointer group flex flex-col"
            >
              {/* Image Container with 16:9 aspect ratio */}
              <div className="relative aspect-video w-full bg-[#EAE5DC] overflow-hidden">
                <img
                  src={item.foto_url}
                  alt={item.judul}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold border border-white/20">
                    {item.kategori}
                  </span>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-[#7A7A7A] mb-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(item.tanggal)}</span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1A1A1A] line-clamp-2 group-hover:text-[#922B21] transition-colors leading-snug">
                    {item.judul}
                  </h3>
                  <p className="text-xs text-[#555] line-clamp-2 mt-1.5 leading-relaxed">
                    {item.deskripsi}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[#F5F0E8] flex items-center justify-between text-xs text-[#922B21] font-bold">
                  <span>Lihat Detail Foto</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIGHTBOX DETAIL MODAL */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-[#DDD8CE]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDD8CE] bg-[#FAF8F2]">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#FDEDEC] text-[#922B21] text-xs font-bold border border-[#F1948A]">
                  {activeItem.kategori}
                </span>
                <span className="text-xs text-[#666] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(activeItem.tanggal)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 border border-[#DDD8CE] flex items-center justify-center text-[#1A1A1A] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="overflow-y-auto flex-1">
              <div className="w-full bg-black/5 flex items-center justify-center max-h-[55vh] overflow-hidden">
                <img
                  src={activeItem.foto_url}
                  alt={activeItem.judul}
                  className="w-full max-h-[55vh] object-contain"
                />
              </div>

              <div className="p-6 space-y-3">
                <h2 className="font-serif font-bold text-lg sm:text-xl text-[#1A1A1A]">
                  {activeItem.judul}
                </h2>
                <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed text-justify">
                  {activeItem.deskripsi}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-[#FAF8F2] border-t border-[#DDD8CE] flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleShare(activeItem)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#922B21] hover:underline cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Bagikan Dokumentasi</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="px-4 py-2 rounded-xl bg-[#922B21] text-white text-xs font-bold shadow-xs hover:bg-[#771F18] transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Jika user sudah login (Guru, Kepsek, Admin, Ortu), tampilkan dengan AppShell (Sidebar Tetap Ada)
  if (currentUserRole) {
    return (
      <AppShell
        role={currentUserRole}
        pageTitle="Galeri Kegiatan Siswa & Sekolah"
        pageSubtitle="Merekam jejak kebersamaan, pembentukan karakter mulia, dan prestasi peserta didik"
      >
        {galleryBody}
      </AppShell>
    );
  }

  // Jika pengunjung publik (belum login), tampilkan halaman mandiri dengan Navbar publik
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8] text-[#1A1A1A]">
      <Navbar schoolName="UPT SD Negeri Latsari 2 Bancar" />

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#922B21] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda Utama</span>
          </Link>
          <span className="text-xs text-[#7A7A7A]">Portal Dokumentasi Sekolah</span>
        </div>

        {/* HERO TITLE BANNER */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DDD8CE] shadow-sm relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDEDEC] text-[#922B21] text-xs font-bold mb-3">
              <Camera className="w-3.5 h-3.5" />
              <span>Dokumentasi Sekolah</span>
            </div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#1A1A1A] leading-tight mb-2">
              Galeri Kegiatan Siswa & Sekolah
            </h1>
            <p className="text-xs sm:text-sm text-[#555] leading-relaxed">
              Merekam jejak kebersamaan, pembentukan karakter mulia, dan prestasi peserta didik UPT SD Negeri Latsari 2 Bancar dalam berbagai agenda intrakurikuler dan ekstrakurikuler.
            </p>
          </div>

          <div className="absolute right-[-20px] bottom-[-20px] opacity-5 pointer-events-none">
            <Camera className="w-64 h-64 text-[#922B21]" />
          </div>
        </section>

        {galleryBody}
      </main>
    </div>
  );
}
