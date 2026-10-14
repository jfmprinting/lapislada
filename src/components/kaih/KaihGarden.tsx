'use client';

/**
 * KaihGarden - Komponen Gamifikasi 7 Tanaman Karakter KAIH
 *
 * Fitur:
 * - 7 Pot Tanaman Mini (1 per Pilar KAIH) dengan 5 fase tumbuh
 * - Visualisasi sinergi dua arah: Guru (Sinar Matahari) + Orang Tua (Tetesan Air)
 * - Streak counter harian & XP tracker
 * - Hutan Kelas Bersama (co-op gotong royong)
 * - Panel kinerja guru untuk kepala sekolah
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, PILAR_KAIH, KaihKegiatan } from '@/lib/supabase';
import {
  Flame,
  Star,
  Droplets,
  Sun,
  TreePine,
  Trophy,
  Users,
  TrendingUp,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  Info,
  Heart,
} from 'lucide-react';

// ============================================================
// TYPES & CONSTANTS
// ============================================================

export interface PlantState {
  pilar_id: number;
  xp: number;
  level: number;       // 0-5
  xp_dari_guru: number;
  xp_dari_ortu: number;
  xp_bonus_apresiasi: number;
  streak_hari: number;
  last_watered_at: string | null;
}

export interface ClassForestData {
  kelas_id: string;
  minggu_iso: string;
  total_siswa: number;
  siswa_aktif_ortu: number;
  siswa_aktif_guru: number;
  sinergi_score: number;
  total_xp_kelas: number;
  maskot_unlock: string | null;
}

/** XP threshold per level */
const XP_THRESHOLDS = [0, 5, 15, 30, 50, 75];

/** Kalkulasi level dari XP */
function xpToLevel(xp: number): number {
  if (xp >= 75) return 5;
  if (xp >= 50) return 4;
  if (xp >= 30) return 3;
  if (xp >= 15) return 2;
  if (xp >= 5)  return 1;
  return 0;
}

/** XP menuju level berikutnya */
function xpToNextLevel(xp: number): { current: number; needed: number; level: number } {
  const level = xpToLevel(xp);
  if (level >= 5) return { current: xp, needed: 75, level: 5 };
  const nextThreshold = XP_THRESHOLDS[level + 1];
  const prevThreshold = XP_THRESHOLDS[level];
  return {
    current: xp - prevThreshold,
    needed: nextThreshold - prevThreshold,
    level,
  };
}

