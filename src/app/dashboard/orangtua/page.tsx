'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import {
  CalendarCheck,
  BookOpen,
  Bell,
  User,
  Plus,
  ArrowRight,
  Sparkles,
  Heart,
  Award,
  LogOut,
  HeartHandshake,
  Camera,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/components/ui/NotificationContext';

export default function DashboardOrangTuaPage() {
  const { confirm, showToast } = useNotification();
  const [parentName, setParentName] = useState('Pak Budi Santoso');
  const [studentName, setStudentName] = useState('Ahmad Budi Santoso');
  const [studentClass, setStudentClass] = useState('Kelas 4A');
  const [avatarInitials, setAvatarInitials] = useState('AB');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata;
        if (meta?.nama) {
          const rawName = meta.nama.replace(/\s*\(Wali Murid\)/i, '').trim();
          setStudentName(rawName);
          setParentName(`Wali Murid ${rawName}`);
          const initials = rawName
            .split(' ')
            .slice(0, 2)
            .map((w: string) => w[0])
            .join('')
            .toUpperCase();
          setAvatarInitials(initials || 'WM');
        }
      }
    });
  }, []);

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      title: 'Keluar dari Akun?',
      message: 'Apakah Anda yakin ingin keluar dari Portal Orang Tua LAPIS LADA?',
      confirmText: 'Ya, Keluar',
      cancelText: 'Batal',
      isDanger: false,
    });
    if (!isConfirmed) return;

    await supabase.auth.signOut();
    showToast({ type: 'info', message: 'Anda telah keluar dari akun. Mengalihkan...' });
    setTimeout(() => {
      window.location.href = '/login?role=orangtua';
    }, 300);
  };

  // Kehadiran stats (WF-04)
  const attendanceStats = {
    hadir: 18,
    sakit: 1,
    izin: 0,
    alpha: 1,
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8] pb-24 text-[#1A1A1A]">
      <Navbar schoolName="Portal Orang Tua" showLogout={true} />

      <main className="w-full max-w-md mx-auto sm:max-w-xl md:max-w-2xl px-4 py-4 flex-1 space-y-4">
        {/* GREETING CARD */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#DDD8CE]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-[#6B6B6B]">
                Selamat Datang,
              </span>
              <h1 className="font-serif font-bold text-base sm:text-lg text-[#1A1A1A] leading-tight">
                {parentName} 👋
              </h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FDEDEC] text-[#922B21] flex items-center justify-center font-bold text-xs sm:text-sm border border-[#F1948A]">
                {avatarInitials}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#922B21] bg-[#FDEDEC] hover:bg-[#FADBD8] border border-[#F1948A] transition-colors cursor-pointer shadow-xs active:scale-95"
                title="Keluar dari Akun"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="font-bold text-[11px]">Keluar</span>
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#F5F0E8] flex items-center justify-between text-xs">
            <span className="text-[#6B6B6B]">Memantau Ananda:</span>
            <span className="font-bold text-[#922B21] bg-[#FDEDEC] px-2.5 py-0.5 rounded-full border border-[#F1948A]">
              {studentName} · {studentClass}
            </span>
          </div>
        </section>

        {/* KEHADIRAN BULAN INI (WF-04) */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-[#DDD8CE]">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#F5F0E8]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[#FDEDEC] text-[#922B21]">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <h2 className="font-serif font-bold text-sm text-[#1A1A1A]">
                Kehadiran Bulan Ini
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-[#6B6B6B]">
              Total 20 Hari Efektif
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="block font-serif font-bold text-xl text-emerald-800">
                {attendanceStats.hadir}
              </span>
              <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                Hadir
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="block font-serif font-bold text-xl text-amber-800">
                {attendanceStats.sakit}
              </span>
              <span className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                Sakit
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
              <span className="block font-serif font-bold text-xl text-blue-800">
                {attendanceStats.izin}
              </span>
              <span className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                Izin
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#FDEDEC] border border-[#F1948A]">
              <span className="block font-serif font-bold text-xl text-[#922B21]">
                {attendanceStats.alpha}
              </span>
              <span className="block text-[10px] font-bold text-[#922B21] uppercase tracking-wider">
                Alpha
              </span>
            </div>
          </div>
        </section>

        {/* KARAKTER KAIH ANANDA (7 Kebiasaan Anak Indonesia Hebat) */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-[#DDD8CE]">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#F5F0E8]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[#FDEDEC] text-[#922B21]">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-sm text-[#1A1A1A]">
                  Karakter KAIH Ananda
                </h2>
                <span className="text-[10px] text-[#6B6B6B] block">7 Kebiasaan Anak Indonesia Hebat</span>
              </div>
            </div>
            <Link
              href="/kaih?role=orangtua"
              className="text-xs font-bold text-[#C0392B] hover:underline flex items-center gap-1"
            >
              <span>Buka Log KAIH</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#DDD8CE] space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-semibold text-[#666] block">
                  Pembiasaan di Rumah Hari Ini:
                </span>
                <p className="text-xs font-bold text-[#1A1A1A] mt-0.5">
                  2 Kegiatan Dicatat (Merapikan Kamar & Sarapan Sehat)
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Sudah Direspon Guru 👍
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-[#E8E0D0]">
              <Link
                href="/kaih?role=orangtua"
                className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>+ Catat & Foto Bukti Hari Ini</span>
              </Link>
              <Link
                href="/kaih?role=orangtua"
                className="w-full sm:w-auto py-2 px-3 rounded-xl bg-white border border-[#DDD8CE] hover:bg-[#F5F0E8] text-[#1A1A1A] font-bold text-xs shadow-xs transition text-center"
              >
                Lihat Kegiatan Kelas Hari Ini
              </Link>
            </div>
          </div>
        </section>

        {/* CAPAIAN NILAI & ASESMEN (Fitur Transparansi Nilai) */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-[#DDD8CE]">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#F5F0E8]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[#FDEDEC] text-[#922B21]">
                <Award className="w-4 h-4" />
              </div>
              <h2 className="font-serif font-bold text-sm text-[#1A1A1A]">
                Capaian Nilai & Asesmen
              </h2>
            </div>
            <Link
              href="/nilai?role=orangtua"
              className="text-xs font-bold text-[#C0392B] hover:underline flex items-center gap-1"
            >
              <span>Lihat Detail Nilai</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#DDD8CE] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#666] block">
                Rata-rata Capaian Belajar Semester Ini
              </span>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-2xl text-emerald-700">88.5</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  Sangat Baik · 9/9 Tuntas
                </span>
              </div>
              <p className="text-[11px] text-[#666]">
                Seluruh nilai mata pelajaran (Formatif & Sumatif) memenuhi standar KKM.
              </p>
            </div>
            <Link
              href="/nilai?role=orangtua"
              className="px-3.5 py-2 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-white font-bold text-xs shadow-xs transition-colors shrink-0"
            >
              Buka Rapor Nilai
            </Link>
          </div>
        </section>

        {/* BUKU PENGHUBUNG DUA ARAH (WF-04 - Fitur Utama v2) */}
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
              href="/buku-penghubung?role=orangtua"
              className="text-xs font-bold text-[#C0392B] hover:underline flex items-center gap-1"
            >
              <span>Semua Catatan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Entry from Guru */}
            <div className="p-3 rounded-lg bg-[#FAF8F2] border border-[#DDD8CE]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#922B21] text-white">
                  [GURU] Bu Sari, S.Pd
                </span>
                <span className="text-[10px] text-[#6B6B6B]">Hari ini · 14.15</span>
              </div>
              <p className="text-xs text-[#1A1A1A] leading-relaxed">
                &ldquo;Ahmad mengerjakan PR Matematika dengan sangat baik hari ini dan aktif membantu temannya di kelompok. Terima kasih atas pendampingannya di rumah ya Pak.&rdquo;
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/buku-penghubung?role=orangtua&tulis=true"
                className="w-full py-2.5 px-4 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tulis Catatan ke Guru</span>
              </Link>
            </div>
          </div>
        </section>

        {/* PENGUMUMAN TERBARU (WF-04) */}
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
              href="/pengumuman?role=orangtua"
              className="text-xs font-bold text-[#C0392B] hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-3 rounded-lg bg-[#FAF8F2] border border-[#DDD8CE] text-xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#922B21]" />
              <h4 className="font-bold text-[#1A1A1A]">
                Libur Nasional Maulid Nabi & Imbauan Belajar
              </h4>
            </div>
            <p className="text-[11px] text-[#6B6B6B] pl-4">
              Diberitahukan kepada seluruh wali murid bahwa pembelajaran mandiri di rumah dilaksanakan hari Senin mendatang.
            </p>
          </div>
        </section>
      </main>

      <BottomNav role="orangtua" />
    </div>
  );
}
