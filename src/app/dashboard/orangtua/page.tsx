'use client';

import { useState } from 'react';
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
} from 'lucide-react';

export default function DashboardOrangTuaPage() {
  const [studentName] = useState('Ahmad Budi Santoso');
  const [studentClass] = useState('Kelas 4A');

  // Kehadiran stats (WF-04)
  const attendanceStats = {
    hadir: 18,
    sakit: 1,
    izin: 0,
    alpha: 1,
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8] pb-24 text-[#1A1A1A]">
      <Navbar schoolName="Portal Orang Tua" />

      <main className="w-full max-w-md mx-auto sm:max-w-xl md:max-w-2xl px-4 py-4 flex-1 space-y-4">
        {/* GREETING CARD */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#DDD8CE]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#6B6B6B]">
                Selamat Datang,
              </span>
              <h1 className="font-serif font-bold text-lg text-[#1A1A1A]">
                Pak Budi Santoso 👋
              </h1>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#FDEDEC] text-[#922B21] flex items-center justify-center font-bold text-sm border border-[#F1948A]">
              AB
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
              href="/buku-penghubung"
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
                href="/buku-penghubung"
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
              href="/pengumuman"
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
