'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { HeartHandshake, CheckCircle2, Sparkles } from 'lucide-react';

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
    <AppShell
      role="guru"
      pageTitle="Karakter KAIH"
      pageSubtitle="7 Kebiasaan Anak Indonesia Hebat — Warisan ABAT"
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-[#DDD8CE]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#FDEDEC] text-[#922B21]">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  7 Kebiasaan Anak Indonesia Hebat
                </h2>
                <p className="text-xs text-[#6B6B6B]">
                  Pemantauan pembiasaan karakter positif anak di rumah & sekolah
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#6B6B6B]">Capaian:</span>
              <span className="ml-1 font-serif font-bold text-lg text-[#922B21]">
                {completedCount} / 7 ({Math.round((completedCount / 7) * 100)}%)
              </span>
            </div>
          </div>

          <div className="w-full bg-[#E8E0D0] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#C0392B] h-full transition-all duration-300 rounded-full"
              style={{ width: `${(completedCount / 7) * 100}%` }}
            />
          </div>
        </div>

        {saved && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center gap-2.5 text-xs text-emerald-800 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Rekap kebiasaan karakter berhasil disimpan dan diperbarui!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => toggleHabit(item.id)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                item.checked
                  ? 'bg-white border-emerald-300 shadow-xs'
                  : 'bg-[#FAF8F2] border-[#DDD8CE] hover:bg-white'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition ${
                  item.checked
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'border border-[#6B6B6B] bg-white'
                }`}
              >
                {item.checked && <CheckCircle2 className="w-4 h-4" />}
              </div>

              <div className="flex-1 text-xs">
                <span className="block font-bold text-sm text-[#1A1A1A] mb-1">
                  {idx + 1}. {item.label}
                </span>
                <span className="text-xs text-[#6B6B6B] leading-relaxed">
                  {item.desc}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => setSaved(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
          >
            Simpan Rekap Karakter KAIH Hari Ini →
          </button>
        </div>
      </div>
    </AppShell>
  );
}
