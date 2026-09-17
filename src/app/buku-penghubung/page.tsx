'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, MessageSquare, Filter, CheckCircle, Clock, User, Sparkles } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { supabase, BukuPenghubungItem } from '@/lib/supabase';

// Sample fallback entries when DB is new
const DUMMY_ENTRIES: BukuPenghubungItem[] = [
  {
    id: 'entry-1',
    siswa_id: 'siswa-1',
    author_id: 'ortu-1',
    author_role: 'orangtua',
    catatan: 'Ahmad tadi malam kurang tidur karena sakit perut ringan. Mohon dipantau ya Bu 🙏 Jika lemas mohon izinkan istirahat di UKS.',
    is_read_by_guru: false,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    users_profile: { nama: 'Pak Budi (Wali Ahmad)' },
    siswa: { nama_lengkap: 'Ahmad Budi Santoso (Kelas 4A)' },
  },
  {
    id: 'entry-2',
    siswa_id: 'siswa-1',
    author_id: 'guru-1',
    author_role: 'guru',
    catatan: 'Baik Pak Budi, terima kasih infonya. Ahmad sudah di kelas dan terlihat bersemangat. PR Matematikanya juga dikerjakan dengan sangat rapi.',
    is_read_by_guru: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // kemarin
    users_profile: { nama: 'Bu Sari, S.Pd (Wali Kelas)' },
    siswa: { nama_lengkap: 'Ahmad Budi Santoso (Kelas 4A)' },
  },
  {
    id: 'entry-3',
    siswa_id: 'siswa-2',
    author_id: 'guru-1',
    author_role: 'guru',
    catatan: 'Ananda Citra hari ini berhasil meraih nilai 100 dalam kuis IPA mengenal rantai makanan. Terus dipertahankan ya!',
    is_read_by_guru: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    users_profile: { nama: 'Bu Sari, S.Pd' },
    siswa: { nama_lengkap: 'Citra Lestari (Kelas 4A)' },
  },
];

