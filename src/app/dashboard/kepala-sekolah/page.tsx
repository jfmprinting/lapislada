'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { supabase, Kelas, UserProfile } from '@/lib/supabase';
import {
  ShieldCheck,
  Users,
  CalendarCheck,
  Award,
  HeartHandshake,
  FolderLock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  School,
  Clock,
  Printer,
  FileSpreadsheet,
  Building,
} from 'lucide-react';

interface KelasSummary {
  id: string;
  nama_kelas: string;
  wali_kelas_nama: string;
  total_siswa: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  persentase: number;
  is_inputted: boolean;
}

export default function DashboardKepalaSekolahPage() {
  const [loading, setLoading] = useState(true);
  const [kepsekName, setKepsekName] = useState('Santoso, S.Pd., M.Pd');
  const [totalSiswaSekolah, setTotalSiswaSekolah] = useState(0);
  const [totalGuru, setTotalGuru] = useState(0);
  const [totalKehadiranSekolah, setTotalKehadiranSekolah] = useState({ hadir: 0, total: 0, pct: 0 });
  const [totalKaihToday, setTotalKaihToday] = useState(0);
  const [avgNilaiSekolah, setAvgNilaiSekolah] = useState(0);
  const [kelasSummaries, setKelasSummaries] = useState<KelasSummary[]>([]);

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const todayDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadExecutiveData() {
      setLoading(true);
      try {
        // 1. Get Session & Profile
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (user) {
          const { data: prof } = await supabase
            .from('users_profile')
            .select('*')
            .eq('id', user.id)
            .single();
          if (prof?.nama) {
            setKepsekName(prof.nama);
          } else if (user.user_metadata?.nama) {
            setKepsekName(user.user_metadata.nama);
          }
        }

        // 2. Fetch all classes
        const { data: allKelas } = await supabase
          .from('kelas')
          .select('*, wali_kelas:wali_kelas_id(nama)')
          .order('nama_kelas');

        // 3. Fetch all students
        const { data: allSiswa } = await supabase
          .from('siswa')
          .select('id, nama_lengkap, kelas_id');
        const students = allSiswa || [];
        setTotalSiswaSekolah(students.length);

        // 4. Fetch all teachers
        const { count: gCount } = await supabase
          .from('users_profile')
          .select('*', { count: 'exact', head: true })
          .in('role', ['guru', 'admin', 'kepala_sekolah']);
        setTotalGuru(gCount || 0);

        // 5. Fetch today's attendance across school
        const { data: todayAtt } = await supabase
          .from('kehadiran')
          .select('id, siswa_id, kelas_id, status')
          .eq('tanggal', todayDate);
        const attendances = todayAtt || [];

        const totalHadirGlobal = attendances.filter((a) => a.status === 'H').length;
        const totalRecordGlobal = attendances.length;
        const globalPct = totalRecordGlobal > 0 ? Math.round((totalHadirGlobal / totalRecordGlobal) * 100) : 0;
        setTotalKehadiranSekolah({
          hadir: totalHadirGlobal,
          total: totalRecordGlobal,
          pct: globalPct,
        });

        // 6. Build per-class summaries
        if (allKelas && allKelas.length > 0) {
          const summaries: KelasSummary[] = allKelas.map((k: any) => {
            const classStudents = students.filter((s) => s.kelas_id === k.id);
            const classAtt = attendances.filter((a) => a.kelas_id === k.id);
            const isInputted = classAtt.length > 0;

            const h = classAtt.filter((a) => a.status === 'H').length;
            const s = classAtt.filter((a) => a.status === 'S').length;
            const i = classAtt.filter((a) => a.status === 'I').length;
            const a = classAtt.filter((a) => a.status === 'A').length;
            const pct = classAtt.length > 0 ? Math.round((h / classAtt.length) * 100) : 0;

            return {
              id: k.id,
              nama_kelas: k.nama_kelas,
              wali_kelas_nama: k.wali_kelas?.nama || 'Belum Ditugaskan',
              total_siswa: classStudents.length,
              hadir: h,
              sakit: s,
              izin: i,
              alpa: a,
              persentase: pct,
              is_inputted: isInputted,
            };
          });
          setKelasSummaries(summaries);
        }

        // 7. Fetch KAIH count today
        const { count: kaihCount } = await supabase
          .from('kaih_kegiatan')
          .select('*', { count: 'exact', head: true })
          .eq('tanggal', todayDate);
        setTotalKaihToday(kaihCount || 0);

        // 8. Fetch Nilai Average
        const { data: allNilai } = await supabase
          .from('nilai')
          .select('nilai')
          .limit(100);
        if (allNilai && allNilai.length > 0) {
          const sum = allNilai.reduce((acc, curr) => acc + Number(curr.nilai), 0);
          setAvgNilaiSekolah(Math.round((sum / allNilai.length) * 10) / 10);
        } else {
          setAvgNilaiSekolah(84.5); // Baseline fallback
        }
      } catch (err) {
        console.warn('Error loading executive dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadExecutiveData();
  }, [todayDate]);

  const classesPending = kelasSummaries.filter((k) => !k.is_inputted && k.total_siswa > 0).length;

  return (
    <AppShell
      role="kepala_sekolah"
      pageTitle="Dashboard Eksekutif Kepala Sekolah"
      pageSubtitle="Panel Pengawasan & Rekapitulasi Global UPT SD Negeri Latsari 2 Bancar"
    >
      <div className="space-y-6">
        {/* ============================================================ */}
        {/* EXECUTIVE BANNER */}
        {/* ============================================================ */}
        <div className="rounded-3xl bg-linear-to-r from-[#922B21] via-[#7B1E17] to-[#4A100B] text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-bold border border-white/20">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Akses Monitoring Pimpinan Sekolah</span>
            </div>

            <h1 className="font-serif font-bold text-2xl sm:text-3xl tracking-tight leading-tight">
              Selamat Datang, Bapak/Ibu {kepsekName}
            </h1>

            <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
              Memantau perkembangan seluruh kegiatan belajar mengajar, kedisiplinan absensi per rombel, capaian asesmen, dan pembiasaan 7 KAIH se-sekolah dalam satu pintu kendali.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-white/90 font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-300" />
                {todayStr}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <School className="w-4 h-4 text-amber-300" />
                NPSN: 20504924 · UPT SDN Latsari 2 Bancar
              </span>
            </div>
          </div>

          {/* Decorative watermark icon */}
          <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none hidden sm:block">
            <Building className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* ============================================================ */}
        {/* TOP STAT METRICS (KPI CARDS) */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Kehadiran Global */}
          <div className="bg-white rounded-2xl p-5 border border-[#DDD8CE] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                Kehadiran Sekolah
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif font-bold text-2xl sm:text-3xl text-[#1A1A1A]">
                  {totalKehadiranSekolah.pct}%
                </span>
                <span className="text-xs text-emerald-800 font-bold">Hadir</span>
              </div>
              <p className="text-[11px] text-[#6B6B6B] mt-1">
                {totalKehadiranSekolah.hadir} dari {totalKehadiranSekolah.total} siswa tercatat hari ini
              </p>
            </div>
          </div>

          {/* 2. Total Peserta Didik */}
          <div className="bg-white rounded-2xl p-5 border border-[#DDD8CE] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                Total Siswa Aktif
              </span>
              <div className="p-2 rounded-xl bg-[#FDEDEC] text-[#922B21]">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif font-bold text-2xl sm:text-3xl text-[#1A1A1A]">
                  {totalSiswaSekolah}
                </span>
                <span className="text-xs text-[#6B6B6B]">Siswa</span>
              </div>
              <p className="text-[11px] text-[#6B6B6B] mt-1">
                Tersebar di {kelasSummaries.length} Rombel (Kelas I – VI)
              </p>
            </div>
          </div>

          {/* 3. Pendidik & Tenaga Kependidikan */}
          <div className="bg-white rounded-2xl p-5 border border-[#DDD8CE] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                Guru & Staf PTK
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
                <School className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif font-bold text-2xl sm:text-3xl text-[#1A1A1A]">
                  {totalGuru}
                </span>
                <span className="text-xs text-[#6B6B6B]">Personel</span>
              </div>
              <p className="text-[11px] text-[#6B6B6B] mt-1">
                Tenaga pendidik & kependidikan aktif
              </p>
            </div>
          </div>

          {/* 4. Pembiasaan 7 KAIH */}
          <div className="bg-white rounded-2xl p-5 border border-[#DDD8CE] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                Karakter 7 KAIH
              </span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-800">
                <HeartHandshake className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif font-bold text-2xl sm:text-3xl text-[#1A1A1A]">
                  {totalKaihToday}
                </span>
                <span className="text-xs text-purple-800 font-bold">Kegiatan</span>
              </div>
              <p className="text-[11px] text-[#6B6B6B] mt-1">
                Pembiasaan sekolah & rumah tercatat hari ini
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* REKAPITULASI KEHADIRAN ANTAR-KELAS HARI INI */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl border border-[#DDD8CE] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#DDD8CE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-[#922B21]" />
                <h2 className="font-serif font-bold text-base text-[#1A1A1A]">
                  Monitoring Presensi Rombongan Belajar (Hari Ini)
                </h2>
              </div>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Pantau kedisiplinan pengisian absensi kelas oleh masing-masing wali kelas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {classesPending > 0 ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{classesPending} Kelas Belum Input Absen</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Seluruh Kelas Selesai Input</span>
                </div>
              )}

              <Link
                href="/kehadiran"
                className="px-3.5 py-1.5 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold transition flex items-center gap-1"
              >
                <span>Lihat Detail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F2] border-b border-[#DDD8CE] text-[#6B6B6B] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Kelas / Rombel</th>
                  <th className="px-4 py-3">Wali Kelas</th>
                  <th className="px-4 py-3 text-center">Jumlah Siswa</th>
                  <th className="px-4 py-3 text-center">Hadir</th>
                  <th className="px-4 py-3 text-center">Sakit</th>
                  <th className="px-4 py-3 text-center">Izin</th>
                  <th className="px-4 py-3 text-center">Alpa</th>
                  <th className="px-4 py-3 text-center">% Kehadiran</th>
                  <th className="px-4 py-3 text-center">Status Administrasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD8CE]/60">
                {kelasSummaries.map((k) => (
                  <tr key={k.id} className="hover:bg-[#FAF8F2]/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-[#1A1A1A]">
                      {k.nama_kelas}
                    </td>
                    <td className="px-4 py-3 text-[#3D3D3D]">
                      {k.wali_kelas_nama}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-[#1A1A1A]">
                      {k.total_siswa}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-700">
                      {k.is_inputted ? k.hadir : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-blue-700">
                      {k.is_inputted ? k.sakit : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-amber-700">
                      {k.is_inputted ? k.izin : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-red-600 font-bold">
                      {k.is_inputted ? k.alpa : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {k.is_inputted ? (
                        <span className={`font-bold ${k.persentase >= 90 ? 'text-emerald-700' : 'text-amber-800'}`}>
                          {k.persentase}%
                        </span>
                      ) : (
                        <span className="text-[#999]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {k.is_inputted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Sudah Input</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Menunggu Guru</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MENU AKSI CEPAT EKSEKUTIF KEPALA SEKOLAH */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl p-6 border border-[#DDD8CE] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                Pintasan Pengawasan & Administrasi
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                Akses cepat menuju seluruh modul pengawasan operasional sekolah
              </p>
            </div>
            <span className="text-[11px] font-bold text-[#922B21] bg-[#FDEDEC] px-2.5 py-1 rounded-lg border border-[#F1948A]">
              Mode Read-Only Aman
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <Link
              href="/kehadiran"
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#FAF8F2] hover:bg-[#F5F0E8] border border-[#DDD8CE] transition active:scale-95 group text-center"
            >
              <CalendarCheck className="w-6 h-6 text-[#922B21] mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-[#1A1A1A]">Pantau Presensi</span>
              <span className="text-[10px] text-[#6B6B6B]">Semua Rombel</span>
            </Link>

            <Link
              href="/nilai"
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#FAF8F2] hover:bg-[#F5F0E8] border border-[#DDD8CE] transition active:scale-95 group text-center"
            >
              <Award className="w-6 h-6 text-[#922B21] mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-[#1A1A1A]">Leger Nilai</span>
              <span className="text-[10px] text-[#6B6B6B]">Buku Leger Sekolah</span>
            </Link>

            <Link
              href="/kaih"
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#FAF8F2] hover:bg-[#F5F0E8] border border-[#DDD8CE] transition active:scale-95 group text-center"
            >
              <HeartHandshake className="w-6 h-6 text-[#922B21] mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-[#1A1A1A]">Pantau 7 KAIH</span>
              <span className="text-[10px] text-[#6B6B6B]">Sekolah & Rumah</span>
            </Link>

            <Link
              href="/dokumen-bos"
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#FAF8F2] hover:bg-[#F5F0E8] border border-[#DDD8CE] transition active:scale-95 group text-center"
            >
              <FolderLock className="w-6 h-6 text-[#922B21] mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-[#1A1A1A]">Dokumen BOS</span>
              <span className="text-[10px] text-[#6B6B6B]">Laporan & SPJ</span>
            </Link>

            <Link
              href="/buku-penghubung"
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#FAF8F2] hover:bg-[#F5F0E8] border border-[#DDD8CE] transition active:scale-95 group text-center"
            >
              <BookOpen className="w-6 h-6 text-[#922B21] mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xs text-[#1A1A1A]">Buku Penghubung</span>
              <span className="text-[10px] text-[#6B6B6B]">Komunikasi Sekolah</span>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
