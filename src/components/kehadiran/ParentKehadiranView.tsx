'use client';

import Link from 'next/link';
import { Calendar, Plus, Image as ImageIcon, BookOpen, ArrowRight } from 'lucide-react';
import { getTodayDateString } from '@/lib/supabase';

interface ParentKehadiranViewProps {
  parentSiswa: any;
  todayStr: string;
  monthLabel: string;
  selectedYear: number;
  parentStats: { H: number; S: number; I: number; A: number; total: number; percent: number };
  parentLoading: boolean;
  parentRecords: any[];
  onOpenIzinModal: () => void;
  onPreviewFoto: (url: string) => void;
}

export default function ParentKehadiranView({
  parentSiswa,
  todayStr,
  monthLabel,
  selectedYear,
  parentStats,
  parentLoading,
  parentRecords,
  onOpenIzinModal,
  onPreviewFoto,
}: ParentKehadiranViewProps) {
  return (
    <div className="space-y-6">
      {/* Header Parent Summary */}
      <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-xs border border-[#DDD8CE] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#FDEDEC] text-[#922B21] text-[11px] font-bold border border-[#F1948A]">
              Status Presensi Ananda {parentSiswa?.nama_lengkap ? `· ${parentSiswa.nama_lengkap}` : ''}
            </span>
            <span className="text-xs text-[#6B6B6B] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {todayStr}
            </span>
          </div>
          <h2 className="font-serif font-bold text-xl text-[#1A1A1A]">
            Presensi Ananda Bulan {monthLabel} {selectedYear}
          </h2>
          <p className="text-xs text-[#6B6B6B]">
            {parentSiswa?.kelas?.nama_kelas ? `${parentSiswa.kelas.nama_kelas} · ` : ''}Data kehadiran dicatat setiap pagi oleh wali kelas untuk memantau kedisiplinan dan kesehatan ananda.
          </p>
        </div>

        {/* Action Button & Counter Grid */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenIzinModal}
            className="px-4 py-2.5 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajukan Izin / Sakit Ananda</span>
          </button>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-200 min-w-[62px]">
              <span className="block font-serif font-bold text-base">{parentStats.H}</span>
              <span className="text-[10px] uppercase font-bold text-emerald-700">Hadir</span>
            </div>
            <div className="bg-amber-50 text-amber-800 p-2.5 rounded-xl border border-amber-200 min-w-[62px]">
              <span className="block font-serif font-bold text-base">{parentStats.S}</span>
              <span className="text-[10px] uppercase font-bold text-amber-700">Sakit</span>
            </div>
            <div className="bg-blue-50 text-blue-800 p-2.5 rounded-xl border border-blue-200 min-w-[62px]">
              <span className="block font-serif font-bold text-base">{parentStats.I}</span>
              <span className="text-[10px] uppercase font-bold text-blue-700">Izin</span>
            </div>
            <div className="bg-[#FDEDEC] text-[#922B21] p-2.5 rounded-xl border border-[#F1948A] min-w-[62px]">
              <span className="block font-serif font-bold text-base">{parentStats.A}</span>
              <span className="text-[10px] uppercase font-bold text-[#922B21]">Alpha</span>
            </div>
          </div>
        </div>
      </div>

      {/* Parent Log Table */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#DDD8CE]">
        <h3 className="font-serif font-bold text-base text-[#1A1A1A] mb-3 pb-2 border-b border-[#F5F0E8] flex items-center justify-between">
          <span>Riwayat Presensi Ananda ({monthLabel} {selectedYear})</span>
          <span
            className={`text-xs font-sans font-bold px-2.5 py-1 rounded-full border ${
              parentStats.total === 0
                ? 'bg-gray-100 text-gray-700 border-gray-300'
                : parentStats.percent >= 90
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}
          >
            {parentStats.total === 0
              ? 'Belum Ada Data'
              : `Kehadiran: ${parentStats.percent}% (${parentStats.percent >= 90 ? 'Sangat Baik' : 'Cukup Baik'})`}
          </span>
        </h3>

        {parentLoading ? (
          <div className="py-8 text-center text-xs text-[#6B6B6B]">
            Memuat riwayat presensi ananda...
          </div>
        ) : parentRecords.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#6B6B6B]">
            <Calendar className="w-8 h-8 text-[#DDD8CE] mx-auto mb-2" />
            <p className="font-semibold text-[#1A1A1A]">Belum Ada Catatan Presensi</p>
            <p className="text-[11px] text-[#6B6B6B] mt-0.5">
              Wali kelas belum menginput data absensi ananda untuk bulan {monthLabel} {selectedYear}.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F5F0E8] text-xs">
            {parentRecords.map((record) => {
              const dateFormatted = new Intl.DateTimeFormat('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(new Date(record.tanggal));

              const badgeConfig = {
                H: { label: 'Hadir', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                S: { label: 'Sakit', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
                I: { label: 'Izin', bg: 'bg-blue-100 text-blue-800 border-blue-300' },
                A: { label: 'Alpha', bg: 'bg-red-100 text-red-800 border-red-300' },
              }[record.status as 'H' | 'S' | 'I' | 'A'] || {
                label: record.status,
                bg: 'bg-gray-100 text-gray-800 border-gray-300',
              };

              const hasIzinInfo = !!record.parsedKet;
              const ketText = hasIzinInfo
                ? record.parsedKet.alasan ||
                  (record.status === 'S' ? 'Izin sakit diajukan orang tua' : 'Izin diajukan orang tua')
                : record.keterangan ||
                  (record.status === 'H' ? 'Presensi terekam tepat waktu' : 'Tercatat di sistem');

              return (
                <div
                  key={record.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#1A1A1A]">{dateFormatted}</span>
                      {hasIzinInfo && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                          <span>Diajukan Wali Murid</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#6B6B6B] leading-relaxed">{ketText}</p>
                    {hasIzinInfo && record.parsedKet?.foto_url && (
                      <button
                        type="button"
                        onClick={() => onPreviewFoto(record.parsedKet.foto_url)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#922B21] hover:underline cursor-pointer pt-0.5"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Lihat Lampiran Foto Bukti / Surat Dokter</span>
                      </button>
                    )}
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border self-start sm:self-center shrink-0 ${badgeConfig.bg}`}
                  >
                    {badgeConfig.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Link to Buku Penghubung */}
      <div className="bg-[#FAF8F2] rounded-2xl p-4 border border-[#DDD8CE] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-[#922B21] shrink-0" />
          <span>Ingin memberitahukan izin atau kondisi kesehatan ananda kepada wali kelas?</span>
        </div>
        <Link
          href="/buku-penghubung?role=orangtua&tulis=true"
          className="px-4 py-2 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white font-bold text-xs shadow-xs transition active:scale-95 shrink-0 inline-flex items-center gap-1.5"
        >
          <span>Tulis ke Guru</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

