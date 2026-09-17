'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { ArrowLeft, FolderOpen, ExternalLink, Plus, BookCheck } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col bg-[#F5F0E8] pb-24 text-[#1A1A1A]">
      <Navbar schoolName="Materi Pelajaran" />

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
            Zero Storage Server
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#DDD8CE] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#FDEDEC] text-[#922B21]">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-base text-[#1A1A1A]">
                Materi & Lembar Belajar
              </h1>
              <p className="text-[11px] text-[#6B6B6B]">
                Tautan materi Google Drive langsung dari guru tanpa membebani memori HP
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {materiList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-[#DDD8CE] hover:border-[#C0392B]/40 transition"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F5F0E8] text-[#922B21]">
                  {item.mapel}
                </span>
                <span className="text-[10px] text-[#6B6B6B] font-medium">
                  {item.kelas}
                </span>
              </div>

              <h3 className="font-serif font-bold text-sm text-[#1A1A1A] mb-1">
                {item.judul}
              </h3>
              <p className="text-xs text-[#6B6B6B] mb-3 leading-relaxed">
                {item.deskripsi}
              </p>

              <div className="pt-2 border-t border-[#F5F0E8] flex justify-end">
                <a
                  href={item.link_gdrive}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold shadow-xs transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Google Drive</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>

      <BottomNav role="guru" />
    </div>
  );
}
