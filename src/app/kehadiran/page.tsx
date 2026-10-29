'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import AppShell from '@/components/layout/AppShell';
import {
  CheckCircle2,
  Save,
  Users,
  Calendar,
  Sparkles,
  BookOpen,
  Clock,
  ArrowRight,
  Download,
  Printer,
  FileSpreadsheet,
  Layers,
  Search,
  Filter,
  BarChart3,
  CalendarDays,
  Table as TableIcon,
  Check,
  AlertCircle,
  Award,
  Plus,
  Eye,
  Camera,
  X,
  FileText,
  Image as ImageIcon,
  Bell,
  Trash2,
} from 'lucide-react';
import { supabase, Siswa, Kelas, compressImageFile, getTodayDateString } from '@/lib/supabase';
import { useNotification } from '@/components/ui/NotificationContext';
import ParentKehadiranView from '@/components/kehadiran/ParentKehadiranView';

const BULAN_LIST = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

interface StudentDailyAttendance {
  id: string;
  nis: string;
  nama: string;
  jk?: 'L' | 'P';
  status: 'H' | 'S' | 'I' | 'A';
  izinInfo?: {
    alasan: string;
    foto_url?: string | null;
    diajukan_oleh?: string;
    tipe?: string;
    submitted_at?: string;
    status_label?: string;
  } | null;
}

