'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  MessageSquare,
  CheckCircle,
  Clock,
  Printer,
  Copy,
  Search,
  Filter,
  Users,
  AlertCircle,
  BookOpen,
  Sparkles,
  Phone,
  Calendar,
  X,
  FileText,
  Trash2,
  Edit,
  User,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { supabase, BukuPenghubungItem } from '@/lib/supabase';
import { useNotification } from '@/components/ui/NotificationContext';

interface SiswaData {
  id: string;
  nis: string | null;
  nisn: string | null;
  nama_lengkap: string;
  jenis_kelamin: 'L' | 'P';
  nama_wali: string | null;
  no_hp_wali: string | null;
  kelas_id: string;
  kelas?: {
    id: string;
    nama_kelas: string;
  };
}

interface KelasOption {
  id: string;
  nama_kelas: string;
  tahun_ajaran?: string;
  wali_kelas_id?: string | null;
  wali_kelas?: {
    id: string;
    nama: string;
    email: string;
    telepon?: string | null;
    nip?: string | null;
  } | null;
}

// Helper untuk parsing catatan kasuistik
function parseCatatan(rawCatatan: string, createdAt: string) {
  let masalah = rawCatatan;
  let saran = '-';
  let tanggalStr = new Date(createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  let isoDate = createdAt ? new Date(createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  if (rawCatatan.includes('*Masalah yang Disampaikan:*') && rawCatatan.includes('*Saran dan Kesimpulan:*')) {
    const parts = rawCatatan.split('*Saran dan Kesimpulan:*');
    const firstPart = parts[0];
    saran = parts[1]?.trim() || '-';

    if (firstPart.includes('*Tanggal Kejadian:*')) {
      const matchTanggal = firstPart.match(/\*Tanggal Kejadian:\*\s*([^\n\r]+)/);
      if (matchTanggal && matchTanggal[1]) {
        tanggalStr = matchTanggal[1].trim();
      }
      masalah = firstPart.replace(/\*Tanggal Kejadian:\*\s*[^\n\r]+/, '').replace('*Masalah yang Disampaikan:*', '').trim();
    } else {
      masalah = firstPart.replace('*Masalah yang Disampaikan:*', '').trim();
    }
  } else if (rawCatatan.includes('[MASALAH]') && rawCatatan.includes('[SARAN]')) {
    const parts = rawCatatan.split('[SARAN]');
    masalah = parts[0].replace('[MASALAH]', '').trim();
    saran = parts[1]?.trim() || '-';
  }

  return { masalah, saran, tanggalStr, isoDate };
}

// Helper untuk menyusun pesan WhatsApp resmi dengan domain https://lapislada.web.id
function buildWhatsAppMessage({
  siswaNama,
  kelasNama,
  tanggal,
  masalah,
  saran,
  guruNama,
}: {
  siswaNama: string;
  kelasNama: string;
  tanggal: string;
  masalah: string;
  saran: string;
  guruNama: string;
}) {
  return `*BUKU PENGHUBUNG GURU & ORANG TUA*
*UPT SD NEGERI LATSARI 2 BANCAR*
------------------------------------------------
Yth. Bapak/Ibu Wali Murid dari *${siswaNama}* (${kelasNama})

Berikut disampaikan catatan resmi buku penghubung terkait kejadian / perkembangan ananda:

📅 *Tanggal Kejadian:* ${tanggal}

📝 *Masalah / Perkembangan yang Disampaikan:*
${masalah}

💡 *Saran dan Kesimpulan Guru:*
${saran}

------------------------------------------------
Catatan ini juga dapat dipantau dan ditanggapi secara online melalui portal resmi sekolah:
🌐 https://lapislada.web.id/buku-penghubung

Terima kasih atas kerja sama dan perhatian Ayah/Bunda demi pendampingan terbaik ananda tercinta.

Salam hormat,
*${guruNama}*
Guru / Wali Kelas ${kelasNama}
UPT SD Negeri Latsari 2 Bancar`;
}

function BukuPenghubungContent() {
  const { showToast } = useNotification();
  const searchParams = useSearchParams();
  const queryRole = searchParams.get('role');

  // State user & role
  const [currentRole, setCurrentRole] = useState<'guru' | 'orangtua' | 'admin' | 'kepala_sekolah'>('guru');
  const [currentUserName, setCurrentUserName] = useState<string>('Guru / Wali Kelas');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Kelas & Siswa
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [loadingKelas, setLoadingKelas] = useState(true);

  const [siswaList, setSiswaList] = useState<SiswaData[]>([]);
  const [loadingSiswa, setLoadingSiswa] = useState(true);
  const [searchSiswa, setSearchSiswa] = useState('');

  // Filter Siswa Tertentu di Format Resmi
  const [filterSiswaId, setFilterSiswaId] = useState<string>('semua');

  // Entries
  const [entries, setEntries] = useState<BukuPenghubungItem[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  // Tab: 'rekap-resmi' (Format Screenshot 5) | 'daftar-siswa' (List Siswa) | 'percakapan' (Feed)
  const [activeTab, setActiveTab] = useState<'rekap-resmi' | 'daftar-siswa' | 'percakapan'>('rekap-resmi');

  // Modal Catat / Edit Kejadian
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [modalSiswa, setModalSiswa] = useState<SiswaData | null>(null);
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formMasalah, setFormMasalah] = useState('');
  const [formSaran, setFormSaran] = useState('');
  const [formNoHpWali, setFormNoHpWali] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal Konfirmasi Hapus
  const [entryToDelete, setEntryToDelete] = useState<BukuPenghubungItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Orang tua linked children
  const [myChildren, setMyChildren] = useState<SiswaData[]>([]);
  const [parentChildId, setParentChildId] = useState<string>('');

  // 1. Initial Auth & Profile Fetch
  useEffect(() => {
    async function initUser() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user ?? null;

        if (user) {
          setCurrentUserId(user.id);
          setCurrentUserEmail(user.email || '');

          const { data: profile } = await supabase
            .from('users_profile')
            .select('*')
            .eq('id', user.id)
            .single();

          const cleanEmail = (user.email || '').toLowerCase().trim();
          const isKepsekUser =
            (profile?.role === 'kepala_sekolah') ||
            (user?.user_metadata?.role === 'kepala_sekolah') ||
            (user?.user_metadata?.jabatan === 'kepala_sekolah') ||
            cleanEmail === 'kepsek@demo.com' ||
            cleanEmail === 'santoso.7404@admin.sd.belajar.id' ||
            cleanEmail.startsWith('santoso') ||
            (profile?.nama && profile.nama.toLowerCase().includes('santoso'));

          const detectedRole =
            (queryRole as any) ||
            (isKepsekUser ? 'kepala_sekolah' : (profile?.role as any)) ||
            (user?.user_metadata?.role as any) ||
            'guru';

          setCurrentRole(detectedRole);
          setCurrentUserName(
            profile?.nama ||
            user.user_metadata?.nama ||
            (detectedRole === 'orangtua' ? 'Wali Murid' : detectedRole === 'kepala_sekolah' ? 'Santoso ,S.Pd.,M.Pd.' : 'Guru / Wali Kelas')
          );
        }
      } catch (err) {
        console.warn('Error initUser:', err);
      }
    }

    initUser();
  }, [queryRole]);

  // 2. Fetch Master Kelas & filter berdasarkan Wali Kelas
  useEffect(() => {
    async function fetchKelas() {
      setLoadingKelas(true);
      try {
        const { data: allKelas, error } = await supabase
          .from('kelas')
          .select('id, nama_kelas, tahun_ajaran, wali_kelas_id, wali_kelas:wali_kelas_id(id, nama, email)')
          .order('nama_kelas', { ascending: true });

        if (!error && allKelas && allKelas.length > 0) {
          if (currentRole === 'guru') {
            const cleanEmail = (currentUserEmail || '').toLowerCase().trim();
            // Filter strictly: Guru hanya melihat kelas yang diampunya
            const myClasses = allKelas.filter((k: any) => {
              const idMatch = currentUserId && k.wali_kelas_id === currentUserId;
              const emailMatch = cleanEmail && k.wali_kelas?.email?.toLowerCase() === cleanEmail;
              return idMatch || emailMatch;
            });

            if (myClasses.length > 0) {
              setKelasList(myClasses as unknown as KelasOption[]);
              setSelectedKelasId(myClasses[0].id);
            } else {
              setKelasList(allKelas as unknown as KelasOption[]);
              setSelectedKelasId(allKelas[0].id);
            }
          } else {
            // Admin atau Kepala Sekolah bisa melihat semua kelas
            setKelasList(allKelas as unknown as KelasOption[]);
            if (!selectedKelasId) {
              setSelectedKelasId(allKelas[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching kelas:', err);
      } finally {
        setLoadingKelas(false);
      }
    }

    if (currentUserId || currentRole === 'admin' || currentRole === 'kepala_sekolah') {
      fetchKelas();
    }
  }, [currentRole, currentUserId, currentUserEmail]);

  // 3. Fetch Siswa untuk Kelas Terpilih
  useEffect(() => {
    async function fetchSiswa() {
      if (!selectedKelasId && currentRole !== 'orangtua') return;

      setLoadingSiswa(true);
      try {
        if (currentRole === 'orangtua') {
          const { data: sData } = await supabase
            .from('siswa')
            .select('id, nis, nisn, nama_lengkap, jenis_kelamin, nama_wali, no_hp_wali, kelas_id, kelas:kelas_id(id, nama_kelas)')
            .eq('wali_murid_id', currentUserId);

          if (sData && sData.length > 0) {
            setMyChildren(sData as any);
            setSiswaList(sData as any);
            setParentChildId(sData[0].id);
          } else {
            const { data: allS } = await supabase
              .from('siswa')
              .select('id, nis, nisn, nama_lengkap, jenis_kelamin, nama_wali, no_hp_wali, kelas_id, kelas:kelas_id(id, nama_kelas)')
              .limit(10);
            if (allS) {
              setMyChildren(allS as any);
              setSiswaList(allS as any);
              setParentChildId(allS[0]?.id || '');
            }
          }
        } else {
          // Guru / Admin / Kepsek: AMBIL SISWA KHUSUS KELAS TERPILIH
          const { data, error } = await supabase
            .from('siswa')
            .select('id, nis, nisn, nama_lengkap, jenis_kelamin, nama_wali, no_hp_wali, kelas_id, kelas:kelas_id(id, nama_kelas)')
            .eq('kelas_id', selectedKelasId)
            .order('nama_lengkap', { ascending: true });

          if (!error && data) {
            setSiswaList(data as any);
          } else {
            setSiswaList([]);
          }
        }
      } catch (err) {
        console.error('Error fetching siswa:', err);
        setSiswaList([]);
      } finally {
        setLoadingSiswa(false);
      }
    }

    fetchSiswa();
  }, [selectedKelasId, currentRole, currentUserId]);

  // 4. Fetch Catatan Buku Penghubung
  const fetchEntries = async () => {
    setLoadingEntries(true);
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
          siswa:siswa_id(
            id,
            nama_lengkap,
            nis,
            nisn,
            jenis_kelamin,
            nama_wali,
            no_hp_wali,
            kelas:kelas_id(id, nama_kelas)
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setEntries(data as any);
      } else {
        setEntries([]);
      }
    } catch (err) {
      console.warn('Error fetchEntries:', err);
      setEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const currentKelasObj = useMemo(() => {
    return kelasList.find((k) => k.id === selectedKelasId) || null;
  }, [kelasList, selectedKelasId]);

  // Filter entries sesuai kelas aktif & filter siswa tertentu
  const filteredEntries = useMemo(() => {
    if (currentRole === 'orangtua') {
      if (!parentChildId) return entries;
      return entries.filter((e) => e.siswa_id === parentChildId);
    }

    let result = entries;

    // Filter berdasarkan kelas aktif
    if (selectedKelasId) {
      result = result.filter((e) => {
        const siswaKelasId = (e.siswa as any)?.kelas?.id;
        return siswaKelasId === selectedKelasId || siswaList.some((s) => s.id === e.siswa_id);
      });
    }

    // Filter berdasarkan siswa tertentu jika dipilih
    if (filterSiswaId !== 'semua') {
      result = result.filter((e) => e.siswa_id === filterSiswaId);
    }

    return result;
  }, [entries, selectedKelasId, currentRole, parentChildId, siswaList, filterSiswaId]);

  // Siswa terpilih untuk filter tertentu
  const currentFilteredSiswaObj = useMemo(() => {
    if (filterSiswaId === 'semua') return null;
    return siswaList.find((s) => s.id === filterSiswaId) || null;
  }, [siswaList, filterSiswaId]);

  // Filter siswa untuk tab Daftar Siswa berdasarkan kata kunci
  const searchedSiswaList = useMemo(() => {
    if (!searchSiswa.trim()) return siswaList;
    const q = searchSiswa.toLowerCase();
    return siswaList.filter(
      (s) =>
        s.nama_lengkap.toLowerCase().includes(q) ||
        (s.nis && s.nis.toLowerCase().includes(q)) ||
        (s.nama_wali && s.nama_wali.toLowerCase().includes(q))
    );
  }, [siswaList, searchSiswa]);

  // Buka Modal Catat Baru
  const openCatatModal = (siswa: SiswaData) => {
    setIsEditing(false);
    setEditingEntryId(null);
    setModalSiswa(siswa);
    setFormTanggal(new Date().toISOString().split('T')[0]);
    setFormMasalah('');
    setFormSaran('');
    setFormNoHpWali(siswa.no_hp_wali || '');
    setShowModal(true);
  };

  // Buka Modal Edit Catatan
  const openEditModal = (item: BukuPenghubungItem) => {
    const s = item.siswa as any;
    const foundSiswa = siswaList.find((x) => x.id === item.siswa_id) || {
      id: item.siswa_id,
      nis: s?.nis || null,
      nisn: s?.nisn || null,
      nama_lengkap: s?.nama_lengkap || 'Siswa',
      jenis_kelamin: s?.jenis_kelamin || 'L',
      nama_wali: s?.nama_wali || null,
      no_hp_wali: s?.no_hp_wali || null,
      kelas_id: selectedKelasId,
      kelas: s?.kelas,
    };

    const { masalah, saran, isoDate } = parseCatatan(item.catatan, item.created_at);

    setIsEditing(true);
    setEditingEntryId(item.id);
    setModalSiswa(foundSiswa);
    setFormTanggal(isoDate);
    setFormMasalah(masalah);
    setFormSaran(saran === '-' ? '' : saran);
    setFormNoHpWali(s?.no_hp_wali || foundSiswa.no_hp_wali || '');
    setShowModal(true);
  };

  // Navigasi cepat filter catatan siswa tertentu
  const handleFilterToSiswa = (siswaId: string) => {
    setFilterSiswaId(siswaId);
    setActiveTab('rekap-resmi');
  };

  // Simpan Catatan (Baru atau Edit)
  const handleSaveCatatan = async (e: React.FormEvent, directWhatsApp = false) => {
    e.preventDefault();
    if (!modalSiswa) return;
    if (!formMasalah.trim()) {
      showToast({ type: 'warning', message: 'Silakan isi masalah yang disampaikan.' });
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

      const formattedTanggal = new Date(formTanggal).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const structuredCatatan = `*Tanggal Kejadian:* ${formattedTanggal}\n\n*Masalah yang Disampaikan:*\n${formMasalah.trim()}\n\n*Saran dan Kesimpulan:*\n${formSaran.trim() || '-'}`;

      if (isEditing && editingEntryId) {
        // Mode UPDATE / EDIT Catatan
        const res = await fetch('/api/buku-penghubung', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingEntryId,
            catatan: structuredCatatan,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Gagal memperbarui catatan');
        }

        setEntries((prev) =>
          prev.map((item) =>
            item.id === editingEntryId
              ? { ...item, catatan: structuredCatatan }
              : item
          )
        );

        showToast({
          type: 'success',
          title: 'Catatan Diperbarui',
          message: `Catatan ananda ${modalSiswa.nama_lengkap} berhasil diperbarui.`,
        });
      } else {
        // Mode INSERT Catatan Baru
        const { data: newEntry, error: insertError } = await supabase
          .from('buku_penghubung')
          .insert({
            siswa_id: modalSiswa.id,
            author_id: user.id,
            author_role: currentRole === 'orangtua' ? 'orangtua' : 'guru',
            catatan: structuredCatatan,
            is_read_by_guru: currentRole !== 'orangtua',
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
            siswa:siswa_id(
              id,
              nama_lengkap,
              nis,
              nisn,
              jenis_kelamin,
              nama_wali,
              no_hp_wali,
              kelas:kelas_id(id, nama_kelas)
            )
          `)
          .single();

        if (insertError) throw insertError;

        if (newEntry) {
          setEntries((prev) => [newEntry as any, ...prev]);
        }

        showToast({
          type: 'success',
          title: 'Catatan Tersimpan',
          message: `Catatan ananda ${modalSiswa.nama_lengkap} berhasil dibukukan!`,
        });
      }

      // Update No HP Wali jika diisi
      if (formNoHpWali.trim() && formNoHpWali.trim() !== modalSiswa.no_hp_wali) {
        await supabase
          .from('siswa')
          .update({ no_hp_wali: formNoHpWali.trim() })
          .eq('id', modalSiswa.id);

        setSiswaList((prev) =>
          prev.map((s) => (s.id === modalSiswa.id ? { ...s, no_hp_wali: formNoHpWali.trim() } : s))
        );
      }

      // Kirim WhatsApp jika dipilih
      if (directWhatsApp) {
        handleSendWhatsAppDirect(
          modalSiswa.nama_lengkap,
          modalSiswa.kelas?.nama_kelas || currentKelasObj?.nama_kelas || 'Kelas I',
          formattedTanggal,
          formMasalah,
          formSaran,
          formNoHpWali
        );
      }

      setShowModal(false);
    } catch (err: any) {
      console.error('Error simpan catatan:', err);
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: err.message || 'Terjadi kesalahan sistem saat menyimpan catatan.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Konfirmasi & Eksekusi Hapus Catatan
  const confirmDeleteEntry = async () => {
    if (!entryToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/buku-penghubung?id=${entryToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal menghapus catatan dari server.');
      }

      // Update state realtime
      setEntries((prev) => prev.filter((item) => item.id !== entryToDelete.id));

      showToast({
        type: 'success',
        title: 'Catatan Dihapus',
        message: 'Catatan buku penghubung berhasil dihapus.',
      });

      setEntryToDelete(null);
    } catch (err: any) {
      console.error('Error delete catatan:', err);
      showToast({
        type: 'error',
        title: 'Gagal Menghapus',
        message: err.message || 'Terjadi kendala saat menghapus catatan.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Kirim WhatsApp langsung
  const handleSendWhatsAppDirect = (
    siswaNama: string,
    kelasNama: string,
    tanggal: string,
    masalah: string,
    saran: string,
    phoneInput?: string
  ) => {
    const rawPhone = phoneInput || '';
    let cleanPhone = rawPhone.replace(/[^0-9]/g, '');

    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('8')) {
      cleanPhone = '62' + cleanPhone;
    }

    const messageText = buildWhatsAppMessage({
      siswaNama,
      kelasNama,
      tanggal,
      masalah,
      saran: saran || '-',
      guruNama: currentUserName,
    });

    if (!cleanPhone || cleanPhone.length < 9) {
      navigator.clipboard.writeText(messageText);
      showToast({
        type: 'warning',
        title: 'Nomor WA Belum Lengkap',
        message: 'Nomor WhatsApp wali murid belum valid. Redaksi pesan telah otomatis disalin ke clipboard!',
      });
      return;
    }

    const encoded = encodeURIComponent(messageText);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  // Salin pesan WhatsApp ke clipboard
  const handleCopyWhatsApp = (
    siswaNama: string,
    kelasNama: string,
    tanggal: string,
    masalah: string,
    saran: string
  ) => {
    const text = buildWhatsAppMessage({
      siswaNama,
      kelasNama,
      tanggal,
      masalah,
      saran,
      guruNama: currentUserName,
    });

    navigator.clipboard.writeText(text);
    showToast({
      type: 'success',
      title: 'Teks WA Berhasil Disalin',
      message: 'Redaksi buku penghubung siap ditempel (paste) di WhatsApp!',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const isOrangTua = currentRole === 'orangtua';
  const isKepsekOrAdmin = currentRole === 'admin' || currentRole === 'kepala_sekolah';

  return (
    <AppShell
      role={currentRole}
      pageTitle={isOrangTua ? 'Buku Penghubung Ananda' : 'Buku Penghubung Guru & Orang Tua'}
      pageSubtitle={
        isOrangTua
          ? 'Catatan kejadian dan perkembangan ananda antara pihak sekolah dan orang tua'
          : 'Pencatatan kasuistik kejadian / perkembangan siswa dan pelaporan terhubung WhatsApp'
      }
    >
      <div className="space-y-6">
        {/* HEADER KELAS & ACTION BAR */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#DDD8CE] flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#FDEDEC] text-[#922B21] border border-[#F1948A]/40 shrink-0">
              <BookOpen className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  {isOrangTua
                    ? 'Buku Penghubung Orang Tua'
                    : currentKelasObj
                    ? `Buku Penghubung ${currentKelasObj.nama_kelas}`
                    : 'Buku Penghubung Guru & Orang Tua'}
                </h2>
                {!isOrangTua && currentKelasObj && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#F5F0E8] text-[#922B21] border border-[#DDD8CE]">
                    {currentKelasObj.tahun_ajaran || 'Tahun Ajaran 2025/2026'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                {isOrangTua
                  ? 'Memantau perkembangan perilaku, belajar, dan komunikasi resmi wali kelas'
                  : `Wali Kelas: ${currentKelasObj?.wali_kelas?.nama || currentUserName} • ${siswaList.length} Siswa Terdaftar`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Pemilih Kelas untuk Admin & Kepala Sekolah */}
            {isKepsekOrAdmin && kelasList.length > 0 && (
              <div className="flex items-center gap-1.5 bg-[#FAF8F2] px-3 py-1.5 rounded-xl border border-[#DDD8CE]">
                <Filter className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <span className="text-xs font-semibold text-[#6B6B6B]">Kelas:</span>
                <select
                  value={selectedKelasId}
                  onChange={(e) => {
                    setSelectedKelasId(e.target.value);
                    setFilterSiswaId('semua');
                  }}
                  className="bg-transparent text-xs font-bold text-[#922B21] focus:outline-none cursor-pointer"
                >
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Pemilih Ananda untuk Orang Tua */}
            {isOrangTua && myChildren.length > 1 && (
              <div className="flex items-center gap-1.5 bg-[#FAF8F2] px-3 py-1.5 rounded-xl border border-[#DDD8CE]">
                <Users className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <span className="text-xs font-semibold text-[#6B6B6B]">Pilih Ananda:</span>
                <select
                  value={parentChildId}
                  onChange={(e) => setParentChildId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#922B21] focus:outline-none cursor-pointer"
                >
                  {myChildren.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama_lengkap}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tombol Cetak Dokumen Resmi */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF8F2] text-[#3D3D3D] border border-[#DDD8CE] text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
              title="Cetak Format Lembar Resmi (Screenshot 5)"
            >
              <Printer className="w-4 h-4 text-[#922B21]" />
              <span>Cetak Format Resmi</span>
            </button>

            {/* Tombol Tulis Catatan Baru untuk Guru */}
            {!isOrangTua && (
              <button
                onClick={() => {
                  if (siswaList.length > 0) {
                    const defaultSiswa = filterSiswaId !== 'semua' && currentFilteredSiswaObj ? currentFilteredSiswaObj : siswaList[0];
                    openCatatModal(defaultSiswa);
                  } else {
                    showToast({ type: 'warning', message: 'Belum ada data siswa di kelas ini.' });
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Catat Kejadian Siswa</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB NAVIGASI KHUSUS GURU & ADMIN */}
        {!isOrangTua && (
          <div className="flex items-center gap-2 border-b border-[#DDD8CE] pb-3 overflow-x-auto no-scrollbar flex-nowrap print:hidden">
            <button
              onClick={() => setActiveTab('rekap-resmi')}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'rekap-resmi'
                  ? 'bg-[#922B21] text-white shadow-xs'
                  : 'bg-white text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#DDD8CE]'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Format Resmi Buku ({filteredEntries.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('daftar-siswa')}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'daftar-siswa'
                  ? 'bg-[#922B21] text-white shadow-xs'
                  : 'bg-white text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#DDD8CE]'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Daftar Siswa {currentKelasObj?.nama_kelas ? `Kelas ${currentKelasObj.nama_kelas}` : ''} ({siswaList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('percakapan')}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'percakapan'
                  ? 'bg-[#922B21] text-white shadow-xs'
                  : 'bg-white text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#DDD8CE]'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>Feed Percakapan</span>
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 1: FORMAT RESMI BUKU PENGHUBUNG (SESUAI SCREENSHOT 5)      */}
        {/* ============================================================== */}
        {(activeTab === 'rekap-resmi' || isOrangTua) && (
          <div className="bg-white rounded-2xl border border-[#DDD8CE] shadow-xs p-3.5 sm:p-6 print:p-0 print:border-none print:shadow-none">
            {/* BAR FILTER SISWA SPESIFIK (HANYA MUNCUL DI TAMPILAN SCREEN, TIDAK DI CETAK) */}
            {!isOrangTua && (
              <div className="mb-5 p-3 sm:p-3.5 bg-[#FAF8F2] rounded-2xl border border-[#DDD8CE] flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A] shrink-0">
                    <User className="w-4 h-4 text-[#922B21]" />
                    <span>Filter Siswa:</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto flex-1 min-w-0">
                    <select
                      value={filterSiswaId}
                      onChange={(e) => setFilterSiswaId(e.target.value)}
                      className="w-full sm:max-w-xs md:max-w-md px-3 py-2 sm:py-1.5 rounded-xl border border-[#DDD8CE] bg-white text-xs font-bold text-[#922B21] focus:ring-1 focus:ring-[#922B21] cursor-pointer truncate max-w-full"
                    >
                      <option value="semua">
                        Semua Siswa di Kelas ({entries.filter((e) => siswaList.some((s) => s.id === e.siswa_id)).length} Total Catatan)
                      </option>
                      {siswaList.map((s) => {
                        const count = entries.filter((e) => e.siswa_id === s.id).length;
                        return (
                          <option key={s.id} value={s.id}>
                            {s.nama_lengkap} ({count} Catatan)
                          </option>
                        );
                      })}
                    </select>

                    {filterSiswaId !== 'semua' && (
                      <button
                        onClick={() => setFilterSiswaId('semua')}
                        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-[#6B6B6B] border border-[#DDD8CE] text-xs font-semibold cursor-pointer active:scale-95 transition"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>

                {currentFilteredSiswaObj && (
                  <div className="text-xs bg-[#FDEDEC] text-[#922B21] px-3 py-1.5 rounded-xl border border-[#F1948A] flex items-center justify-between gap-2 shrink-0">
                    <span className="truncate">
                      Riwayat khusus: <strong>{currentFilteredSiswaObj.nama_lengkap}</strong>
                    </span>
                    <button
                      onClick={() => openCatatModal(currentFilteredSiswaObj)}
                      className="text-[11px] font-bold underline cursor-pointer hover:text-[#771F18] shrink-0"
                    >
                      + Tambah
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* KOP RESMI CETAK */}
            <div className="text-center pb-5 mb-5 border-b border-black/10 print:border-b-2 print:border-black">
              <h1 className="font-serif font-black text-xl md:text-2xl tracking-wider uppercase text-[#1A1A1A] print:text-black">
                PENGHUBUNG GURU DAN ORANG TUA
              </h1>
              <p className="text-xs md:text-sm font-semibold tracking-wide text-[#6B6B6B] print:text-black mt-1">
                UPT SD NEGERI LATSARI 2 BANCAR
              </p>
              <p className="text-[11px] text-[#6B6B6B] print:text-black">
                {currentKelasObj?.nama_kelas ? `Kelas: ${currentKelasObj.nama_kelas}` : 'Kelas I'} • Tahun Ajaran 2025/2026
                {currentFilteredSiswaObj && ` • Khusus Siswa: ${currentFilteredSiswaObj.nama_lengkap}`}
              </p>
            </div>

            {/* TABEL FORMAT RESMI */}
            {loadingEntries ? (
              <div className="py-16 text-center">
                <div className="w-9 h-9 border-2 border-[#922B21] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-[#6B6B6B]">Memuat rekapan buku penghubung...</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#FAF8F2] border border-[#DDD8CE] flex items-center justify-center text-[#922B21]">
                  <FileText className="w-7 h-7 stroke-[1.5]" />
                </div>
                <h3 className="font-serif font-bold text-base text-[#1A1A1A] mb-1">
                  {currentFilteredSiswaObj
                    ? `Belum Ada Catatan untuk ${currentFilteredSiswaObj.nama_lengkap}`
                    : 'Belum Ada Catatan Kejadian Khusus'}
                </h3>
                <p className="text-xs text-[#6B6B6B] max-w-lg mx-auto mb-5 leading-relaxed">
                  {currentFilteredSiswaObj
                    ? `Ananda ${currentFilteredSiswaObj.nama_lengkap} belum memiliki catatan kejadian khusus. Catatan hanya dibuat jika terjadi peristiwa atau perkembangan tertentu.`
                    : 'Buku penghubung ini bersifat kasuistik (hanya dicatat ketika ada kejadian atau perkembangan khusus pada siswa tertentu, tidak wajib diisi setiap hari untuk semua siswa).'}
                </p>
                {!isOrangTua && (
                  <button
                    onClick={() => {
                      const target = currentFilteredSiswaObj || siswaList[0];
                      if (target) openCatatModal(target);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Catat Kejadian Sekarang</span>
                  </button>
                )}
              </div>
            ) : (
              <div>
                {/* Petunjuk Geser di Layar Mobile */}
                <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] mb-2.5 md:hidden bg-[#FAF8F2] px-3 py-1.5 rounded-xl border border-[#DDD8CE]">
                  <span className="font-semibold text-[#1A1A1A]">Format Buku Kedinasan</span>
                  <span className="text-[#922B21] font-bold flex items-center gap-1">Geser tabel ke kanan →</span>
                </div>

                <div className="overflow-x-auto -mx-3.5 sm:mx-0 px-3.5 sm:px-0 pb-2">
                  <table className="w-full min-w-[760px] text-left text-xs border-collapse border border-black/30 print:border-black">
                  <thead>
                    <tr className="bg-[#FAF8F2] print:bg-gray-100 text-[#1A1A1A] font-bold text-center border-b border-black/30 print:border-black">
                      <th colSpan={2} className="p-2 border border-black/30 print:border-black w-24">
                        NOMOR
                      </th>
                      <th rowSpan={2} className="p-2 border border-black/30 print:border-black min-w-[140px] text-left">
                        NAMA SISWA
                      </th>
                      <th colSpan={2} className="p-2 border border-black/30 print:border-black w-14">
                        JENIS KEL
                      </th>
                      <th rowSpan={2} className="p-2 border border-black/30 print:border-black min-w-[100px]">
                        TANGGAL
                      </th>
                      <th rowSpan={2} className="p-2 border border-black/30 print:border-black min-w-[200px] text-left">
                        MASALAH YANG DISAMPAIKAN
                      </th>
                      <th rowSpan={2} className="p-2 border border-black/30 print:border-black min-w-[200px] text-left">
                        SARAN DAN KESIMPULAN
                      </th>
                      <th rowSpan={2} className="p-2 border border-black/30 print:border-black min-w-[120px]">
                        TANDA TANGAN / RESPON
                      </th>
                      <th rowSpan={2} className="p-2 border border-black/30 print:border-black w-36 print:hidden">
                        AKSI & KELOLA
                      </th>
                    </tr>
                    <tr className="bg-[#FAF8F2] print:bg-gray-100 text-[#1A1A1A] font-bold text-center border-b border-black/30 print:border-black">
                      <th className="p-1 border border-black/30 print:border-black text-[10px] w-10">URUT</th>
                      <th className="p-1 border border-black/30 print:border-black text-[10px] w-14">INDUK</th>
                      <th className="p-1 border border-black/30 print:border-black text-[10px] w-7">L</th>
                      <th className="p-1 border border-black/30 print:border-black text-[10px] w-7">P</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((item, idx) => {
                      const { masalah, saran, tanggalStr } = parseCatatan(item.catatan, item.created_at);
                      const s = item.siswa as any;
                      const jk = s?.jenis_kelamin || 'L';
                      const nis = s?.nis || s?.nisn || '-';
                      const namaMurid = s?.nama_lengkap || 'Siswa';
                      const namaKelas = s?.kelas?.nama_kelas || currentKelasObj?.nama_kelas || 'Kelas I';
                      const noHp = s?.no_hp_wali || '';

                      return (
                        <tr key={item.id} className="border-b border-black/20 hover:bg-[#FAF8F2]/60 print:hover:bg-transparent">
                          <td className="p-2 border border-black/30 print:border-black text-center font-semibold">
                            {idx + 1}
                          </td>
                          <td className="p-2 border border-black/30 print:border-black text-center font-mono text-[11px]">
                            {nis}
                          </td>
                          <td className="p-2 border border-black/30 print:border-black font-semibold text-[#1A1A1A]">
                            <button
                              onClick={() => handleFilterToSiswa(item.siswa_id)}
                              className="text-left hover:text-[#922B21] hover:underline cursor-pointer"
                              title="Klik untuk memfilter catatan ananda ini"
                            >
                              {namaMurid}
                            </button>
                          </td>
                          <td className="p-2 border border-black/30 print:border-black text-center font-bold">
                            {jk === 'L' ? '✓' : ''}
                          </td>
                          <td className="p-2 border border-black/30 print:border-black text-center font-bold">
                            {jk === 'P' ? '✓' : ''}
                          </td>
                          <td className="p-2 border border-black/30 print:border-black text-center text-[11px] whitespace-nowrap">
                            {tanggalStr}
                          </td>
                          <td className="p-2.5 border border-black/30 print:border-black leading-relaxed whitespace-pre-wrap">
                            {masalah}
                          </td>
                          <td className="p-2.5 border border-black/30 print:border-black leading-relaxed whitespace-pre-wrap">
                            {saran}
                          </td>
                          <td className="p-2 border border-black/30 print:border-black text-center">
                            {item.author_role === 'orangtua' ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F8F5] text-[#117864] border border-[#A3E4D7]">
                                Respon Ortu
                              </span>
                            ) : item.is_read_by_guru ? (
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-semibold text-[#27AE60]">Terkonfirmasi</span>
                                <span className="text-[9px] text-[#6B6B6B]">(Paraf Guru)</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-[#6B6B6B] italic">Menunggu respon</span>
                            )}
                          </td>
                          {/* Kolom Aksi WA, Edit, dan Hapus (Disembunyikan saat Cetak) */}
                          <td className="p-2 border border-black/30 print:hidden text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Tombol Kirim WA */}
                              <button
                                onClick={() =>
                                  handleSendWhatsAppDirect(
                                    namaMurid,
                                    namaKelas,
                                    tanggalStr,
                                    masalah,
                                    saran,
                                    noHp
                                  )
                                }
                                title={noHp ? `Kirim ke WA Orang Tua (${noHp})` : 'Nomor WA belum tersimpan'}
                                className={`p-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                                  noHp
                                    ? 'bg-[#25D366] hover:bg-[#20BA5C] text-white shadow-2xs'
                                    : 'bg-gray-100 hover:bg-gray-200 text-[#6B6B6B]'
                                }`}
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </button>

                              {/* Tombol Salin Pesan WA */}
                              <button
                                onClick={() =>
                                  handleCopyWhatsApp(
                                    namaMurid,
                                    namaKelas,
                                    tanggalStr,
                                    masalah,
                                    saran
                                  )
                                }
                                title="Salin Pesan WhatsApp"
                                className="p-1.5 rounded-lg bg-[#FAF8F2] hover:bg-[#F5F0E8] border border-[#DDD8CE] text-[#3D3D3D] transition cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              {!isOrangTua && (
                                <>
                                  {/* Tombol Edit Catatan */}
                                  <button
                                    onClick={() => openEditModal(item)}
                                    title="Edit Catatan Ini"
                                    className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 transition cursor-pointer"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Tombol Hapus Catatan */}
                                  <button
                                    onClick={() => setEntryToDelete(item)}
                                    title="Hapus Catatan Ini"
                                    className="p-1.5 rounded-lg bg-[#FDEDEC] hover:bg-[#FADBD8] border border-[#F5B7B1] text-[#C0392B] transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

            {/* TANDA TANGAN RESMI KEDINASAN (PERSIS SCREENSHOT 5) */}
            <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 grid grid-cols-2 gap-4 sm:gap-8 text-xs text-[#1A1A1A] print:text-black">
              <div className="text-left">
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala Sekolah</p>
                <div className="h-16 print:h-20" />
                <p className="font-bold underline">
                  Santoso ,S.Pd.,M.Pd.
                </p>
                <p className="text-[11px] text-[#6B6B6B] print:text-black">
                  NIP. 19850612 201001 1 015
                </p>
              </div>

              <div className="text-right">
                <p>
                  Bancar, {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </p>
                <p className="font-bold">
                  Guru Kelas {currentKelasObj?.nama_kelas || 'I'}
                </p>
                <div className="h-16 print:h-20" />
                <p className="font-bold underline">
                  {currentKelasObj?.wali_kelas?.nama && !currentKelasObj.wali_kelas.nama.toLowerCase().includes('santoso')
                    ? currentKelasObj.wali_kelas.nama
                    : (currentRole === 'guru' && currentUserName && !currentUserName.toLowerCase().includes('santoso')
                        ? currentUserName
                        : `Guru Kelas ${currentKelasObj?.nama_kelas || 'I'}`)}
                </p>
                <p className="text-[11px] text-[#6B6B6B] print:text-black">
                  {currentKelasObj?.wali_kelas?.telepon ? `Kontak: ${currentKelasObj.wali_kelas.telepon}` : 'NIP. -'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: DAFTAR SISWA KELAS (AKSI CEPAT SEPERTI DI ABSENSI)      */}
        {/* ============================================================== */}
        {activeTab === 'daftar-siswa' && !isOrangTua && (
          <div className="bg-white rounded-2xl border border-[#DDD8CE] shadow-xs p-3.5 sm:p-5">
            {/* SEARCH & INFO BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#DDD8CE]">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                  Daftar Siswa {currentKelasObj?.nama_kelas || 'Kelas I'}
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  Pilih siswa untuk melihat riwayat atau mencatat kejadian khusus
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
                <input
                  type="text"
                  value={searchSiswa}
                  onChange={(e) => setSearchSiswa(e.target.value)}
                  placeholder="Cari nama atau NIS siswa..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#DDD8CE] text-xs bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#922B21]"
                />
              </div>
            </div>

            {/* TABEL SISWA */}
            {loadingSiswa ? (
              <div className="py-12 text-center text-xs text-[#6B6B6B]">
                <div className="w-8 h-8 border-2 border-[#922B21] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Memuat daftar siswa kelas...
              </div>
            ) : searchedSiswaList.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#6B6B6B]">
                Tidak ada siswa yang ditemukan di kelas ini.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-3.5 sm:mx-0 px-3.5 sm:px-0">
                <table className="w-full min-w-[680px] text-left text-xs">
                  <thead>
                    <tr className="bg-[#FAF8F2] text-[#6B6B6B] border-b border-[#DDD8CE]">
                      <th className="py-2.5 px-3 font-bold w-12 text-center">No</th>
                      <th className="py-2.5 px-3 font-bold w-20">NIS</th>
                      <th className="py-2.5 px-3 font-bold">Nama Lengkap Siswa</th>
                      <th className="py-2.5 px-3 font-bold w-16 text-center">L/P</th>
                      <th className="py-2.5 px-3 font-bold">Nama Wali Murid</th>
                      <th className="py-2.5 px-3 font-bold">No. WhatsApp Wali</th>
                      <th className="py-2.5 px-3 font-bold text-center">Catatan Kejadian</th>
                      <th className="py-2.5 px-3 font-bold text-right">Aksi Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDD8CE]/60">
                    {searchedSiswaList.map((siswa, idx) => {
                      const studentRecordCount = entries.filter((e) => e.siswa_id === siswa.id).length;

                      return (
                        <tr key={siswa.id} className="hover:bg-[#FAF8F2]/60 transition">
                          <td className="py-3 px-3 text-center font-bold text-[#6B6B6B]">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-[#3D3D3D]">
                            {siswa.nis || siswa.nisn || '-'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-[#1A1A1A] block">
                              {siswa.nama_lengkap}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-[#3D3D3D]">
                            {siswa.jenis_kelamin || 'L'}
                          </td>
                          <td className="py-3 px-3 text-[#3D3D3D]">
                            {siswa.nama_wali || <span className="text-[#9E9E9E] italic">Belum diisi</span>}
                          </td>
                          <td className="py-3 px-3">
                            {siswa.no_hp_wali ? (
                              <span className="font-mono text-xs text-[#27AE60] font-semibold flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {siswa.no_hp_wali}
                              </span>
                            ) : (
                              <span className="text-[#9E9E9E] italic">Belum ada no WA</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {studentRecordCount > 0 ? (
                              <button
                                onClick={() => handleFilterToSiswa(siswa.id)}
                                className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FDEDEC] text-[#922B21] border border-[#F1948A] hover:bg-[#FADBD8] transition cursor-pointer"
                                title="Klik untuk membuka riwayat catatan siswa ini"
                              >
                                {studentRecordCount} Kejadian &rarr;
                              </button>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-[#6B6B6B]">
                                Belum Ada
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {studentRecordCount > 0 && (
                                <button
                                  onClick={() => handleFilterToSiswa(siswa.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FAF8F2] border border-[#DDD8CE] text-[#3D3D3D] font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
                                  title="Lihat Rekapan Siswa Ini"
                                >
                                  <FileText className="w-3 h-3 text-[#922B21]" />
                                  <span>Lihat ({studentRecordCount})</span>
                                </button>
                              )}

                              <button
                                onClick={() => openCatatModal(siswa)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#922B21] hover:bg-[#771F18] text-white font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Catat</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: FEED PERCAKAPAN DUA ARAH (GURU & ORANG TUA)            */}
        {/* ============================================================== */}
        {activeTab === 'percakapan' && !isOrangTua && (
          <div className="space-y-4">
            {filteredEntries.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-[#DDD8CE] text-center shadow-xs">
                <MessageSquare className="w-12 h-12 text-[#922B21] mx-auto mb-3 stroke-[1.5]" />
                <h3 className="font-serif font-bold text-base text-[#1A1A1A] mb-1">
                  Belum Ada Pesan Masuk
                </h3>
                <p className="text-xs text-[#6B6B6B] max-w-md mx-auto">
                  Belum ada pesan atau pertanyaan dari orang tua murid untuk rombel ini.
                </p>
              </div>
            ) : (
              filteredEntries.map((item) => {
                const isOrtu = item.author_role === 'orangtua';
                const namaPenulis = item.users_profile?.nama || (isOrtu ? 'Orang Tua Murid' : 'Guru / Wali Kelas');
                const s = item.siswa as any;
                const namaMurid = s?.nama_lengkap || 'Siswa';
                const { masalah, saran, tanggalStr } = parseCatatan(item.catatan, item.created_at);

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl p-5 shadow-xs border transition ${
                      isOrtu ? 'bg-[#FDEDEC]/70 border-[#F1948A]' : 'bg-white border-[#DDD8CE]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-black/5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                            isOrtu ? 'bg-[#922B21] text-white' : 'bg-[#F5F0E8] text-[#922B21] border border-[#DDD8CE]'
                          }`}
                        >
                          {isOrtu ? 'Dari Orang Tua' : 'Catatan Guru'}
                        </span>
                        <span className="font-bold text-xs text-[#1A1A1A]">{namaPenulis}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{tanggalStr}</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#6B6B6B] mb-2 font-medium">
                      Ananda: <strong className="text-[#1A1A1A]">{namaMurid}</strong>
                    </p>

                    <div className="space-y-2 text-xs leading-relaxed text-[#1A1A1A]">
                      <div>
                        <strong className="text-[#922B21] block">Masalah / Kejadian:</strong>
                        <p className="whitespace-pre-wrap">{masalah}</p>
                      </div>
                      {saran !== '-' && (
                        <div className="pt-2 border-t border-black/5">
                          <strong className="text-[#27AE60] block">Saran & Arahan Guru:</strong>
                          <p className="whitespace-pre-wrap">{saran}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-end gap-2 text-xs">
                      <button
                        onClick={() => openEditModal(item)}
                        className="inline-flex items-center gap-1 text-amber-700 hover:underline font-bold cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setEntryToDelete(item)}
                        className="inline-flex items-center gap-1 text-[#C0392B] hover:underline font-bold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL: FORM CATAT / EDIT KEJADIAN SISWA                        */}
        {/* ============================================================== */}
        {showModal && modalSiswa && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 border border-[#DDD8CE] animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8E0D0]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#FDEDEC] text-[#922B21]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                      {isEditing ? 'Edit Catatan Buku Penghubung' : 'Catat Kejadian / Kasus Siswa'}
                    </h3>
                    <p className="text-[11px] text-[#6B6B6B]">
                      Buku Penghubung Guru & Orang Tua (Format Resmi)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-[#6B6B6B] hover:text-black hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* CARD INFO SISWA TERPILIH */}
              <div className="bg-[#FAF8F2] p-4 rounded-xl border border-[#DDD8CE] mb-4 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[#6B6B6B] block text-[10px]">Nama Peserta Didik:</span>
                    <strong className="text-[#1A1A1A] text-sm block">
                      {modalSiswa.nama_lengkap}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block text-[10px]">NIS / Jenis Kelamin:</span>
                    <strong className="text-[#1A1A1A]">
                      {modalSiswa.nis || modalSiswa.nisn || '-'} ({modalSiswa.jenis_kelamin || 'L'})
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block text-[10px]">Wali Murid:</span>
                    <strong className="text-[#1A1A1A]">
                      {modalSiswa.nama_wali || 'Belum diisi'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block text-[10px]">Kelas:</span>
                    <strong className="text-[#922B21]">
                      {modalSiswa.kelas?.nama_kelas || currentKelasObj?.nama_kelas || 'Kelas I'}
                    </strong>
                  </div>
                </div>
              </div>

              <form onSubmit={(e) => handleSaveCatatan(e, false)} className="space-y-4 text-xs">
                {/* Tanggal Kejadian */}
                <div>
                  <label className="block font-bold text-[#3D3D3D] mb-1">
                    Tanggal Kejadian:
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={formTanggal}
                      onChange={(e) => setFormTanggal(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] font-medium focus:ring-1 focus:ring-[#922B21]"
                    />
                  </div>
                </div>

                {/* Masalah yang Disampaikan */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-[#3D3D3D]">
                      Masalah yang Disampaikan (Kejadian / Kasus):
                    </label>
                    <span className="text-[10px] text-[#6B6B6B]">
                      {formMasalah.length} / 500 karakter
                    </span>
                  </div>
                  <textarea
                    required
                    maxLength={500}
                    rows={3}
                    value={formMasalah}
                    onChange={(e) => setFormMasalah(e.target.value)}
                    placeholder="Contoh: Ananda mengeluh sakit perut setelah istirahat pertama, sudah diberi minyak kayu putih di UKS namun belum membaik..."
                    className="w-full p-3 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                  />
                </div>

                {/* Saran dan Kesimpulan */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-[#3D3D3D]">
                      Saran dan Kesimpulan / Tindak Lanjut:
                    </label>
                    <span className="text-[10px] text-[#6B6B6B]">
                      {formSaran.length} / 500 karakter
                    </span>
                  </div>
                  <textarea
                    maxLength={500}
                    rows={3}
                    value={formSaran}
                    onChange={(e) => setFormSaran(e.target.value)}
                    placeholder="Contoh: Mohon Ayah/Bunda dapat menjemput ananda lebih awal atau memeriksa kesehatannya di rumah..."
                    className="w-full p-3 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                  />
                </div>

                {/* Nomor WhatsApp Wali Murid */}
                <div>
                  <label className="block font-bold text-[#3D3D3D] mb-1">
                    Nomor WhatsApp Wali Murid (Untuk Kirim Laporan):
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#27AE60]" />
                    <input
                      type="text"
                      value={formNoHpWali}
                      onChange={(e) => setFormNoHpWali(e.target.value)}
                      placeholder="Contoh: 081234567890 (otomatis tersimpan ke profil siswa)"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] font-mono text-xs focus:ring-1 focus:ring-[#922B21]"
                    />
                  </div>
                  <p className="text-[10px] text-[#6B6B6B] mt-1">
                    Nomor WhatsApp ini otomatis terhubung dengan tombol kirim laporan instan ke wali murid.
                  </p>
                </div>

                {/* LIVE PREVIEW REDAKSI WHATSAPP */}
                {formMasalah && (
                  <div className="p-3.5 bg-[#FAF8F2] rounded-xl border border-[#E8E0D0] text-xs">
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#DDD8CE]">
                      <span className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#25D366]" />
                        Pratinjau Redaksi WhatsApp Otomatis:
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyWhatsApp(
                            modalSiswa.nama_lengkap,
                            modalSiswa.kelas?.nama_kelas || currentKelasObj?.nama_kelas || 'Kelas I',
                            formTanggal,
                            formMasalah,
                            formSaran
                          )
                        }
                        className="text-[11px] font-bold text-[#922B21] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        Salin Teks
                      </button>
                    </div>
                    <pre className="text-[11px] text-[#3D3D3D] font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto bg-white p-2.5 rounded-lg border border-[#DDD8CE]">
                      {buildWhatsAppMessage({
                        siswaNama: modalSiswa.nama_lengkap,
                        kelasNama: modalSiswa.kelas?.nama_kelas || currentKelasObj?.nama_kelas || 'Kelas I',
                        tanggal: formTanggal,
                        masalah: formMasalah,
                        saran: formSaran || '-',
                        guruNama: currentUserName,
                      })}
                    </pre>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-[#DDD8CE]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[#DDD8CE] text-[#6B6B6B] hover:bg-[#FAF8F2] font-semibold cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || !formMasalah.trim()}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-[#FAF8F2] border border-[#DDD8CE] text-[#3D3D3D] font-bold shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Simpan di Buku'}
                  </button>

                  <button
                    type="button"
                    disabled={submitting || !formMasalah.trim()}
                    onClick={(e) => handleSaveCatatan(e as any, true)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20BA5C] text-white font-bold shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Simpan & Kirim WA' : 'Simpan & Kirim ke WhatsApp'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL DIALOG KONFIRMASI HAPUS                                  */}
        {/* ============================================================== */}
        {entryToDelete && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-[#DDD8CE] animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-[#C0392B] mb-3">
                <div className="p-2.5 rounded-xl bg-[#FDEDEC] border border-[#F5B7B1]">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                    Hapus Catatan Buku Penghubung?
                  </h3>
                  <p className="text-xs text-[#6B6B6B]">
                    Tindakan ini akan menghapus catatan ini secara permanen dari database.
                  </p>
                </div>
              </div>

              <div className="bg-[#FAF8F2] p-3.5 rounded-xl border border-[#DDD8CE] my-4 text-xs space-y-1.5">
                <p>
                  <span className="text-[#6B6B6B]">Peserta Didik:</span>{' '}
                  <strong className="text-[#1A1A1A]">
                    {entryToDelete.siswa?.nama_lengkap || 'Siswa'}
                  </strong>
                </p>
                <p>
                  <span className="text-[#6B6B6B]">Tanggal Catatan:</span>{' '}
                  <strong className="text-[#1A1A1A]">
                    {new Date(entryToDelete.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </strong>
                </p>
                <div className="pt-1 text-[#3D3D3D] italic bg-white p-2 rounded border border-[#DDD8CE] max-h-24 overflow-y-auto">
                  &ldquo;{parseCatatan(entryToDelete.catatan, entryToDelete.created_at).masalah}&rdquo;
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEntryToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl border border-[#DDD8CE] text-[#6B6B6B] hover:bg-[#FAF8F2] font-semibold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteEntry}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-[#C0392B] hover:bg-[#922B21] text-white font-bold text-xs shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                >
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus Catatan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function BukuPenghubungPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center text-xs text-[#6B6B6B]">
          Memuat Buku Penghubung...
        </div>
      }
    >
      <BukuPenghubungContent />
    </Suspense>
  );
}
