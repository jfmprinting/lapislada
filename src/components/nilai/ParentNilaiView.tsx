'use client';

import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { Award, AlertCircle, RefreshCw } from 'lucide-react';
import { Siswa } from '@/lib/supabase';

interface ParentChildGrade {
  mapelId: string;
  mapelNama: string;
  kkm: number;
  skor: number | null;
  catatan: string;
  hasNilai: boolean;
}

interface ParentNilaiViewProps {
  loadingOrangTua: boolean;
  parentChild: Siswa | null;
  parentChildGrades: ParentChildGrade[];
  semester: number;
  tahunAjaran: string;
}

export default function ParentNilaiView({
  loadingOrangTua,
  parentChild,
  parentChildGrades,
  semester,
  tahunAjaran,
}: ParentNilaiViewProps) {
  if (loadingOrangTua) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5F0E8] text-[#1A1A1A]">
        <Navbar schoolName="Portal Nilai Siswa" showLogout={true} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-[#DDD8CE] shadow-xs">
            <RefreshCw className="w-5 h-5 text-[#922B21] animate-spin" />
            <span className="text-sm font-semibold text-[#555]">Memuat capaian nilai ananda...</span>
          </div>
        </div>
        <BottomNav role="orangtua" />
      </div>
    );
  }

  // Hitung rata-rata dan ketuntasan HANYA dari nilai yang sudah diinput guru
  const gradedSubjects = parentChildGrades.filter((g) => g.hasNilai && g.skor !== null);
  const totalScore = gradedSubjects.reduce((acc, curr) => acc + (curr.skor || 0), 0);
  const avgScore =
    gradedSubjects.length > 0 ? Math.round((totalScore / gradedSubjects.length) * 10) / 10 : null;
  const passedSubjects = gradedSubjects.filter((g) => (g.skor || 0) >= g.kkm).length;

  const childName = parentChild?.nama_lengkap || 'Data Siswa Belum Tertaut';
  const childNisn = parentChild?.nisn || '-';
  const childClass = (parentChild?.kelas as any)?.nama_kelas || 'Kelas I';

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8] pb-24 text-[#1A1A1A]">
      <Navbar schoolName="Portal Nilai Siswa" showLogout={true} />

      <main className="w-full max-w-4xl mx-auto px-4 py-5 flex-1 space-y-5">
        {/* Back link & Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/orangtua"
            className="text-xs font-bold text-[#922B21] hover:underline inline-flex items-center gap-1"
          >
            <span>← Kembali ke Dashboard</span>
          </Link>
          <span className="text-xs text-[#666] font-medium">
            Semester {semester} · TP {tahunAjaran}
          </span>
        </div>

        {/* Child Identity Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DDD8CE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FDEDEC] text-[#922B21] border border-[#F1948A] flex items-center justify-center font-bold text-xl uppercase">
              {childName.charAt(0) || 'S'}
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#922B21] uppercase tracking-wider block">
                Laporan Capaian Belajar Ananda
              </span>
              <h1 className="font-serif font-bold text-xl text-[#1A1A1A]">{childName}</h1>
              <div className="flex items-center gap-2 mt-1 text-xs text-[#666]">
                <span>NISN: {childNisn}</span>
                <span>•</span>
                <span className="font-semibold text-[#922B21] bg-[#FDEDEC] px-2 py-0.5 rounded-md">
                  {childClass}
                </span>
              </div>
            </div>
          </div>

          {/* Quick KPI Badge: Only calculated if grades exist */}
          <div className="flex items-center gap-3 bg-[#FAF8F2] p-3 rounded-xl border border-[#DDD8CE]">
            <div className="text-right">
              <span className="block text-[10px] text-[#666] uppercase font-bold tracking-wider">
                Rata-rata Nilai
              </span>
              <span
                className={`font-serif font-bold text-2xl ${
                  avgScore !== null ? 'text-emerald-700' : 'text-[#888]'
                }`}
              >
                {avgScore !== null ? avgScore : '—'}
              </span>
            </div>
            <div className="w-px h-8 bg-[#DDD8CE]" />
            <div>
              <span className="block text-[10px] text-[#666] uppercase font-bold tracking-wider">
                Ketuntasan
              </span>
              {gradedSubjects.length > 0 ? (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md block mt-0.5">
                  {passedSubjects}/{gradedSubjects.length} Tuntas
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-[#666] bg-[#EDE8DE] px-2 py-0.5 rounded-md block mt-0.5">
                  Belum ada nilai
                </span>
              )}
            </div>
          </div>
        </div>

        {/* If no child account connected */}
        {!parentChild && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="block font-bold">
                Akun Anda belum tertaut dengan data ananda.
              </strong>
              Silakan hubungi admin sekolah atau wali kelas untuk menghubungkan email akun wali murid
              dengan nama siswa yang bersangkutan.
            </div>
          </div>
        )}

        {/* Subject Cards Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-base text-[#1A1A1A] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#922B21]" />
              <span>Daftar Nilai Capaian Kompetensi</span>
            </h2>
            <span className="text-xs text-[#777]">
              {gradedSubjects.length} dari {parentChildGrades.length} mapel telah dinilai
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {parentChildGrades.map((g, idx) => {
              const hasScore = g.hasNilai && g.skor !== null;
              const isPassed = hasScore && (g.skor as number) >= g.kkm;
              const percentage = hasScore
                ? Math.min(100, Math.round(((g.skor as number) / 100) * 100))
                : 0;

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white border border-[#DDD8CE] shadow-xs hover:border-[#922B21]/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-sm text-[#1A1A1A] leading-snug">
                          {g.mapelNama}
                        </h3>
                        <span className="text-[11px] text-[#666]">
                          Standar KKM: <strong className="text-[#1A1A1A]">{g.kkm}</strong>
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        {hasScore ? (
                          <>
                            <span
                              className={`font-serif font-bold text-2xl block leading-none ${
                                isPassed ? 'text-emerald-700' : 'text-[#922B21]'
                              }`}
                            >
                              {g.skor}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block mt-1 ${
                                isPassed
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-[#FDEDEC] text-[#922B21] border border-[#F1948A]'
                              }`}
                            >
                              {isPassed ? 'TUNTAS' : 'PERLU BIMBINGAN'}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-serif font-bold text-2xl block leading-none text-[#A09D95]">
                              —
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block mt-1 bg-[#F5F0E8] text-[#777] border border-[#DDD8CE]">
                              BELUM DIINPUT
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#F5F0E8] rounded-full h-2 mb-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          hasScore ? (isPassed ? 'bg-emerald-600' : 'bg-[#922B21]') : 'bg-transparent'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    {/* Teacher's narrative feedback */}
                    <div className="p-2.5 rounded-lg bg-[#FAF8F2] border border-[#DDD8CE]/60 text-xs text-[#4A4A4A]">
                      <span className="text-[10px] font-bold text-[#922B21] uppercase block mb-0.5">
                        Catatan Guru Pengampu:
                      </span>
                      <p className={`leading-relaxed ${hasScore ? 'italic' : 'text-[#777]'}`}>
                        {hasScore ? `“${g.catatan}”` : g.catatan}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <BottomNav role="orangtua" />
    </div>
  );
}
