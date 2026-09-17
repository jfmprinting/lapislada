'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { ArrowLeft, CheckCircle2, Save, Users, Calendar, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
    month: 'short',
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
    // Simulating database commit or saving via Supabase
    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
    }, 500);
  };

  const counts = students.reduce(
    (acc, cur) => {
      acc[cur.status] = (acc[cur.status] || 0) + 1;
      return acc;
    },
    { H: 0, S: 0, I: 0, A: 0 } as Record<string, number>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8] pb-24 text-[#1A1A1A]">
      <Navbar schoolName="Absensi Kelas 4A" />

      <main className="w-full max-w-md mx-auto sm:max-w-xl md:max-w-2xl px-4 py-4 flex-1">
        {/* TOP BAR */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#6B6B6B] hover:text-[#922B21]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <span className="text-xs font-bold text-[#6B6B6B] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {todayStr}
          </span>
        </div>

        {/* HEADER CARD */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#DDD8CE] mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="font-serif font-bold text-base text-[#1A1A1A]">
                Absensi Kehadiran Siswa
              </h1>
              <p className="text-[11px] text-[#6B6B6B]">
                Kelas 4A · {students.length} Siswa Terdaftar
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#FDEDEC] text-[#922B21] text-[11px] font-bold border border-[#F1948A]">
              Hari Ini
            </span>
          </div>

          {/* Quick Stats Pill */}
          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[#F5F0E8] text-center text-xs">
            <div className="bg-emerald-50 text-emerald-800 p-1.5 rounded-lg border border-emerald-200">
              <span className="font-bold">{counts.H}</span> Hadir
            </div>
            <div className="bg-amber-50 text-amber-800 p-1.5 rounded-lg border border-amber-200">
              <span className="font-bold">{counts.S}</span> Sakit
            </div>
            <div className="bg-blue-50 text-blue-800 p-1.5 rounded-lg border border-blue-200">
              <span className="font-bold">{counts.I}</span> Izin
            </div>
            <div className="bg-[#FDEDEC] text-[#922B21] p-1.5 rounded-lg border border-[#F1948A]">
              <span className="font-bold">{counts.A}</span> Alpha
            </div>
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center gap-2 text-xs text-emerald-800 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Data absensi berhasil disimpan dan disinkronkan ke orang tua!</span>
          </div>
        )}

        {/* ATTENDANCE TABLE / CARDS (WF-09) */}
        <div className="bg-white rounded-xl shadow-sm border border-[#DDD8CE] overflow-hidden mb-5">
          <div className="p-3 bg-[#FAF8F2] border-b border-[#DDD8CE] flex items-center justify-between">
            <span className="text-xs font-bold text-[#1A1A1A]">Daftar Siswa</span>
            <button
              onClick={markAllHadir}
              className="text-[11px] font-bold text-[#922B21] hover:underline cursor-pointer"
            >
              ✓ Tandai Semua Hadir
            </button>
          </div>

          <div className="divide-y divide-[#F5F0E8]">
            {students.map((student, idx) => (
              <div
                key={student.id}
                className="p-3 flex items-center justify-between gap-2 hover:bg-[#FAF8F2] transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 text-[11px] font-mono font-bold text-[#6B6B6B]">
                    {idx + 1}.
                  </span>
                  <div className="truncate">
                    <span className="block text-xs font-semibold text-[#1A1A1A] truncate">
                      {student.nama}
                    </span>
                    <span className="block text-[10px] text-[#6B6B6B]">
                      NIS: {student.nis}
                    </span>
                  </div>
                </div>

                {/* Status Toggle Buttons [H][S][I][A] */}
                <div className="flex items-center gap-1 shrink-0">
                  {(['H', 'S', 'I', 'A'] as const).map((st) => {
                    const isSelected = student.status === st;
                    const colorMap = {
                      H: isSelected ? 'bg-emerald-600 text-white font-bold' : 'bg-emerald-50 text-emerald-800 border border-emerald-200',
                      S: isSelected ? 'bg-amber-500 text-white font-bold' : 'bg-amber-50 text-amber-800 border border-amber-200',
                      I: isSelected ? 'bg-blue-600 text-white font-bold' : 'bg-blue-50 text-blue-800 border border-blue-200',
                      A: isSelected ? 'bg-[#922B21] text-white font-bold' : 'bg-[#FDEDEC] text-[#922B21] border border-[#F1948A]',
                    };
                    return (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(student.id, st)}
                        className={`w-7 h-7 rounded-md text-xs transition cursor-pointer active:scale-95 ${colorMap[st]}`}
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

        {/* SUBMIT BUTTON */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 px-4 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan Absensi...' : 'Simpan Absensi Sekarang →'}</span>
          </button>
          <p className="text-center text-[10px] text-[#6B6B6B]">
            H = Hadir · S = Sakit · I = Izin · A = Alpha
          </p>
        </div>
      </main>

      <BottomNav role="guru" />
    </div>
  );
}
