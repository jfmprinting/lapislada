'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { FolderOpen, ExternalLink, Plus, BookCheck } from 'lucide-react';

interface MateriItem {
  id: string;
  judul: string;
  mapel: string;
  deskripsi: string;
  link_gdrive: string;
  kelas: string;
}

const INITIAL_MATERI: MateriItem[] = [
  {
    id: 'm-1',
    judul: 'Modul Ajar Matematika: Operasi Pecahan Campuran',
    mapel: 'Matematika',
    deskripsi: 'Panduan belajar mandiri siswa dilengkapi soal latihan dan pembahasan.',
    link_gdrive: 'https://drive.google.com/file/d/demo-materi-mtk/view',
    kelas: 'Kelas 4A',
  },
  {
    id: 'm-2',
    judul: 'Bahan Tayang IPA: Rantai Makanan & Jaring-Jaring Kehidupan',
    mapel: 'IPA',
    deskripsi: 'Slide presentasi bergambar untuk dipelajari sebelum kuis.',
    link_gdrive: 'https://drive.google.com/file/d/demo-materi-ipa/view',
    kelas: 'Kelas 4A',
  },
  {
    id: 'm-3',
    judul: 'Lembar Kerja Siswa (LKS) Bahasa Indonesia: Menulis Puisi',
    mapel: 'Bahasa Indonesia',
    deskripsi: 'Format latihan tugas menulis puisi bertema alam sekitar.',
    link_gdrive: 'https://drive.google.com/file/d/demo-materi-bind/view',
    kelas: 'Kelas 4A',
  },
];

export default function MateriPage() {
  const [materiList] = useState<MateriItem[]>(INITIAL_MATERI);

  return (
    <AppShell
      role="guru"
      pageTitle="Materi Pelajaran"
      pageSubtitle="Penyimpanan link Google Drive materi belajar siswa (Zero Storage Server)"
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#DDD8CE] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FDEDEC] text-[#922B21]">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">
                Materi & Lembar Belajar Siswa
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Wali murid dan siswa dapat mengunduh langsung dari Google Drive
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materiList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 shadow-xs border border-[#DDD8CE] hover:border-[#C0392B]/40 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F0E8] text-[#922B21] border border-[#DDD8CE]">
                    {item.mapel}
                  </span>
                  <span className="text-[11px] text-[#6B6B6B] font-medium">
                    {item.kelas}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-base text-[#1A1A1A] mb-2 leading-snug">
                  {item.judul}
                </h3>
                <p className="text-xs text-[#6B6B6B] mb-4 leading-relaxed">
                  {item.deskripsi}
                </p>
              </div>

              <div className="pt-3 border-t border-[#F5F0E8] flex justify-end">
                <a
                  href={item.link_gdrive}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold shadow-xs transition active:scale-95"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Google Drive</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
