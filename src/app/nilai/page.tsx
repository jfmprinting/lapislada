'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { Award, Plus, CheckCircle2, TrendingUp, Filter } from 'lucide-react';

interface NilaiEntry {
  id: string;
  namaSiswa: string;
  mapel: string;
  jenisUjian: string;
  skor: number;
  kkm: number;
}

const INITIAL_GRADES: NilaiEntry[] = [
  { id: 'n-1', namaSiswa: 'Ahmad Budi Santoso', mapel: 'Matematika', jenisUjian: 'Sumatif 1 (Pecahan)', skor: 92, kkm: 75 },
  { id: 'n-2', namaSiswa: 'Citra Dewi Lestari', mapel: 'Matematika', jenisUjian: 'Sumatif 1 (Pecahan)', skor: 88, kkm: 75 },
  { id: 'n-3', namaSiswa: 'Dimas Prasetyo', mapel: 'Matematika', jenisUjian: 'Sumatif 1 (Pecahan)', skor: 78, kkm: 75 },
  { id: 'n-4', namaSiswa: 'Ahmad Budi Santoso', mapel: 'IPA', jenisUjian: 'Kuis Ekosistem', skor: 95, kkm: 75 },
  { id: 'n-5', namaSiswa: 'Citra Dewi Lestari', mapel: 'IPA', jenisUjian: 'Kuis Ekosistem', skor: 100, kkm: 75 },
];

export default function NilaiPage() {
  const [grades, setGrades] = useState<NilaiEntry[]>(INITIAL_GRADES);
  const [filterMapel, setFilterMapel] = useState('Semua');

  const filtered = grades.filter(
    (g) => filterMapel === 'Semua' || g.mapel === filterMapel
  );

  return (
    <AppShell
      role="guru"
      pageTitle="Nilai Siswa"
      pageSubtitle="Capaian asesmen sumatif dan formatif kelas 4A"
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#DDD8CE] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FDEDEC] text-[#922B21]">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">
                Rekapitulasi Nilai Siswa
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Wali murid dapat memantau capaian belajar anak secara transparan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#6B6B6B] font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Mapel:
            </span>
            <select
              value={filterMapel}
              onChange={(e) => setFilterMapel(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] font-medium"
            >
              <option value="Semua">Semua Mata Pelajaran</option>
              <option value="Matematika">Matematika</option>
              <option value="IPA">IPA</option>
              <option value="Bahasa Indonesia">Bahasa Indonesia</option>
            </select>
          </div>
        </div>

        {/* GRADES GRID (RESPONSIVE MULTI-COLUMN ON DESKTOP) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const isLulus = item.skor >= item.kkm;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 shadow-xs border border-[#DDD8CE] flex items-center justify-between hover:border-[#C0392B]/50 transition"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F0E8] text-[#922B21] border border-[#DDD8CE]">
                      {item.mapel}
                    </span>
                    <span className="text-xs text-[#6B6B6B]">{item.jenisUjian}</span>
                  </div>
                  <h3 className="font-bold text-sm text-[#1A1A1A]">
                    {item.namaSiswa}
                  </h3>
                  <span className="text-[11px] text-[#6B6B6B] mt-0.5 block">
                    Standar KKM: {item.kkm}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`block font-serif font-bold text-2xl ${
                      isLulus ? 'text-emerald-700' : 'text-[#C0392B]'
                    }`}
                  >
                    {item.skor}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isLulus ? 'bg-emerald-50 text-emerald-700' : 'bg-[#FDEDEC] text-[#C0392B]'
                    }`}
                  >
                    {isLulus ? 'Tuntas' : 'Remidial'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
