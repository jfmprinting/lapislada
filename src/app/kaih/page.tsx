'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { ArrowLeft, HeartHandshake, CheckCircle2, Sparkles } from 'lucide-react';

interface HabitItem {
  id: string;
  label: string;
  desc: string;
  checked: boolean;
}

const DEFAULT_HABITS: HabitItem[] = [
  { id: '1', label: 'Bangun Pagi & Merapikan Tempat Tidur', desc: 'Disiplin mengawali hari sebelum subuh/pagi.', checked: true },
  { id: '2', label: 'Beribadah Tepat Waktu', desc: 'Menjalankan kewajiban ibadah sesuai agamanya.', checked: true },
  { id: '3', label: 'Berolahraga / Aktivitas Fisik', desc: 'Minimal 15-30 menit gerak badan atau senam.', checked: false },
  { id: '4', label: 'Gemar Belajar & Membaca Buku', desc: 'Membaca buku non-pelajaran atau mengulang pelajaran.', checked: true },
  { id: '5', label: 'Makan Makanan Bergizi Seimbang', desc: 'Sarapan bernutrisi, cukup minum air putih, kurangi junk food.', checked: true },
  { id: '6', label: 'Bermasyarakat & Membantu Orang Tua', desc: 'Sopan santun kepada tetangga, membantu pekerjaan rumah.', checked: true },
  { id: '7', label: 'Tidur Cepat (Tepat Waktu)', desc: 'Istirahat malam maksimal pukul 21.00 WIB.', checked: false },
];

export default function KaihPage() {
  const [habits, setHabits] = useState<HabitItem[]>(DEFAULT_HABITS);
  const [saved, setSaved] = useState(false);

  const toggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, checked: !h.checked } : h))
    );
    setSaved(false);
  };

  const completedCount = habits.filter((h) => h.checked).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8] pb-24 text-[#1A1A1A]">
      <Navbar schoolName="KAIH Siswa" />

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
            Karakter Anak Hebat
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#DDD8CE] mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#FDEDEC] text-[#922B21]">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-base text-[#1A1A1A]">
                  7 Kebiasaan Anak Indonesia Hebat
                </h1>
                <p className="text-[11px] text-[#6B6B6B]">
                  Pemantauan pembiasaan karakter positif anak di rumah & sekolah
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F5F0E8] flex items-center justify-between text-xs">
            <span className="text-[#6B6B6B]">Capaian Hari Ini:</span>
            <span className="font-bold text-[#922B21]">
              {completedCount} dari 7 Kebiasaan Tercapai ({Math.round((completedCount / 7) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-[#E8E0D0] h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[#C0392B] h-full transition-all duration-300 rounded-full"
              style={{ width: `${(completedCount / 7) * 100}%` }}
            />
          </div>
        </div>

        {saved && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Rekap kebiasaan karakter berhasil disimpan!</span>
          </div>
        )}

        <div className="space-y-2.5 mb-5">
          {habits.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => toggleHabit(item.id)}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                item.checked
                  ? 'bg-white border-emerald-300 shadow-xs'
                  : 'bg-[#FAF8F2] border-[#DDD8CE]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition ${
                  item.checked
                    ? 'bg-emerald-600 text-white'
                    : 'border border-[#6B6B6B] bg-white'
                }`}
              >
                {item.checked && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>

              <div className="flex-1 text-xs">
                <span className="block font-bold text-[#1A1A1A] mb-0.5">
                  {idx + 1}. {item.label}
                </span>
                <span className="text-[11px] text-[#6B6B6B] leading-relaxed">
                  {item.desc}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setSaved(true)}
          className="w-full py-3 px-4 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
        >
          Simpan Rekap KAIH Hari Ini →
        </button>
      </main>

      <BottomNav role="guru" />
    </div>
  );
}
