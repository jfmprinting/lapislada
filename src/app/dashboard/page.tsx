'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import {
  CalendarCheck,
  BookOpen,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Award,
  FolderOpen,
  FolderLock,
  HeartHandshake,
  ArrowRight,
  Clock,
  Sparkles,
  Users,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export default function DashboardGuruPage() {
  const [hasAttendanceToday, setHasAttendanceToday] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <AppShell
      role="guru"
      pageTitle="Dashboard Guru & Wali Kelas"
      pageSubtitle="Kelas 4A · UPT SD Negeri Latsari 2 Bancar"
      unreadCount={unreadCount}
    >
      <div className="space-y-6">
        {/* ============================================================ */}
        {/* TOP GREETING & STATS ROW */}
        {/* ============================================================ */}
        <section className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-[#DDD8CE] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FDEDEC] text-[#922B21] text-[11px] font-bold border border-[#F1948A]">
                Wali Kelas 4A
              </span>
              <span className="text-xs text-[#6B6B6B] hidden sm:inline">
                T.A 2025/2026
              </span>
            </div>
            <h2 className="font-serif font-bold text-xl lg:text-2xl text-[#1A1A1A]">
              Selamat Datang, Bu Sari, S.Pd 👋
            </h2>
            <p className="text-xs text-[#6B6B6B] mt-1">
              {todayStr} · Mengelola 20 Siswa Terdaftar
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-[#FAF8F2] border border-[#DDD8CE] p-3 rounded-xl text-center">
              <span className="block font-serif font-bold text-lg text-[#1A1A1A]">20</span>
              <span className="text-[10px] font-semibold text-[#6B6B6B] uppercase">Total Siswa</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
              <span className="block font-serif font-bold text-lg text-emerald-800">18</span>
              <span className="text-[10px] font-semibold text-emerald-700 uppercase">Hadir Kemarin</span>
            </div>
            <div className="bg-[#FDEDEC] border border-[#F1948A] p-3 rounded-xl text-center col-span-2 sm:col-span-1">
              <span className="block font-serif font-bold text-lg text-[#922B21]">{unreadCount}</span>
              <span className="text-[10px] font-semibold text-[#922B21] uppercase">Catatan Ortu</span>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* DESKTOP TWO-COLUMN GRID (lg:grid-cols-12) */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* BUKU PENGHUBUNG FEED */}
            <section className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-[#DDD8CE]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F5F0E8]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#FDEDEC] text-[#922B21]">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                      Buku Penghubung Terbaru
                    </h3>
                    <p className="text-[11px] text-[#6B6B6B]">
                      Komunikasi harian dua arah antara guru dan wali murid
                    </p>
                  </div>
                </div>
                <Link
                  href="/buku-penghubung"
                  className="text-xs font-bold text-[#C0392B] hover:underline flex items-center gap-1"
                >
                  <span>Lihat Semua</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                {/* Unread from parent */}
                <Link
                  href="/buku-penghubung"
                  className="block p-4 rounded-xl bg-[#FDEDEC]/70 border border-[#F1948A] hover:bg-[#FDEDEC] transition group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#C0392B] animate-pulse" />
                      <span className="font-bold text-[#922B21] text-[11px] uppercase tracking-wide">
                        [ORANG TUA] Pak Budi (Wali Ahmad Budi)
                      </span>
                    </div>
                    <span className="text-[11px] text-[#6B6B6B]">2 jam lalu</span>
                  </div>
                  <p className="text-xs text-[#1A1A1A] leading-relaxed">
                    &ldquo;Ahmad tadi malam kurang tidur karena sakit perut ringan. Mohon dipantau ya Bu 🙏 Jika lemas mohon izinkan istirahat di UKS.&rdquo;
                  </p>
                  <div className="mt-2 text-[11px] font-bold text-[#C0392B] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    <span>Balas Catatan Sekarang</span>
                    <span>&rarr;</span>
                  </div>
                </Link>

                {/* Entry from teacher */}
                <Link
                  href="/buku-penghubung"
                  className="block p-4 rounded-xl bg-[#FAF8F2] border border-[#DDD8CE] hover:bg-white transition"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-[#6B6B6B] text-[11px]">
                      [GURU] Bu Sari &rarr; Citra Lestari
                    </span>
                    <span className="text-[11px] text-[#6B6B6B]">Kemarin · 14.00</span>
                  </div>
                  <p className="text-xs text-[#3D3D3D] leading-relaxed">
                    Ananda Citra hari ini berhasil meraih nilai 100 dalam kuis IPA mengenal rantai makanan. Terus dipertahankan ya!
                  </p>
                </Link>
              </div>
            </section>

            {/* MENU OPERASIONAL CEPAT (GRID KARTU) */}
            <section className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-[#DDD8CE]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                  Menu Operasional Cepat
                </h3>
                <span className="text-xs text-[#6B6B6B]">Akses 1 Klik</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <Link
                  href="/kehadiran"
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#F5F0E8] hover:bg-[#E8E0D0] border border-[#DDD8CE] transition active:scale-95 group text-center"
                >
                  <CalendarCheck className="w-7 h-7 text-[#922B21] mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-[#1A1A1A]">Absensi Siswa</span>
                  <span className="text-[10px] text-[#6B6B6B]">Input Harian Kelas</span>
                </Link>

                <Link
                  href="/nilai"
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#F5F0E8] hover:bg-[#E8E0D0] border border-[#DDD8CE] transition active:scale-95 group text-center"
                >
                  <Award className="w-7 h-7 text-[#922B21] mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-[#1A1A1A]">Nilai Siswa</span>
                  <span className="text-[10px] text-[#6B6B6B]">Capaian Per Mapel</span>
                </Link>

                <Link
                  href="/pengumuman"
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#F5F0E8] hover:bg-[#E8E0D0] border border-[#DDD8CE] transition active:scale-95 group text-center"
                >
                  <Bell className="w-7 h-7 text-[#922B21] mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-[#1A1A1A]">Umumkan</span>
                  <span className="text-[10px] text-[#6B6B6B]">Informasi Kelas</span>
                </Link>

                <Link
                  href="/materi"
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#F5F0E8] hover:bg-[#E8E0D0] border border-[#DDD8CE] transition active:scale-95 group text-center"
                >
                  <FolderOpen className="w-7 h-7 text-[#922B21] mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-[#1A1A1A]">Materi Belajar</span>
                  <span className="text-[10px] text-[#6B6B6B]">Link Google Drive</span>
                </Link>

                <Link
                  href="/dokumen-bos"
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#F5F0E8] hover:bg-[#E8E0D0] border border-[#DDD8CE] transition active:scale-95 group text-center"
                >
                  <FolderLock className="w-7 h-7 text-[#922B21] mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-[#1A1A1A]">Dokumen BOS</span>
                  <span className="text-[10px] text-[#6B6B6B]">Arsip SPJ & RKAS</span>
                </Link>

                <Link
                  href="/kaih"
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#F5F0E8] hover:bg-[#E8E0D0] border border-[#DDD8CE] transition active:scale-95 group text-center"
                >
                  <HeartHandshake className="w-7 h-7 text-[#922B21] mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs text-[#1A1A1A]">Karakter KAIH</span>
                  <span className="text-[10px] text-[#6B6B6B]">7 Kebiasaan Anak</span>
                </Link>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            {/* ATTENDANCE STATUS CARD */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#DDD8CE]">
              <h3 className="font-serif font-bold text-sm text-[#1A1A1A] mb-3 flex items-center justify-between">
                <span>Status Absensi Hari Ini</span>
                <span className="text-[10px] font-bold text-[#922B21] bg-[#FDEDEC] px-2 py-0.5 rounded">
                  Wajib
                </span>
              </h3>

              {!hasAttendanceToday ? (
                <div className="bg-[#FDEDEC] border border-[#F1948A] rounded-xl p-4 shadow-xs">
                  <div className="flex items-start gap-2.5 mb-3">
                    <AlertTriangle className="w-5 h-5 text-[#C0392B] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-[#922B21]">
                        Belum Input Absensi Kelas
                      </h4>
                      <p className="text-[11px] text-[#6B6B6B] mt-1 leading-relaxed">
                        Data kehadiran diperlukan sebelum jam 08.30 agar wali murid menerima rekap otomatis.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/kehadiran"
                    className="w-full py-2.5 px-3 rounded-lg bg-[#C0392B] hover:bg-[#a93226] text-white text-xs font-bold shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>Input Absensi Sekarang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-xs text-emerald-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold">Absensi Selesai Disimpan</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Semua 20 siswa telah tercatat dan disinkronkan ke sistem.
                  </p>
                </div>
              )}
            </div>

            {/* PENGUMUMAN WIDGET */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#DDD8CE]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F5F0E8]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-[#FDEDEC] text-[#922B21]">
                    <Bell className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">
                    Pengumuman Sekolah
                  </h3>
                </div>
                <Link
                  href="/pengumuman"
                  className="text-xs font-bold text-[#C0392B] hover:underline"
                >
                  Semua
                </Link>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#DDD8CE] space-y-1.5">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#922B21] text-white">
                  Penting
                </span>
                <h4 className="font-bold text-xs text-[#1A1A1A] leading-snug">
                  Pelaksanaan Asesmen Sumatif Tengah Semester (ASTS) Ganjil
                </h4>
                <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
                  ASTS akan dilaksanakan mulai hari Senin depan. Mohon bimbingan belajar siswa di rumah.
                </p>
              </div>
            </section>

            {/* QUICK INFORMATION CARD */}
            <div className="bg-[#FAF8F2] rounded-2xl p-5 border border-[#DDD8CE]">
              <div className="flex items-center gap-2 mb-2 text-[#922B21] font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Bantuan & Panduan</span>
              </div>
              <p className="text-[11px] text-[#6B6B6B] leading-relaxed mb-3">
                Butuh bantuan seputar penginputan nilai, absensi, atau sinkronisasi Google Drive?
              </p>
              <Link
                href="/"
                className="text-xs font-bold text-[#C0392B] hover:underline inline-flex items-center gap-1"
              >
                <span>Buka Profil Publik Sekolah</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
