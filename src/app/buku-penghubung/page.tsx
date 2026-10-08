'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, MessageSquare, CheckCircle, Clock, ArrowLeft, Send, Sparkles, Inbox } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { supabase, BukuPenghubungItem } from '@/lib/supabase';
import { useNotification } from '@/components/ui/NotificationContext';

interface SiswaOption {
  id: string;
  nama_lengkap: string;
  kelas_nama?: string;
}

function BukuPenghubungContent() {
  const { showToast } = useNotification();
  const searchParams = useSearchParams();
  const queryRole = searchParams.get('role');
  const autoTulis = searchParams.get('tulis') === 'true';

  // State entries: murni data real, default kosong
  const [entries, setEntries] = useState<BukuPenghubungItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<'semua' | 'guru' | 'orangtua'>('semua');
  const [currentRole, setCurrentRole] = useState<'guru' | 'orangtua' | 'admin'>('guru');
  const [currentUserName, setCurrentUserName] = useState<string>('Guru / Wali Kelas');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Real siswa options
  const [siswaOptions, setSiswaOptions] = useState<SiswaOption[]>([]);
  const [myChildren, setMyChildren] = useState<SiswaOption[]>([]);

  // Modal / Quick Write form state
  const [showModal, setShowModal] = useState(false);
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>('');
  const [newCatatan, setNewCatatan] = useState('');
  const [authorRoleInput, setAuthorRoleInput] = useState<'guru' | 'orangtua'>('guru');
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch user session, role, profiles, and students
  useEffect(() => {
    async function initUserAndData() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user ?? null;

        if (user) {
          setCurrentUserId(user.id);
          setCurrentUserEmail(user.email || '');

          // Get profile
          const { data: profile } = await supabase
            .from('users_profile')
            .select('*')
            .eq('id', user.id)
            .single();

          const detectedRole =
            (queryRole as 'guru' | 'orangtua' | 'admin') ||
            (profile?.role as 'guru' | 'orangtua' | 'admin') ||
            (user?.user_metadata?.role as 'guru' | 'orangtua' | 'admin') ||
            'guru';

          setCurrentRole(detectedRole);
          setCurrentUserName(profile?.nama || user.user_metadata?.nama || (detectedRole === 'orangtua' ? 'Wali Murid' : 'Guru / Wali Kelas'));
          setAuthorRoleInput(detectedRole === 'orangtua' ? 'orangtua' : 'guru');

          // Fetch all students with class name
          const { data: sData } = await supabase
            .from('siswa')
            .select('id, nama_lengkap, wali_murid_id, kelas:kelas_id(nama_kelas)')
            .order('nama_lengkap');

          if (sData && sData.length > 0) {
            const formatted: SiswaOption[] = sData.map((s: any) => ({
              id: s.id,
              nama_lengkap: s.nama_lengkap,
              kelas_nama: s.kelas?.nama_kelas || '',
            }));
            setSiswaOptions(formatted);

            // If orang tua, check their linked children
            const linked = sData.filter((s: any) => s.wali_murid_id === user.id);
            if (linked.length > 0) {
              const childrenFormatted: SiswaOption[] = linked.map((s: any) => ({
                id: s.id,
                nama_lengkap: s.nama_lengkap,
                kelas_nama: s.kelas?.nama_kelas || '',
              }));
              setMyChildren(childrenFormatted);
              setSelectedSiswaId(childrenFormatted[0].id);
            } else if (formatted.length > 0) {
              setSelectedSiswaId(formatted[0].id);
            }
          }
        }
      } catch (err) {
        console.warn('Error during initUserAndData:', err);
      }
    }

    initUserAndData();
  }, [queryRole]);

  // 2. Fetch real entries from Supabase
  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('buku_penghubung')
        .select(`
          id,
          siswa_id,
          author_id,
          author_role,
          catatan,
          parent_entry_id,
          is_read_by_guru,
          created_at,
          users_profile:author_id(nama),
          siswa:siswa_id(nama_lengkap, kelas:kelas_id(nama_kelas))
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Gagal memuat catatan buku penghubung:', error);
        setEntries([]);
      } else if (data) {
        setEntries(data as any);
      }
    } catch (err) {
      console.warn('Exception fetching buku_penghubung:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    if (autoTulis) {
      setShowModal(true);
    }
  }, [autoTulis]);

  const isOrangTua = currentRole === 'orangtua';

  // 3. Create real entry to Supabase
  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatatan.trim()) return;

    if (!selectedSiswaId) {
      showToast({ type: 'warning', message: 'Silakan pilih siswa terlebih dahulu.' });
      return;
    }

    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) {
        showToast({ type: 'error', message: 'Sesi Anda telah berakhir, silakan login kembali.' });
        setSubmitting(false);
        return;
      }

      const roleForEntry = isOrangTua ? 'orangtua' : authorRoleInput;

      const { data, error } = await supabase
        .from('buku_penghubung')
        .insert({
          siswa_id: selectedSiswaId,
          author_id: user.id,
          author_role: roleForEntry,
          catatan: newCatatan.trim(),
          is_read_by_guru: roleForEntry === 'guru',
        })
        .select(`
          id,
          siswa_id,
          author_id,
          author_role,
          catatan,
          parent_entry_id,
          is_read_by_guru,
          created_at,
          users_profile:author_id(nama),
          siswa:siswa_id(nama_lengkap, kelas:kelas_id(nama_kelas))
        `)
        .single();

      if (error) {
        console.error('Error insert buku_penghubung:', error);
        showToast({
          type: 'error',
          title: 'Gagal Menyimpan',
          message: error.message || 'Gagal menyimpan catatan buku penghubung.',
        });
      } else if (data) {
        setEntries((prev) => [data as any, ...prev]);
        setNewCatatan('');
        setShowModal(false);
        showToast({
          type: 'success',
          title: 'Catatan Terkirim',
          message: 'Catatan buku penghubung berhasil disampaikan!',
        });
      }
    } catch (err: any) {
      console.error(err);
      showToast({ type: 'error', message: err.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Mark entry as read in Supabase
  const markRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('buku_penghubung')
        .update({ is_read_by_guru: true })
        .eq('id', id);

      if (!error) {
        setEntries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, is_read_by_guru: true } : item))
        );
        showToast({ type: 'info', message: 'Catatan ditandai sudah dibaca.' });
      } else {
        console.warn('Gagal update status dibaca:', error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter entries
  const filteredEntries = entries.filter((item) => {
    if (filterRole === 'semua') return true;
    return item.author_role === filterRole;
  });

  const unreadCount = entries.filter((e) => e.author_role === 'orangtua' && !e.is_read_by_guru).length;

  return (
    <AppShell
      role={currentRole}
      pageTitle={isOrangTua ? 'Buku Penghubung Siswa' : 'Buku Penghubung Dua Arah'}
      pageSubtitle={
        isOrangTua
          ? 'Catatan harian komunikasi antara orang tua dan wali kelas ananda'
          : 'Catatan harian perkembangan siswa antara guru & orang tua'
      }
      unreadCount={unreadCount}
    >
      <div className="space-y-6">
        {/* TOP FILTER & ACTION BAR */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#DDD8CE] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FDEDEC] text-[#922B21]">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">
                {isOrangTua ? 'Percakapan Ananda' : 'Percakapan & Catatan Siswa'}
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                {loading
                  ? 'Memeriksa data catatan...'
                  : entries.length > 0
                  ? `Total ${entries.length} Catatan Tersimpan (${unreadCount} belum dibaca)`
                  : 'Belum ada catatan yang tersimpan'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-[#F5F0E8] rounded-xl border border-[#DDD8CE] text-xs">
              <button
                onClick={() => setFilterRole('semua')}
                className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                  filterRole === 'semua'
                    ? 'bg-[#922B21] text-white font-bold shadow-xs'
                    : 'text-[#3D3D3D] hover:text-[#922B21]'
                }`}
              >
                Semua ({entries.length})
              </button>
              <button
                onClick={() => setFilterRole('orangtua')}
                className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                  filterRole === 'orangtua'
                    ? 'bg-[#922B21] text-white font-bold shadow-xs'
                    : 'text-[#3D3D3D] hover:text-[#922B21]'
                }`}
              >
                {isOrangTua ? 'Dari Saya' : 'Dari Orang Tua'}
              </button>
              <button
                onClick={() => setFilterRole('guru')}
                className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                  filterRole === 'guru'
                    ? 'bg-[#922B21] text-white font-bold shadow-xs'
                    : 'text-[#3D3D3D] hover:text-[#922B21]'
                }`}
              >
                Dari Guru
              </button>
            </div>

            <button
              onClick={() => {
                if (isOrangTua && myChildren.length > 0) {
                  setAuthorRoleInput('orangtua');
                  setSelectedSiswaId(myChildren[0].id);
                } else if (siswaOptions.length > 0 && !selectedSiswaId) {
                  setSelectedSiswaId(siswaOptions[0].id);
                }
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isOrangTua ? '+ Tulis Catatan ke Guru' : '+ Tulis Catatan Baru'}</span>
            </button>
          </div>
        </div>

        {/* FEED ENTRIES LIST / EMPTY STATE */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 border border-[#DDD8CE] text-center shadow-xs">
            <div className="w-10 h-10 border-2 border-[#922B21] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#6B6B6B] font-medium">Memuat catatan buku penghubung...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          /* EMPTY STATE BERSIH & REAL */
          <div className="bg-white rounded-2xl p-12 border border-[#DDD8CE] text-center shadow-xs">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[#FAF8F2] border border-[#DDD8CE] flex items-center justify-center text-[#922B21]">
              <Inbox className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#1A1A1A] mb-1">
              Belum Ada Catatan Buku Penghubung
            </h3>
            <p className="text-xs text-[#6B6B6B] max-w-md mx-auto mb-5 leading-relaxed">
              {filterRole !== 'semua'
                ? `Belum ada riwayat catatan buku penghubung kategori "${filterRole === 'guru' ? 'Dari Guru' : 'Dari Orang Tua'}".`
                : 'Buku penghubung dua arah masih kosong. Guru dan orang tua murid dapat saling mengirim catatan harian terkait perkembangan belajar, izin sakit, atau pesan khusus ananda.'}
            </p>
            <button
              onClick={() => {
                if (isOrangTua && myChildren.length > 0) {
                  setSelectedSiswaId(myChildren[0].id);
                } else if (siswaOptions.length > 0 && !selectedSiswaId) {
                  setSelectedSiswaId(siswaOptions[0].id);
                }
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isOrangTua ? 'Tulis Catatan ke Guru Sekarang' : 'Tulis Catatan Pertama'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((item) => {
              const isOrtu = item.author_role === 'orangtua';
              const namaPenulis = item.users_profile?.nama || (isOrtu ? 'Orang Tua Murid' : 'Guru / Wali Kelas');
              const namaMurid = item.siswa?.nama_lengkap || 'Siswa';
              const kelasMurid = (item.siswa as any)?.kelas?.nama_kelas ? `(${(item.siswa as any).kelas.nama_kelas})` : '';

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl p-5 shadow-xs border transition ${
                    isOrtu
                      ? 'bg-[#FDEDEC]/60 border-[#F1948A]'
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
                        {namaPenulis}
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
                          Belum dibaca guru
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-[#6B6B6B] font-medium mb-2.5">
                    Memantau Siswa:{' '}
                    <span className="text-[#1A1A1A] font-bold">
                      {namaMurid} {kelasMurid}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-wrap">
                    {item.catatan}
                  </p>

                  <div className="mt-4 pt-3 flex items-center justify-between border-t border-black/5 text-xs">
                    {!isOrangTua && isOrtu && !item.is_read_by_guru ? (
                      <button
                        onClick={() => markRead(item.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-[#922B21] hover:underline font-bold cursor-pointer"
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
                        setSelectedSiswaId(item.siswa_id);
                        if (isOrangTua) {
                          setAuthorRoleInput('orangtua');
                        } else {
                          setAuthorRoleInput(isOrtu ? 'guru' : 'orangtua');
                        }
                        setShowModal(true);
                      }}
                      className="text-xs font-bold text-[#922B21] hover:text-[#771F18] transition inline-flex items-center gap-1 hover:translate-x-1 cursor-pointer"
                    >
                      <span>Balas Catatan Ini</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL FORM TULIS */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-[#DDD8CE] animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8E0D0]">
                <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                  {isOrangTua ? 'Tulis Catatan ke Guru Wali Kelas' : 'Tulis Catatan Buku Penghubung'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-sm font-bold text-[#6B6B6B] hover:text-black p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateEntry} className="space-y-4 text-xs">
                {isOrangTua ? (
                  <div className="p-3 bg-[#FAF8F2] rounded-xl border border-[#DDD8CE] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#6B6B6B] block">Pengirim:</span>
                      <span className="font-bold text-[#1A1A1A]">{currentUserName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B6B6B] block text-right">Untuk Siswa:</span>
                      {myChildren.length > 0 ? (
                        <select
                          value={selectedSiswaId}
                          onChange={(e) => setSelectedSiswaId(e.target.value)}
                          className="font-bold text-[#922B21] bg-[#FDEDEC] px-2 py-1 rounded border border-[#F1948A] text-xs"
                        >
                          {myChildren.map((child) => (
                            <option key={child.id} value={child.id}>
                              {child.nama_lengkap} {child.kelas_nama ? `(${child.kelas_nama})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={selectedSiswaId}
                          onChange={(e) => setSelectedSiswaId(e.target.value)}
                          className="font-bold text-[#922B21] bg-[#FDEDEC] px-2 py-1 rounded border border-[#F1948A] text-xs"
                        >
                          {siswaOptions.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.nama_lengkap} {s.kelas_nama ? `(${s.kelas_nama})` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block font-semibold text-[#3D3D3D] mb-1.5">
                        Menulis Sebagai:
                      </label>
                      <div className="grid grid-cols-2 gap-2 p-1 bg-[#F5F0E8] rounded-xl">
                        <button
                          type="button"
                          onClick={() => setAuthorRoleInput('guru')}
                          className={`py-2 rounded-lg font-bold text-xs cursor-pointer ${
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
                          className={`py-2 rounded-lg font-bold text-xs cursor-pointer ${
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
                        Pilih Siswa / Peserta Didik:
                      </label>
                      <select
                        value={selectedSiswaId}
                        onChange={(e) => setSelectedSiswaId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] font-medium"
                      >
                        {siswaOptions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nama_lengkap} {s.kelas_nama ? `— ${s.kelas_nama}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

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
                    placeholder={
                      isOrangTua
                        ? 'Tuliskan catatan kondisi ananda di rumah, izin sakit, atau pertanyaan kepada bapak/ibu guru...'
                        : 'Tuliskan catatan kondisi belajar, kemajuan, kesehatan, atau pesan kepada wali murid...'
                    }
                    className="w-full p-3 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#DDD8CE] text-[#6B6B6B] hover:bg-[#F5F0E8] font-semibold cursor-pointer"
                  >
                    Batalkan
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !newCatatan.trim()}
                    className="px-5 py-2.5 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-white font-bold shadow-xs active:scale-95 disabled:opacity-60 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Mengirim...' : isOrangTua ? 'Kirim ke Guru' : 'Kirim Catatan'}</span>
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

export default function BukuPenghubungPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center text-xs text-[#6B6B6B]">Memuat Buku Penghubung...</div>}>
      <BukuPenghubungContent />
    </Suspense>
  );
}
