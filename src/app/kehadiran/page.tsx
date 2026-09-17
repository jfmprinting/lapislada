'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { CheckCircle2, Save, Users, Calendar, Sparkles } from 'lucide-react';

interface StudentAttendance {
  id: string;
  nis: string;
  nama: string;
  status: 'H' | 'S' | 'I' | 'A';
}

const INITIAL_STUDENTS: StudentAttendance[] = [
  { id: 's-1', nis: '1001', nama: 'Ahmad Budi Santoso', status: 'H' },
  { id: 's-2', nis: '1002', nama: 'Budi Rahardjo', status: 'H' },
  { id: 's-3', nis: '1003', nama: 'Citra Dewi Lestari', status: 'H' },
  { id: 's-4', nis: '1004', nama: 'Dimas Prasetyo', status: 'S' },
  { id: 's-5', nis: '1005', nama: 'Eka Putri Wardani', status: 'H' },
  { id: 's-6', nis: '1006', nama: 'Fajar Hidayat', status: 'H' },
  { id: 's-7', nis: '1007', nama: 'Gita Permata', status: 'I' },
  { id: 's-8', nis: '1008', nama: 'Hendra Saputra', status: 'H' },
  { id: 's-9', nis: '1009', nama: 'Indah Cahyani', status: 'H' },
  { id: 's-10', nis: '1010', nama: 'Joko Susanto', status: 'H' },
];

export default function KehadiranPage() {
  const [students, setStudents] = useState<StudentAttendance[]>(INITIAL_STUDENTS);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const todayStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const handleStatusChange = (id: string, newStatus: 'H' | 'S' | 'I' | 'A') => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
    setSavedSuccess(false);
  };

  const markAllHadir = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: 'H' })));
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
    }, 400);
  };

  const counts = students.reduce(
    (acc, cur) => {
      acc[cur.status] = (acc[cur.status] || 0) + 1;
      return acc;
    },
    { H: 0, S: 0, I: 0, A: 0 } as Record<string, number>
  );

  return (
    <AppShell
      role="guru"
      pageTitle="Absensi Kehadiran Siswa"
      pageSubtitle="Kelas 4A · 20 Siswa Terdaftar · T.A 2025/2026"
    >
      <div className="space-y-6">
        {/* SUMMARY HEADER CARD */}
        <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-[#DDD8CE] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FDEDEC] text-[#922B21] text-[11px] font-bold border border-[#F1948A]">
                Hari Ini
              </span>
              <span className="text-xs text-[#6B6B6B] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {todayStr}
              </span>
            </div>
            <h2 className="font-serif font-bold text-xl text-[#1A1A1A]">
              Pencatatan Kehadiran Harian
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Wali murid menerima rekap otomatis saat guru menyimpan data absen.
            </p>
          </div>

          {/* Quick Counter Grid */}
          <div className="grid grid-cols-4 gap-2.5 shrink-0 text-center text-xs">
            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 min-w-[70px]">
              <span className="block font-serif font-bold text-lg">{counts.H}</span>
              <span className="text-[10px] uppercase font-bold text-emerald-700">Hadir</span>
            </div>
            <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200 min-w-[70px]">
              <span className="block font-serif font-bold text-lg">{counts.S}</span>
              <span className="text-[10px] uppercase font-bold text-amber-700">Sakit</span>
            </div>
            <div className="bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-200 min-w-[70px]">
              <span className="block font-serif font-bold text-lg">{counts.I}</span>
              <span className="text-[10px] uppercase font-bold text-blue-700">Izin</span>
            </div>
            <div className="bg-[#FDEDEC] text-[#922B21] p-3 rounded-xl border border-[#F1948A] min-w-[70px]">
              <span className="block font-serif font-bold text-lg">{counts.A}</span>
              <span className="text-[10px] uppercase font-bold text-[#922B21]">Alpha</span>
            </div>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center gap-2.5 text-xs text-emerald-800 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">Data absensi kelas 4A berhasil disimpan dan disinkronkan ke sistem orang tua!</span>
          </div>
        )}

        {/* ATTENDANCE TABLE (EXPANSIVE DESKTOP LAYOUT) */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#DDD8CE] overflow-hidden">
          <div className="p-4 bg-[#FAF8F2] border-b border-[#DDD8CE] flex items-center justify-between">
            <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
              Daftar Presensi Siswa ({students.length} Siswa)
            </span>
            <button
              onClick={markAllHadir}
              className="text-xs font-bold text-[#922B21] hover:underline cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-[#DDD8CE] shadow-xs active:scale-95"
            >
              ✓ Tandai Semua Hadir
            </button>
          </div>

          <div className="divide-y divide-[#F5F0E8]">
            {students.map((student, idx) => (
              <div
                key={student.id}
                className="p-4 flex items-center justify-between gap-3 hover:bg-[#FAF8F2] transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-xs font-mono font-bold text-[#6B6B6B]">
                    {idx + 1}.
                  </span>
                  <div className="truncate">
                    <span className="block text-xs sm:text-sm font-semibold text-[#1A1A1A] truncate">
                      {student.nama}
                    </span>
                    <span className="block text-[11px] text-[#6B6B6B]">
                      NIS: {student.nis} · Siswa Kelas 4A
                    </span>
                  </div>
                </div>

                {/* Status Toggle Buttons [H][S][I][A] */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {(['H', 'S', 'I', 'A'] as const).map((st) => {
                    const isSelected = student.status === st;
                    const colorMap = {
                      H: isSelected ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-300' : 'bg-emerald-50 text-emerald-800 border border-emerald-200',
                      S: isSelected ? 'bg-amber-500 text-white font-bold ring-2 ring-amber-300' : 'bg-amber-50 text-amber-800 border border-amber-200',
                      I: isSelected ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-300' : 'bg-blue-50 text-blue-800 border border-blue-200',
                      A: isSelected ? 'bg-[#922B21] text-white font-bold ring-2 ring-red-300' : 'bg-[#FDEDEC] text-[#922B21] border border-[#F1948A]',
                    };
                    return (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(student.id, st)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 ${colorMap[st]}`}
                        title={st === 'H' ? 'Hadir' : st === 'S' ? 'Sakit' : st === 'I' ? 'Izin' : 'Alpha'}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SUBMIT ACTION BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-[#DDD8CE] shadow-xs">
          <p className="text-xs text-[#6B6B6B]">
            Keterangan: <span className="font-bold text-emerald-700">H = Hadir</span> · <span className="font-bold text-amber-700">S = Sakit</span> · <span className="font-bold text-blue-700">I = Izin</span> · <span className="font-bold text-[#922B21]">A = Alpha</span>
          </p>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan Absensi...' : 'Simpan Absensi Hari Ini →'}</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}