function KehadiranContent() {
  const { showToast } = useNotification();
  const searchParams = useSearchParams();
  const queryRole = searchParams.get('role');
  const [role, setRole] = useState<'guru' | 'admin' | 'orangtua' | 'kepala_sekolah'>('guru');

  // Navigation Tab for Guru/Admin/Kepsek
  const [activeTab, setActiveTab] = useState<'harian' | 'rekap'>('harian');

  // Master Data State
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [loadingKelas, setLoadingKelas] = useState(false);

  // Daily Attendance States
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [dailyStudents, setDailyStudents] = useState<StudentDailyAttendance[]>([]);
  const [savingDaily, setSavingDaily] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Monthly Recap Filter States
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [recapSearchTerm, setRecapSearchTerm] = useState('');
  const [recapViewMode, setRecapViewMode] = useState<'summary' | 'matrix'>('summary');

  // Database Attendance Records
  const [dbKehadiranRecords, setDbKehadiranRecords] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const isOrangTua = role === 'orangtua';
  const isKepalaSekolah = role === 'kepala_sekolah';
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  // Parent View States
  const [parentSiswa, setParentSiswa] = useState<any>(null);
  const [parentRecords, setParentRecords] = useState<any[]>([]);
  const [parentLoading, setParentLoading] = useState(false);

  // States Modal Pengajuan Izin (Portal Orang Tua)
  const [modalIzinOpen, setModalIzinOpen] = useState(false);
  const [formIzinStatus, setFormIzinStatus] = useState<'S' | 'I'>('S');
  const [formIzinTanggal, setFormIzinTanggal] = useState<string>(getTodayDateString());
  const [formIzinAlasan, setFormIzinAlasan] = useState('');
  const [formIzinFoto, setFormIzinFoto] = useState('');
  const [compressingFoto, setCompressingFoto] = useState(false);
  const [submittingIzin, setSubmittingIzin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States Modal Detail Izin Siswa (Guru / Admin)
  const [selectedIzinStudent, setSelectedIzinStudent] = useState<StudentDailyAttendance | null>(null);
  const [modalDetailIzinOpen, setModalDetailIzinOpen] = useState(false);
  const [previewFotoUrl, setPreviewFotoUrl] = useState<string | null>(null);

  // Auto-open modal pengajuan jika ada query ?ajukan=true
  useEffect(() => {
    if (searchParams.get('ajukan') === 'true') {
      setModalIzinOpen(true);
    }
  }, [searchParams]);

  // 1. Detect User Role
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || '');
      }

      const metaRole = user?.user_metadata?.role;
      const metaJabatan = user?.user_metadata?.jabatan;
      const email = user?.email?.toLowerCase().trim();

      let dbRole: string | undefined;
      if (user?.id) {
        try {
          const { data: prof } = await supabase
            .from('users_profile')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          if (prof?.role) dbRole = prof.role;
        } catch {}
      }

      const isKepsekDetected =
        queryRole === 'kepala_sekolah' ||
        dbRole === 'kepala_sekolah' ||
        metaRole === 'kepala_sekolah' ||
        metaJabatan === 'kepala_sekolah' ||
        email === 'kepsek@demo.com';

      if (isKepsekDetected) {
        setRole('kepala_sekolah');
      } else {
        const detectedRole =
          (queryRole as 'guru' | 'admin' | 'orangtua' | 'kepala_sekolah') ||
          (dbRole as 'guru' | 'admin' | 'orangtua' | 'kepala_sekolah') ||
          (metaRole as 'guru' | 'admin' | 'orangtua' | 'kepala_sekolah') ||
          'guru';
        setRole(detectedRole);
      }
    });
  }, [queryRole]);

  // 1b. Fetch Data for Orang Tua View
  useEffect(() => {
    if (!isOrangTua) return;
    const fetchParentData = async () => {
      setParentLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const meta = user.user_metadata;
        let sData: any = null;

        // 1. Query by wali_murid_id = user.id
        const { data: byWali } = await supabase
          .from('siswa')
          .select('*, kelas:kelas_id(id, nama_kelas)')
          .eq('wali_murid_id', user.id)
          .maybeSingle();
        sData = byWali;

        // 2. Fallback to /api/link-siswa with session token
        if (!sData && session?.access_token) {
          try {
            const linkRes = await fetch('/api/link-siswa', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
            });
            if (linkRes.ok) {
              const linkJson = await linkRes.json();
              if (linkJson?.siswa) sData = linkJson.siswa;
            }
          } catch (e) {
            console.warn('Auto-link in kehadiran failed:', e);
          }
        }

        // 3. Fallback to meta.siswa_id
        if (!sData && meta?.siswa_id) {
          const { data } = await supabase
            .from('siswa')
            .select('*, kelas:kelas_id(id, nama_kelas)')
            .eq('id', meta.siswa_id)
            .maybeSingle();
          sData = data;
        }

        if (sData) {
          setParentSiswa(sData);

          const startDay = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
          const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0).getDate();
          const endDay = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

          const { data: recs } = await supabase
            .from('kehadiran')
            .select('*')
            .eq('siswa_id', sData.id)
            .gte('tanggal', startDay)
            .lte('tanggal', endDay)
            .order('tanggal', { ascending: false });

          const enrichedRecs = (recs || []).map((r: any) => {
            let parsedKet: any = null;
            if (r.keterangan && r.keterangan.startsWith('{') && r.keterangan.endsWith('}')) {
              try {
                parsedKet = JSON.parse(r.keterangan);
              } catch {}
            }
            return {
              ...r,
              parsedKet,
            };
          });

          setParentRecords(enrichedRecs);
        }
      } catch (err) {
        console.error('Error loading parent attendance data:', err);
      } finally {
        setParentLoading(false);
      }
    };

    fetchParentData();
  }, [isOrangTua, selectedMonth, selectedYear]);

  // 2. Fetch Master Kelas from Supabase
  useEffect(() => {
    const fetchKelas = async () => {
      setLoadingKelas(true);
      try {
        const { data: allKelas, error } = await supabase
          .from('kelas')
          .select('id, nama_kelas, tahun_ajaran, wali_kelas_id, wali_kelas:wali_kelas_id(id, nama, email)')
          .order('nama_kelas', { ascending: true });

        if (!error && allKelas && allKelas.length > 0) {
          if (role === 'guru') {
            const cleanEmail = (userEmail || '').toLowerCase().trim();
            // Filter classes for guru: match by wali_kelas_id or wali_kelas email
            const myClasses = allKelas.filter((k: any) => {
              const idMatch = userId && k.wali_kelas_id === userId;
              const emailMatch = cleanEmail && k.wali_kelas?.email?.toLowerCase() === cleanEmail;
              return idMatch || emailMatch;
            });

            if (myClasses.length > 0) {
              setKelasList(myClasses as unknown as Kelas[]);
              setSelectedKelasId(myClasses[0].id);
            } else {
              setKelasList([]);
              setSelectedKelasId('');
            }
          } else {
            // Admin: gets all classes
            setKelasList(allKelas as unknown as Kelas[]);
            setSelectedKelasId(allKelas[0].id);
          }
        } else {
          setKelasList([]);
          setSelectedKelasId('');
        }
      } catch (err) {
        console.warn('Error fetching classes', err);
      } finally {
        setLoadingKelas(false);
      }
    };
    
    // Fetch if role is admin or kepala_sekolah, or guru with user credentials
    if (role === 'admin' || role === 'kepala_sekolah' || (role === 'guru' && (userId || userEmail))) {
      fetchKelas();
    }
  }, [role, userId, userEmail]);

  // 3. Fetch Students & Daily Attendance whenever selectedKelasId or selectedDate changes
  useEffect(() => {
    const loadDailyAttendance = async () => {
      if (!selectedKelasId) {
        setDailyStudents([]);
        return;
      }
      
      setLoadingAttendance(true);
      setSavedSuccess(false);

      try {
        // Fetch students of selected class
        const { data: siswaData, error: siswaError } = await supabase
          .from('siswa')
          .select('id, nis, nisn, nama_lengkap, jenis_kelamin, kelas_id')
          .eq('kelas_id', selectedKelasId)
          .order('nama_lengkap', { ascending: true });

        let studentsToUse: StudentDailyAttendance[] = [];

        if (!siswaError && siswaData && siswaData.length > 0) {
          studentsToUse = siswaData.map((s) => ({
            id: s.id,
            nis: s.nis || s.nisn || '-',
            nama: s.nama_lengkap,
            jk: (s.jenis_kelamin as 'L' | 'P') || 'L',
            status: 'H',
          }));
        } else {
          studentsToUse = [];
        }

        // Fetch existing attendance records for the selected date & class
        const { data: attData } = await supabase
          .from('kehadiran')
          .select('id, siswa_id, status, keterangan')
          .eq('kelas_id', selectedKelasId)
          .eq('tanggal', selectedDate);

        if (attData && attData.length > 0) {
          const statusMap = new Map<string, 'H' | 'S' | 'I' | 'A'>();
          const keteranganMap = new Map<string, any>();
          attData.forEach((item) => {
            statusMap.set(item.siswa_id, item.status);
            if (item.keterangan) {
              let parsed: any = null;
              if (item.keterangan.startsWith('{') && item.keterangan.endsWith('}')) {
                try {
                  parsed = JSON.parse(item.keterangan);
                } catch {}
              }
              keteranganMap.set(item.siswa_id, parsed || { alasan: item.keterangan });
            }
          });

          studentsToUse = studentsToUse.map((s) => ({
            ...s,
            status: statusMap.get(s.id) || 'H',
            izinInfo: keteranganMap.get(s.id) || null,
          }));
        }

        setDailyStudents(studentsToUse);
      } catch (err) {
        console.error('Error loading daily attendance:', err);
      } finally {
        setLoadingAttendance(false);
      }
    };

    loadDailyAttendance();
  }, [selectedKelasId, selectedDate]);

  // Hitung jumlah siswa yang izin diajukan orang tua hari ini
  const parentIzinCount = useMemo(() => {
    return dailyStudents.filter((s) => s.izinInfo && s.izinInfo.tipe === 'orangtua').length;
  }, [dailyStudents]);

  // 4. Fetch Month Attendance Records for Monthly Recap
  useEffect(() => {
    if (!selectedKelasId) {
      setDbKehadiranRecords([]);
      return;
    }

    const fetchMonthlyAttendance = async () => {
      try {
        const startDay = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const endDay = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

        const { data, error } = await supabase
          .from('kehadiran')
          .select('id, siswa_id, kelas_id, tanggal, status, keterangan')
          .eq('kelas_id', selectedKelasId)
          .gte('tanggal', startDay)
          .lte('tanggal', endDay);

        if (!error && data) {
          setDbKehadiranRecords(data);
        } else {
          setDbKehadiranRecords([]);
        }
      } catch (err) {
        console.warn('Error fetching monthly records:', err);
      }
    };

    fetchMonthlyAttendance();
  }, [selectedKelasId, selectedMonth, selectedYear]);

  // Selected Class Object — always safe (never undefined)
  const currentKelasObj = useMemo(() => {
    return (
      kelasList.find((k) => k.id === selectedKelasId) ||
      kelasList[0] || { id: '', nama_kelas: 'Belum Ada Kelas', tahun_ajaran: '2025/2026' }
    );
  }, [kelasList, selectedKelasId]);

  // Active Month Info
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const monthLabel = useMemo(() => {
    return BULAN_LIST.find((b) => b.value === selectedMonth)?.label || 'Bulan';
  }, [selectedMonth]);

  // Monthly Recap Data Calculation (Strictly Real Data, No Simulation)
  const monthlyRecapRows = useMemo(() => {
    const datesArr: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      datesArr.push(d);
    }

    // Map database records by `siswaId_day`
    const recordMap = new Map<string, 'H' | 'S' | 'I' | 'A'>();
    dbKehadiranRecords.forEach((r) => {
      const dayNum = parseInt(r.tanggal.split('-')[2], 10);
      recordMap.set(`${r.siswa_id}_${dayNum}`, r.status);
    });

    return dailyStudents.map((student, idx) => {
      let totalH = 0;
      let totalS = 0;
      let totalI = 0;
      let totalA = 0;

      const dailyStatus: Record<number, 'H' | 'S' | 'I' | 'A' | 'Libur' | '-'> = {};

      datesArr.forEach((day) => {
        const dateObj = new Date(selectedYear, selectedMonth - 1, day);
        const dayOfWeek = dateObj.getDay(); // 0 = Sunday

        if (dayOfWeek === 0) {
          dailyStatus[day] = 'Libur';
          return;
        }

        const explicitStatus = recordMap.get(`${student.id}_${day}`);
        if (explicitStatus) {
          dailyStatus[day] = explicitStatus;
          if (explicitStatus === 'H') totalH++;
          else if (explicitStatus === 'S') totalS++;
          else if (explicitStatus === 'I') totalI++;
          else if (explicitStatus === 'A') totalA++;
        } else {
          dailyStatus[day] = '-';
        }
      });

      const totalEfektif = totalH + totalS + totalI + totalA;
      const persentase = totalEfektif > 0 ? Math.round((totalH / totalEfektif) * 100) : 0;

      return {
        ...student,
        no: idx + 1,
        totalH,
        totalS,
        totalI,
        totalA,
        totalEfektif,
        persentase,
        dailyStatus,
      };
    });
  }, [dailyStudents, dbKehadiranRecords, daysInMonth, selectedMonth, selectedYear]);

  // Parent Attendance KPI Stats
  const parentStats = useMemo(() => {
    const counts = { H: 0, S: 0, I: 0, A: 0, total: parentRecords.length };
    parentRecords.forEach((r) => {
      if (r.status === 'H') counts.H++;
      else if (r.status === 'S') counts.S++;
      else if (r.status === 'I') counts.I++;
      else if (r.status === 'A') counts.A++;
    });
    const percent = counts.total > 0 ? Math.round((counts.H / counts.total) * 100) : 0;
    return { ...counts, percent };
  }, [parentRecords]);

  // Filtered monthly recap for search input
  const filteredRecapRows = useMemo(() => {
    if (!recapSearchTerm.trim()) return monthlyRecapRows;
    const q = recapSearchTerm.toLowerCase();
    return monthlyRecapRows.filter(
      (r) => r.nama.toLowerCase().includes(q) || r.nis.includes(q)
    );
  }, [monthlyRecapRows, recapSearchTerm]);

  // Overall Class KPI Metrics
  const classKPIs = useMemo(() => {
    const totalSiswa = monthlyRecapRows.length;
    if (totalSiswa === 0) {
      return { totalSiswa: 0, avgPersen: 0, sumH: 0, sumS: 0, sumI: 0, sumA: 0 };
    }

    const sumH = monthlyRecapRows.reduce((acc, cur) => acc + cur.totalH, 0);
    const sumS = monthlyRecapRows.reduce((acc, cur) => acc + cur.totalS, 0);
    const sumI = monthlyRecapRows.reduce((acc, cur) => acc + cur.totalI, 0);
    const sumA = monthlyRecapRows.reduce((acc, cur) => acc + cur.totalA, 0);

    const totalDaysRecorded = sumH + sumS + sumI + sumA;
    const avgPersen =
      totalDaysRecorded > 0 ? Math.round((sumH / totalDaysRecorded) * 100) : 100;

    return { totalSiswa, avgPersen, sumH, sumS, sumI, sumA };
  }, [monthlyRecapRows]);

  // Handle image upload and compression for leave proof
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressingFoto(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 900, 900, 0.75);
      setFormIzinFoto(compressedDataUrl);
      showToast({
        type: 'success',
        title: 'Foto Terlampir',
        message: 'Foto berhasil diproses secara otomatis.',
      });
    } catch (err) {
      console.error('Gagal memproses foto:', err);
      showToast({
        type: 'error',
        title: 'Gagal Membaca Foto',
        message: 'Format foto tidak didukung atau ukuran terlalu besar.',
      });
    } finally {
      setCompressingFoto(false);
    }
  };

  const handleClearImage = () => {
    setFormIzinFoto('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit pengajuan izin dari orang tua
  const handleSubmitIzin = async () => {
    if (!parentSiswa?.id) {
      showToast({ type: 'error', message: 'Data siswa ananda belum terhubung.' });
      return;
    }
    if (!formIzinAlasan.trim()) {
      showToast({ type: 'error', message: 'Keterangan atau alasan izin wajib diisi.' });
      return;
    }

    setSubmittingIzin(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Sesi autentikasi telah berakhir.');

      const res = await fetch('/api/pengajuan-izin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          siswa_id: parentSiswa.id,
          tanggal: formIzinTanggal,
          status: formIzinStatus,
          alasan: formIzinAlasan.trim(),
          foto_url: formIzinFoto || null,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Gagal mengirim pengajuan izin.');

      showToast({
        type: 'success',
        title: 'Surat Izin Terkirim',
        message: `Surat izin ${formIzinStatus === 'S' ? 'Sakit' : 'Izin'} untuk ananda berhasil dikirim ke wali kelas dan langsung tercatat di presensi.`,
      });

      setModalIzinOpen(false);
      setFormIzinAlasan('');
      setFormIzinFoto('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reload parent records
      const startDay = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDay = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

      const { data: recs } = await supabase
        .from('kehadiran')
        .select('*')
        .eq('siswa_id', parentSiswa.id)
        .gte('tanggal', startDay)
        .lte('tanggal', endDay)
        .order('tanggal', { ascending: false });

      const enrichedRecs = (recs || []).map((r: any) => {
        let parsedKet: any = null;
        if (r.keterangan && r.keterangan.startsWith('{') && r.keterangan.endsWith('}')) {
          try {
            parsedKet = JSON.parse(r.keterangan);
          } catch {}
        }
        return {
          ...r,
          parsedKet,
        };
      });
      setParentRecords(enrichedRecs);
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Gagal mengirim izin.' });
    } finally {
      setSubmittingIzin(false);
    }
  };

  // Daily Handler: Status change
  const handleDailyStatusChange = (id: string, newStatus: 'H' | 'S' | 'I' | 'A') => {
    setDailyStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
    setSavedSuccess(false);
  };

  // Daily Handler: Mark all present
  const markAllHadir = () => {
    setDailyStudents((prev) => prev.map((s) => ({ ...s, status: 'H' })));
    setSavedSuccess(false);
    showToast({ type: 'info', message: 'Semua siswa ditandai Hadir (H).' });
  };

  // Daily Handler: Save attendance to Supabase
  const handleSaveDaily = async () => {
    setSavingDaily(true);
    try {
      // Upsert records into `kehadiran`
      const upsertRows = dailyStudents.map((s) => ({
        siswa_id: s.id.startsWith('s-') ? null : s.id, // Only send valid uuid if real
        kelas_id: selectedKelasId.startsWith('k-') ? null : selectedKelasId,
        tanggal: selectedDate,
        status: s.status,
        keterangan: s.izinInfo ? JSON.stringify(s.izinInfo) : null,
      }));

      // Try upserting to Supabase if valid UUIDs exist
      if (upsertRows.some((r) => r.siswa_id && r.kelas_id)) {
        const validRows = upsertRows.filter((r) => r.siswa_id && r.kelas_id);
        const { error } = await supabase.from('kehadiran').upsert(validRows, {
          onConflict: 'siswa_id,tanggal',
        });
        if (error) console.warn('Supabase upsert warning:', error);
      }

      setSavedSuccess(true);
      showToast({
        type: 'success',
        title: 'Presensi Tersimpan',
        message: `Data presensi ${dailyStudents.length} siswa kelas ${currentKelasObj.nama_kelas} tanggal ${selectedDate} berhasil disimpan.`,
      });
    } catch (err: any) {
      console.error(err);
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: 'Terjadi kesalahan saat menyimpan presensi ke database.',
      });
    } finally {
      setSavingDaily(false);
    }
  };

  // Export Excel (.xlsx)
  const handleExportExcel = () => {
    if (monthlyRecapRows.length === 0) {
      showToast({ type: 'warning', message: 'Tidak ada data presensi untuk diekspor.' });
      return;
    }

    const titleRow = [`REKAPITULASI KEHADIRAN SISWA BULANAN`];
    const subTitle1 = [`Sekolah: UPT SD Negeri Latsari 2 Bancar`];
    const subTitle2 = [`Kelas: ${currentKelasObj.nama_kelas} · Periode: ${monthLabel} ${selectedYear}`];
    const emptyRow: any[] = [];

    const headers = [
      'No',
      'NIS/NISN',
      'Nama Lengkap',
      'L/P',
      'Hadir (H)',
      'Sakit (S)',
      'Izin (I)',
      'Alpha (A)',
      'Hari Efektif',
      'Persentase (%)',
      'Keterangan',
    ];

    const dataRows = monthlyRecapRows.map((row, idx) => [
      idx + 1,
      row.nis,
      row.nama,
      row.jk || 'L',
      row.totalH,
      row.totalS,
      row.totalI,
      row.totalA,
      row.totalEfektif,
      `${row.persentase}%`,
      row.persentase >= 90 ? 'Sangat Baik' : row.persentase >= 75 ? 'Cukup' : 'Perlu Pembinaan',
    ]);

    const summaryRow = [
      '',
      '',
      'RATA-RATA KELAS',
      '',
      classKPIs.sumH,
      classKPIs.sumS,
      classKPIs.sumI,
      classKPIs.sumA,
      '',
      `${classKPIs.avgPersen}%`,
      classKPIs.avgPersen >= 90 ? 'Sangat Baik' : 'Perlu Perhatian',
    ];

    const worksheetData = [
      titleRow,
      subTitle1,
      subTitle2,
      emptyRow,
      headers,
      ...dataRows,
      emptyRow,
      summaryRow,
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Presensi');

    // Auto-width columns
    ws['!cols'] = [
      { wch: 5 },
      { wch: 14 },
      { wch: 28 },
      { wch: 6 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 14 },
      { wch: 18 },
    ];

    const cleanClassName = currentKelasObj.nama_kelas.replace(/\s+/g, '_');
    const fileName = `Rekap_Kehadiran_${cleanClassName}_${monthLabel}_${selectedYear}.xlsx`;
    XLSX.writeFile(wb, fileName);

    showToast({
      type: 'success',
      title: 'Ekspor Berhasil',
      message: `File ${fileName} berhasil diunduh!`,
    });
  };

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  // Today Date String
  const todayStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // Daily Counts
  const dailyCounts = dailyStudents.reduce(
    (acc, cur) => {
      acc[cur.status] = (acc[cur.status] || 0) + 1;
      return acc;
    },
    { H: 0, S: 0, I: 0, A: 0 } as Record<string, number>
  );

  return (
    <AppShell
      role={role}
      pageTitle={
        isOrangTua
          ? 'Kehadiran Ananda'
          : activeTab === 'rekap'
          ? 'Rekap Kehadiran Bulanan Siswa'
          : 'Absensi Kehadiran Siswa'
      }
      pageSubtitle={
        isOrangTua
          ? parentSiswa
            ? `Rekapitulasi presensi harian ananda ${parentSiswa.nama_lengkap} (${parentSiswa.kelas?.nama_kelas || 'Kelas'})`
            : 'Rekapitulasi presensi harian ananda'
          : kelasList.length === 0
          ? loadingKelas
            ? 'Memuat data kelas...'
            : 'Belum ada kelas yang ditugaskan'
          : `${currentKelasObj.nama_kelas} · ${dailyStudents.length} Siswa Terdaftar · T.A 2026/2027`
      }
    >
      <div className="space-y-6">
        {/* ROLE GURU & ADMIN: TAB NAVIGATION */}
        {!isOrangTua && (
          <div className="flex items-center justify-between gap-3 border-b border-[#DDD8CE] pb-3 print:hidden">
            <div className="flex items-center gap-2 bg-[#FAF8F2] p-1.5 rounded-2xl border border-[#DDD8CE]">
              <button
                onClick={() => setActiveTab('harian')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  activeTab === 'harian'
                    ? 'bg-[#C0392B] text-white shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-white/60'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span>Absensi Harian</span>
              </button>
              <button
                onClick={() => setActiveTab('rekap')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  activeTab === 'rekap'
                    ? 'bg-[#C0392B] text-white shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-white/60'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Rekap Bulanan per Kelas</span>
              </button>
            </div>

            {/* Quick Class Badge in Top Bar */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#6B6B6B]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                Kelas Aktif: <strong className="text-[#1A1A1A]">{currentKelasObj.nama_kelas}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Banner Khusus Kepala Sekolah */}
        {isKepalaSekolah && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 shadow-xs animate-in fade-in duration-200">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs">Mode Pengawasan Presensi Kepala Sekolah</h4>
              <p className="text-[11px] text-amber-800 leading-snug">
                Anda dapat memantau presensi harian dan rekap bulanan seluruh rombel kelas tanpa batasan wali kelas (mode pemantauan eksekutif).
              </p>
            </div>
          </div>
        )}

        {/* ORANG TUA VIEW (100% REAL DATABASE DATA) */}
        {isOrangTua ? (
          <ParentKehadiranView
            parentSiswa={parentSiswa}
            todayStr={todayStr}
            monthLabel={monthLabel}
            selectedYear={selectedYear}
            parentStats={parentStats}
            parentLoading={parentLoading}
            parentRecords={parentRecords}
            onOpenIzinModal={() => {
              setFormIzinTanggal(getTodayDateString());
              setFormIzinStatus('S');
              setFormIzinAlasan('');
              setFormIzinFoto('');
              setModalIzinOpen(true);
            }}
            onPreviewFoto={(url) => setPreviewFotoUrl(url)}
          />
        ) : activeTab === 'harian' ? (
          /* TAB 1: ABSENSI HARIAN */
          <div className="space-y-6">
            {/* Warning if teacher has no class assigned */}
            {!loadingKelas && kelasList.length === 0 && role === 'guru' && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs">
                <p className="font-bold">Perhatian: Anda belum ditugaskan sebagai Wali Kelas</p>
                <p className="mt-0.5 text-amber-800">
                  Presensi absensi harian dicatat oleh masing-masing Wali Kelas. Jika Anda merupakan wali kelas, silakan hubungi Administrator Sekolah untuk penugasan rombel kelas Anda.
                </p>
              </div>
            )}

            {/* Filter Bar Harian */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#DDD8CE] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Pilih Kelas */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-1">
                    {role === 'guru' ? 'Kelas Anda' : 'Pilih Kelas'}
                  </label>
                  {role === 'guru' && kelasList.length <= 1 ? (
                    <div className="px-3.5 py-2 rounded-xl border border-[#DDD8CE] bg-[#FAF8F2] text-xs font-bold text-[#1A1A1A]">
                      {currentKelasObj.nama_kelas}
                    </div>
                  ) : (
                    <select
                      value={selectedKelasId}
                      onChange={(e) => setSelectedKelasId(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-[#DDD8CE] bg-white text-xs font-bold text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C0392B]"
                    >
                      {kelasList.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama_kelas}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Pilih Tanggal */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-1">
                    Tanggal Presensi
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-[#DDD8CE] bg-white text-xs font-bold text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C0392B]"
                  />
                </div>
              </div>

              {/* Status Counter Grid */}
              <div className="grid grid-cols-4 gap-2 shrink-0 text-center text-xs">
                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-200 min-w-[64px]">
                  <span className="block font-serif font-bold text-base">{dailyCounts.H}</span>
                  <span className="text-[9px] uppercase font-bold text-emerald-700">Hadir</span>
                </div>
                <div className="bg-amber-50 text-amber-800 p-2.5 rounded-xl border border-amber-200 min-w-[64px]">
                  <span className="block font-serif font-bold text-base">{dailyCounts.S}</span>
                  <span className="text-[9px] uppercase font-bold text-amber-700">Sakit</span>
                </div>
                <div className="bg-blue-50 text-blue-800 p-2.5 rounded-xl border border-blue-200 min-w-[64px]">
                  <span className="block font-serif font-bold text-base">{dailyCounts.I}</span>
                  <span className="text-[9px] uppercase font-bold text-blue-700">Izin</span>
                </div>
                <div className="bg-[#FDEDEC] text-[#922B21] p-2.5 rounded-xl border border-[#F1948A] min-w-[64px]">
                  <span className="block font-serif font-bold text-base">{dailyCounts.A}</span>
                  <span className="text-[9px] uppercase font-bold text-[#922B21]">Alpha</span>
                </div>
              </div>
            </div>

            {/* Success Alert */}
            {savedSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center gap-2.5 text-xs text-emerald-800 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-medium">
                  Data absensi {currentKelasObj.nama_kelas} tanggal {selectedDate} berhasil disimpan dan disinkronkan ke sistem orang tua!
                </span>
              </div>
            )}

            {/* Banner Notifikasi Pengajuan Izin Wali Murid */}
            {parentIzinCount > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                    <Bell className="w-5 h-5 text-amber-800" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs flex items-center gap-2">
                      <span>Pemberitahuan Izin Hari Ini ({parentIzinCount} Siswa)</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
                        Wali Murid
                      </span>
                    </h4>
                    <p className="text-[11px] text-amber-800 leading-snug mt-0.5">
                      Wali murid telah mengirimkan pemberitahuan izin/sakit beserta surat/foto bukti untuk tanggal {selectedDate}. Status absensi siswa di bawah otomatis disesuaikan (Sakit / Izin).
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-amber-900 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 self-start sm:self-center shrink-0">
                  Periksa baris siswa di bawah
                </span>
              </div>
            )}

            {/* Table of Daily Students */}
            <div className="bg-white rounded-2xl shadow-xs border border-[#DDD8CE] overflow-hidden">
              <div className="p-4 bg-[#FAF8F2] border-b border-[#DDD8CE] flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#C0392B]" />
                  <span>Daftar Siswa {currentKelasObj.nama_kelas} ({dailyStudents.length} Siswa)</span>
                </span>
                {!isKepalaSekolah && (
                  <button
                    onClick={markAllHadir}
                    className="text-xs font-bold text-[#922B21] hover:underline cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-[#DDD8CE] shadow-xs active:scale-95"
                  >
                    ✓ Tandai Semua Hadir
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#F5F0E8]">
                {dailyStudents.map((student, idx) => (
                  <div
                    key={student.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#FAF8F2] transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-xs font-mono font-bold text-[#6B6B6B]">
                        {idx + 1}.
                      </span>
                      <div className="truncate">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-semibold text-[#1A1A1A] truncate">
                            {student.nama}
                          </span>
                          {student.izinInfo && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Bell className="w-3 h-3 text-amber-700" />
                              <span>Diajukan Wali Murid</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="text-[11px] text-[#6B6B6B]">
                            NIS: {student.nis} · JK: {student.jk || 'L'} · {currentKelasObj.nama_kelas}
                          </span>
                          {student.izinInfo && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedIzinStudent(student);
                                setModalDetailIzinOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#922B21] hover:underline cursor-pointer bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-md border border-red-200 transition"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Lihat Surat & Foto Bukti</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Toggle Buttons [H][S][I][A] */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(['H', 'S', 'I', 'A'] as const).map((st) => {
                        const isSelected = student.status === st;
                        const colorMap = {
                          H: isSelected
                            ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-300'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100',
                          S: isSelected
                            ? 'bg-amber-500 text-white font-bold ring-2 ring-amber-300'
                            : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100',
                          I: isSelected
                            ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-300'
                            : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100',
                          A: isSelected
                            ? 'bg-[#922B21] text-white font-bold ring-2 ring-red-300'
                            : 'bg-[#FDEDEC] text-[#922B21] border border-[#F1948A] hover:bg-[#FADBD8]',
                        };
                        return (
                          <button
                            key={st}
                            disabled={isKepalaSekolah}
                            onClick={() => handleDailyStatusChange(student.id, st)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition active:scale-95 ${colorMap[st]} ${
                              isKepalaSekolah ? 'cursor-default opacity-85' : 'cursor-pointer'
                            }`}
                            title={
                              st === 'H'
                                ? 'Hadir'
                                : st === 'S'
                                ? 'Sakit'
                                : st === 'I'
                                ? 'Izin'
                                : 'Alpha'
                            }
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Save Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-[#DDD8CE] shadow-xs">
              <p className="text-xs text-[#6B6B6B]">
                Keterangan: <span className="font-bold text-emerald-700">H = Hadir</span> ·{' '}
                <span className="font-bold text-amber-700">S = Sakit</span> ·{' '}
                <span className="font-bold text-blue-700">I = Izin</span> ·{' '}
                <span className="font-bold text-[#922B21]">A = Alpha</span>
              </p>

              {isKepalaSekolah ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-semibold shadow-xs">
                  <Award className="w-4 h-4 text-amber-700" />
                  <span>Mode Pengawasan Kepala Sekolah (Read-Only)</span>
                </span>
              ) : (
                <button
                  onClick={handleSaveDaily}
                  disabled={savingDaily}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingDaily ? 'Menyimpan Absensi...' : `Simpan Absensi ${selectedDate} →`}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* TAB 2: REKAP KEHADIRAN BULANAN PER KELAS */
          <div className="space-y-6">
            {/* Filter Control Header Card */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#DDD8CE] flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
              {/* Dropdown Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Pilih Kelas */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-1">
                    {role === 'guru' ? 'Kelas Anda' : 'Kelas'}
                  </label>
                  {role === 'guru' && kelasList.length <= 1 ? (
                    <div className="px-3.5 py-2 rounded-xl border border-[#DDD8CE] bg-[#FAF8F2] text-xs font-bold text-[#1A1A1A]">
                      {currentKelasObj.nama_kelas}
                    </div>
                  ) : (
                    <select
                      value={selectedKelasId}
                      onChange={(e) => setSelectedKelasId(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-[#DDD8CE] bg-white text-xs font-bold text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C0392B]"
                    >
                      {kelasList.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama_kelas}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Pilih Bulan */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-1">
                    Bulan
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="px-3.5 py-2 rounded-xl border border-[#DDD8CE] bg-white text-xs font-bold text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C0392B]"
                  >
                    {BULAN_LIST.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pilih Tahun */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-1">
                    Tahun
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3.5 py-2 rounded-xl border border-[#DDD8CE] bg-white text-xs font-bold text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C0392B]"
                  >
                    {[2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-1">
                    Mode Tampilan
                  </label>
                  <div className="flex items-center bg-[#FAF8F2] p-1 rounded-xl border border-[#DDD8CE]">
                    <button
                      onClick={() => setRecapViewMode('summary')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        recapViewMode === 'summary'
                          ? 'bg-white text-[#C0392B] shadow-xs'
                          : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                      }`}
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span>Ringkasan</span>
                    </button>
                    <button
                      onClick={() => setRecapViewMode('matrix')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        recapViewMode === 'matrix'
                          ? 'bg-white text-[#C0392B] shadow-xs'
                          : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                      }`}
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Grid 1–31</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Export Excel & Cetak PDF */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={handleExportExcel}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Ekspor Excel (.xlsx)</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F2] text-[#1A1A1A] border border-[#DDD8CE] font-bold text-xs shadow-xs transition active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#6B6B6B]" />
                  <span>Cetak Laporan</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:hidden">
              {/* Total Siswa */}
              <div className="bg-white p-4 rounded-2xl border border-[#DDD8CE] shadow-xs">
                <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
                  Total Siswa
                </span>
                <span className="text-xl font-serif font-bold text-[#1A1A1A] mt-1 block">
                  {classKPIs.totalSiswa} Siswa
                </span>
                <span className="text-[10px] text-[#6B6B6B] mt-0.5 block">
                  {currentKelasObj.nama_kelas}
                </span>
              </div>

              {/* Rata-rata Kehadiran */}
              <div className="bg-white p-4 rounded-2xl border border-[#DDD8CE] shadow-xs">
                <span className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
                  Kehadiran Kelas
                </span>
                <span className="text-xl font-serif font-bold text-emerald-700 mt-1 block">
                  {classKPIs.avgPersen}%
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                  {classKPIs.avgPersen >= 90 ? 'Sangat Disiplin' : 'Cukup Baik'}
                </span>
              </div>

              {/* Akumulasi Hadir */}
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Total Hadir (H)
                </span>
                <span className="text-xl font-serif font-bold text-emerald-800 mt-1 block">
                  {classKPIs.sumH}
                </span>
                <span className="text-[10px] text-emerald-700 mt-0.5 block">
                  Presensi kumulatif
                </span>
              </div>

              {/* Akumulasi Sakit */}
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  Total Sakit (S)
                </span>
                <span className="text-xl font-serif font-bold text-amber-800 mt-1 block">
                  {classKPIs.sumS}
                </span>
                <span className="text-[10px] text-amber-700 mt-0.5 block">
                  Ada surat/catatan
                </span>
              </div>

              {/* Akumulasi Izin */}
              <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                  Total Izin (I)
                </span>
                <span className="text-xl font-serif font-bold text-blue-800 mt-1 block">
                  {classKPIs.sumI}
                </span>
                <span className="text-[10px] text-blue-700 mt-0.5 block">
                  Izin keluarga/acara
                </span>
              </div>

              {/* Akumulasi Alpha */}
              <div className="bg-[#FDEDEC] p-4 rounded-2xl border border-[#F1948A]">
                <span className="text-[11px] font-bold text-[#922B21] uppercase tracking-wider block">
                  Total Alpha (A)
                </span>
                <span className="text-xl font-serif font-bold text-[#922B21] mt-1 block">
                  {classKPIs.sumA}
                </span>
                <span className="text-[10px] text-[#922B21]/80 mt-0.5 block">
                  Tanpa keterangan
                </span>
              </div>
            </div>

            {/* PRINT-ONLY OFFICIAL HEADER (Hidden on Screen, Visible on Print) */}
            <div className="hidden print:block mb-6 text-center border-b-2 border-black pb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-black">
                Pemerintah Kabupaten Tuban · Dinas Pendidikan
              </h2>
              <h1 className="text-lg font-serif font-bold text-black uppercase">
                UPT SD Negeri Latsari 2 Bancar
              </h1>
              <p className="text-[11px] text-gray-700">
                Jl. Desa Latsari No.190, Kec. Bancar, Kab. Tuban, Jawa Timur · Kode Pos 62354
              </p>
              <div className="mt-3 pt-2 border-t border-black flex items-center justify-between text-xs font-bold">
                <span>REKAPITULASI KEHADIRAN SISWA BULANAN</span>
                <span>KELAS: {currentKelasObj.nama_kelas.toUpperCase()}</span>
                <span>PERIODE: {monthLabel.toUpperCase()} {selectedYear}</span>
              </div>
            </div>

            {/* RECAP TABLE CARD */}
            <div className="bg-white rounded-2xl shadow-xs border border-[#DDD8CE] overflow-hidden">
              {/* Header Bar with Search Filter */}
              <div className="p-4 bg-[#FAF8F2] border-b border-[#DDD8CE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#C0392B]" />
                  <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                    Rekapitulasi {currentKelasObj.nama_kelas} · {monthLabel} {selectedYear} ({filteredRecapRows.length} Siswa)
                  </span>
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari siswa atau NIS..."
                    value={recapSearchTerm}
                    onChange={(e) => setRecapSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#DDD8CE] bg-white text-xs text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C0392B]"
                  />
                </div>
              </div>

              {/* Table Content */}
              {recapViewMode === 'summary' ? (
                /* SUMMARY VIEW (Clean Compact Table) */
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#FAF8F2] text-[#6B6B6B] uppercase font-bold border-b border-[#DDD8CE]">
                      <tr>
                        <th className="py-3 px-3 w-12 text-center">No</th>
                        <th className="py-3 px-3 w-28">NIS</th>
                        <th className="py-3 px-4">Nama Lengkap Siswa</th>
                        <th className="py-3 px-3 text-center w-16">L/P</th>
                        <th className="py-3 px-3 text-center w-20 bg-emerald-50/50 text-emerald-800">
                          Hadir (H)
                        </th>
                        <th className="py-3 px-3 text-center w-20 bg-amber-50/50 text-amber-800">
                          Sakit (S)
                        </th>
                        <th className="py-3 px-3 text-center w-20 bg-blue-50/50 text-blue-800">
                          Izin (I)
                        </th>
                        <th className="py-3 px-3 text-center w-20 bg-red-50/50 text-[#922B21]">
                          Alpha (A)
                        </th>
                        <th className="py-3 px-3 text-center w-24">Efektif</th>
                        <th className="py-3 px-4 text-center w-28">% Kehadiran</th>
                        <th className="py-3 px-4 text-center w-32">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F0E8]">
                      {filteredRecapRows.map((row) => (
                        <tr key={row.id} className="hover:bg-[#FAF8F2] transition">
                          <td className="py-3 px-3 text-center font-mono font-bold text-[#6B6B6B]">
                            {row.no}.
                          </td>
                          <td className="py-3 px-3 font-mono text-[#6B6B6B]">{row.nis}</td>
                          <td className="py-3 px-4 font-semibold text-[#1A1A1A]">{row.nama}</td>
                          <td className="py-3 px-3 text-center font-bold text-[#6B6B6B]">
                            {row.jk || 'L'}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-emerald-800 bg-emerald-50/30">
                            {row.totalH}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-amber-800 bg-amber-50/30">
                            {row.totalS}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-blue-800 bg-blue-50/30">
                            {row.totalI}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-[#922B21] bg-red-50/30">
                            {row.totalA}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-[#6B6B6B]">
                            {row.totalEfektif} Hari
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block font-mono font-bold px-2.5 py-0.5 rounded-full text-[11px] border ${
                                row.persentase >= 90
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : row.persentase >= 75
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-red-100 text-[#922B21] border-red-300'
                              }`}
                            >
                              {row.persentase}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-[11px] font-bold ${
                                row.persentase >= 90
                                  ? 'text-emerald-700'
                                  : row.persentase >= 75
                                  ? 'text-amber-700'
                                  : 'text-[#922B21]'
                              }`}
                            >
                              {row.persentase >= 90
                                ? 'Sangat Baik'
                                : row.persentase >= 75
                                ? 'Cukup'
                                : 'Perlu Pembinaan'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#FAF8F2] border-t-2 border-[#DDD8CE] font-bold text-[#1A1A1A]">
                      <tr>
                        <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider">
                          Akumulasi / Rata-rata Kelas:
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-emerald-800 bg-emerald-100/50">
                          {classKPIs.sumH}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-amber-800 bg-amber-100/50">
                          {classKPIs.sumS}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-blue-800 bg-blue-100/50">
                          {classKPIs.sumI}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-[#922B21] bg-red-100/50">
                          {classKPIs.sumA}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-[#6B6B6B]">
                          -
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-800">
                          {classKPIs.avgPersen}%
                        </td>
                        <td className="py-3 px-4 text-center text-emerald-800">
                          {classKPIs.avgPersen >= 90 ? 'Disiplin Tinggi' : 'Cukup'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                /* MATRIX VIEW (Date Grid 1..31) */
                <div className="overflow-x-auto max-w-full">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead className="bg-[#FAF8F2] text-[#6B6B6B] uppercase font-bold border-b border-[#DDD8CE]">
                      <tr>
                        <th className="py-2.5 px-2 w-10 text-center border-r border-[#DDD8CE] sticky left-0 bg-[#FAF8F2] z-10">
                          No
                        </th>
                        <th className="py-2.5 px-3 min-w-[160px] border-r border-[#DDD8CE] sticky left-10 bg-[#FAF8F2] z-10">
                          Nama Siswa
                        </th>
                        {/* Day numbers 1..daysInMonth */}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                          const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                          const isSunday = dateObj.getDay() === 0;
                          return (
                            <th
                              key={day}
                              className={`py-2 px-1 text-center w-7 border-r border-[#DDD8CE] font-mono text-[10px] ${
                                isSunday ? 'bg-red-50 text-red-700 font-bold' : ''
                              }`}
                              title={`${day} ${monthLabel} ${selectedYear}`}
                            >
                              {day}
                            </th>
                          );
                        })}
                        {/* Summary Columns */}
                        <th className="py-2.5 px-2 text-center w-8 bg-emerald-50 text-emerald-800 border-r border-[#DDD8CE]">
                          H
                        </th>
                        <th className="py-2.5 px-2 text-center w-8 bg-amber-50 text-amber-800 border-r border-[#DDD8CE]">
                          S
                        </th>
                        <th className="py-2.5 px-2 text-center w-8 bg-blue-50 text-blue-800 border-r border-[#DDD8CE]">
                          I
                        </th>
                        <th className="py-2.5 px-2 text-center w-8 bg-red-50 text-[#922B21] border-r border-[#DDD8CE]">
                          A
                        </th>
                        <th className="py-2.5 px-2 text-center w-12 bg-gray-50 text-[#1A1A1A]">
                          %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F0E8]">
                      {filteredRecapRows.map((row) => (
                        <tr key={row.id} className="hover:bg-[#FAF8F2] transition">
                          <td className="py-2 px-2 text-center font-mono font-bold text-[#6B6B6B] border-r border-[#F5F0E8] sticky left-0 bg-white z-10">
                            {row.no}.
                          </td>
                          <td className="py-2 px-3 font-semibold text-[#1A1A1A] border-r border-[#F5F0E8] sticky left-10 bg-white z-10 truncate max-w-[160px]">
                            {row.nama}
                          </td>
                          {/* Day Statuses */}
                          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                            const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                            const isSunday = dateObj.getDay() === 0;
                            const st = row.dailyStatus[day];

                            let badge = (
                              <span className="text-gray-300 font-mono">-</span>
                            );

                            if (isSunday) {
                              badge = (
                                <span className="text-red-400 font-bold text-[9px]">M</span>
                              );
                            } else if (st === 'H') {
                              badge = (
                                <span className="text-emerald-700 font-bold text-[10px]">H</span>
                              );
                            } else if (st === 'S') {
                              badge = (
                                <span className="text-amber-700 font-bold text-[10px] bg-amber-100 px-1 rounded-sm">S</span>
                              );
                            } else if (st === 'I') {
                              badge = (
                                <span className="text-blue-700 font-bold text-[10px] bg-blue-100 px-1 rounded-sm">I</span>
                              );
                            } else if (st === 'A') {
                              badge = (
                                <span className="text-white font-bold text-[10px] bg-[#922B21] px-1 rounded-sm">A</span>
                              );
                            }

                            return (
                              <td
                                key={day}
                                className={`py-1.5 px-0.5 text-center border-r border-[#F5F0E8] ${
                                  isSunday ? 'bg-red-50/40' : ''
                                }`}
                              >
                                {badge}
                              </td>
                            );
                          })}
                          {/* Summary numbers */}
                          <td className="py-2 px-1 text-center font-mono font-bold text-emerald-800 bg-emerald-50/40 border-r border-[#F5F0E8]">
                            {row.totalH}
                          </td>
                          <td className="py-2 px-1 text-center font-mono font-bold text-amber-800 bg-amber-50/40 border-r border-[#F5F0E8]">
                            {row.totalS}
                          </td>
                          <td className="py-2 px-1 text-center font-mono font-bold text-blue-800 bg-blue-50/40 border-r border-[#F5F0E8]">
                            {row.totalI}
                          </td>
                          <td className="py-2 px-1 text-center font-mono font-bold text-[#922B21] bg-red-50/40 border-r border-[#F5F0E8]">
                            {row.totalA}
                          </td>
                          <td className="py-2 px-1 text-center font-mono font-bold text-[#1A1A1A]">
                            {row.persentase}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* PRINT-ONLY SIGNATURE SECTION */}
            <div className="hidden print:grid grid-cols-2 gap-8 mt-12 text-xs text-black">
              <div className="text-center">
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala UPT SD Negeri Latsari 2 Bancar</p>
                <div className="h-20"></div>
                <p className="font-bold underline">Santoso ,S.Pd.,M.Pd.</p>
                <p>NIP. 19850612 201001 1 015</p>
              </div>
              <div className="text-center">
                <p>Bancar, {todayStr}</p>
                <p className="font-bold">Wali Kelas {currentKelasObj.nama_kelas}</p>
                <div className="h-20"></div>
                <p className="font-bold underline">
                  {currentKelasObj.wali_kelas?.nama || `Wali Kelas ${currentKelasObj.nama_kelas}`}
                </p>
                <p>{(currentKelasObj.wali_kelas as any)?.telepon ? `Kontak: ${(currentKelasObj.wali_kelas as any).telepon}` : 'NIP. -'}</p>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: FORMULIR PENGAJUAN IZIN / SAKIT (PORTAL ORANG TUA) */}
        {modalIzinOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#DDD8CE] relative max-h-[92vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setModalIzinOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FAF8F2] transition cursor-pointer"
                title="Tutup Formulir"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 rounded-2xl bg-[#FDEDEC] text-[#922B21] border border-[#F1948A]">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                    Ajukan Izin / Sakit Ananda
                  </h3>
                  <p className="text-xs text-[#6B6B6B]">
                    UPT SD Negeri Latsari 2 Bancar · Presensi Digital
                  </p>
                </div>
              </div>

              {/* Info Ananda Card */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#DDD8CE] mb-5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6B6B6B]">Nama Siswa:</span>
                  <span className="font-bold text-[#1A1A1A] text-right">
                    {parentSiswa?.nama_lengkap || 'Ananda'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-[#6B6B6B]">Kelas & NISN:</span>
                  <span className="font-semibold text-[#1A1A1A] text-right">
                    {parentSiswa?.kelas?.nama_kelas || 'Kelas'} · {parentSiswa?.nisn || parentSiswa?.nis || '-'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmitIzin} className="space-y-4 text-xs">
                {/* Tanggal Izin */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                    Tanggal Izin / Sakit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formIzinTanggal}
                    onChange={(e) => setFormIzinTanggal(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-xs font-bold text-[#1A1A1A] focus:outline-hidden focus:ring-2 focus:ring-[#C0392B]"
                  />
                </div>

                {/* Status: Sakit vs Izin */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                    Jenis Ketidakhadiran <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFormIzinStatus('S')}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                        formIzinStatus === 'S'
                          ? 'bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-300'
                          : 'bg-white border-[#DDD8CE] text-[#6B6B6B] hover:bg-[#FAF8F2]'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 border-amber-600">
                        {formIzinStatus === 'S' && (
                          <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                        )}
                      </span>
                      <div>
                        <span className="font-bold text-xs block text-amber-900">Sakit (S)</span>
                        <span className="text-[10px] text-amber-800">Kondisi kesehatan/rawat</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormIzinStatus('I')}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                        formIzinStatus === 'I'
                          ? 'bg-blue-50 border-blue-400 text-blue-950 ring-2 ring-blue-300'
                          : 'bg-white border-[#DDD8CE] text-[#6B6B6B] hover:bg-[#FAF8F2]'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 border-blue-600">
                        {formIzinStatus === 'I' && (
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        )}
                      </span>
                      <div>
                        <span className="font-bold text-xs block text-blue-900">Izin (I)</span>
                        <span className="text-[10px] text-blue-800">Acara keluarga / mendesak</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Alasan / Keterangan */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                    Alasan Lengkap <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formIzinAlasan}
                    onChange={(e) => setFormIzinAlasan(e.target.value)}
                    placeholder={
                      formIzinStatus === 'S'
                        ? 'Contoh: Ananda demam tinggi sejak semalam dan flu berat, disarankan dokter istirahat di rumah selama 2 hari...'
                        : 'Contoh: Ananda ada acara keluarga menghadiri pernikahan saudara di luar kota...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-xs text-[#1A1A1A] placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#C0392B]"
                  />
                </div>

                {/* Upload Foto Surat Dokter / Bukti Fisik */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                    Foto Surat Dokter / Bukti Pendukung <span className="text-gray-400 font-normal">(Sangat Disarankan)</span>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="foto-surat-izin-input"
                  />

                  {formIzinFoto ? (
                    <div className="relative rounded-2xl border border-[#DDD8CE] bg-[#FAF8F2] p-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={formIzinFoto}
                          alt="Pratinjau Surat Dokter"
                          className="w-14 h-14 object-cover rounded-xl border border-[#DDD8CE] shrink-0 cursor-pointer"
                          onClick={() => setPreviewFotoUrl(formIzinFoto)}
                          title="Klik untuk perbesar foto"
                        />
                        <div className="truncate">
                          <span className="font-bold text-[#1A1A1A] block truncate">
                            Foto Bukti Terlampir
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            ✓ Siap dikirim ke wali kelas
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition cursor-pointer shrink-0"
                        title="Hapus foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="foto-surat-izin-input"
                      className={`w-full p-4 rounded-2xl border-2 border-dashed border-[#DDD8CE] bg-[#FAF8F2] hover:bg-white text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                        compressingFoto ? 'opacity-60 pointer-events-none' : ''
                      }`}
                    >
                      <Camera className="w-6 h-6 text-[#922B21]" />
                      <span className="font-bold text-xs text-[#1A1A1A]">
                        {compressingFoto ? 'Mengompresi Foto...' : 'Ambil Foto Surat Dokter / Unggah Berkas'}
                      </span>
                      <span className="text-[10px] text-[#6B6B6B]">
                        Format JPG, PNG (Otomatis dioptimalkan)
                      </span>
                    </label>
                  )}
                </div>

                <div className="pt-3 border-t border-[#F5F0E8] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalIzinOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-[#6B6B6B] hover:text-[#1A1A1A] font-bold text-xs transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingIzin || compressingFoto}
                    className="px-5 py-2.5 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer disabled:opacity-60 flex items-center gap-2"
                  >
                    {submittingIzin ? 'Mengirim Surat Izin...' : 'Kirim Pengajuan Izin →'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: INSPEKTOR DETAIL IZIN DARI WALI MURID (GURU / ADMIN) */}
        {modalDetailIzinOpen && selectedIzinStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#DDD8CE] relative max-h-[92vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setModalDetailIzinOpen(false);
                  setSelectedIzinStudent(null);
                }}
                className="absolute top-5 right-5 p-2 rounded-full text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FAF8F2] transition cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-800 border border-amber-300">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                    Surat / Keterangan Izin Wali Murid
                  </h3>
                  <p className="text-xs text-[#6B6B6B]">
                    Diajukan melalui Portal Orang Tua SD Negeri Latsari 2 Bancar
                  </p>
                </div>
              </div>

              {/* Detail Siswa & Status */}
              <div className="space-y-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#DDD8CE] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B6B6B]">Nama Siswa:</span>
                    <span className="font-bold text-[#1A1A1A]">{selectedIzinStudent.nama}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B6B6B]">NIS / Kelas:</span>
                    <span className="font-semibold text-[#1A1A1A]">
                      {selectedIzinStudent.nis} · {currentKelasObj.nama_kelas}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B6B6B]">Tanggal Presensi:</span>
                    <span className="font-bold text-[#1A1A1A]">{selectedDate}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#DDD8CE]/60">
                    <span className="text-[#6B6B6B]">Status Izin:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                        selectedIzinStudent.status === 'S'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}
                    >
                      {selectedIzinStudent.izinInfo?.status_label || (selectedIzinStudent.status === 'S' ? 'Sakit' : 'Izin')}
                    </span>
                  </div>
                </div>

                {/* Alasan Lengkap */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-1">
                    Alasan / Keterangan Wali Murid:
                  </label>
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-[#1A1A1A] text-xs leading-relaxed whitespace-pre-wrap">
                    {selectedIzinStudent.izinInfo?.alasan || 'Tidak ada keterangan tambahan.'}
                  </div>
                </div>

                {/* Lampiran Foto */}
                {selectedIzinStudent.izinInfo?.foto_url ? (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-1">
                      Lampiran Foto Surat Dokter / Bukti:
                    </label>
                    <div className="rounded-2xl border border-[#DDD8CE] overflow-hidden bg-[#FAF8F2] p-2">
                      <img
                        src={selectedIzinStudent.izinInfo.foto_url}
                        alt="Surat Dokter"
                        className="w-full max-h-72 object-contain rounded-xl cursor-pointer hover:opacity-95 transition"
                        onClick={() => setPreviewFotoUrl(selectedIzinStudent.izinInfo?.foto_url || null)}
                        title="Klik untuk perbesar gambar"
                      />
                      <p className="text-[10px] text-center text-[#6B6B6B] mt-2">
                        Klik gambar untuk melihat dalam ukuran penuh (Lightbox)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 text-[11px] text-center">
                    Tidak ada lampiran foto surat dokter yang diunggah.
                  </div>
                )}

                <div className="pt-3 border-t border-[#F5F0E8] flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setModalDetailIzinOpen(false);
                      setSelectedIzinStudent(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    Tutup Tinjauan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: LIGHTBOX PREVIEW FOTO */}
        {previewFotoUrl && (
          <div
            onClick={() => setPreviewFotoUrl(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 cursor-zoom-out"
          >
            <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center">
              <button
                type="button"
                onClick={() => setPreviewFotoUrl(null)}
                className="absolute -top-12 right-0 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition cursor-pointer"
                title="Tutup (ESC)"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={previewFotoUrl}
                alt="Lampiran Foto Bukti Penuh"
                className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain border border-white/20"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function KehadiranPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center text-xs text-[#6B6B6B]">
          Memuat Kehadiran...
        </div>
      }
    >
      <KehadiranContent />
    </Suspense>
  );
}
