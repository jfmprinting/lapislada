'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import {
  supabase,
  KaihKegiatan,
  PILAR_KAIH,
  PilarKaih,
  compressImageFile,
} from '@/lib/supabase';
import { INITIAL_KAIH_KEGIATAN } from '@/lib/kaihData';
import { useNotification } from '@/components/ui/NotificationContext';
import {
  HeartHandshake,
  Camera,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Download,
  AlertTriangle,
  Users,
  Home as HomeIcon,
  School,
  X,
  ThumbsUp,
  Filter,
  Image as ImageIcon,
  ChevronRight,
  BookOpen,
  Info,
} from 'lucide-react';

function KaihContent() {
  const searchParams = useSearchParams();
  const { showToast, confirm } = useNotification();

  // Role detection: query param (?role=orangtua) or auth metadata
  const [role, setRole] = useState<'guru' | 'admin' | 'orangtua'>('guru');
  const [currentUserName, setCurrentUserName] = useState('Bu Sari, S.Pd');
  const [studentName, setStudentName] = useState('Ahmad Budi Santoso');
  const [studentClass, setStudentClass] = useState('Kelas 4A');

  // Active Tab for Guru: 'sekolah' | 'rumah' | 'panduan'
  const [activeTab, setActiveTab] = useState<'sekolah' | 'rumah' | 'panduan'>('sekolah');

  // Filter states
  const todayStr = new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(todayStr);
  const [filterStudent, setFilterStudent] = useState('semua');

  // Data states
  const [kegiatanList, setKegiatanList] = useState<KaihKegiatan[]>(INITIAL_KAIH_KEGIATAN);
  const [loading, setLoading] = useState(true);

  // Modal State for Adding Activity (Sekolah or Rumah)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'sekolah' | 'rumah'>('sekolah');
  const [formData, setFormData] = useState({
    judul: '',
    kategori_id: 1,
    jam: '07:30 WIB',
    deskripsi: '',
    foto_url: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample student list for Kelas 4A
  const siswaKelasList = [
    { id: 's-1', nama: 'Ahmad Budi Santoso' },
    { id: 's-2', nama: 'Bima Arya Pratama' },
    { id: 's-3', nama: 'Citra Kirana Dewi' },
    { id: 's-4', nama: 'Daffa Rizky Maulana' },
    { id: 's-5', nama: 'Eka Putri Lestari' },
  ];

  // 1. Initialize Auth and Role
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'orangtua') {
      setRole('orangtua');
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata;
        const detectedRole = (meta?.role as 'guru' | 'admin' | 'orangtua') || roleParam || 'guru';
        setRole(detectedRole);

        if (detectedRole === 'orangtua') {
          const rawName = (meta?.nama || 'Wali Murid Ahmad').replace(/\s*\(Wali Murid\)/i, '').trim();
          setStudentName(rawName || 'Ahmad Budi Santoso');
          setCurrentUserName(`Wali Murid ${rawName || 'Ahmad'}`);
        } else {
          setCurrentUserName(meta?.nama || 'Bu Sari, S.Pd (Wali Kelas 4A)');
        }
      }
    });
  }, [searchParams]);

  // 2. Fetch Data from Supabase / localStorage fallback
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const local = localStorage.getItem('lapislada_kaih_kegiatan');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setKegiatanList(parsed);
            }
          } catch (e) {
            // ignore
          }
        }

        // Try Supabase fetch
        const { data, error } = await supabase
          .from('kaih_kegiatan')
          .select('*')
          .order('created_at', { ascending: false });

        if (data && data.length > 0 && !error) {
          setKegiatanList(data);
          localStorage.setItem('lapislada_kaih_kegiatan', JSON.stringify(data));
        }
      } catch (err) {
        console.warn('Fallback to local KAIH data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const saveKegiatanList = (items: KaihKegiatan[]) => {
    setKegiatanList(items);
    try {
      localStorage.setItem('lapislada_kaih_kegiatan', JSON.stringify(items));
    } catch (e) {
      console.warn('localStorage save failed:', e);
    }
  };

  // 3. Handle Image Selection & Instant Compression
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    try {
      // Compress to max 900px, quality 0.75 -> compact size (~70KB)
      const compressedDataUrl = await compressImageFile(file, 900, 900, 0.75);
      setImagePreview(compressedDataUrl);
      setFormData((prev) => ({ ...prev, foto_url: compressedDataUrl }));
      showToast({
        type: 'success',
        title: 'Foto Terkompresi',
        message: 'Foto berhasil diproses secara otomatis dengan ukuran ringan.',
      });
    } catch (err) {
      console.error('Gagal memproses gambar:', err);
      showToast({
        type: 'error',
        title: 'Gagal Membaca Foto',
        message: 'Format foto tidak didukung atau ukuran terlalu besar.',
      });
    } finally {
      setCompressing(false);
    }
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, foto_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 4. Open Modal for Adding Activity
  const handleOpenAddModal = (type: 'sekolah' | 'rumah') => {
    setModalType(type);
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    setFormData({
      judul: type === 'sekolah' ? 'Pembiasaan Sholat Dhuha Berjamaah' : 'Merapikan Tempat Tidur Sendiri',
      kategori_id: type === 'sekolah' ? 2 : 1,
      jam: `${hours}:${minutes} WIB`,
      deskripsi: '',
      foto_url: '',
    });
    setImagePreview(null);
    setIsModalOpen(true);
  };

  // 5. Submit New Activity
  const handleSubmitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul.trim()) {
      showToast({ type: 'error', message: 'Judul kegiatan wajib diisi!' });
      return;
    }

    const selectedPilar = PILAR_KAIH.find((p) => p.id === Number(formData.kategori_id)) || PILAR_KAIH[0];

    setSubmitting(true);
    const newId = `kaih-${Date.now()}`;
    const newRecord: KaihKegiatan = {
      id: newId,
      tipe: modalType,
      kelas_id: 'c1-4a',
      siswa_id: modalType === 'rumah' ? 's-1' : null,
      kategori_id: selectedPilar.id,
      kategori_nama: selectedPilar.judul,
      judul: formData.judul.trim(),
      deskripsi: formData.deskripsi.trim() || null,
      jam: formData.jam || '07:30 WIB',
      tanggal: filterDate || todayStr,
      foto_url: formData.foto_url || null,
      creator_nama: modalType === 'sekolah' ? currentUserName : `${currentUserName} (Ananda: ${studentName})`,
      apresiasi_guru: false,
      created_at: new Date().toISOString(),
      siswa:
        modalType === 'rumah'
          ? {
              nama_lengkap: studentName,
              kelas: { nama_kelas: studentClass },
            }
          : undefined,
    };

    try {
      // Try save to Supabase
      await supabase.from('kaih_kegiatan').insert([
        {
          id: newRecord.id,
          tipe: newRecord.tipe,
          kelas_id: newRecord.kelas_id,
          siswa_id: newRecord.siswa_id,
          kategori_id: newRecord.kategori_id,
          kategori_nama: newRecord.kategori_nama,
          judul: newRecord.judul,
          deskripsi: newRecord.deskripsi,
          jam: newRecord.jam,
          tanggal: newRecord.tanggal,
          foto_url: newRecord.foto_url,
          creator_nama: newRecord.creator_nama,
        },
      ]);
    } catch (dbErr) {
      console.info('Database insert fallback to local state');
    }

    const updated = [newRecord, ...kegiatanList];
    saveKegiatanList(updated);
    setSubmitting(false);
    setIsModalOpen(false);

    showToast({
      type: 'success',
      title: 'Kegiatan Tercatat!',
      message:
        modalType === 'sekolah'
          ? 'Dokumentasi kegiatan sekolah berhasil dicatat untuk seluruh wali murid kelas.'
          : 'Pembiasaan ananda di rumah berhasil dicatat dan dapat dipantau oleh wali kelas.',
    });
  };

  // 6. Guru Toggle Apresiasi
  const handleToggleApresiasi = async (id: string) => {
    const target = kegiatanList.find((k) => k.id === id);
    if (!target) return;

    const newStatus = !target.apresiasi_guru;
    const updated = kegiatanList.map((k) =>
      k.id === id ? { ...k, apresiasi_guru: newStatus, catatan_guru: newStatus ? 'Hebat, pertahankan pembiasaan baik ini ya Ananda!' : null } : k
    );
    saveKegiatanList(updated);

    try {
      await supabase.from('kaih_kegiatan').update({ apresiasi_guru: newStatus }).eq('id', id);
    } catch (e) {
      // ignore
    }

    showToast({
      type: 'success',
      title: newStatus ? 'Apresiasi Diberikan 👍' : 'Apresiasi Dibatalkan',
      message: newStatus ? `Apresiasi telah dikirimkan kepada orang tua ${target.siswa?.nama_lengkap || 'siswa'}.` : 'Status apresiasi diperbarui.',
    });
  };

  // 7. Delete Activity
  const handleDeleteActivity = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Catatan Kegiatan?',
      message: 'Apakah Anda yakin ingin menghapus catatan kegiatan ini? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      isDanger: true,
    });
    if (!isConfirmed) return;

    try {
      await supabase.from('kaih_kegiatan').delete().eq('id', id);
    } catch (e) {
      // ignore
    }

    const updated = kegiatanList.filter((k) => k.id !== id);
    saveKegiatanList(updated);
    showToast({ type: 'info', message: 'Catatan kegiatan berhasil dihapus.' });
  };

  // 8. Backup / Export All Data (Retention Feature)
  const handleExportBackup = () => {
    const dataStr = JSON.stringify(kegiatanList, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-karakter-kaih-${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast({
      type: 'success',
      title: 'Cadangan Berhasil Diunduh',
      message: 'Seluruh rekap data kegiatan dan arsip foto KAIH telah tersimpan di perangkat Anda.',
    });
  };

  // Filtered lists
  const filteredSekolah = kegiatanList.filter(
    (k) => k.tipe === 'sekolah' && (!filterDate || k.tanggal === filterDate)
  );

  const filteredRumah = kegiatanList.filter((k) => {
    if (k.tipe !== 'rumah') return false;
    if (filterDate && k.tanggal !== filterDate) return false;
    if (filterStudent !== 'semua' && k.siswa_id !== filterStudent) return false;
    return true;
  });

  // For Orang Tua view: get today's school activity + my child's home activity
  const ortuSekolahHariIni = kegiatanList.filter(
    (k) => k.tipe === 'sekolah' && k.tanggal === todayStr
  );
  const ortuRumahAnanda = kegiatanList.filter(
    (k) => k.tipe === 'rumah' && (k.siswa_id === 's-1' || k.siswa?.nama_lengkap === studentName)
  );

  // Retention days calculation (30 days policy)
  const retentionRemainingDays = 27; // Example countdown indicator

  return (
    <AppShell
      role={role}
      pageTitle={role === 'orangtua' ? 'Karakter KAIH Ananda' : 'Karakter KAIH'}
      pageSubtitle="7 Kebiasaan Anak Indonesia Hebat: Warisan ABAT"
    >
      <div className="space-y-6 pb-12">
        {/* ========================================================================= */}
        {/* RETENTION & BACKUP ALERT BANNER (Voice Note: 30 Hari & Peringatan Backup) */}
        {/* ========================================================================= */}
        <div className="bg-[#FFFDF7] rounded-2xl p-4 lg:p-5 border border-[#FADBD8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#FDEDEC] text-[#922B21] shrink-0 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">
                  Kebijakan Retensi Foto 30 Hari
                </h3>
                <span className="text-[10px] font-bold bg-[#FDEDEC] text-[#922B21] px-2 py-0.5 rounded-full border border-[#F1948A]">
                  Sisa ~{retentionRemainingDays} Hari
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B] mt-0.5 leading-relaxed">
                Foto dokumentasi KAIH disimpan di server selama <strong>30 hari</strong>. Harap lakukan pencadangan data atau unduh foto kegiatan secara berkala sebelum terhapus otomatis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              onClick={handleExportBackup}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-white border border-[#DDD8CE] hover:bg-[#FAF8F2] text-xs font-bold text-[#1A1A1A] transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Unduh file backup JSON dan foto"
            >
              <Download className="w-3.5 h-3.5 text-[#922B21]" />
              <span>Cadangkan / Ekspor Data</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* JIKA PERAN ORANG TUA (Portal Orang Tua Murid) */}
        {/* ========================================================================= */}
        {role === 'orangtua' ? (
          <div className="space-y-6">
            {/* CARD INFO ANANDA */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#DDD8CE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-[#922B21] uppercase tracking-wider bg-[#FDEDEC] px-2 py-0.5 rounded">
                  Buku Catatan Pembiasaan Ananda
                </span>
                <h2 className="font-serif font-bold text-lg text-[#1A1A1A] mt-1">
                  {studentName} · {studentClass}
                </h2>
                <p className="text-xs text-[#6B6B6B]">
                  Laporkan 1-2 pembiasaan baik yang dilakukan ananda di rumah hari ini beserta foto bukti.
                </p>
              </div>

              <button
                onClick={() => handleOpenAddModal('rumah')}
                className="px-4 py-2.5 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <Camera className="w-4 h-4" />
                <span>+ Catat & Unggah Foto di Rumah</span>
              </button>
            </div>

            {/* SEKSI 1: KEGIATAN KELAS DI SEKOLAH HARI INI (DARI BU GURU) */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#DDD8CE] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#F5F0E8]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#EBF5FB] text-[#2980B9]">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">
                      Kegiatan Kelas Hari Ini di Sekolah
                    </h3>
                    <p className="text-[11px] text-[#6B6B6B]">
                      Dicatat secara global oleh wali kelas untuk seluruh orang tua
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#2980B9] bg-[#EBF5FB] px-2.5 py-1 rounded-full">
                  {ortuSekolahHariIni.length} Kegiatan Hari Ini
                </span>
              </div>

              {ortuSekolahHariIni.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-[#FAF8F2] border border-dashed border-[#DDD8CE]">
                  <p className="text-xs text-[#6B6B6B]">
                    Belum ada kegiatan kelas yang dicatat guru untuk hari ini.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ortuSekolahHariIni.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[#DDD8CE] overflow-hidden bg-[#FAF8F2] hover:bg-white transition shadow-xs flex flex-col"
                    >
                      {item.foto_url && (
                        <div className="h-44 w-full overflow-hidden bg-black/5 relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.foto_url}
                            alt={item.judul}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            <span>{item.jam}</span>
                          </div>
                        </div>
                      )}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <span className="inline-block text-[10px] font-bold text-[#2980B9] bg-white border border-[#2980B9]/30 px-2 py-0.5 rounded mb-1">
                            {item.kategori_nama}
                          </span>
                          <h4 className="font-serif font-bold text-sm text-[#1A1A1A]">
                            {item.judul}
                          </h4>
                          {item.deskripsi && (
                            <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">
                              {item.deskripsi}
                            </p>
                          )}
                        </div>
                        <div className="pt-2 border-t border-[#DDD8CE]/60 flex items-center justify-between text-[10px] text-[#6B6B6B]">
                          <span>Oleh: {item.creator_nama}</span>
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Diikuti Seluruh Kelas
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* SEKSI 2: CATATAN PEMBIASAAN ANANDA DI RUMAH */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#DDD8CE] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#F5F0E8]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#EAFAF1] text-[#27AE60]">
                    <HomeIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">
                      Riwayat Pembiasaan Ananda di Rumah
                    </h3>
                    <p className="text-[11px] text-[#6B6B6B]">
                      Catatan kebiasaan baik ananda yang sudah Anda kirimkan ke wali kelas
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenAddModal('rumah')}
                  className="px-3 py-1.5 rounded-lg bg-[#FAF8F2] border border-[#DDD8CE] hover:bg-white text-xs font-bold text-[#1A1A1A] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#922B21]" />
                  <span>Tambah Kegiatan</span>
                </button>
              </div>

              {ortuRumahAnanda.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-[#FAF8F2] border border-dashed border-[#DDD8CE] space-y-2">
                  <HeartHandshake className="w-8 h-8 text-[#922B21] mx-auto opacity-70" />
                  <p className="text-xs text-[#6B6B6B]">
                    Belum ada pembiasaan rumah yang dicatat untuk ananda hari ini.
                  </p>
                  <button
                    onClick={() => handleOpenAddModal('rumah')}
                    className="mt-2 px-4 py-2 rounded-xl bg-[#C0392B] text-white font-bold text-xs shadow-xs"
                  >
                    + Catat Pembiasaan Pertama Hari Ini
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ortuRumahAnanda.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[#DDD8CE] overflow-hidden bg-[#FAF8F2] hover:bg-white transition shadow-xs flex flex-col"
                    >
                      {item.foto_url && (
                        <div className="h-44 w-full overflow-hidden bg-black/5 relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.foto_url}
                            alt={item.judul}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            <span>{item.jam}</span>
                          </div>
                        </div>
                      )}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                              {item.kategori_nama}
                            </span>
                            <span className="text-[10px] text-[#6B6B6B]">
                              {item.tanggal}
                            </span>
                          </div>
                          <h4 className="font-serif font-bold text-sm text-[#1A1A1A]">
                            {item.judul}
                          </h4>
                          {item.deskripsi && (
                            <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">
                              {item.deskripsi}
                            </p>
                          )}
                        </div>

                        {/* Status Respon / Apresiasi Guru */}
                        <div className="pt-2 border-t border-[#DDD8CE]/60">
                          {item.apresiasi_guru ? (
                            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-[11px] text-emerald-800">
                                <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Direspon Wali Kelas:</span>
                              </div>
                              <p className="text-[11px] italic text-emerald-700">
                                &ldquo;{item.catatan_guru || 'Hebat, terima kasih telah mendampingi ananda dengan baik!'}&rdquo;
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-[11px] text-[#6B6B6B]">
                              <span>Status: Menunggu tinjauan guru</span>
                              <span className="text-[10px] bg-[#E8E0D0] px-2 py-0.5 rounded">Terkirim</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          /* ========================================================================= */
          /* JIKA PERAN GURU / ADMIN */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* TAB CONTROLLER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DDD8CE] pb-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('sekolah')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    activeTab === 'sekolah'
                      ? 'bg-[#C0392B] text-white shadow-sm'
                      : 'bg-white text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#DDD8CE]'
                  }`}
                >
                  <School className="w-4 h-4" />
                  <span>Kegiatan Sekolah (Global Kelas)</span>
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                    {filteredSekolah.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('rumah')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    activeTab === 'rumah'
                      ? 'bg-[#C0392B] text-white shadow-sm'
                      : 'bg-white text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#DDD8CE]'
                  }`}
                >
                  <HomeIcon className="w-4 h-4" />
                  <span>Pantauan Rumah (Siswa)</span>
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                    {filteredRumah.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('panduan')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    activeTab === 'panduan'
                      ? 'bg-[#C0392B] text-white shadow-sm'
                      : 'bg-white text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#DDD8CE]'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>7 Pilar KAIH (Panduan)</span>
                </button>
              </div>

              {/* ACTION BUTTON */}
              {activeTab === 'sekolah' && (
                <button
                  type="button"
                  onClick={() => handleOpenAddModal('sekolah')}
                  className="px-4 py-2 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Catat Kegiatan Sekolah Hari Ini</span>
                </button>
              )}
            </div>

            {/* FILTER BAR (TANGGAL & SISWA) */}
            {activeTab !== 'panduan' && (
              <div className="bg-white rounded-xl p-3.5 border border-[#DDD8CE] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#922B21]" />
                    <span className="font-bold text-[#1A1A1A]">Pilih Tanggal:</span>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#DDD8CE] bg-[#FAF8F2] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#922B21]"
                    />
                  </div>

                  {activeTab === 'rumah' && (
                    <div className="flex items-center gap-1.5">
                      <Filter className="w-4 h-4 text-[#922B21]" />
                      <span className="font-bold text-[#1A1A1A]">Siswa:</span>
                      <select
                        value={filterStudent}
                        onChange={(e) => setFilterStudent(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#DDD8CE] bg-[#FAF8F2] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#922B21]"
                      >
                        <option value="semua">Semua Siswa Kelas 4A</option>
                        {siswaKelasList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-[#6B6B6B]">
                  Menampilkan <strong>{activeTab === 'sekolah' ? filteredSekolah.length : filteredRumah.length}</strong> catatan
                </div>
              </div>
            )}

            {/* TAB CONTENT 1: KEGIATAN SEKOLAH (GLOBAL KELAS) */}
            {activeTab === 'sekolah' && (
              <div className="space-y-4">
                {filteredSekolah.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-[#DDD8CE] space-y-3">
                    <School className="w-10 h-10 text-[#922B21] mx-auto opacity-60" />
                    <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                      Belum Ada Kegiatan Sekolah di Tanggal Ini
                    </h3>
                    <p className="text-xs text-[#6B6B6B] max-w-md mx-auto">
                      Catat kegiatan pembiasaan positif kelas (seperti Sholat Dhuha, Senam Pagi, Literasi) beserta foto untuk dibagikan ke seluruh wali murid.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal('sekolah')}
                      className="mt-2 px-5 py-2.5 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white font-bold text-xs shadow-md transition active:scale-95 inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Catat Kegiatan Sekolah Sekarang</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredSekolah.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-[#DDD8CE] overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                      >
                        <div>
                          {item.foto_url ? (
                            <div className="h-48 w-full overflow-hidden bg-black/5 relative group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.foto_url}
                                alt={item.judul}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                                <Clock className="w-3 h-3" />
                                <span>{item.jam}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-32 w-full bg-[#FAF8F2] flex items-center justify-center text-[#6B6B6B] text-xs">
                              <ImageIcon className="w-6 h-6 opacity-40 mr-1.5" />
                              <span>Tidak ada foto</span>
                            </div>
                          )}

                          <div className="p-4 space-y-2">
                            <span className="inline-block text-[10px] font-bold text-[#2980B9] bg-[#EBF5FB] px-2 py-0.5 rounded">
                              {item.kategori_nama}
                            </span>
                            <h4 className="font-serif font-bold text-sm text-[#1A1A1A] leading-snug">
                              {item.judul}
                            </h4>
                            {item.deskripsi && (
                              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                                {item.deskripsi}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="p-4 pt-2 border-t border-[#F5F0E8] flex items-center justify-between text-[11px] text-[#6B6B6B]">
                          <span>{item.creator_nama}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(item.id)}
                            className="p-1 text-[#C0392B] hover:bg-[#FDEDEC] rounded-md transition cursor-pointer"
                            title="Hapus Kegiatan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: PANTAUAN KEGIATAN RUMAH (SISWA) */}
            {activeTab === 'rumah' && (
              <div className="space-y-4">
                {filteredRumah.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-[#DDD8CE] space-y-3">
                    <HomeIcon className="w-10 h-10 text-[#922B21] mx-auto opacity-60" />
                    <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                      Belum Ada Laporan Pembiasaan Rumah
                    </h3>
                    <p className="text-xs text-[#6B6B6B] max-w-md mx-auto">
                      Belum ada orang tua yang mengunggah kegiatan pembiasaan ananda di rumah pada tanggal atau filter yang dipilih.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredRumah.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-[#DDD8CE] overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                      >
                        <div>
                          {item.foto_url && (
                            <div className="h-48 w-full overflow-hidden bg-black/5 relative group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.foto_url}
                                alt={item.judul}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                                <Clock className="w-3 h-3" />
                                <span>{item.jam}</span>
                              </div>
                            </div>
                          )}

                          <div className="p-4 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                {item.kategori_nama}
                              </span>
                              <span className="text-[10px] text-[#6B6B6B]">
                                {item.tanggal}
                              </span>
                            </div>

                            <div className="pt-1">
                              <span className="text-[10px] font-bold text-[#922B21] uppercase tracking-wider block">
                                Ananda: {item.siswa?.nama_lengkap || 'Ahmad Budi Santoso'}
                              </span>
                              <h4 className="font-serif font-bold text-sm text-[#1A1A1A] mt-0.5">
                                {item.judul}
                              </h4>
                            </div>

                            {item.deskripsi && (
                              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                                {item.deskripsi}
                              </p>
                            )}

                            <div className="text-[10px] text-[#6B6B6B] pt-1">
                              Oleh: {item.creator_nama}
                            </div>
                          </div>
                        </div>

                        {/* TOMBOL APRESIASI GURU */}
                        <div className="p-4 pt-3 border-t border-[#F5F0E8] flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleApresiasi(item.id)}
                            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                              item.apresiasi_guru
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-[#FAF8F2] border border-[#DDD8CE] hover:bg-[#E8E0D0] text-[#1A1A1A]'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>{item.apresiasi_guru ? 'Sudah Diapresiasi 👍' : 'Beri Apresiasi 👍'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(item.id)}
                            className="p-1.5 text-[#C0392B] hover:bg-[#FDEDEC] rounded-lg transition cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: PANDUAN 7 PILAR KAIH */}
            {activeTab === 'panduan' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PILAR_KAIH.map((pilar) => (
                  <div
                    key={pilar.id}
                    className="p-5 rounded-2xl border border-[#DDD8CE] bg-white shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{pilar.ikon}</span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: pilar.bgHex, color: pilar.textHex }}
                      >
                        {pilar.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#1A1A1A]">
                        {pilar.id}. {pilar.judul}
                      </h4>
                      <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">
                        {pilar.deskripsi}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL INPUT KEGIATAN KAIH (DENGAN KAMERA / GALERI HP) */}
        {/* ========================================================================= */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DDD8CE] space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-[#F5F0E8]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#FDEDEC] text-[#922B21]">
                    {modalType === 'sekolah' ? <School className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                      {modalType === 'sekolah'
                        ? 'Catat Kegiatan Kelas (Sekolah)'
                        : 'Catat Pembiasaan Ananda (Di Rumah)'}
                    </h3>
                    <p className="text-[11px] text-[#6B6B6B]">
                      {modalType === 'sekolah'
                        ? 'Akan tampil di beranda seluruh wali murid Kelas 4A'
                        : 'Akan terkirim ke wali kelas untuk pemantauan karakter'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-[#6B6B6B] hover:bg-[#FAF8F2] transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitActivity} className="space-y-4 text-xs">
                {/* PILIH PILAR KAIH */}
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1">
                    Pilih 1 dari 7 Pilar KAIH:
                  </label>
                  <select
                    value={formData.kategori_id}
                    onChange={(e) => setFormData({ ...formData, kategori_id: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#DDD8CE] bg-[#FAF8F2] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                  >
                    {PILAR_KAIH.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.ikon} {p.id}. {p.judul} ({p.badge})
                      </option>
                    ))}
                  </select>
                </div>

                {/* JUDUL KEGIATAN */}
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1">
                    Judul Kegiatan:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      modalType === 'sekolah'
                        ? 'Contoh: Sholat Dhuha Berjamaah / Senam Pagi Ceria'
                        : 'Contoh: Merapikan Kamar / Membantu Memasak / Sholat Maghrib'
                    }
                    value={formData.judul}
                    onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD8CE] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                  />
                </div>

                {/* JAM KEGIATAN */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#1A1A1A] mb-1">
                      Jam / Waktu:
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 07:15 WIB"
                      value={formData.jam}
                      onChange={(e) => setFormData({ ...formData, jam: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#DDD8CE] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#1A1A1A] mb-1">
                      Tanggal:
                    </label>
                    <input
                      type="date"
                      value={filterDate || todayStr}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#DDD8CE] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                    />
                  </div>
                </div>

                {/* CATATAN / DESKRIPSI */}
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1">
                    Deskripsi Singkat / Catatan:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Tuliskan keterangan singkat tentang kegiatan positif ini..."
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#DDD8CE] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#922B21] resize-none"
                  />
                </div>

                {/* UPLOAD FOTO BUKTI (KAMERA / GALERI HP) */}
                <div>
                  <label className="block font-bold text-[#1A1A1A] mb-1">
                    Unggah Bukti Foto (Kamera / Galeri):
                  </label>

                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-[#DDD8CE] bg-black/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Preview kegiatan"
                        className="w-full h-44 object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition cursor-pointer"
                        title="Hapus foto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="p-2 bg-emerald-50 text-emerald-800 text-[11px] font-medium flex items-center justify-between">
                        <span>Foto siap diunggah (Terkompresi otomatis)</span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[#922B21] font-bold hover:underline"
                        >
                          Ganti Foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-5 border-2 border-dashed border-[#DDD8CE] hover:border-[#922B21] rounded-xl bg-[#FAF8F2] hover:bg-white text-center cursor-pointer transition space-y-1.5"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#FDEDEC] text-[#922B21] flex items-center justify-center mx-auto">
                        <Camera className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-[#1A1A1A] text-xs">
                        Buka Kamera Ponsel atau Pilih dari Galeri
                      </p>
                      <p className="text-[10px] text-[#6B6B6B]">
                        Mendukung JPG, PNG, WebP (Ukuran otomatis dikompresi)
                      </p>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {compressing && (
                    <p className="text-[10px] text-[#922B21] mt-1 font-semibold animate-pulse">
                      Sedang memproses dan mengompresi foto...
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#F5F0E8] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white border border-[#DDD8CE] text-xs font-bold text-[#6B6B6B] hover:text-[#1A1A1A]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || compressing}
                    className="px-5 py-2.5 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan & Publikasikan'}
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

export default function KaihPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8] text-[#922B21]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#922B21]"></div>
            <span className="text-xs font-bold text-[#6B6B6B]">Memuat Modul KAIH...</span>
          </div>
        </div>
      }
    >
      <KaihContent />
    </Suspense>
  );
}
