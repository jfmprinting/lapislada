'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import {
  Award,
  Calendar,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  GraduationCap,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Clock,
  FileText,
  School,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Layers,
  HeartHandshake,
  Target,
} from 'lucide-react';
import { supabase, ProfilSekolah } from '@/lib/supabase';

const DEFAULT_PROFIL: ProfilSekolah = {
  id: 'default',
  nama_sekolah: 'UPT SD Negeri Latsari 2 Bancar',
  npsn: '20504924',
  nss: '101050612003',
  nis: '100020',
  akreditasi: 'B',
  tahun_berdiri: 1987,
  alamat: 'Jl. Desa Latsari No.190',
  kecamatan: 'Bancar',
  kabupaten: 'Tuban',
  provinsi: 'Jawa Timur',
  kode_pos: '62354',
  telepon: '(0356) 411000',
  hp_kepsek: '082230898376',
  email: 'sdnlatsari2@gmail.com',
  visi: 'Terwujudnya Peserta didik yang beriman dan bertaqwa kepada Tuhan Yang Maha Esa, Berkewargaan, kolaboratif, mandiri, dan berprestasi',
  misi: '1. Melaksanakan Pembelajaran sesuai kebutuhan peserta didik yang terintegrasi dalam setiap aspek kehidupan peserta didik.\n2. Menciptakan sekolah aman, sehat, dan nyaman.\n3. Mengembangkan kemandirian, bernalar kritis dan kreatifitas yang memfasilitasi keragaman minat dan bakat peserta didik.\n4. Mengembangkan dan memfasilitasi peningkatan prestasi belajar peserta didik sesuai minat dan bakatnya.\n5. Merancang pembelajaran yang bermakna, berkesadaran dan menyenangkan yang mampu memotivasi peserta didik untuk selalu belajar dan menjadi pembelajar sepanjang hayat.\n6. Membangun lingkungan sekolah yang membentuk peserta didik memiliki akhlak mulia melalui rutinitas kegiatan keagamaan serta menerapkan ajaran agama dan juga melalui program pendidikan karakter melalui kegiatan intrakurikuler, kokurikuler dan ekstrakurikuler.\n7. Membangun lingkungan sekolah yang bertoleransi dalam kebhinekaan global, mencintai budaya lokal, dan menjunjung nilai gotong royong.\n8. Membangun atmosfir belajar yang mandiri dan kolaboratif untuk memberikan pengalaman belajar yang bermakna.\n9. Membangun sinergi yang positif bersama masyarakat (komite, paguyuban dan pemerintah desa) untuk mewujudkan pendidikan yang bermakna dalam setiap proses pembelajaran.',
  logo_url: '/logo.webp',
  maps_embed_url:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.854890696347!2d111.7766!3d-6.7865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNDcnMTEuNCJTIDExMcKwNDYnMzUuOCJF!5e0!3m2!1sid!2sid!4v1700000000000',
};

export const TUJUAN_SEKOLAH_LIST = [
  {
    target: '≥ 90%',
    kategori: 'Religius & Akhlak Mulia',
    deskripsi:
      'Terwujudnya peserta didik yang beriman dan bertaqwa kepada Tuhan Yang Maha Esa, melalui pembiasaan kegiatan keagamaan dan penerapan akhlak mulia dalam kehidupan sehari-hari, dengan target sekurang-kurangnya 90% peserta didik menunjukkan perilaku religius dan berakhlak baik setiap tahun yang diukur dalam jurnal harian siswa.',
  },
  {
    target: '≥ 90%',
    kategori: 'Karakter Berkewargaan',
    deskripsi:
      'Terwujudnya peserta didik yang memiliki karakter berkewargaan, dengan menerapkan nilai-nilai Pancasila, disiplin, tanggung jawab, toleransi, cinta tanah air, gotong royong, dan menghargai keberagaman, dengan target sekurang-kurangnya 90% peserta didik menunjukkan perkembangan karakter positif setiap semester yang diukur dalam jurnal siswa.',
  },
  {
    target: '≥ 85%',
    kategori: 'Kolaborasi & Kerjasama',
    deskripsi:
      'Terwujudnya peserta didik yang mampu berkolaborasi, melalui kegiatan pembelajaran, projek, kokurikuler, ekstrakurikuler, dan kegiatan sosial, dengan target sekurang-kurangnya 85% peserta didik mampu bekerja sama, berkomunikasi, berbagi tugas, dan menyelesaikan kegiatan secara bertanggung jawab dalam satu tahun pelajaran melalui penilaian sikap yang terukur dalam setiap asesmen intrakurikuler, ekstrakurikuler maupun kokurikuler.',
  },
  {
    target: '≥ 85%',
    kategori: 'Kemandirian Belajar',
    deskripsi:
      'Terwujudnya peserta didik yang mandiri dalam belajar dan melaksanakan tanggung jawabnya, melalui pembiasaan, pemberian tugas, pengambilan keputusan sederhana, serta pengelolaan diri dan lingkungan, dengan target sekurang-kurangnya 85% peserta didik menunjukkan peningkatan kemandirian pada setiap semester yang terukur dalam nilai asesmen dan buku jurnal siswa.',
  },
  {
    target: 'Berkelanjutan',
    kategori: 'Prestasi Akademik & Non-Akademik',
    deskripsi:
      'Terwujudnya peserta didik yang berprestasi sesuai potensi, bakat, dan minatnya dalam bidang akademik maupun nonakademik melalui pembinaan yang terencana dan berkelanjutan, dengan target meningkatnya capaian prestasi peserta didik setiap tahun pelajaran yang terukur dari kegiatan asesmen intrakurikuler, ekstrakurikuler maupun kokurikuler.',
  },
];

