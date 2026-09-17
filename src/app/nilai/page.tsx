'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { ArrowLeft, Award, Plus, CheckCircle2, TrendingUp } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col bg-[#F5F0E8] pb-24 text-[#1A1A1A]">
      <Navbar schoolName="Nilai Siswa Kelas 4A" />

      <main className="w-full max-w-md mx-auto sm:max-w-xl md:max-w-2xl px-4 py-4 flex-1">
        <div className="flex items-center justify-between gap-2 mb-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#6B6B6B] hover:text-[#922B21]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <span className="text-xs font-bold text-[#922B21] bg-[#FDEDEC] px-2.5 py-1 rounded-md border border-[#F1948A]">
            T.A 2025/2026
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#DDD8CE] mb-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 rounded-lg bg-[#FDEDEC] text-[#922B21]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-base text-[#1A1A1A]">
                Capaian & Nilai Siswa
              </h1>
              <p className="text-[11px] text-[#6B6B6B]">
                Wali murid dapat memantau perkembangan nilai anak tanpa harus menunggu rapor
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F5F0E8] flex items-center gap-2 text-xs">
            <span className="text-[#6B6B6B] font-semibold text-[11px]">Mapel:</span>
            <select
              value={filterMapel}
              onChange={(e) => setFilterMapel(e.target.value)}
              className="px-2.5 py-1 rounded-md border border-[#DDD8CE] bg-white text-[#1A1A1A]"
            >
              <option value="Semua">Semua Mata Pelajaran</option>
              <option value="Matematika">Matematika</option>
              <option value="IPA">IPA</option>
              <option value="Bahasa Indonesia">Bahasa Indonesia</option>
            </select>
          </div>
        </div>

        <div className="space-y-2.5">
          {filtered.map((item) => {
            const isLulus = item.skor >= item.kkm;
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl p-3.5 shadow-sm border border-[#DDD8CE] flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F5F0E8] text-[#922B21]">
                      {item.mapel}
                    </span>
                    <span className="text-[10px] text-[#6B6B6B]">{item.jenisUjian}</span>
                  </div>
                  <h3 className="font-bold text-xs text-[#1A1A1A]">
                    {item.namaSiswa}
                  </h3>
                  <span className="text-[10px] text-[#6B6B6B]">
                    KKM: {item.kkm}
                  </span>
                </div>

                <div className="text-right">
                  <span
                    className={`block font-serif font-bold text-xl ${
                      isLulus ? 'text-emerald-700' : 'text-[#C0392B]'
                    }`}
                  >
                    {item.skor}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider ${
                      isLulus ? 'text-emerald-600' : 'text-[#C0392B]'
                    }`}
                  >
                    {isLulus ? 'Tuntas' : 'Remidial'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <BottomNav role="guru" />
    </div>
  );
}
