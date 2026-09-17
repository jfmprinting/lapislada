'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
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
    <div className="min-h-screen flex flex-col bg-[#F5F0E8] pb-24 text-[#1A1A1A]">
      <Navbar schoolName="Kelas 4A · Bu Sari" />

      <main className="w-full max-w-md mx-auto sm:max-w-xl md:max-w-2xl px-4 py-4 flex-1 space-y-4">
        {/* GREETING CARD */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#DDD8CE] flex items-center justify-between">
          <div>
            <h1 className="font-serif font-bold text-lg text-[#1A1A1A]">
              Selamat Datang, Bu Sari, S.Pd 👋
            </h1>
            <p className="text-xs text-[#6B6B6B] mt-0.5">{todayStr} · Wali Kelas 4A</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#FDEDEC] text-[#922B21] text-[11px] font-bold border border-[#F1948A]">
            Kelas 4A (20 Siswa)
          </span>
        </section>

        {/* ATTENDANCE STATUS ALERT (WF-03) */}
        {!hasAttendanceToday ? (
          <div className="bg-[#FDEDEC] border border-[#F1948A] rounded-xl p-4 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#C0392B] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-xs text-[#922B21]">
                  Belum input absensi kelas hari ini
                </h3>
                <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                  Wali murid menunggu kepastian kehadiran ananda.
                </p>
              </div>
            </div>
            <Link
              href="/kehadiran"
              className="shrink-0 px-3 py-1.5 rounded-lg bg-[#C0392B] hover:bg-[#a93226] text-white text-xs font-bold shadow-xs transition active:scale-95"
            >
              Input Absen &rarr;
            </Link>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Absensi hari ini telah lengkap tersimpan (20 Siswa Hadir).</span>
          </div>
        )}

        {/* BUKU PENGHUBUNG SUMMARY (WF-03) */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-[#DDD8CE]">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#F5F0E8]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[#FDEDEC] text-[#922B21]">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="font-serif font-bold text-sm text-[#1A1A1A]">
                Buku Penghubung
              </h2>
            </div>
            <Link
              href="/buku-penghubung"
              className="text-xs font-bold text-[#C0392B] hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2 text-xs">
            {/* Unread entry */}
            <Link
              href="/buku-penghubung"
              className="block p-3 rounded-lg bg-[#FDEDEC]/80 border border-[#F1948A] hover:bg-[#FDEDEC] transition"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#C0392B] animate-pulse" />
                  <span className="font-bold text-[#922B21] text-[11px] uppercase tracking-wide">
                    [ORANG TUA] Pak Budi (Ahmad)
                  </span>
                </div>
                <span className="text-[10px] text-[#6B6B6B]">2 jam lalu</span>
              </div>
              <p className="text-xs text-[#1A1A1A] line-clamp-2">
                &ldquo;Ahmad tadi malam kurang tidur karena sakit perut ringan. Mohon dipantau ya Bu 🙏&rdquo;
              </p>
            </Link>

            {/* Read entry */}
            <Link
              href="/buku-penghubung"
              className="block p-3 rounded-lg bg-[#FAF8F2] border border-[#DDD8CE] hover:bg-white transition"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-[#6B6B6B] text-[11px]">
                  [GURU] Bu Sari &rarr; Citra Lestari
                </span>
                <span className="text-[10px] text-[#6B6B6B]">Kemarin</span>
              </div>
              <p className="text-xs text-[#3D3D3D] line-clamp-1">
                Ananda Citra hari ini berhasil meraih nilai 100 dalam kuis IPA...
              </p>
            </Link>
          </div>
        </section>

        {/* PENGUMUMAN TERBARU (WF-03) */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-[#DDD8CE]">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#F5F0E8]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[#FDEDEC] text-[#922B21]">
                <Bell className="w-4 h-4" />
              </div>
              <h2 className="font-serif font-bold text-sm text-[#1A1A1A]">
                Pengumuman Sekolah
              </h2>
            </div>
            <Link
              href="/pengumuman"
              className="text-xs font-bold text-[#C0392B] hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-3 rounded-lg bg-[#FAF8F2] border border-[#DDD8CE]">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#922B21] text-white mb-1">
              Penting
            </span>
            <h4 className="font-bold text-xs text-[#1A1A1A]">
              Pelaksanaan Asesmen Sumatif Tengah Semester (ASTS) Ganjil
            </h4>
            <p className="text-[11px] text-[#6B6B6B] mt-1">
              ASTS akan dilaksanakan mulai hari Senin depan. Mohon bimbingan belajar siswa di rumah.
            </p>
          </div>
        </section>

        {/* MENU CEPAT (WF-03) */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-[#DDD8CE]">
          <h2 className="font-serif font-bold text-sm text-[#1A1A1A] mb-3">
            Menu Operasional Cepat
          </h2>

          <div className="grid grid-cols-3 gap-2.5">
            <Link
              href="/kehadiran"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F5F0E8] hover:bg-[#E8E0D0] border border-[#DDD8CE] transition active:scale-95 group text-center"
            >
              <CalendarCheck className="w-6 h-6 text-[#922B21] mb-1 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-[#1A1A1A]">Absensi</span>
              <span className="text-[9px] text-[#6B6B6B]">Harian</span>
            </Link>

            <Link
              href="/nilai"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F5F0E8] hover:bg-[#E8E0D0] border border-[#DDD8CE] transition active:scale-95 group text-center"
            >
              <Award className="w-6 h-6 text-[#922B21] mb-1 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-[#1A1A1A]">Nilai</span>
              <span className="text-[9px] text-[#6B6B6B]">Per Mapel</span>
            </Link>

            <Link
              href="/pengumuman"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F5F0E8] hover:bg-[#E8E0D0] border border-[#DDD8CE] transition active:scale-95 group text-center"
            >
              <Bell className="w-6 h-6 text-[#922B21] mb-1 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-[#1A1A1A]">Umumkan</span>
              <span className="text-[9px] text-[#6B6B6B]">Ke Kelas</span>
            </Link>

            <Link
              href="/materi"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F5F0E8] hover:bg-[#E8E0D0] border border-[#DDD8CE] transition active:scale-95 group text-center"
            >
              <FolderOpen className="w-6 h-6 text-[#922B21] mb-1 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-[#1A1A1A]">Materi</span>
              <span className="text-[9px] text-[#6B6B6B]">GDrive</span>
            </Link>

            <Link
              href="/dokumen-bos"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F5F0E8] hover:bg-[#E8E0D0] border border-[#DDD8CE] transition active:scale-95 group text-center"
            >
              <FolderLock className="w-6 h-6 text-[#922B21] mb-1 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-[#1A1A1A]">Dokumen BOS</span>
              <span className="text-[9px] text-[#6B6B6B]">Arsip SPJ</span>
            </Link>

            <Link
              href="/kaih"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#F5F0E8] hover:bg-[#E8E0D0] border border-[#DDD8CE] transition active:scale-95 group text-center"
            >
              <HeartHandshake className="w-6 h-6 text-[#922B21] mb-1 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-[#1A1A1A]">KAIH</span>
              <span className="text-[9px] text-[#6B6B6B]">7 Karakter</span>
            </Link>
          </div>
        </section>
      </main>

      <BottomNav role="guru" />
    </div>
  );
}