export default function HomePage() {
  const [profil, setProfil] = useState<ProfilSekolah>(DEFAULT_PROFIL);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profil' | 'visi' | 'layanan' | 'kontak'>('profil');

  useEffect(() => {
    async function loadProfil() {
      try {
        const { data, error } = await supabase
          .from('profil_sekolah')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (data && !error) {
          setProfil(data);
        }
      } catch (err) {
        console.info('Using default profil sekolah data');
      } finally {
        setLoading(false);
      }
    }
    loadProfil();
  }, []);

  const misiList = profil.misi
    ? profil.misi
        .split('\n')
        .map((m) => m.trim())
        .filter(Boolean)
    : [];

  const waKepsekUrl = profil.hp_kepsek
    ? `https://wa.me/62${profil.hp_kepsek.replace(/^0/, '').replace(/[^0-9]/g, '')}?text=Halo%20Kepala%20Sekolah%20${encodeURIComponent(
        profil.nama_sekolah
      )},%20saya%20ingin%20bertanya%20seputar%20informasi%20sekolah.`
    : '#';

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F5F0E8] text-[#1A1A1A]">
      <Navbar schoolName={profil.nama_sekolah} />

      {/* Main container with responsive desktop width & mobile comfort */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 flex-1 flex flex-col gap-6 sm:gap-8">
        
        {/* HERO BANNER SECTION (UPACARA BENDERA + STANDOUT LAPIS LADA) */}
        <section className="relative rounded-3xl overflow-hidden shadow-xl border border-[#922B21]/30">
          {/* Background Image Container */}
          <div className="absolute inset-0 z-0">
            <img
              src="/hero-upacara.jpg"
              alt="Upacara Bendera UPT SD Negeri Latsari 2"
              className="w-full h-full object-cover object-center transform scale-105 filter brightness-75 transition-transform duration-1000"
            />
            {/* Rich multi-layer gradient overlay for high contrast & elegance */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#140605] via-[#771F18]/85 to-[#922B21]/90 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#140605]/95 via-[#771F18]/75 to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 p-6 sm:p-10 md:p-12 flex flex-col justify-between text-white min-h-[440px] sm:min-h-[480px]">
            {/* Top Row: School Badge & Official Status */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-amber-300/40 text-amber-300 text-xs font-semibold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="tracking-wide">PORTAL INFORMASI RESMI</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs text-white/90">
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  Akreditasi {profil.akreditasi || 'B'}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white/80">
                  <Calendar className="w-3.5 h-3.5 text-white/70" />
                  Est. {profil.tahun_berdiri || 1987}
                </span>
              </div>
            </div>

            {/* Middle: Standout Branding LAPIS LADA */}
            <div className="my-6 max-w-2xl">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1.5 shadow-2xl flex items-center justify-center border-2 border-amber-400/80 shrink-0 transform hover:scale-105 transition-transform">
                  <img
                    src={profil.logo_url || '/logo.webp'}
                    alt={profil.nama_sekolah}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-amber-300/90 block">
                    Sistem Manajemen Sekolah Digital
                  </span>
                  <h1 className="font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight text-white drop-shadow-md">
                    LAPIS LADA
                  </h1>
                </div>
              </div>

              <p className="text-amber-100 font-medium text-sm sm:text-base leading-snug tracking-wide max-w-xl">
                Layanan Pusat Informasi Sekolah Latsari Dua
              </p>
              <p className="text-white/80 text-xs sm:text-sm font-light mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{profil.nama_sekolah} &bull; Kec. {profil.kecamatan}, Kab. {profil.kabupaten}</span>
              </p>
            </div>

            {/* Bottom: Modern & Refined Access Bar (Clean, Non-Intrusive) */}
            <div className="pt-4 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-white/70 hidden md:block">
                Akses terpadu untuk wali murid, dewan guru, dan pemangku kepentingan sekolah.
              </div>

              {/* Refined and aesthetic CTA buttons (No longer bulky/distracting) */}
              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                <Link
                  href="/login?role=orangtua"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-amber-50 text-[#922B21] font-bold text-xs shadow-md transition-all active:scale-95 group border border-white/80"
                >
                  <UserCheck className="w-4 h-4 text-[#C0392B] group-hover:scale-110 transition-transform" />
                  <span>Portal Wali Murid</span>
                </Link>

                <Link
                  href="/login?role=guru"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md text-white font-bold text-xs shadow-md transition-all active:scale-95 group border border-white/30"
                >
                  <GraduationCap className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
                  <span>Portal Guru & Tendik</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK STATS & RECOGNITION BAR (BENTO-STYLE) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#DDD8CE] flex items-center gap-3.5 hover:border-[#922B21]/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#FDEDEC] text-[#922B21] flex items-center justify-center shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#6B6B6B] uppercase font-semibold block tracking-wider">Status Sekolah</span>
              <span className="text-xs font-bold text-[#1A1A1A]">Negeri (Kemdikbud)</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#DDD8CE] flex items-center gap-3.5 hover:border-[#922B21]/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#6B6B6B] uppercase font-semibold block tracking-wider">Akreditasi</span>
              <span className="text-xs font-bold text-[#1A1A1A]">Peringkat B ({profil.akreditasi || 'B'})</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#DDD8CE] flex items-center gap-3.5 hover:border-[#922B21]/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#6B6B6B] uppercase font-semibold block tracking-wider">NPSN Resmi</span>
              <span className="text-xs font-mono font-bold text-[#1A1A1A]">{profil.npsn}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#DDD8CE] flex items-center gap-3.5 hover:border-[#922B21]/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-[#6B6B6B] uppercase font-semibold block tracking-wider">Wilayah</span>
              <span className="text-xs font-bold text-[#1A1A1A]">Bancar, Tuban</span>
            </div>
          </div>
        </div>

        {/* MODERN NAVIGATION TABS (ENHANCED USER EXPERIENCE) */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#E8E0D0]/70 rounded-2xl border border-[#DDD8CE] overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('profil')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'profil'
                ? 'bg-[#922B21] text-white shadow-sm'
                : 'text-[#3D3D3D] hover:bg-white/60'
            }`}
          >
            <School className="w-3.5 h-3.5" />
            <span>Identitas Sekolah</span>
          </button>

          <button
            onClick={() => setActiveTab('visi')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'visi'
                ? 'bg-[#922B21] text-white shadow-sm'
                : 'text-[#3D3D3D] hover:bg-white/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Visi, Misi & Tujuan</span>
          </button>

          <button
            onClick={() => setActiveTab('layanan')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'layanan'
                ? 'bg-[#922B21] text-white shadow-sm'
                : 'text-[#3D3D3D] hover:bg-white/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Layanan LAPIS LADA</span>
          </button>

          <button
            onClick={() => setActiveTab('kontak')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'kontak'
                ? 'bg-[#922B21] text-white shadow-sm'
                : 'text-[#3D3D3D] hover:bg-white/60'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Kontak & Lokasi</span>
          </button>
        </div>

        {/* TAB 1: IDENTITAS SEKOLAH */}
        {activeTab === 'profil' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in duration-300">
            {/* Main Info Card (2 cols) */}
            <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-[#DDD8CE]">
              <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-[#E8E0D0]">
                <div className="p-2 rounded-xl bg-[#FDEDEC] text-[#922B21]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">
                    Profil & Legalitas Sekolah
                  </h2>
                  <p className="text-xs text-[#6B6B6B]">Data kelembagaan terdaftar resmi di Kemendikbudristek RI</p>
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-xs">
                <div className="p-2.5 rounded-xl bg-[#F5F0E8]/70 border border-[#E8E0D0]">
                  <dt className="text-[#6B6B6B] text-[10px] uppercase font-semibold">Nama Resmi Lembaga</dt>
                  <dd className="font-bold text-[#1A1A1A] mt-0.5">{profil.nama_sekolah}</dd>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F5F0E8]/70 border border-[#E8E0D0]">
                  <dt className="text-[#6B6B6B] text-[10px] uppercase font-semibold">Nomor Pokok Sekolah Nasional (NPSN)</dt>
                  <dd className="font-mono font-bold text-[#922B21] mt-0.5">{profil.npsn}</dd>
                </div>

                {profil.nss && (
                  <div className="p-2.5 rounded-xl bg-[#F5F0E8]/70 border border-[#E8E0D0]">
                    <dt className="text-[#6B6B6B] text-[10px] uppercase font-semibold">Nomor Statistik Sekolah (NSS)</dt>
                    <dd className="font-mono font-semibold text-[#1A1A1A] mt-0.5">{profil.nss}</dd>
                  </div>
                )}

                {profil.nis && (
                  <div className="p-2.5 rounded-xl bg-[#F5F0E8]/70 border border-[#E8E0D0]">
                    <dt className="text-[#6B6B6B] text-[10px] uppercase font-semibold">Nomor Induk Sekolah (NIS)</dt>
                    <dd className="font-mono font-semibold text-[#1A1A1A] mt-0.5">{profil.nis}</dd>
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-[#F5F0E8]/70 border border-[#E8E0D0]">
                  <dt className="text-[#6B6B6B] text-[10px] uppercase font-semibold">Bentuk Pendidikan</dt>
                  <dd className="font-semibold text-[#1A1A1A] mt-0.5">Sekolah Dasar (SD)</dd>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F5F0E8]/70 border border-[#E8E0D0]">
                  <dt className="text-[#6B6B6B] text-[10px] uppercase font-semibold">Tahun Operasional / Berdiri</dt>
                  <dd className="font-semibold text-[#1A1A1A] mt-0.5">{profil.tahun_berdiri || 1987}</dd>
                </div>

                <div className="sm:col-span-2 p-2.5 rounded-xl bg-[#F5F0E8]/70 border border-[#E8E0D0]">
                  <dt className="text-[#6B6B6B] text-[10px] uppercase font-semibold">Alamat Lengkap</dt>
                  <dd className="font-semibold text-[#1A1A1A] mt-0.5">
                    {profil.alamat}, Kec. {profil.kecamatan}, Kab. {profil.kabupaten}, {profil.provinsi} {profil.kode_pos}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Fast Card: Kepala Sekolah & Moto (1 col) */}
            <div className="bg-gradient-to-br from-[#922B21] to-[#771F18] text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-amber-300" />
                </div>
                <h3 className="font-serif font-bold text-lg text-white mb-2">
                  Pendidikan Karakter & Prestasi
                </h3>
                <p className="text-xs text-amber-100/90 leading-relaxed">
                  UPT SD Negeri Latsari 2 Bancar berkomitmen menghadirkan lingkungan belajar yang humanis, kreatif, dan berwawasan masa depan untuk mencetak generasi berkarakter.
                </p>
              </div>

              <div className="pt-6 border-t border-white/15 mt-6">
                <span className="text-[10px] text-amber-200 uppercase tracking-widest font-semibold block">Layanan Terpadu</span>
                <span className="text-sm font-bold text-white block mt-0.5">Portal LAPIS LADA</span>
                <Link
                  href="/login"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-white font-semibold group"
                >
                  <span>Buka Akses Pengguna</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VISI, MISI & TUJUAN */}
        {activeTab === 'visi' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Visi & Misi Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
              {/* Visi Sekolah (2 cols) */}
              <div className="md:col-span-2 bg-gradient-to-br from-[#FAF7F2] to-[#FDEDEC]/40 rounded-2xl p-6 shadow-sm border border-[#F1948A]/40 flex flex-col justify-center relative overflow-hidden">
                <div className="p-2.5 rounded-xl bg-[#FDEDEC] text-[#922B21] w-fit mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-[#922B21] uppercase tracking-wider block mb-2">
                  Visi UPT SDN Latsari 2 Bancar
                </span>
                <blockquote className="font-serif italic text-base sm:text-lg text-[#1A1A1A] leading-relaxed relative z-10">
                  &ldquo;{profil.visi}&rdquo;
                </blockquote>
              </div>

              {/* Misi Sekolah (3 cols) */}
              <div className="md:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-[#DDD8CE]">
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#E8E0D0]">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                      Misi Satuan Pendidikan
                    </h3>
                    <p className="text-[11px] text-[#7A7A7A]">9 Program aksi strategis satuan pendidikan</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs max-h-[360px] overflow-y-auto pr-1">
                  {misiList.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-[#F5F0E8]/50 border border-[#E8E0D0] hover:bg-[#FAF8F2] transition-colors"
                    >
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#922B21] text-white font-bold text-[11px] shrink-0 mt-0.5 shadow-sm">
                        {idx + 1}
                      </span>
                      <p className="text-[#3D3D3D] leading-relaxed font-medium">
                        {m.replace(/^[0-9]+\.\s*/, '')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tujuan Satuan Pendidikan Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DDD8CE]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[#E8E0D0]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#FDEDEC] text-[#922B21]">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                      Tujuan Satuan Pendidikan
                    </h3>
                    <p className="text-xs text-[#7A7A7A]">
                      Sasaran strategis terukur UPT SDN Latsari 2 Bancar berbasis asesmen & karakter
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F0E8] border border-[#DDD8CE] text-xs font-semibold text-[#666]">
                  <span>5 Sasaran Mutu</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TUJUAN_SEKOLAH_LIST.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-[#E8E0D0] bg-[#FAF8F2]/60 hover:bg-white hover:border-[#922B21]/40 transition-all flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-bold text-xs text-[#1A1A1A] group-hover:text-[#922B21] transition-colors flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#922B21]" />
                          {t.kategori}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FDEDEC] text-[#922B21] border border-[#F1948A]/40 shrink-0">
                          Target: {t.target}
                        </span>
                      </div>
                      <p className="text-xs text-[#4A4A4A] leading-relaxed text-justify">
                        {t.deskripsi}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LAYANAN LAPIS LADA */}
        {activeTab === 'layanan' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DDD8CE]">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDEDEC] text-[#922B21] text-xs font-bold mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Mengenal LAPIS LADA
                </div>
                <h2 className="font-serif font-bold text-xl text-[#1A1A1A] mb-2">
                  Layanan Pusat Informasi Sekolah Latsari Dua
                </h2>
                <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">
                  LAPIS LADA adalah platform integrasi informasi dan komunikasi sekolah dasar modern yang dirancang untuk mempererat sinergi antara guru, wali murid, dan pihak sekolah secara transparan dan aman.
                </p>
              </div>

              {/* Asymmetric Bento Grid for LAPIS LADA Features (Anti 3-card slop) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-6">
                {/* Flagship Feature (Spans 7 cols): Buku Penghubung Digital */}
                <div className="md:col-span-7 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#FAF7F2] to-[#FDEDEC]/40 border border-[#F1948A]/40 flex flex-col justify-between hover:border-[#922B21]/50 transition-all group shadow-xs">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-[#FDEDEC] text-[#922B21] flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#922B21]/10 text-[#922B21]">
                        Pilar Utama
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-base text-[#1A1A1A] mb-1.5">
                      Buku Penghubung Digital 2 Arah
                    </h4>
                    <p className="text-xs text-[#525252] leading-relaxed">
                      Jembatan komunikasi harian antara guru dan orang tua. Catatan pembinaan akhlak, perkembangan belajar, hingga konsultasi pribadi langsung tersimpan aman tanpa resiko buku hilang.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[#E8E0D0]">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#922B21] bg-white px-2 py-0.5 rounded-md border border-[#F1948A]/30">
                      <CheckCircle2 className="w-3 h-3 text-[#25D366]" /> Notifikasi Terkirim
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#525252] bg-white px-2 py-0.5 rounded-md border border-[#DDD8CE]">
                      Riwayat Permanen
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#525252] bg-white px-2 py-0.5 rounded-md border border-[#DDD8CE]">
                      Privasi Terjamin
                    </span>
                  </div>
                </div>

                {/* Right Column Stack (Spans 5 cols): Presensi & Transparansi */}
                <div className="md:col-span-5 flex flex-col gap-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F5F0E8]/80 border border-[#DDD8CE] hover:border-[#922B21]/40 transition-all group flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Clock className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-sm text-[#1A1A1A]">Presensi Terpadu Realtime</h4>
                    </div>
                    <p className="text-xs text-[#6B6B6B] leading-relaxed">
                      Pencatatan kehadiran harian per rombel kelas yang terpantau instan oleh wali murid.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F5F0E8]/80 border border-[#DDD8CE] hover:border-[#922B21]/40 transition-all group flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-sm text-[#1A1A1A]">Transparansi BOS & Nilai</h4>
                    </div>
                    <p className="text-xs text-[#6B6B6B] leading-relaxed">
                      Publikasi dokumen akuntabilitas anggaran BOS dan transkrip perkembangan siswa secara teratur.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Banner inside Layanan */}
              <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-[#922B21] to-[#C0392B] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-white">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm">Sudah Memiliki Akun Akses?</h5>
                    <p className="text-[11px] text-amber-200">Silakan login sesuai dengan peran Anda sebagai Wali Murid atau Guru.</p>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-amber-50 text-[#922B21] font-bold text-xs shadow transition active:scale-95 shrink-0"
                >
                  <span>Masuk ke Akun</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: KONTAK & LOKASI */}
        {activeTab === 'kontak' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-300">
            {/* Info Kontak Cepat */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DDD8CE] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#E8E0D0]">
                  <div className="p-2 rounded-xl bg-[#FDEDEC] text-[#922B21]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                    Saluran Komunikasi Resmi
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  {profil.hp_kepsek && (
                    <div className="p-3.5 rounded-xl bg-[#F5F0E8] border border-[#DDD8CE] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0">
                          <MessageCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#6B6B6B] uppercase font-semibold">WhatsApp Kepala Sekolah</span>
                          <span className="font-bold text-[#1A1A1A] text-xs sm:text-sm">{profil.hp_kepsek}</span>
                        </div>
                      </div>
                      <a
                        href={waKepsekUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-[11px] font-bold shadow-sm hover:bg-[#20ba59] transition shrink-0"
                      >
                        <span>Chat WA</span>
                      </a>
                    </div>
                  )}

                  {profil.email && (
                    <div className="p-3.5 rounded-xl bg-[#F5F0E8] border border-[#DDD8CE] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <span className="block text-[10px] text-[#6B6B6B] uppercase font-semibold">Email Resmi Sekolah</span>
                        <a
                          href={`mailto:${profil.email}`}
                          className="font-bold text-[#1A1A1A] hover:text-[#C0392B] text-xs sm:text-sm"
                        >
                          {profil.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {profil.telepon && (
                    <div className="p-3.5 rounded-xl bg-[#F5F0E8] border border-[#DDD8CE] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-[10px] text-[#6B6B6B] uppercase font-semibold">Telepon Kantor</span>
                        <span className="font-bold text-[#1A1A1A] text-xs sm:text-sm">{profil.telepon}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#E8E0D0] text-[11px] text-[#6B6B6B]">
                📍 {profil.alamat}, Kec. {profil.kecamatan}, Kab. {profil.kabupaten}, Jawa Timur {profil.kode_pos}
              </div>
            </div>

            {/* Peta Google Maps Interaktif */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DDD8CE] flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8E0D0]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#FDEDEC] text-[#922B21]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                    Lokasi di Peta
                  </h3>
                </div>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(profil.nama_sekolah + ' ' + (profil.alamat || ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#922B21] hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  <span>Buka Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {profil.maps_embed_url ? (
                <div className="flex-1 min-h-[220px] rounded-xl overflow-hidden border border-[#DDD8CE] shadow-inner relative">
                  <iframe
                    title="Peta Lokasi Sekolah"
                    src={profil.maps_embed_url}
                    width="100%"
                    height="100%"
                    className="w-full h-full min-h-[220px]"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[#6B6B6B]">
                  Peta lokasi belum dikonfigurasi di profil sekolah.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ELEGANT FOOTER */}
        <footer className="mt-4 pt-6 pb-8 border-t border-[#DDD8CE] text-center text-xs text-[#6B6B6B] flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[#1A1A1A]">
            <img src="/logo.webp" alt="Logo" className="w-5 h-5 object-contain" />
            <span>{profil.nama_sekolah}</span>
          </div>

          <p className="max-w-md text-[11px] text-[#6B6B6B]">
            Didukung penuh oleh sistem digital <strong className="text-[#922B21] font-bold">LAPIS LADA</strong> (Layanan Pusat Informasi Sekolah Latsari Dua).
          </p>

          <div className="flex items-center gap-3 text-[10px] text-[#8C827A] pt-1">
            <span>&copy; {new Date().getFullYear()} UPT SDN Latsari 2 Bancar</span>
            <span>&bull;</span>
            <span>Dinas Pendidikan Kab. Tuban</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
