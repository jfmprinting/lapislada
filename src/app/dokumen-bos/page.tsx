'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, FolderLock, ExternalLink, Trash2, Edit3, Filter, AlertCircle, FileText } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { supabase, DokumenBOS } from '@/lib/supabase';

const DUMMY_BOS: DokumenBOS[] = [
  {
    id: 'bos-1',
    judul: 'SPJ BOS Reguler Triwulan 1 2026',
    kategori: 'SPJ',
    link_gdrive: 'https://drive.google.com/file/d/1demo-spj-tw1-2026/view',
    tahun_anggaran: 2026,
    triwulan: 1,
    uploaded_by: 'Bu Sari, S.Pd',
    created_at: '2026-03-12T08:30:00Z',
  },
  {
    id: 'bos-2',
    judul: 'RKAS Perubahan BOS 2026',
    kategori: 'RKAS',
    link_gdrive: 'https://drive.google.com/file/d/1demo-rkas-2026/view',
    tahun_anggaran: 2026,
    triwulan: null,
    uploaded_by: 'Admin Sekolah',
    created_at: '2026-01-03T10:15:00Z',
  },
  {
    id: 'bos-3',
    judul: 'SK Tim Pengelola BOSP 2026',
    kategori: 'SK',
    link_gdrive: 'https://drive.google.com/file/d/1demo-sk-bosp-2026/view',
    tahun_anggaran: 2026,
    triwulan: null,
    uploaded_by: 'Kepala Sekolah',
    created_at: '2026-01-05T09:00:00Z',
  },
];