/** ISO Week string untuk minggu ini */
function getISOWeek(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Format bulan-tahun untuk query */
function getBulanTahun(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ============================================================
// 7 TANAMAN MINI DEFINITIONS
// Setiap pilar memiliki tanaman dengan 6 fase visual (level 0-5)
// Menggunakan SVG inline yang ringan & tajam di HP murah
// ============================================================

interface PlantVisual {
  name: string;
  phases: string[];    // emoji per level (0-5) sebagai representasi visual
  color: string;       // warna aksen pot
  bgColor: string;     // latar pot
  borderColor: string;
}

const PLANT_VISUALS: Record<number, PlantVisual> = {
  1: {
    name: 'Bunga Matahari',
    phases: ['🌰', '🌱', '🌿', '🌾', '🌻', '🌻'],
    color: '#D4A017',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  2: {
    name: 'Teratai Putih',
    phases: ['🌰', '🌱', '🌿', '🌲', '🌳', '🌸'],
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  3: {
    name: 'Bambu Tangguh',
    phases: ['🌰', '🌱', '🌿', '🎍', '🎋', '🎋'],
    color: '#16A34A',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  4: {
    name: 'Bonsai Bijaksana',
    phases: ['🌰', '🌱', '🌿', '🪴', '🪴', '🌲'],
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  5: {
    name: 'Pohon Buah Segar',
    phases: ['🌰', '🌱', '🌿', '🌺', '🍓', '🍓'],
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  6: {
    name: 'Melati Bakti',
    phases: ['🌰', '🌱', '🌿', '🌷', '🌸', '🌸'],
    color: '#DB2777',
    bgColor: '#FDF2F8',
    borderColor: '#F9A8D4',
  },
  7: {
    name: 'Lavender Malam',
    phases: ['🌰', '🌱', '🌿', '💜', '🪻', '🪻'],
    color: '#7C3AED',
    bgColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
};

const PILAR_MATURE_IMAGES: Record<number, string> = {
  1: '/plants/pilar1_sunflower.jpg',
  2: '/plants/pilar2_lotus.jpg',
  3: '/plants/pilar3_bamboo.jpg',
  4: '/plants/pilar4_bonsai.jpg',
  5: '/plants/pilar5_fruit.jpg',
  6: '/plants/pilar6_rose.jpg',
  7: '/plants/pilar7_lavender.jpg',
};

function getPlantImage(pilarId: number, level: number): string {
  if (level === 0) return '/plants/seed.jpg';
  if (level === 1) return '/plants/sprout.jpg';
  if (level === 2) return '/plants/growing.jpg';
  return PILAR_MATURE_IMAGES[pilarId] || '/plants/growing.jpg';
}

const PHASE_LABELS = ['Benih', 'Tunas', 'Tumbuh', 'Berkembang', 'Mekar', 'Panen Raya'];
const PHASE_COLORS = [
  '#9CA3AF', // Benih - abu
  '#86EFAC', // Tunas - hijau muda
  '#4ADE80', // Tumbuh - hijau
  '#22C55E', // Berkembang - hijau tua
  '#F59E0B', // Mekar - kuning emas
  '#EF4444', // Panen - merah ranum
];

const MASKOT_INFO: Record<string, { emoji: string; nama: string }> = {
  kupu_emas:  { emoji: '🦋', nama: 'Kupu-Kupu Emas' },
  burung_nuri: { emoji: '🦜', nama: 'Burung Nuri Ceria' },
  rusa_hutan:  { emoji: '🦌', nama: 'Rusa Hutan Jinak' },
  merak_biru:  { emoji: '🦚', nama: 'Merak Biru Megah' },
};

// ============================================================
// PROGRESS BAR MINI
// ============================================================
function ProgressBar({ current, total, color }: { current: number; total: number; color: string }) {
  const pct = Math.min(100, Math.round((current / Math.max(total, 1)) * 100));
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ============================================================
// SINGLE PLANT POT CARD
// ============================================================
function PlantPot({
  pilar_id,
  plant,
  isHighlighted,
}: {
  pilar_id: number;
  plant: PlantState | null;
  isHighlighted?: boolean;
}) {
  const pilar = PILAR_KAIH.find((p) => p.id === pilar_id)!;
  const visual = PLANT_VISUALS[pilar_id];
  const level = plant ? xpToLevel(plant.xp) : 0;
  const { current, needed } = plant ? xpToNextLevel(plant.xp) : { current: 0, needed: 5 };
  const phaseLabel = PHASE_LABELS[level];
  const phaseColor = PHASE_COLORS[level];
  const xp = plant?.xp ?? 0;
  const guruXp = plant?.xp_dari_guru ?? 0;
  const ortuXp = plant?.xp_dari_ortu ?? 0;
  const hasHarmoni = guruXp > 0 && ortuXp > 0;

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden ${
        isHighlighted
          ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-100'
          : 'shadow-xs hover:shadow-md'
      }`}
      style={{ borderColor: visual.borderColor, backgroundColor: visual.bgColor }}
    >
      {/* Harmoni badge */}
      {hasHarmoni && (
        <div className="absolute top-2 right-2 z-10">
          <div
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
            style={{ backgroundColor: '#FEF9C3', color: '#92400E', border: '1px solid #FDE68A' }}
            title="Harmoni Sempurna: Sekolah & Rumah bersinergi!"
          >
            <Sparkles className="w-2.5 h-2.5" />
            Harmoni
          </div>
        </div>
      )}

      {/* 3D Clay Plant image area */}
      <div className="flex flex-col items-center justify-center pt-3 pb-2 px-2 gap-1.5">
        <div
          className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-white/95 border shadow-xs p-1 flex items-center justify-center transition-all duration-300 ${
            level >= 4 ? 'hover:scale-105' : level >= 2 ? 'hover:scale-105' : ''
          }`}
          style={{
            borderColor: level >= 4 ? visual.color : '#EDE8DC',
            boxShadow: level >= 5 ? `0 4px 14px ${visual.color}40` : undefined,
          }}
        >
          <img
            src={getPlantImage(pilar_id, level)}
            alt={`${visual.name} Level ${level}`}
            className={`w-full h-full object-contain rounded-xl transition-all duration-500 ${
              level === 0 ? 'scale-90 opacity-80' : 'scale-100'
            }`}
            loading="lazy"
          />
          {level >= 5 && (
            <div
              className="absolute top-1 right-1 bg-amber-400 text-amber-950 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs flex items-center gap-0.5"
              title="Panen Raya!"
            >
              <Star className="w-2.5 h-2.5 fill-amber-950 text-amber-950" />
            </div>
          )}
        </div>

        {/* Phase badge */}
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: phaseColor + '22', color: phaseColor }}
        >
          {phaseLabel}
        </span>
      </div>

      {/* Plant info */}
      <div className="px-3 pb-3 flex flex-col gap-2 flex-1">
        {/* Pilar name */}
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
            Pilar {pilar_id}
          </div>
          <div className="text-[11px] font-bold text-gray-700 leading-tight line-clamp-2">
            {pilar.judul}
          </div>
        </div>

        {/* XP progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] text-gray-500">
            <span>XP {xp}</span>
            {level < 5 && <span>Next Lv: {XP_THRESHOLDS[level + 1]}</span>}
            {level >= 5 && <span className="text-amber-600 font-bold">MAX!</span>}
          </div>
          <ProgressBar current={current} total={needed} color={visual.color} />
        </div>

        {/* Sumber XP breakdown (mini) */}
        <div className="flex items-center gap-2 text-[9px] text-gray-500">
          <span className="flex items-center gap-0.5" title="Dari Guru (Sekolah)">
            <Sun className="w-2.5 h-2.5 text-amber-500" />
            {guruXp}
          </span>
          <span className="flex items-center gap-0.5" title="Dari Orang Tua (Rumah)">
            <Droplets className="w-2.5 h-2.5 text-blue-500" />
            {ortuXp}
          </span>
          {plant?.xp_bonus_apresiasi ? (
            <span className="flex items-center gap-0.5 text-amber-600" title="Bonus Apresiasi Guru">
              <Star className="w-2.5 h-2.5" />
              {plant.xp_bonus_apresiasi}
            </span>
          ) : null}
        </div>

        {/* Streak */}
        {(plant?.streak_hari ?? 0) > 0 && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600">
            <Flame className="w-3 h-3" />
            <span>{plant!.streak_hari} hari berturut</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CLASS FOREST PANEL (Hutan Kelas Bersama)
// ============================================================
function ClassForestPanel({ forest, isLoading }: { forest: ClassForestData | null; isLoading: boolean }) {
  const score = forest?.sinergi_score ?? 0;
  const aktifOrtu = forest?.siswa_aktif_ortu ?? 0;
  const totalSiswa = forest?.total_siswa ?? 30;
  const pct = totalSiswa > 0 ? Math.round((aktifOrtu / totalSiswa) * 100) : 0;
  const maskot = forest?.maskot_unlock ? MASKOT_INFO[forest.maskot_unlock] : null;

  const forestLevel =
    score >= 90 ? 'Hutan Tropis Rimbun' :
    score >= 75 ? 'Hutan Berkembang Hijau' :
    score >= 60 ? 'Kebun Tumbuh Ceria' :
    score >= 40 ? 'Ladang Muda Semangat' :
    'Benih Awal Minggu Ini';

  const forestEmoji =
    score >= 90 ? '🌴🌳🌲🌿🦋' :
    score >= 75 ? '🌳🌿🌱🦜' :
    score >= 60 ? '🌿🌱🌻' :
    score >= 40 ? '🌱🌿' :
    '🌱';

  return (
    <div className="bg-white rounded-2xl border border-[#DDD8CE] shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#F5F0E8] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
            <TreePine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-800">Hutan Kelas Bersama</h3>
            <p className="text-[11px] text-gray-500">Tantangan Gotong Royong Minggu Ini</p>
          </div>
        </div>
        {maskot && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            <span className="text-base">{maskot.emoji}</span>
            <span className="text-[10px] font-bold text-amber-700">{maskot.nama}</span>
          </div>
        )}
      </div>

      {/* Forest Visualization */}
      <div
        className="px-5 py-5 text-center border-b border-[#F5F0E8] flex flex-col items-center justify-center"
        style={{
          background: score >= 60
            ? 'linear-gradient(to bottom, #ECFDF5, #F0FFF4)'
            : 'linear-gradient(to bottom, #F9FAFB, #F3F4F6)',
        }}
      >
        {isLoading ? (
          <div className="h-28 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600" />
          </div>
        ) : (
          <>
            <div className="relative mb-2.5">
              <img
                src="/plants/class_forest_tree.jpg"
                alt="Pohon Maskot Hutan Kelas"
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-2xl shadow-xs border-2 border-white/90 bg-white p-1"
                loading="lazy"
              />
              {score >= 80 && (
                <div
                  className="absolute -top-1.5 -right-1.5 bg-amber-400 text-amber-950 p-1.5 rounded-full shadow-xs"
                  title="Sinergi Emas!"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            <div className="text-sm font-bold text-gray-800">{forestLevel}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Skor Sinergi Kelas: <span className="font-bold text-emerald-700">{score.toFixed(0)}%</span>
            </div>
          </>
        )}
      </div>

      {/* Stats row */}
      <div className="px-5 py-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-base font-bold text-gray-800">{aktifOrtu}</div>
          <div className="text-[10px] text-gray-500">Ortu Aktif</div>
        </div>
        <div>
          <div className="text-base font-bold text-gray-800">{forest?.siswa_aktif_guru ?? 0}</div>
          <div className="text-[10px] text-gray-500">Guru Aktif</div>
        </div>
        <div>
          <div className="text-base font-bold text-gray-800">{forest?.total_xp_kelas ?? 0}</div>
          <div className="text-[10px] text-gray-500">Total XP Kelas</div>
        </div>
      </div>

      {/* Progress bar sinergi */}
      <div className="px-5 pb-4 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-600">
            {aktifOrtu}/{totalSiswa} wali murid aktif minggu ini
          </span>
          <span className="font-bold text-emerald-700">{pct}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: pct >= 80
                ? 'linear-gradient(to right, #16A34A, #4ADE80)'
                : pct >= 50
                ? 'linear-gradient(to right, #D97706, #FCD34D)'
                : 'linear-gradient(to right, #DC2626, #FCA5A5)',
            }}
          />
        </div>
        <div className="text-[10px] text-gray-400 text-right">
          Target: 80% untuk unlock maskot
        </div>
      </div>
    </div>
  );
}

// ============================================================
// KEPALA SEKOLAH PANEL (Kinerja Guru)
// ============================================================
function KepsekPanel({
  classForests,
  isLoading,
}: {
  classForests: ClassForestData[];
  isLoading: boolean;
}) {
  const sorted = [...classForests].sort((a, b) => b.sinergi_score - a.sinergi_score);

  return (
    <div className="bg-white rounded-2xl border border-[#DDD8CE] shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F5F0E8] flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-gray-800">Leaderboard Kelas Se-Sekolah</h3>
          <p className="text-[11px] text-gray-500">Sinergi Orang Tua & Guru per Kelas - Minggu Ini</p>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Memuat data leaderboard...</div>
        ) : sorted.length === 0 ? (
          <div className="p-8 text-center">
            <TreePine className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Belum ada data hutan kelas minggu ini.</p>
          </div>
        ) : (
          sorted.map((forest, idx) => {
            const scoreColor = forest.sinergi_score >= 80 ? '#16A34A' : forest.sinergi_score >= 60 ? '#D97706' : '#DC2626';
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
            return (
              <div key={forest.kelas_id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-base w-6 text-center">{medal}</span>
                  <div>
                    <div className="font-bold text-sm text-gray-800">{forest.kelas_id}</div>
                    <div className="text-[11px] text-gray-500">
                      {forest.siswa_aktif_ortu}/{forest.total_siswa} ortu aktif
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm" style={{ color: scoreColor }}>
                    {forest.sinergi_score.toFixed(0)}%
                  </div>
                  {forest.maskot_unlock && (
                    <div className="text-[11px]">{MASKOT_INFO[forest.maskot_unlock]?.emoji}</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================
// STREAK & LEGEND INFO BOX
// ============================================================
function GardenLegend() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-[#DDD8CE] bg-[#FAF8F2] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-gray-700 hover:bg-[#F5F0E8] transition cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#922B21]" />
          <span>Cara Mendapat XP & Menumbuhkan Tanaman</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2.5 text-[11px] text-gray-600 border-t border-[#DDD8CE]">
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center gap-2 bg-amber-50 rounded-lg p-2 border border-amber-100">
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              <span><strong>+3 XP</strong> Guru catat kegiatan sekolah</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-2 border border-blue-100">
              <Droplets className="w-4 h-4 text-blue-500 shrink-0" />
              <span><strong>+4 XP</strong> Orang tua catat kegiatan rumah</span>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 rounded-lg p-2 border border-amber-100">
              <Star className="w-4 h-4 text-amber-500 shrink-0" />
              <span><strong>+3 XP</strong> Bonus Apresiasi dari Guru</span>
            </div>
            <div className="flex items-center gap-2 bg-yellow-50 rounded-lg p-2 border border-yellow-100">
              <Sparkles className="w-4 h-4 text-yellow-500 shrink-0" />
              <span><strong>+7 XP</strong> Bonus Harmoni (Sekolah + Rumah dalam 1 hari!)</span>
            </div>
          </div>
          <div className="text-[10px] text-gray-400 pt-1">
            Level tanaman: Benih (0 XP) → Tunas (5) → Tumbuh (15) → Berkembang (30) → Mekar (50) → Panen Raya (75)
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT: KaihGarden
// ============================================================

interface KaihGardenProps {
  role: 'guru' | 'admin' | 'orangtua' | 'kepala_sekolah';
  siswaId?: string;      // untuk orang tua (id murid)
  kelasId?: string;      // untuk guru/kepala sekolah
  kegiatanList: KaihKegiatan[];
  studentName?: string;
}

export default function KaihGarden({
  role,
  siswaId = 's-1',
  kelasId = 'c1-4a',
  kegiatanList,
  studentName = 'Ananda',
}: KaihGardenProps) {
  const bulanTahun = getBulanTahun();
  const mingguIso = getISOWeek();

  // State
  const [plants, setPlants] = useState<PlantState[]>([]);
  const [classForest, setClassForest] = useState<ClassForestData | null>(null);
  const [allForests, setAllForests] = useState<ClassForestData[]>([]);
  const [loadingPlants, setLoadingPlants] = useState(true);
  const [loadingForest, setLoadingForest] = useState(true);
  const [highlightedPilar, setHighlightedPilar] = useState<number | null>(null);

  // ── Derive plants from kegiatanList (local state, real-time) ──────────────
  const derivePlantsFromKegiatan = useCallback((list: KaihKegiatan[]) => {
    const thisMonth = bulanTahun;
    const monthItems = list.filter((k) => k.tanggal?.startsWith(thisMonth.replace('-', '-')));

    // Build a map per pilar_id
    const plantMap: Record<number, PlantState> = {};
    for (let pid = 1; pid <= 7; pid++) {
      plantMap[pid] = {
        pilar_id: pid,
        xp: 0,
        level: 0,
        xp_dari_guru: 0,
        xp_dari_ortu: 0,
        xp_bonus_apresiasi: 0,
        streak_hari: 0,
        last_watered_at: null,
      };
    }

    // Track days per pilar for streak & harmoni calculation
    const daysByPilar: Record<number, { school: Set<string>; home: Set<string> }> = {};
    for (let pid = 1; pid <= 7; pid++) {
      daysByPilar[pid] = { school: new Set(), home: new Set() };
    }

    for (const item of monthItems) {
      const pid = item.kategori_id;
      if (!plantMap[pid]) continue;
      const dateKey = item.tanggal;

      if (item.tipe === 'sekolah') {
        plantMap[pid].xp_dari_guru += 3;
        daysByPilar[pid].school.add(dateKey);
      } else if (item.tipe === 'rumah') {
        plantMap[pid].xp_dari_ortu += 4;
        daysByPilar[pid].home.add(dateKey);
      }

      if (item.apresiasi_guru) {
        plantMap[pid].xp_bonus_apresiasi += 3;
      }
    }

    // Bonus Harmoni: +7 XP per hari yang sekolah & rumah keduanya terisi
    for (let pid = 1; pid <= 7; pid++) {
      const harmonDays = [...daysByPilar[pid].school].filter((d) =>
        daysByPilar[pid].home.has(d)
      );
      if (harmonDays.length > 0) {
        plantMap[pid].xp_dari_guru += harmonDays.length * 3; // bonus sinergi di-split
        plantMap[pid].xp_dari_ortu += harmonDays.length * 4;
      }
    }

    // Calculate total XP & level
    for (let pid = 1; pid <= 7; pid++) {
      const p = plantMap[pid];
      p.xp = p.xp_dari_guru + p.xp_dari_ortu + p.xp_bonus_apresiasi;
      p.level = xpToLevel(p.xp);
    }

    // Simple streak: hitung hari berturut-turut dari hari ini ke belakang (pilar 1)
    // Gunakan gabungan semua kegiatan untuk streak global
    const allDates = new Set(monthItems.map((k) => k.tanggal));
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (allDates.has(ds)) streak++;
      else if (i > 0) break;
    }
    for (let pid = 1; pid <= 7; pid++) {
      plantMap[pid].streak_hari = streak;
    }

    return Object.values(plantMap);
  }, [bulanTahun]);

  // ── Load plants ───────────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingPlants(true);
    // Derive from props kegiatanList first (instant, no network)
    const derived = derivePlantsFromKegiatan(kegiatanList);
    setPlants(derived);
    setLoadingPlants(false);

    // Then try to load from Supabase kaih_garden for persisted XP
    async function loadFromDB() {
      try {
        const { data } = await supabase
          .from('kaih_garden')
          .select('*')
          .eq('siswa_id', siswaId)
          .eq('bulan_tahun', bulanTahun);

        if (data && data.length > 0) {
          // Merge DB data (for streak & last_watered_at) with derived XP
          const merged = derived.map((p) => {
            const dbRow = data.find((d: any) => d.pilar_id === p.pilar_id);
            if (dbRow) {
              return {
                ...p,
                streak_hari: dbRow.streak_hari ?? p.streak_hari,
                last_watered_at: dbRow.last_watered_at ?? null,
              };
            }
            return p;
          });
          setPlants(merged);
        }
      } catch {
        // fail silently, derived from kegiatanList is enough
      }
    }
    loadFromDB();
  }, [kegiatanList, siswaId, bulanTahun, derivePlantsFromKegiatan]);

  // ── Load class forest ─────────────────────────────────────────────────────
  useEffect(() => {
    async function loadForest() {
      setLoadingForest(true);
      try {
        // Load hutan kelas ini
        const { data: myForest } = await supabase
          .from('kaih_class_forest')
          .select('*')
          .eq('kelas_id', kelasId)
          .eq('minggu_iso', mingguIso)
          .single();

        if (myForest) {
          setClassForest(myForest as ClassForestData);
        } else {
          // Kalkulasi dari kegiatan list secara lokal
          const weekStart = getWeekStart();
          const weekItems = kegiatanList.filter((k) => k.tanggal >= weekStart);
          const ortuSet = new Set(weekItems.filter((k) => k.tipe === 'rumah').map((k) => k.siswa_id));
          const guruSet = new Set(weekItems.filter((k) => k.tipe === 'sekolah').map((k) => k.kelas_id));
          const totalXP = plants.reduce((sum, p) => sum + p.xp, 0);
          const total_siswa = 30; // placeholder; idealnya dari DB
          const aktif = ortuSet.size;
          const sinergi = Math.min(100, Math.round((aktif / total_siswa) * 100));
          setClassForest({
            kelas_id: kelasId,
            minggu_iso: mingguIso,
            total_siswa,
            siswa_aktif_ortu: aktif,
            siswa_aktif_guru: guruSet.size,
            sinergi_score: sinergi,
            total_xp_kelas: totalXP,
            maskot_unlock: sinergi >= 80 ? 'kupu_emas' : null,
          });
        }

        // Kepala sekolah: load semua kelas
        if (role === 'kepala_sekolah' || role === 'admin') {
          const { data: allData } = await supabase
            .from('kaih_class_forest')
            .select('*')
            .eq('minggu_iso', mingguIso)
            .order('sinergi_score', { ascending: false });
          if (allData) setAllForests(allData as ClassForestData[]);
        }
      } catch {
        // fail silently
      } finally {
        setLoadingForest(false);
      }
    }
    loadForest();
  }, [kelasId, mingguIso, kegiatanList, plants, role]);

  // ── Highlight last added pilar ────────────────────────────────────────────
  useEffect(() => {
    if (kegiatanList.length === 0) return;
    const latest = kegiatanList[0];
    if (latest?.kategori_id) {
      setHighlightedPilar(latest.kategori_id);
      const t = setTimeout(() => setHighlightedPilar(null), 4000);
      return () => clearTimeout(t);
    }
  }, [kegiatanList]);

  // ── Aggregate streak & total XP ───────────────────────────────────────────
  const maxStreak = Math.max(...plants.map((p) => p.streak_hari), 0);
  const totalXP = plants.reduce((sum, p) => sum + p.xp, 0);
  const matureCount = plants.filter((p) => p.level >= 3).length;

  // ── Role-specific intro text ──────────────────────────────────────────────
  const introText =
    role === 'orangtua'
      ? `Kebun Karakter ${studentName}`
      : role === 'guru' || role === 'admin'
      ? 'Kebun Karakter Kelas'
      : 'Pantauan Kebun Karakter Sekolah';

  return (
    <div className="space-y-4">
      {/* ── HEADER ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
            <TreePine className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-gray-800">{introText}</h2>
            <p className="text-[11px] text-gray-500">
              7 Tanaman Karakter KAIH &bull; {bulanTahun.replace('-', '/')}
            </p>
          </div>
        </div>

        {/* Summary badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {maxStreak > 0 && (
            <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-full text-[11px] font-bold">
              <Flame className="w-3.5 h-3.5" />
              <span>{maxStreak} hari streak</span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <Star className="w-3.5 h-3.5" />
            <span>{totalXP} Total XP</span>
          </div>
          {matureCount > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full text-[11px] font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>{matureCount}/7 Tumbuh</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 7 PLANT POTS GRID ────────────────────────────────── */}
      {loadingPlants ? (
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-100 bg-gray-50 h-44 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
          {plants.map((plant) => (
            <PlantPot
              key={plant.pilar_id}
              pilar_id={plant.pilar_id}
              plant={plant}
              isHighlighted={highlightedPilar === plant.pilar_id}
            />
          ))}
        </div>
      )}

      {/* ── SINERGI INFO STRIP ───────────────────────────────── */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-blue-50 border border-amber-100 rounded-xl px-4 py-3 text-[11px]">
        <div className="flex items-center gap-1.5 text-amber-700 font-bold">
          <Sun className="w-4 h-4" />
          <span>Guru = Sinar Matahari (+3 XP)</span>
        </div>
        <div className="w-px h-4 bg-gray-300" />
        <div className="flex items-center gap-1.5 text-blue-700 font-bold">
          <Droplets className="w-4 h-4" />
          <span>Orang Tua = Tetes Air (+4 XP)</span>
        </div>
        <div className="w-px h-4 bg-gray-300 hidden sm:block" />
        <div className="items-center gap-1.5 text-yellow-700 font-bold hidden sm:flex">
          <Sparkles className="w-4 h-4" />
          <span>Keduanya = Harmoni Sempurna (+7 bonus!)</span>
        </div>
      </div>

      {/* ── HUTAN KELAS (untuk semua role) ───────────────────── */}
      <ClassForestPanel forest={classForest} isLoading={loadingForest} />

      {/* ── LEADERBOARD SEKOLAH (hanya kepala sekolah / admin) ── */}
      {(role === 'kepala_sekolah' || role === 'admin') && (
        <KepsekPanel classForests={allForests} isLoading={loadingForest} />
      )}

      {/* ── LEGEND & XP GUIDE ────────────────────────────────── */}
      <GardenLegend />
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Mon
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}
