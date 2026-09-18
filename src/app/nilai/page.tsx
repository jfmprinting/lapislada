'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import AppShell from '@/components/layout/AppShell';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { useNotification } from '@/components/ui/NotificationContext';
import { supabase, Siswa, Kelas, Mapel, Nilai } from '@/lib/supabase';
import {
  Award,
  BookOpen,
  Filter,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  Save,
  TrendingUp,
  Search,
  Sparkles,
  Layers,
  ChevronRight,
  UserCheck,
  Calendar,
  Clock,
  ArrowRight,
  FileSpreadsheet,
} from 'lucide-react';

// Default subjects list with KKM
const DEFAULT_MAPEL: Mapel[] = [
  { id: 'm-pai', nama_mapel: 'Pendidikan Agama & Budi Pekerti', kkm: 75 },
  { id: 'm-pkn', nama_mapel: 'Pendidikan Pancasila', kkm: 75 },
  { id: 'm-indo', nama_mapel: 'Bahasa Indonesia', kkm: 75 },
  { id: 'm-mtk', nama_mapel: 'Matematika', kkm: 70 },
  { id: 'm-ipas', nama_mapel: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', kkm: 75 },
  { id: 'm-pjok', nama_mapel: 'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)', kkm: 75 },
  { id: 'm-seni', nama_mapel: 'Seni dan Budaya', kkm: 75 },
  { id: 'm-jawa', nama_mapel: 'Bahasa Jawa (Mulok)', kkm: 75 },
  { id: 'm-inggris', nama_mapel: 'Bahasa Inggris', kkm: 70 },
];

// Initial sample students for Kelas 4A
const SAMPLE_STUDENTS: Siswa[] = [
  { id: 's-1', nama_lengkap: 'Ahmad Budi Santoso', nisn: '0123456789', nis: '2001', jenis_kelamin: 'L', kelas_id: 'k-4a' },
  { id: 's-2', nama_lengkap: 'Citra Dewi Lestari', nisn: '0123456790', nis: '2002', jenis_kelamin: 'P', kelas_id: 'k-4a' },
  { id: 's-3', nama_lengkap: 'Dimas Prasetyo', nisn: '0123456791', nis: '2003', jenis_kelamin: 'L', kelas_id: 'k-4a' },
  { id: 's-4', nama_lengkap: 'Eka Nur Aini', nisn: '0123456792', nis: '2004', jenis_kelamin: 'P', kelas_id: 'k-4a' },
  { id: 's-5', nama_lengkap: 'Fajar Hidayat', nisn: '0123456793', nis: '2005', jenis_kelamin: 'L', kelas_id: 'k-4a' },
  { id: 's-6', nama_lengkap: 'Gita Maharani', nisn: '0123456794', nis: '2006', jenis_kelamin: 'P', kelas_id: 'k-4a' },
  { id: 's-7', nama_lengkap: 'Hafiz Al-Fatih', nisn: '0123456795', nis: '2007', jenis_kelamin: 'L', kelas_id: 'k-4a' },
  { id: 's-8', nama_lengkap: 'Indah Permatasari', nisn: '0123456796', nis: '2008', jenis_kelamin: 'P', kelas_id: 'k-4a' },
];

function NilaiContent() {
  const searchParams = useSearchParams();
  const { showToast } = useNotification();

  // Role detection: orangtua vs guru/admin
  const roleParam = searchParams.get('role');
  const isOrangTua = roleParam === 'orangtua';

  // Tabs for Guru: 'input' (Guru Mapel/Kelas) vs 'leger' (Wali Kelas)
  const [activeTab, setActiveTab] = useState<'input' | 'leger'>('input');

  // Filter States
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>(DEFAULT_MAPEL);
  const [siswaList, setSiswaList] = useState<Siswa[]>(SAMPLE_STUDENTS);

  const [selectedKelasId, setSelectedKelasId] = useState<string>('k-4a');
  const [selectedMapelId, setSelectedMapelId] = useState<string>('m-mtk');
  const [selectedJenisAsesmen, setSelectedJenisAsesmen] = useState<string>('Sumatif Lingkup Materi (Bab 1)');
  const [semester, setSemester] = useState<number>(1);
  const [tahunAjaran, setTahunAjaran] = useState<string>('2026/2027');

  // Input Grid State: studentId -> { nilai: number, catatan: string }
  const [gridScores, setGridScores] = useState<Record<string, { nilai: number; catatan: string }>>({
    's-1': { nilai: 92, catatan: 'Sangat menguasai konsep pecahan senilai' },
    's-2': { nilai: 88, catatan: 'Mampu menyelesaikan soal cerita dengan teliti' },
    's-3': { nilai: 78, catatan: 'Perlu latihan pembagian pecahan lanjutan' },
    's-4': { nilai: 85, catatan: 'Baik dalam operasi penjumlahan pecahan' },
    's-5': { nilai: 70, catatan: 'Perlu pendampingan remedial konsep dasar' },
    's-6': { nilai: 95, catatan: 'Istimewa dalam penalaran matematika' },
    's-7': { nilai: 82, catatan: 'Cukup teliti dan mandiri' },
    's-8': { nilai: 90, catatan: 'Aktif bertanya dan pemahaman sangat baik' },
  });

  // Leger Full Matrix State: studentId -> { [mapelId]: number }
  const [legerData, setLegerData] = useState<Record<string, Record<string, number>>>({
    's-1': { 'm-pai': 94, 'm-pkn': 88, 'm-indo': 90, 'm-mtk': 92, 'm-ipas': 95, 'm-pjok': 86, 'm-seni': 85, 'm-jawa': 88, 'm-inggris': 89 },
    's-2': { 'm-pai': 96, 'm-pkn': 92, 'm-indo': 94, 'm-mtk': 88, 'm-ipas': 90, 'm-pjok': 82, 'm-seni': 90, 'm-jawa': 87, 'm-inggris': 91 },
    's-3': { 'm-pai': 85, 'm-pkn': 80, 'm-indo': 82, 'm-mtk': 78, 'm-ipas': 84, 'm-pjok': 88, 'm-seni': 80, 'm-jawa': 79, 'm-inggris': 75 },
    's-4': { 'm-pai': 90, 'm-pkn': 86, 'm-indo': 88, 'm-mtk': 85, 'm-ipas': 86, 'm-pjok': 80, 'm-seni': 88, 'm-jawa': 84, 'm-inggris': 82 },
    's-5': { 'm-pai': 82, 'm-pkn': 76, 'm-indo': 78, 'm-mtk': 70, 'm-ipas': 76, 'm-pjok': 90, 'm-seni': 75, 'm-jawa': 74, 'm-inggris': 72 },
    's-6': { 'm-pai': 98, 'm-pkn': 95, 'm-indo': 96, 'm-mtk': 95, 'm-ipas': 96, 'm-pjok': 85, 'm-seni': 92, 'm-jawa': 90, 'm-inggris': 94 },
    's-7': { 'm-pai': 88, 'm-pkn': 84, 'm-indo': 85, 'm-mtk': 82, 'm-ipas': 85, 'm-pjok': 84, 'm-seni': 82, 'm-jawa': 80, 'm-inggris': 80 },
    's-8': { 'm-pai': 92, 'm-pkn': 89, 'm-indo': 91, 'm-mtk': 90, 'm-ipas': 92, 'm-pjok': 83, 'm-seni': 89, 'm-jawa': 86, 'm-inggris': 88 },
  });

  const [saving, setSaving] = useState(false);

  // Load classes, subjects, and students
  useEffect(() => {
    async function loadData() {
      try {
        // Fetch kelas
        const { data: kData } = await supabase.from('kelas').select('*').order('nama_kelas');
        if (kData && kData.length > 0) {
          setKelasList(kData);
        } else {
          setKelasList([
            { id: 'k-1', nama_kelas: 'Kelas 1', tahun_ajaran: '2026/2027' },
            { id: 'k-2', nama_kelas: 'Kelas 2', tahun_ajaran: '2026/2027' },
            { id: 'k-3', nama_kelas: 'Kelas 3', tahun_ajaran: '2026/2027' },
            { id: 'k-4a', nama_kelas: 'Kelas 4A', tahun_ajaran: '2026/2027' },
            { id: 'k-4b', nama_kelas: 'Kelas 4B', tahun_ajaran: '2026/2027' },
            { id: 'k-5a', nama_kelas: 'Kelas 5A', tahun_ajaran: '2026/2027' },
            { id: 'k-6a', nama_kelas: 'Kelas 6A', tahun_ajaran: '2026/2027' },
          ]);
        }

        // Fetch mapel
        const { data: mData } = await supabase.from('mapel').select('*').order('nama_mapel');
        if (mData && mData.length > 0) {
          setMapelList(mData);
        }

        // Fetch students
        const { data: sData } = await supabase.from('siswa').select('*').order('nama_lengkap');
        if (sData && sData.length > 0) {
          setSiswaList(sData);
        }
      } catch (err) {
        console.warn('Error loading academic data:', err);
      }
    }
    loadData();
  }, []);

  // Filtered students based on selected class
  const currentStudents = useMemo(() => {
    return siswaList.filter((s) => s.kelas_id === selectedKelasId || !s.kelas_id || selectedKelasId === 'k-4a');
  }, [siswaList, selectedKelasId]);

  // Current selected mapel metadata
  const currentMapel = useMemo(() => {
    return mapelList.find((m) => m.id === selectedMapelId) || mapelList[0];
  }, [mapelList, selectedMapelId]);

  const kkm = currentMapel?.kkm || 75;

  // Statistics calculation for the current grid
  const stats = useMemo(() => {
    const scores = currentStudents.map((s) => gridScores[s.id]?.nilai || 0).filter((v) => v > 0);
    if (scores.length === 0) return { avg: 0, highest: 0, lowest: 0, passRate: 0 };
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = Math.round((sum / scores.length) * 10) / 10;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const passedCount = scores.filter((sc) => sc >= kkm).length;
    const passRate = Math.round((passedCount / scores.length) * 100);
    return { avg, highest, lowest, passRate };
  }, [currentStudents, gridScores, kkm]);

  // Handler: Update score for a single student
  const handleScoreChange = (studentId: string, value: number) => {
    const clamped = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));
    setGridScores((prev) => ({
      ...prev,
      [studentId]: {
        nilai: clamped,
        catatan: prev[studentId]?.catatan || '',
      },
    }));
  };

  // Handler: Update note for a student
  const handleNoteChange = (studentId: string, catatan: string) => {
    setGridScores((prev) => ({
      ...prev,
      [studentId]: {
        nilai: prev[studentId]?.nilai || 0,
        catatan,
      },
    }));
  };

  // Save all scores to database
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Upsert to Supabase 'nilai' table
      const upsertRows = currentStudents.map((s) => ({
        siswa_id: s.id.startsWith('s-') ? null : s.id,
        mapel_id: currentMapel.id.startsWith('m-') ? null : currentMapel.id,
        jenis_ujian: selectedJenisAsesmen,
        nilai: gridScores[s.id]?.nilai || 0,
        semester,
        tahun_ajaran: tahunAjaran,
        catatan: gridScores[s.id]?.catatan || null,
        created_at: new Date().toISOString(),
      })).filter((r) => r.siswa_id && r.mapel_id);

      if (upsertRows.length > 0) {
        await supabase.from('nilai').upsert(upsertRows);
      }

      // Also update local leger state
      setLegerData((prev) => {
        const next = { ...prev };
        currentStudents.forEach((s) => {
          if (!next[s.id]) next[s.id] = {};
          next[s.id][selectedMapelId] = gridScores[s.id]?.nilai || 0;
        });
        return next;
      });

      showToast({
        type: 'success',
        title: 'Nilai Berhasil Disimpan',
        message: `Nilai ${currentStudents.length} siswa untuk ${currentMapel.nama_mapel} telah tersimpan dan diperbarui di Leger Wali Kelas.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        message: err.message || 'Gagal menyimpan nilai ke server.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Export Leger to Excel
  const handleExportLeger = () => {
    const selectedClassObj = kelasList.find((k) => k.id === selectedKelasId);
    const headers = [
      'No',
      'NISN',
      'Nama Peserta Didik',
      ...mapelList.map((m) => m.nama_mapel),
      'Total Nilai',
      'Rata-rata',
      'Status Ketuntasan',
    ];

    const rows = currentStudents.map((s, idx) => {
      const studentGrades = mapelList.map((m) => legerData[s.id]?.[m.id] || 0);
      const total = studentGrades.reduce((a, b) => a + b, 0);
      const avg = Math.round((total / (mapelList.length || 1)) * 10) / 10;
      const allPassed = mapelList.every((m) => (legerData[s.id]?.[m.id] || 0) >= m.kkm);

      return [
        idx + 1,
        s.nisn || '-',
        s.nama_lengkap,
        ...studentGrades,
        total,
        avg,
        allPassed ? 'TUNTAS' : 'REMIDIAL',
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leger Nilai');
    XLSX.writeFile(wb, `Leger_Nilai_${selectedClassObj?.nama_kelas || 'Kelas'}_${tahunAjaran.replace('/', '-')}.xlsx`);
    showToast({ type: 'success', message: 'Leger nilai berhasil diekspor ke Excel!' });
  };

  // Print Leger
  const handlePrint = () => {
    window.print();
  };

  // =========================================================================
  // VIEW 1: ORANG TUA / WALI MURID VIEW
  // =========================================================================
  if (isOrangTua) {
    // Child: Ahmad Budi Santoso (sample default)
    const childId = 's-1';
    const childStudent = currentStudents.find((s) => s.id === childId) || currentStudents[0];
    const childGrades = mapelList.map((m) => ({
      mapel: m.nama_mapel,
      kkm: m.kkm,
      skor: legerData[childId]?.[m.id] || 88,
      catatan:
        m.id === 'm-mtk'
          ? 'Sangat menguasai konsep pecahan senilai dan aktif dalam kerja kelompok.'
          : m.id === 'm-ipas'
          ? 'Memahami rantai makanan & interaksi ekosistem dengan sangat baik.'
          : 'Partisipasi pembelajaran aktif dan tugas diselesaikan tepat waktu.',
    }));

    const totalScore = childGrades.reduce((a, b) => a + b.skor, 0);
    const avgScore = Math.round((totalScore / childGrades.length) * 10) / 10;
    const passedSubjects = childGrades.filter((g) => g.skor >= g.kkm).length;

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
            <span className="text-xs text-[#666] font-medium">Semester 1 · TP 2026/2027</span>
          </div>

          {/* Child Identity Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DDD8CE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FDEDEC] text-[#922B21] border border-[#F1948A] flex items-center justify-center font-bold text-xl">
                {childStudent?.nama_lengkap?.charAt(0) || 'A'}
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#922B21] uppercase tracking-wider block">
                  Laporan Capaian Belajar Ananda
                </span>
                <h1 className="font-serif font-bold text-xl text-[#1A1A1A]">
                  {childStudent?.nama_lengkap || 'Ahmad Budi Santoso'}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-xs text-[#666]">
                  <span>NISN: {childStudent?.nisn || '0123456789'}</span>
                  <span>•</span>
                  <span className="font-semibold text-[#922B21] bg-[#FDEDEC] px-2 py-0.5 rounded-md">
                    Kelas 4A
                  </span>
                </div>
              </div>
            </div>

            {/* Quick KPI Badge */}
            <div className="flex items-center gap-3 bg-[#FAF8F2] p-3 rounded-xl border border-[#DDD8CE]">
              <div className="text-right">
                <span className="block text-[10px] text-[#666] uppercase font-bold tracking-wider">
                  Rata-rata Nilai
                </span>
                <span className="font-serif font-bold text-2xl text-emerald-700">
                  {avgScore}
                </span>
              </div>
              <div className="w-px h-8 bg-[#DDD8CE]" />
              <div>
                <span className="block text-[10px] text-[#666] uppercase font-bold tracking-wider">
                  Ketuntasan
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md block mt-0.5">
                  {passedSubjects}/{childGrades.length} Tuntas
                </span>
              </div>
            </div>
          </div>

          {/* Subject Cards Grid */}
          <div className="space-y-3">
            <h2 className="font-serif font-bold text-base text-[#1A1A1A] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#922B21]" />
              <span>Daftar Nilai Capaian Kompetensi</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {childGrades.map((g, idx) => {
                const isPassed = g.skor >= g.kkm;
                const percentage = Math.min(100, Math.round((g.skor / 100) * 100));

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white border border-[#DDD8CE] shadow-xs hover:border-[#922B21]/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-sm text-[#1A1A1A] leading-snug">
                            {g.mapel}
                          </h3>
                          <span className="text-[11px] text-[#666]">
                            Standar KKM: <strong className="text-[#1A1A1A]">{g.kkm}</strong>
                          </span>
                        </div>
                        <div className="text-right shrink-0">
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
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-[#F5F0E8] rounded-full h-2 mb-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPassed ? 'bg-emerald-600' : 'bg-[#922B21]'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      {/* Teacher's narrative feedback */}
                      <div className="p-2.5 rounded-lg bg-[#FAF8F2] border border-[#DDD8CE]/60 text-xs text-[#4A4A4A]">
                        <span className="text-[10px] font-bold text-[#922B21] uppercase block mb-0.5">
                          Catatan Guru Pengampu:
                        </span>
                        <p className="italic leading-relaxed">&ldquo;{g.catatan}&rdquo;</p>
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

  // =========================================================================
  // VIEW 2: GURU & WALI KELAS VIEW
  // =========================================================================
  return (
    <AppShell
      role="guru"
      pageTitle="Nilai & Asesmen Siswa"
      pageSubtitle="Alur input nilai guru mata pelajaran dan buku leger rekapitulasi wali kelas"
    >
      <div className="space-y-6">
        {/* TOP TAB TOGGLE: Input Asesmen Mapel VS Buku Leger Rombel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-[#DDD8CE] shadow-xs">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F5F0E8] rounded-xl border border-[#DDD8CE]/70 sm:w-auto">
            <button
              onClick={() => setActiveTab('input')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'input'
                  ? 'bg-[#922B21] text-white shadow-xs'
                  : 'text-[#666] hover:text-[#1A1A1A]'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Input Nilai Guru Mapel</span>
            </button>

            <button
              onClick={() => setActiveTab('leger')}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'leger'
                  ? 'bg-[#922B21] text-white shadow-xs'
                  : 'text-[#666] hover:text-[#1A1A1A]'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Buku Leger Wali Kelas</span>
            </button>
          </div>

          <div className="flex items-center gap-2 px-2 text-xs text-[#666]">
            <span>Tahun Ajaran:</span>
            <span className="font-bold text-[#1A1A1A] bg-[#FAF8F2] px-2.5 py-1 rounded-lg border border-[#DDD8CE]">
              {tahunAjaran} · Sem {semester}
            </span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: INPUT NILAI GURU MAPEL */}
        {/* =================================================================== */}
        {activeTab === 'input' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Filter Card: Kelas, Mapel, Asesmen */}
            <div className="bg-white rounded-2xl p-5 border border-[#DDD8CE] shadow-xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Pilih Kelas Diajar */}
                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#922B21]" />
                    <span>1. Kelas / Rombel Diajar:</span>
                  </label>
                  <select
                    value={selectedKelasId}
                    onChange={(e) => setSelectedKelasId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F2] border border-[#DDD8CE] rounded-xl text-xs font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                  >
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Pilih Mata Pelajaran */}
                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#922B21]" />
                    <span>2. Mata Pelajaran Diampu:</span>
                  </label>
                  <select
                    value={selectedMapelId}
                    onChange={(e) => setSelectedMapelId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F2] border border-[#DDD8CE] rounded-xl text-xs font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                  >
                    {mapelList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama_mapel} (KKM: {m.kkm})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Jenis Asesmen */}
                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#922B21]" />
                    <span>3. Jenis Asesmen / Ujian:</span>
                  </label>
                  <select
                    value={selectedJenisAsesmen}
                    onChange={(e) => setSelectedJenisAsesmen(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F2] border border-[#DDD8CE] rounded-xl text-xs font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                  >
                    <option value="Formatif (Tujuan Pembelajaran 1)">Formatif (Tujuan Pembelajaran 1)</option>
                    <option value="Formatif (Tujuan Pembelajaran 2)">Formatif (Tujuan Pembelajaran 2)</option>
                    <option value="Sumatif Lingkup Materi (Bab 1)">Sumatif Lingkup Materi (Bab 1)</option>
                    <option value="Sumatif Lingkup Materi (Bab 2)">Sumatif Lingkup Materi (Bab 2)</option>
                    <option value="Sumatif Tengah Semester (STS / UTS)">Sumatif Tengah Semester (STS / UTS)</option>
                    <option value="Sumatif Akhir Semester (SAS / PAS)">Sumatif Akhir Semester (SAS / PAS)</option>
                  </select>
                </div>
              </div>

              {/* Statistical KPI Ribbon */}
              <div className="pt-3 border-t border-[#DDD8CE] grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#FAF8F2] border border-[#DDD8CE]/80">
                  <span className="block text-[10px] text-[#666] uppercase font-bold tracking-wider">
                    Jumlah Siswa
                  </span>
                  <span className="font-bold text-lg text-[#1A1A1A]">
                    {currentStudents.length} Siswa
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="block text-[10px] text-emerald-800 uppercase font-bold tracking-wider">
                    Rata-rata Kelas
                  </span>
                  <span className="font-serif font-bold text-lg text-emerald-800">
                    {stats.avg}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="block text-[10px] text-blue-800 uppercase font-bold tracking-wider">
                    Ketuntasan (≥ KKM {kkm})
                  </span>
                  <span className="font-bold text-lg text-blue-900">
                    {stats.passRate}%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="block text-[10px] text-amber-800 uppercase font-bold tracking-wider">
                    Tertinggi / Terendah
                  </span>
                  <span className="font-bold text-lg text-amber-900">
                    {stats.highest} / {stats.lowest}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick-Input Table View */}
            <div className="bg-white rounded-2xl border border-[#DDD8CE] shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-[#DDD8CE] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#1A1A1A]">
                    Tabel Penulisan Nilai Asesmen
                  </h3>
                  <p className="text-xs text-[#666]">
                    Ketik skor 0–100. Status KKM & ketuntasan otomatis terkalkulasi saat diketik.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveAll}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Semua Nilai'}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F0E8]/70 border-b border-[#DDD8CE] text-[#666] font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-center w-12">No</th>
                      <th className="px-4 py-3 w-64">Nama Siswa</th>
                      <th className="px-4 py-3 text-center w-28">Skor Nilai (0-100)</th>
                      <th className="px-4 py-3 text-center w-28">Status KKM</th>
                      <th className="px-4 py-3">Catatan / Deskripsi Capaian Kompetensi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDD8CE]/60">
                    {currentStudents.map((s, idx) => {
                      const currentScore = gridScores[s.id]?.nilai ?? 0;
                      const currentNote = gridScores[s.id]?.catatan || '';
                      const isPassed = currentScore >= kkm;

                      return (
                        <tr key={s.id} className="hover:bg-[#FAF8F2]/60 transition-colors">
                          <td className="px-4 py-3 text-center text-[#666] font-medium">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-[#1A1A1A]">{s.nama_lengkap}</div>
                            <div className="text-[11px] text-[#7A7A7A]">NISN: {s.nisn || '-'}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={currentScore}
                              onChange={(e) => handleScoreChange(s.id, parseInt(e.target.value, 10))}
                              className={`w-20 px-2.5 py-1.5 rounded-xl border text-center font-bold text-sm font-mono focus:outline-none transition-all ${
                                isPassed
                                  ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800 focus:ring-2 focus:ring-emerald-500'
                                  : 'border-[#F1948A] bg-[#FDEDEC]/50 text-[#922B21] focus:ring-2 focus:ring-[#922B21]'
                              }`}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block ${
                                isPassed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-[#FDEDEC] text-[#922B21]'
                              }`}
                            >
                              {isPassed ? 'TUNTAS' : 'REMIDIAL'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={currentNote}
                              placeholder="Ketik catatan kemajuan belajar atau tindak lanjut..."
                              onChange={(e) => handleNoteChange(s.id, e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-[#DDD8CE] bg-white text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Actions */}
              <div className="px-5 py-3.5 bg-[#FAF8F2] border-t border-[#DDD8CE] flex items-center justify-between">
                <span className="text-xs text-[#666]">
                  Nilai tersimpan langsung sinkron ke <strong>Buku Leger Wali Kelas</strong>.
                </span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveAll}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Semua Nilai'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: BUKU LEGER KELAS (WALI KELAS AGGREGATOR) */}
        {/* =================================================================== */}
        {activeTab === 'leger' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Header Leger & Status Setoran Guru */}
            <div className="bg-white rounded-2xl p-5 border border-[#DDD8CE] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                    Buku Leger Nilai Rombel ({kelasList.find((k) => k.id === selectedKelasId)?.nama_kelas || 'Kelas 4A'})
                  </h3>
                  <p className="text-xs text-[#666]">
                    Rekapitulasi seluruh mata pelajaran dari seluruh guru pengampu semester ini
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportLeger}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#DDD8CE] bg-white hover:bg-[#F5F0E8] text-xs font-bold text-[#1A1A1A] transition-colors cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-[#922B21]" />
                    <span>Ekspor Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-xs font-bold text-white transition-colors cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Leger</span>
                  </button>
                </div>
              </div>

              {/* Status Setoran Guru Mapel */}
              <div className="pt-3 border-t border-[#DDD8CE]">
                <span className="text-[11px] font-bold text-[#666] uppercase tracking-wider block mb-2">
                  Status Setoran Nilai Guru Mata Pelajaran:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {mapelList.map((m) => {
                    const filledCount = currentStudents.filter((s) => (legerData[s.id]?.[m.id] || 0) > 0).length;
                    const isComplete = filledCount === currentStudents.length;

                    return (
                      <div
                        key={m.id}
                        className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                          isComplete
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                        <span className="font-semibold text-[11px]">{m.nama_mapel}</span>
                        <span className="text-[10px] opacity-75">
                          ({filledCount}/{currentStudents.length})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Matrix Table: Students x Subjects */}
            <div className="bg-white rounded-2xl border border-[#DDD8CE] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F0E8]/80 border-b border-[#DDD8CE] text-[#666] font-semibold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-3 text-center w-10 sticky left-0 bg-[#F5F0E8] z-10">No</th>
                      <th className="px-3 py-3 w-52 sticky left-10 bg-[#F5F0E8] z-10 border-r border-[#DDD8CE]">
                        Nama Siswa
                      </th>
                      {mapelList.map((m) => (
                        <th key={m.id} className="px-2.5 py-3 text-center min-w-[70px]">
                          <span className="block truncate max-w-[90px]" title={m.nama_mapel}>
                            {m.nama_mapel.split(' ')[0]}
                          </span>
                          <span className="text-[9px] text-[#888]">KKM {m.kkm}</span>
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center bg-[#FAF8F2] font-bold border-l border-[#DDD8CE]">Total</th>
                      <th className="px-3 py-3 text-center bg-emerald-50 text-emerald-900 font-bold">Rata-rata</th>
                      <th className="px-3 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDD8CE]/60">
                    {currentStudents.map((s, idx) => {
                      const studentScores = mapelList.map((m) => legerData[s.id]?.[m.id] || 0);
                      const total = studentScores.reduce((a, b) => a + b, 0);
                      const avg = Math.round((total / (mapelList.length || 1)) * 10) / 10;
                      const allPassed = mapelList.every((m) => (legerData[s.id]?.[m.id] || 0) >= m.kkm);

                      return (
                        <tr key={s.id} className="hover:bg-[#FAF8F2]/60 transition-colors">
                          <td className="px-3 py-3 text-center text-[#666] font-medium sticky left-0 bg-white z-10">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-3 font-bold text-[#1A1A1A] sticky left-10 bg-white z-10 border-r border-[#DDD8CE]">
                            <div className="truncate max-w-[200px]">{s.nama_lengkap}</div>
                          </td>
                          {mapelList.map((m) => {
                            const val = legerData[s.id]?.[m.id] || 0;
                            const isPassed = val >= m.kkm;
                            return (
                              <td
                                key={m.id}
                                className={`px-2 py-3 text-center font-mono font-semibold ${
                                  val === 0
                                    ? 'text-[#AAA] italic'
                                    : isPassed
                                    ? 'text-[#1A1A1A]'
                                    : 'text-[#922B21] font-bold bg-[#FDEDEC]/40'
                                }`}
                              >
                                {val || '-'}
                              </td>
                            );
                          })}
                          <td className="px-3 py-3 text-center font-mono font-bold text-[#1A1A1A] bg-[#FAF8F2] border-l border-[#DDD8CE]">
                            {total}
                          </td>
                          <td className="px-3 py-3 text-center font-mono font-bold text-emerald-800 bg-emerald-50/50">
                            {avg}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                allPassed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-[#FDEDEC] text-[#922B21]'
                              }`}
                            >
                              {allPassed ? 'TUNTAS' : 'REMIDIAL'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function NilaiPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-[#666]">Memuat modul nilai siswa...</div>}>
      <NilaiContent />
    </Suspense>
  );
}