export default function BukuPenghubungPage() {
  const [entries, setEntries] = useState<BukuPenghubungItem[]>(DUMMY_ENTRIES);
  const [filterRole, setFilterRole] = useState<'semua' | 'guru' | 'orangtua'>('semua');
  const [currentRole, setCurrentRole] = useState<'guru' | 'orangtua' | 'admin'>('guru');

  // Quick form state inside page for immediate writing or fast reply
  const [showModal, setShowModal] = useState(false);
  const [targetSiswa, setTargetSiswa] = useState('Ahmad Budi Santoso (Kelas 4A)');
  const [newCatatan, setNewCatatan] = useState('');
  const [authorRoleInput, setAuthorRoleInput] = useState<'guru' | 'orangtua'>('orangtua');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchEntries() {
      try {
        const { data, error } = await supabase
          .from('buku_penghubung')
          .select('*, users_profile(nama), siswa(nama_lengkap)')
          .order('created_at', { ascending: false });

        if (data && data.length > 0 && !error) {
          setEntries(data as any);
        }
      } catch (err) {
        // Fallback to demo items
      }
    }
    fetchEntries();
  }, []);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatatan.trim()) return;

    setSubmitting(true);
    const newEntry: BukuPenghubungItem = {
      id: `entry-${Date.now()}`,
      siswa_id: 'siswa-1',
      author_id: 'user-current',
      author_role: authorRoleInput,
      catatan: newCatatan.trim(),
      is_read_by_guru: authorRoleInput === 'guru',
      created_at: new Date().toISOString(),
      users_profile: {
        nama: authorRoleInput === 'guru' ? 'Bu Sari, S.Pd (Guru)' : 'Pak Budi (Wali Murid)',
      },
      siswa: { nama_lengkap: targetSiswa },
    };

    try {
      // Try save to Supabase
      await supabase.from('buku_penghubung').insert({
        siswa_id: 'a0000000-0000-0000-0000-000000000010', // dummy uuid
        author_id: 'a0000000-0000-0000-0000-000000000002',
        author_role: authorRoleInput,
        catatan: newCatatan.trim(),
        is_read_by_guru: authorRoleInput === 'guru',
      });
    } catch (e) {
      // client-side simulation
    }

    setEntries([newEntry, ...entries]);
    setNewCatatan('');
    setShowModal(false);
    setSubmitting(false);
  };

  const markRead = async (id: string) => {
    setEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read_by_guru: true } : item))
    );
    try {
      await supabase.from('buku_penghubung').update({ is_read_by_guru: true }).eq('id', id);
    } catch (e) {}
  };

  const filteredEntries = entries.filter((item) => {
    if (filterRole === 'semua') return true;
    return item.author_role === filterRole;
  });

  const unreadCount = entries.filter((e) => e.author_role === 'orangtua' && !e.is_read_by_guru).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8] pb-24 text-[#1A1A1A]">
      <Navbar schoolName="Buku Penghubung" />

      <main className="w-full max-w-md mx-auto sm:max-w-xl md:max-w-2xl px-4 py-4 flex-1">
        {/* TOP BAR (WF-05) */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#6B6B6B] hover:text-[#922B21]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C0392B] hover:bg-[#a93226] text-white text-xs font-bold shadow transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tulis Catatan</span>
          </button>
        </div>

        {/* TITLE CARD */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#DDD8CE] mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#FDEDEC] text-[#922B21]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-base text-[#1A1A1A]">
                  Buku Penghubung Dua Arah
                </h1>
                <p className="text-[11px] text-[#6B6B6B]">
                  Komunikasi langsung antara Wali Kelas & Orang Tua Murid
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FDEDEC] border border-[#F1948A] text-[11px] font-bold text-[#922B21]">
                <span className="w-2 h-2 rounded-full bg-[#C0392B] animate-pulse" />
                {unreadCount} Baru dari Ortu
              </span>
            )}
          </div>

          {/* FILTER BAR (WF-05) */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#F5F0E8] overflow-x-auto text-xs">
            <span className="text-[#6B6B6B] font-semibold text-[11px] shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <button
              onClick={() => setFilterRole('semua')}
              className={`px-3 py-1 rounded-md transition ${
                filterRole === 'semua'
                  ? 'bg-[#922B21] text-white font-bold'
                  : 'bg-[#F5F0E8] text-[#3D3D3D] hover:bg-[#E8E0D0]'
              }`}
            >
              Semua ({entries.length})
            </button>
            <button
              onClick={() => setFilterRole('orangtua')}
              className={`px-3 py-1 rounded-md transition ${
                filterRole === 'orangtua'
                  ? 'bg-[#922B21] text-white font-bold'
                  : 'bg-[#F5F0E8] text-[#3D3D3D] hover:bg-[#E8E0D0]'
              }`}
            >
              Dari Orang Tua
            </button>
            <button
              onClick={() => setFilterRole('guru')}
              className={`px-3 py-1 rounded-md transition ${
                filterRole === 'guru'
                  ? 'bg-[#922B21] text-white font-bold'
                  : 'bg-[#F5F0E8] text-[#3D3D3D] hover:bg-[#E8E0D0]'
              }`}
            >
              Dari Guru
            </button>
          </div>
        </div>

        {/* FEED ENTRIES LIST (WF-05) */}
        <div className="space-y-3">
          {filteredEntries.map((item) => {
            const isOrtu = item.author_role === 'orangtua';
            return (
              <div
                key={item.id}
                className={`rounded-xl p-4 shadow-sm border transition ${
                  isOrtu
                    ? 'bg-[#FDEDEC]/70 border-[#F1948A]/70'
                    : 'bg-white border-[#DDD8CE]'
                }`}
              >
                {/* Entry Header */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-black/5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase ${
                        isOrtu
                          ? 'bg-[#922B21] text-white'
                          : 'bg-[#F5F0E8] text-[#922B21] border border-[#DDD8CE]'
                      }`}
                    >
                      {isOrtu ? 'Orang Tua' : 'Guru'}
                    </span>
                    <span className="font-semibold text-xs text-[#1A1A1A]">
                      {item.users_profile?.nama || (isOrtu ? 'Wali Murid' : 'Wali Kelas')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#6B6B6B]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isOrtu && !item.is_read_by_guru && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#C0392B]" title="Belum dibaca guru" />
                    )}
                  </div>
                </div>

                {/* Siswa target */}
                <div className="text-[11px] text-[#6B6B6B] font-medium mb-2">
                  Memantau Siswa:{' '}
                  <span className="text-[#1A1A1A] font-semibold">
                    {item.siswa?.nama_lengkap || 'Ahmad Budi (Kelas 4A)'}
                  </span>
                </div>

                {/* Catatan Body */}
                <p className="text-xs text-[#1A1A1A] leading-relaxed whitespace-pre-wrap">
                  {item.catatan}
                </p>

                {/* Action footer */}
                <div className="mt-3 pt-2 flex items-center justify-between border-t border-black/5 text-xs">
                  {isOrtu && !item.is_read_by_guru ? (
                    <button
                      onClick={() => markRead(item.id)}
                      className="inline-flex items-center gap-1 text-[11px] text-[#922B21] hover:underline font-semibold"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Tandai Sudah Dibaca</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#6B6B6B]">
                      {item.is_read_by_guru ? '✓ Sudah dibaca' : ''}
                    </span>
                  )}

                  <button
                    onClick={() => {
                      setTargetSiswa(item.siswa?.nama_lengkap || 'Ahmad Budi (Kelas 4A)');
                      setAuthorRoleInput(isOrtu ? 'guru' : 'orangtua');
                      setShowModal(true);
                    }}
                    className="text-[11px] font-bold text-[#C0392B] hover:text-[#922B21] transition"
                  >
                    Balas Catatan &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM FIXED CTA FOR EASY MOBILE POSTING */}
        <div className="fixed bottom-16 left-0 right-0 p-4 pointer-events-none max-w-md sm:max-w-xl md:max-w-2xl mx-auto flex justify-center z-30">
          <button
            onClick={() => setShowModal(true)}
            className="pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold shadow-xl border border-[#F1948A]/40 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tulis Catatan Baru</span>
          </button>
        </div>

        {/* MODAL / BOTTOM SHEET FORM TULIS (WF-06) */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 border border-[#DDD8CE] animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E0D0]">
                <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                  Tulis Catatan Buku Penghubung
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-xs font-bold text-[#6B6B6B] hover:text-black p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateEntry} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#3D3D3D] mb-1">
                    Menulis Sebagai:
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#F5F0E8] rounded-lg">
                    <button
                      type="button"
                      onClick={() => setAuthorRoleInput('orangtua')}
                      className={`py-1.5 rounded-md font-bold text-[11px] ${
                        authorRoleInput === 'orangtua'
                          ? 'bg-[#922B21] text-white shadow-xs'
                          : 'text-[#6B6B6B]'
                      }`}
                    >
                      Orang Tua Murid
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthorRoleInput('guru')}
                      className={`py-1.5 rounded-md font-bold text-[11px] ${
                        authorRoleInput === 'guru'
                          ? 'bg-[#922B21] text-white shadow-xs'
                          : 'text-[#6B6B6B]'
                      }`}
                    >
                      Guru / Wali Kelas
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#3D3D3D] mb-1">
                    Untuk Siswa:
                  </label>
                  <select
                    value={targetSiswa}
                    onChange={(e) => setTargetSiswa(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] font-medium"
                  >
                    <option value="Ahmad Budi Santoso (Kelas 4A)">
                      Ahmad Budi Santoso — Kelas 4A
                    </option>
                    <option value="Citra Lestari (Kelas 4A)">
                      Citra Lestari — Kelas 4A
                    </option>
                    <option value="Dimas Prasetyo (Kelas 4A)">
                      Dimas Prasetyo — Kelas 4A
                    </option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-[#3D3D3D]">
                      Isi Catatan:
                    </label>
                    <span className="text-[10px] text-[#6B6B6B]">
                      {newCatatan.length} / 500 karakter
                    </span>
                  </div>
                  <textarea
                    required
                    maxLength={500}
                    rows={4}
                    value={newCatatan}
                    onChange={(e) => setNewCatatan(e.target.value)}
                    placeholder={
                      authorRoleInput === 'orangtua'
                        ? 'Contoh: Ahmad tadi malam demam ringan, mohon pantauannya saat jam istirahat ya Bu...'
                        : 'Contoh: Ahmad hari ini sangat aktif dalam kerja kelompok pelajaran IPA...'
                    }
                    className="w-full p-3 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                  />
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
                    disabled={submitting || !newCatatan.trim()}
                    className="px-4 py-2 rounded-lg bg-[#C0392B] hover:bg-[#a93226] text-white font-bold shadow active:scale-95 disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? 'Mengirim...' : 'Kirim Catatan →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <BottomNav role={currentRole} />
    </div>
  );
}
