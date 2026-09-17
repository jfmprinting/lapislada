'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, MessageSquare, Filter, CheckCircle, Clock, User, ArrowLeft } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { supabase, BukuPenghubungItem } from '@/lib/supabase';

const DUMMY_ENTRIES: BukuPenghubungItem[] = [
  {
    id: 'entry-1',
    siswa_id: 'siswa-1',
    author_id: 'ortu-1',
    author_role: 'orangtua',
    catatan: 'Ahmad tadi malam kurang tidur karena sakit perut ringan. Mohon dipantau ya Bu 🙏 Jika lemas mohon izinkan istirahat di UKS.',
    is_read_by_guru: false,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
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
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
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

  // Modal / Quick Write form state
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
      } catch (err) {}
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

    setEntries([newEntry, ...entries]);
    setNewCatatan('');
    setShowModal(false);
    setSubmitting(false);
  };

  const markRead = async (id: string) => {
    setEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read_by_guru: true } : item))
    );
  };

  const filteredEntries = entries.filter((item) => {
    if (filterRole === 'semua') return true;
    return item.author_role === filterRole;
  });

  const unreadCount = entries.filter((e) => e.author_role === 'orangtua' && !e.is_read_by_guru).length;

  return (
    <AppShell
      role={currentRole}
      pageTitle="Buku Penghubung Dua Arah"
      pageSubtitle="Catatan harian perkembangan siswa antara guru & orang tua"
      unreadCount={unreadCount}
    >
      <div className="space-y-6">
        {/* TOP FILTER & ACTION BAR (DESKTOP OPTIMIZED) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#DDD8CE] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FDEDEC] text-[#922B21]">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">
                Percakapan & Catatan Siswa
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Kelas 4A · Total {entries.length} Catatan Tersimpan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-[#F5F0E8] rounded-xl border border-[#DDD8CE] text-xs">
              <button
                onClick={() => setFilterRole('semua')}
                className={`px-3 py-1.5 rounded-lg transition font-medium ${
                  filterRole === 'semua'
                    ? 'bg-[#922B21] text-white font-bold shadow-xs'
                    : 'text-[#3D3D3D] hover:text-[#922B21]'
                }`}
              >
                Semua ({entries.length})
              </button>
              <button
                onClick={() => setFilterRole('orangtua')}
                className={`px-3 py-1.5 rounded-lg transition font-medium ${
                  filterRole === 'orangtua'
                    ? 'bg-[#922B21] text-white font-bold shadow-xs'
                    : 'text-[#3D3D3D] hover:text-[#922B21]'
                }`}
              >
                Dari Orang Tua
              </button>
              <button
                onClick={() => setFilterRole('guru')}
                className={`px-3 py-1.5 rounded-lg transition font-medium ${
                  filterRole === 'guru'
                    ? 'bg-[#922B21] text-white font-bold shadow-xs'
                    : 'text-[#3D3D3D] hover:text-[#922B21]'
                }`}
              >
                Dari Guru
              </button>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tulis Catatan Baru</span>
            </button>
          </div>
        </div>

        {/* FEED ENTRIES LIST (EXPANSIVE CARDS) */}
        <div className="space-y-4">
          {filteredEntries.map((item) => {
            const isOrtu = item.author_role === 'orangtua';
            return (
              <div
                key={item.id}
                className={`rounded-2xl p-5 shadow-xs border transition ${
                  isOrtu
                    ? 'bg-[#FDEDEC]/70 border-[#F1948A]'
                    : 'bg-white border-[#DDD8CE]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-black/5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase ${
                        isOrtu
                          ? 'bg-[#922B21] text-white'
                          : 'bg-[#F5F0E8] text-[#922B21] border border-[#DDD8CE]'
                      }`}
                    >
                      {isOrtu ? 'Orang Tua Murid' : 'Guru / Wali Kelas'}
                    </span>
                    <span className="font-bold text-xs text-[#1A1A1A]">
                      {item.users_profile?.nama || (isOrtu ? 'Wali Murid' : 'Wali Kelas')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#6B6B6B]">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isOrtu && !item.is_read_by_guru && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C0392B] bg-white px-2 py-0.5 rounded-full border border-[#F1948A]">
                        <span className="w-2 h-2 rounded-full bg-[#C0392B] animate-pulse" />
                        Belum dibaca
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-[#6B6B6B] font-medium mb-2.5">
                  Memantau Siswa:{' '}
                  <span className="text-[#1A1A1A] font-bold">
                    {item.siswa?.nama_lengkap || 'Ahmad Budi (Kelas 4A)'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-wrap">
                  {item.catatan}
                </p>

                <div className="mt-4 pt-3 flex items-center justify-between border-t border-black/5 text-xs">
                  {isOrtu && !item.is_read_by_guru ? (
                    <button
                      onClick={() => markRead(item.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-[#922B21] hover:underline font-bold"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Tandai Sudah Dibaca</span>
                    </button>
                  ) : (
                    <span className="text-xs text-[#6B6B6B]">
                      {item.is_read_by_guru ? '✓ Sudah dibaca oleh guru' : ''}
                    </span>
                  )}

                  <button
                    onClick={() => {
                      setTargetSiswa(item.siswa?.nama_lengkap || 'Ahmad Budi Santoso (Kelas 4A)');
                      setAuthorRoleInput(isOrtu ? 'guru' : 'orangtua');
                      setShowModal(true);
                    }}
                    className="text-xs font-bold text-[#C0392B] hover:text-[#922B21] transition inline-flex items-center gap-1 hover:translate-x-1"
                  >
                    <span>Balas Catatan Ini</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* MODAL FORM TULIS */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-[#DDD8CE] animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8E0D0]">
                <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                  Tulis Catatan Buku Penghubung
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-sm font-bold text-[#6B6B6B] hover:text-black p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateEntry} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#3D3D3D] mb-1.5">
                    Menulis Sebagai:
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#F5F0E8] rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAuthorRoleInput('guru')}
                      className={`py-2 rounded-lg font-bold text-xs ${
                        authorRoleInput === 'guru'
                          ? 'bg-[#922B21] text-white shadow-xs'
                          : 'text-[#6B6B6B]'
                      }`}
                    >
                      Guru / Wali Kelas
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthorRoleInput('orangtua')}
                      className={`py-2 rounded-lg font-bold text-xs ${
                        authorRoleInput === 'orangtua'
                          ? 'bg-[#922B21] text-white shadow-xs'
                          : 'text-[#6B6B6B]'
                      }`}
                    >
                      Orang Tua Murid
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#3D3D3D] mb-1.5">
                    Untuk Siswa:
                  </label>
                  <select
                    value={targetSiswa}
                    onChange={(e) => setTargetSiswa(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] font-medium"
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
                  <div className="flex justify-between items-center mb-1.5">
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
                    placeholder="Tuliskan catatan kondisi belajar, kesehatan, atau pesan kepada wali murid/guru..."
                    className="w-full p-3 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#DDD8CE] text-[#6B6B6B] hover:bg-[#F5F0E8] font-semibold"
                  >
                    Batalkan
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !newCatatan.trim()}
                    className="px-5 py-2.5 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white font-bold shadow active:scale-95 disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? 'Mengirim...' : 'Kirim Catatan Sekarang →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