export default function DokumenBOSPage() {
  const [documents, setDocuments] = useState<DokumenBOS[]>(DUMMY_BOS);
  const [filterYear, setFilterYear] = useState<string>('2026');
  const [filterKat, setFilterKat] = useState<string>('Semua');

  // Modal / Form state (WF-08)
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DokumenBOS | null>(null);
  const [formJudul, setFormJudul] = useState('');
  const [formKategori, setFormKategori] = useState('SPJ');
  const [formTahun, setFormTahun] = useState('2026');
  const [formTriwulan, setFormTriwulan] = useState<string>('1');
  const [formLink, setFormLink] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocs() {
      try {
        const { data, error } = await supabase
          .from('dokumen_bos')
          .select('*, users_profile(nama)')
          .order('tahun_anggaran', { ascending: false });

        if (data && data.length > 0 && !error) {
          setDocuments(data as any);
        }
      } catch (err) {}
    }
    loadDocs();
  }, []);

  const openAddModal = () => {
    setEditingDoc(null);
    setFormJudul('');
    setFormKategori('SPJ');
    setFormTahun('2026');
    setFormTriwulan('1');
    setFormLink('');
    setUrlError(null);
    setShowModal(true);
  };

  const openEditModal = (doc: DokumenBOS) => {
    setEditingDoc(doc);
    setFormJudul(doc.judul);
    setFormKategori(doc.kategori);
    setFormTahun(String(doc.tahun_anggaran));
    setFormTriwulan(doc.triwulan ? String(doc.triwulan) : '');
    setFormLink(doc.link_gdrive);
    setUrlError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate Google Drive link
    if (!formLink.includes('drive.google.com')) {
      setUrlError('URL harus berasal dari Google Drive (drive.google.com)');
      return;
    }

    const payload: DokumenBOS = {
      id: editingDoc ? editingDoc.id : `bos-${Date.now()}`,
      judul: formJudul.trim(),
      kategori: formKategori,
      tahun_anggaran: parseInt(formTahun) || 2026,
      triwulan: formTriwulan ? parseInt(formTriwulan) : null,
      link_gdrive: formLink.trim(),
      uploaded_by: 'Admin / Guru',
      created_at: editingDoc ? editingDoc.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (editingDoc) {
      setDocuments(documents.map((d) => (d.id === editingDoc.id ? payload : d)));
    } else {
      setDocuments([payload, ...documents]);
    }

    try {
      await supabase.from('dokumen_bos').upsert(payload);
    } catch (e) {}

    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus arsip dokumen BOS ini?')) {
      setDocuments(documents.filter((d) => d.id !== id));
      try {
        await supabase.from('dokumen_bos').delete().eq('id', id);
      } catch (e) {}
    }
  };

  const filteredDocs = documents.filter((d) => {
    const matchYear = filterYear === 'Semua' || String(d.tahun_anggaran) === filterYear;
    const matchKat = filterKat === 'Semua' || d.kategori === filterKat;
    return matchYear && matchKat;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8] pb-24 text-[#1A1A1A]">
      <Navbar schoolName="Dokumen BOS" />

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

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C0392B] hover:bg-[#a93226] text-white text-xs font-bold shadow transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dokumen</span>
          </button>
        </div>

        {/* TITLE CARD */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#DDD8CE] mb-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 rounded-lg bg-[#FDEDEC] text-[#922B21]">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-base text-[#1A1A1A]">
                Arsip Dokumen BOS
              </h1>
              <p className="text-[11px] text-[#6B6B6B]">
                Penyimpanan terpusat link Google Drive SPJ, RKAS, dan Laporan BOS (Khusus Guru & Admin)
              </p>
            </div>
          </div>

          {/* FILTER CONTROLS (WF-07) */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#F5F0E8] text-xs">
            <div>
              <label className="block text-[10px] font-bold text-[#6B6B6B] mb-1">
                Tahun Anggaran
              </label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-[#DDD8CE] bg-white text-[#1A1A1A] font-medium"
              >
                <option value="Semua">Semua Tahun</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#6B6B6B] mb-1">
                Kategori
              </label>
              <select
                value={filterKat}
                onChange={(e) => setFilterKat(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-[#DDD8CE] bg-white text-[#1A1A1A] font-medium"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="SPJ">SPJ</option>
                <option value="RKAS">RKAS</option>
                <option value="Laporan">Laporan</option>
                <option value="SK">SK</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>
        </div>

        {/* DOCUMENT LIST (WF-07) */}
        <div className="space-y-3">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-[#DDD8CE] p-6 text-xs text-[#6B6B6B]">
              Tidak ada dokumen BOS yang sesuai dengan filter.
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-[#DDD8CE] hover:border-[#C0392B]/50 transition"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded bg-[#FDEDEC] text-[#922B21]">
                      <FileText className="w-4 h-4" />
                    </span>
                    <h3 className="font-serif font-bold text-sm text-[#1A1A1A] line-clamp-1">
                      {doc.judul}
                    </h3>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-[#F5F0E8] text-[#922B21] text-[10px] font-bold border border-[#DDD8CE] shrink-0">
                    {doc.kategori}
                  </span>
                </div>

                <div className="text-[11px] text-[#6B6B6B] space-y-0.5 mb-3 pl-8">
                  <div>
                    Tahun: <span className="font-semibold text-[#1A1A1A]">{doc.tahun_anggaran}</span>
                    {doc.triwulan && (
                      <span className="ml-2">
                        · Triwulan: <span className="font-semibold text-[#1A1A1A]">{doc.triwulan}</span>
                      </span>
                    )}
                  </div>
                  <div>
                    Diupload oleh: <span className="text-[#3D3D3D]">{doc.uploaded_by || 'Admin'}</span>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center justify-between pt-2 border-t border-[#F5F0E8]">
                  <a
                    href={doc.link_gdrive}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold shadow-xs transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka GDrive</span>
                  </a>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(doc)}
                      title="Edit Dokumen"
                      className="p-1.5 text-[#6B6B6B] hover:text-[#922B21] hover:bg-[#F5F0E8] rounded-md transition"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      title="Hapus Dokumen"
                      className="p-1.5 text-[#6B6B6B] hover:text-[#C0392B] hover:bg-[#FDEDEC] rounded-md transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* MODAL FORM TAMBAH/EDIT (WF-08) */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 border border-[#DDD8CE] animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E0D0]">
                <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                  {editingDoc ? 'Edit Dokumen BOS' : 'Tambah Dokumen BOS'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-xs font-bold text-[#6B6B6B] hover:text-black p-1"
                >
                  ✕
                </button>
              </div>

              {urlError && (
                <div className="mb-3 p-2.5 rounded-lg bg-[#FDEDEC] border border-[#F1948A] text-xs text-[#922B21] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{urlError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#3D3D3D] mb-1">
                    Judul Dokumen *
                  </label>
                  <input
                    type="text"
                    required
                    value={formJudul}
                    onChange={(e) => setFormJudul(e.target.value)}
                    placeholder="Misal: SPJ BOS Triwulan 1 2026"
                    className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#3D3D3D] mb-1">
                      Kategori *
                    </label>
                    <select
                      value={formKategori}
                      onChange={(e) => setFormKategori(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A]"
                    >
                      <option value="SPJ">SPJ</option>
                      <option value="RKAS">RKAS</option>
                      <option value="Laporan">Laporan</option>
                      <option value="SK">SK</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#3D3D3D] mb-1">
                      Tahun Anggaran *
                    </label>
                    <input
                      type="number"
                      required
                      value={formTahun}
                      onChange={(e) => setFormTahun(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#3D3D3D] mb-1">
                    Triwulan (Opsional)
                  </label>
                  <select
                    value={formTriwulan}
                    onChange={(e) => setFormTriwulan(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A]"
                  >
                    <option value="">Tidak Ada / Tahunan</option>
                    <option value="1">Triwulan 1 (Jan - Mar)</option>
                    <option value="2">Triwulan 2 (Apr - Jun)</option>
                    <option value="3">Triwulan 3 (Jul - Sep)</option>
                    <option value="4">Triwulan 4 (Okt - Des)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#3D3D3D] mb-1">
                    Link Google Drive *
                  </label>
                  <input
                    type="url"
                    required
                    value={formLink}
                    onChange={(e) => {
                      setFormLink(e.target.value);
                      setUrlError(null);
                    }}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                  />
                  <p className="text-[10px] text-[#6B6B6B] mt-1">
                    Wajib tautan Google Drive yang dapat diakses oleh tim sekolah.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg border border-[#DDD8CE] text-[#6B6B6B] hover:bg-[#F5F0E8] font-semibold"
                  >
                    Batalkan
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#C0392B] hover:bg-[#a93226] text-white font-bold shadow active:scale-95 cursor-pointer"
                  >
                    Simpan Dokumen →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <BottomNav role="guru" />
    </div>
  );
}
