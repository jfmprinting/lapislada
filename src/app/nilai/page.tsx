'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import AppShell from '@/components/layout/AppShell';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { useNotification } from '@/components/ui/NotificationContext';
import { supabase, Siswa, Kelas, Mapel, Nilai } from '@/lib/supabase';
import {
  Award,
  BookOpen,
  Filter,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  Save,
  TrendingUp,
  Search,
  Sparkles,
  Layers,
  ChevronRight,
  UserCheck,
  Calendar,
  Clock,
  ArrowRight,
  FileSpreadsheet,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Info,
  Check,
  RefreshCw,
} from 'lucide-react';

// Default Jenis Asesmen (fallback if admin has not set custom ones)
const DEFAULT_JENIS_ASESMEN = [
  { id: 'ja-1', nama: 'Formatif (Tujuan Pembelajaran 1)', kategori: 'Formatif', aktif: true },
  { id: 'ja-2', nama: 'Formatif (Tujuan Pembelajaran 2)', kategori: 'Formatif', aktif: true },
  { id: 'ja-3', nama: 'Sumatif Lingkup Materi (Bab 1)', kategori: 'Sumatif', aktif: true },
  { id: 'ja-4', nama: 'Sumatif Lingkup Materi (Bab 2)', kategori: 'Sumatif', aktif: true },
  { id: 'ja-5', nama: 'Sumatif Tengah Semester (STS / UTS)', kategori: 'Sumatif', aktif: true },
  { id: 'ja-6', nama: 'Sumatif Akhir Semester (SAS / PAS)', kategori: 'Sumatif', aktif: true },
];

const JENIS_ASESMEN_STORAGE_KEY = 'lapislada_jenis_asesmen';
const PUBLISHED_ASESMEN_KEY = 'lapislada_published_asesmen_map';
const CATATAN_NILAI_KEY = 'lapislada_catatan_nilai_map';

// Default subjects list with KKM
const DEFAULT_MAPEL: Mapel[] = [
  { id: 'm-pai', nama_mapel: 'Pendidikan Agama & Budi Pekerti', kkm: 75 },
  { id: 'm-pkn', nama_mapel: 'Pendidikan Pancasila', kkm: 75 },
  { id: 'm-indo', nama_mapel: 'Bahasa Indonesia', kkm: 75 },
  { id: 'm-mtk', nama_mapel: 'Matematika', kkm: 70 },
  { id: 'm-ipas', nama_mapel: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', kkm: 75 },
  { id: 'm-pjok', nama_mapel: 'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)', kkm: 75 },
  { id: 'm-seni', nama_mapel: 'Seni dan Budaya', kkm: 75 },
  { id: 'm-jawa', nama_mapel: 'Bahasa Jawa (Mulok)', kkm: 75 },
  { id: 'm-inggris', nama_mapel: 'Bahasa Inggris', kkm: 70 },
];

function NilaiContent() {
  const searchParams = useSearchParams();
  const { showToast } = useNotification();

  // Role detection: orangtua vs guru/admin/kepala_sekolah
  const roleParam = searchParams.get('role');
  const isOrangTua = roleParam === 'orangtua';

  // Tabs for Guru: 'input' (Guru Mapel/Kelas) vs 'leger' (Wali Kelas)
  const [activeTab, setActiveTab] = useState<'input' | 'leger'>('input');

  // Filter States
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>(DEFAULT_MAPEL);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);

  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [selectedMapelId, setSelectedMapelId] = useState<string>('');
  const [selectedJenisAsesmen, setSelectedJenisAsesmen] = useState<string>('Formatif (Tujuan Pembelajaran 1)');
  const [semester, setSemester] = useState<number>(1);
  const [tahunAjaran, setTahunAjaran] = useState<string>('2026/2027');

  // Publication Toggle State
  const [isPublishedForCurrentAsesmen, setIsPublishedForCurrentAsesmen] = useState<boolean>(true);

  // Wali Kelas & Kepala Sekolah restriction
  const [isWaliKelas, setIsWaliKelas] = useState<boolean>(false);
  const [isKepalaSekolah, setIsKepalaSekolah] = useState<boolean>(false);
  const [waliKelasNama, setWaliKelasNama] = useState<string>('');
  const [allowedKelasList, setAllowedKelasList] = useState<Kelas[]>([]);

  // Dynamic Jenis Asesmen from Admin settings
  const [jenisAsesmenList, setJenisAsesmenList] = useState(DEFAULT_JENIS_ASESMEN);

  // Input Grid State: studentId -> { nilai: number | string, catatan: string }
  const [gridScores, setGridScores] = useState<Record<string, { nilai: number | string; catatan: string }>>({});

  // Leger Matrix State: studentId -> { [mapelId]: number }
  const [legerData, setLegerData] = useState<Record<string, Record<string, number>>>({});

  const [loadingGrid, setLoadingGrid] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  // State khusus Orang Tua
  const [parentChild, setParentChild] = useState<Siswa | null>(null);
  const [parentChildGrades, setParentChildGrades] = useState<
    Array<{
      mapelId: string;
      mapelNama: string;
      kkm: number;
      skor: number | null;
      catatan: string;
      hasNilai: boolean;
    }>
  >([]);
  const [loadingOrangTua, setLoadingOrangTua] = useState<boolean>(true);

  // Helper: Asesmen key for storage
  const currentAsesmenKey = useMemo(() => {
    return `${selectedKelasId}_${selectedMapelId}_${selectedJenisAsesmen}_${semester}_${tahunAjaran}`;
  }, [selectedKelasId, selectedMapelId, selectedJenisAsesmen, semester, tahunAjaran]);

  // Load Jenis Asesmen from Supabase Cloud (with localStorage cache fallback)
  useEffect(() => {
    async function loadJenisAsesmen() {
      // 1. Ambil dari cache lokal terlebih dahulu agar dropdown siap seketika
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(JENIS_ASESMEN_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            const active = parsed.filter((j: any) => j.aktif !== false);
            if (active.length > 0) {
              setJenisAsesmenList(active);
              setSelectedJenisAsesmen(active[0].nama);
            }
          }
        } catch (e) {
          // ignore
        }
      }

      // 2. Ambil data terbaru dari Cloud Supabase
      try {
        const { data, error } = await supabase
          .from('jenis_asesmen')
          .select('*')
          .order('urutan', { ascending: true });

        if (data && data.length > 0 && !error) {
          const active = data.filter((j: any) => j.aktif !== false);
          if (active.length > 0) {
            setJenisAsesmenList(active);
            setSelectedJenisAsesmen((prev) => {
              const stillExists = active.some((j: any) => j.nama === prev);
              return stillExists ? prev : active[0].nama;
            });
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(JENIS_ASESMEN_STORAGE_KEY, JSON.stringify(data));
              } catch (e) {}
            }
          }
        }
      } catch (err) {
        // ignore
      }
    }

    loadJenisAsesmen();
  }, []);

  // 1. Initial Load: Classes, Subjects, Teachers, Current User detection
  useEffect(() => {
    async function loadInitialData() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData?.session?.user;
        const currentUserId = currentUser?.id;
        const currentUserEmail = currentUser?.email?.toLowerCase().trim();
        const metaRole = currentUser?.user_metadata?.role;
        const metaJabatan = currentUser?.user_metadata?.jabatan;

        // Fetch Kelas
        const { data: kData } = await supabase
          .from('kelas')
          .select('*, wali_kelas:wali_kelas_id(id, nama, email)')
          .order('nama_kelas');
        const fetchedKelas: Kelas[] = kData && kData.length > 0 ? kData : [];
        setKelasList(fetchedKelas);

        // Deteksi Kepala Sekolah
        let detectedKepsek =
          roleParam === 'kepala_sekolah' ||
          metaRole === 'kepala_sekolah' ||
          metaJabatan === 'kepala_sekolah' ||
          currentUserEmail === 'kepsek@demo.com';

        if (!detectedKepsek && currentUserId) {
          const { data: prof } = await supabase
            .from('users_profile')
            .select('role, jabatan')
            .eq('id', currentUserId)
            .maybeSingle();
          if (prof && (prof.role === 'kepala_sekolah' || (prof as any).jabatan === 'kepala_sekolah')) {
            detectedKepsek = true;
          }
        }

        setIsKepalaSekolah(detectedKepsek);

        if (detectedKepsek) {
          setIsWaliKelas(false);
          setAllowedKelasList(fetchedKelas);
          if (fetchedKelas.length > 0) {
            setSelectedKelasId(fetchedKelas[0].id);
          }
        } else {
          // Detect Wali Kelas: match either by wali_kelas_id or by email
          const myKelas = fetchedKelas.find((k: any) => {
            const idMatch = currentUserId && k.wali_kelas_id === currentUserId;
            const emailMatch = currentUserEmail && k.wali_kelas?.email?.toLowerCase() === currentUserEmail;
            return idMatch || emailMatch;
          });

          if (myKelas) {
            setIsWaliKelas(true);
            setWaliKelasNama(myKelas.nama_kelas);
            setAllowedKelasList([myKelas]);
            setSelectedKelasId(myKelas.id);
          } else {
            setIsWaliKelas(false);
            setAllowedKelasList(fetchedKelas);
            if (fetchedKelas.length > 0) {
              setSelectedKelasId(fetchedKelas[0].id);
            }
          }
        }

        // Fetch Mapel
        const { data: mData } = await supabase.from('mapel').select('*').order('nama_mapel');
        if (mData && mData.length > 0) {
          setMapelList(mData);
          setSelectedMapelId(mData[0].id);
        } else {
          setMapelList(DEFAULT_MAPEL);
          setSelectedMapelId(DEFAULT_MAPEL[0].id);
        }

        // Fetch All Siswa
        const { data: sData } = await supabase.from('siswa').select('*, kelas:kelas_id(id, nama_kelas)').order('nama_lengkap');
        if (sData && sData.length > 0) {
          setSiswaList(sData);
        }
      } catch (err) {
        console.warn('Error loading initial academic data:', err);
      }
    }

    loadInitialData();
  }, [roleParam]);

  // Current Students based on selected class
  const currentStudents = useMemo(() => {
    if (!selectedKelasId) return [];
    return siswaList.filter((s) => s.kelas_id === selectedKelasId);
  }, [siswaList, selectedKelasId]);

  // Current selected mapel metadata
  const currentMapel = useMemo(() => {
    return mapelList.find((m) => m.id === selectedMapelId) || mapelList[0];
  }, [mapelList, selectedMapelId]);

  const kkm = currentMapel?.kkm || 75;

  // 2. Query saved Nilai from Supabase whenever filters change (for Guru view)
  useEffect(() => {
    if (isOrangTua || !selectedKelasId || !selectedMapelId || currentStudents.length === 0) return;

    let isMounted = true;
    async function loadGridScores() {
      setLoadingGrid(true);
      try {
        const studentIds = currentStudents.map((s) => s.id);
        const { data: savedScores, error } = await supabase
          .from('nilai')
          .select('*')
          .eq('mapel_id', selectedMapelId)
          .eq('jenis_ujian', selectedJenisAsesmen)
          .eq('semester', semester)
          .eq('tahun_ajaran', tahunAjaran)
          .in('siswa_id', studentIds);

        if (!isMounted) return;

        // Check local publication cache & catatan cache
        let publishMap: Record<string, boolean> = {};
        let catatanMap: Record<string, string> = {};
        if (typeof window !== 'undefined') {
          try {
            publishMap = JSON.parse(localStorage.getItem(PUBLISHED_ASESMEN_KEY) || '{}');
            catatanMap = JSON.parse(localStorage.getItem(CATATAN_NILAI_KEY) || '{}');
          } catch (e) {}
        }

        // Determine publication state
        let isPublished = true;
        if (savedScores && savedScores.length > 0) {
          const firstRow = savedScores[0] as any;
          if (firstRow.is_published !== undefined && firstRow.is_published !== null) {
            isPublished = firstRow.is_published;
          } else if (publishMap[currentAsesmenKey] !== undefined) {
            isPublished = publishMap[currentAsesmenKey];
          }
        } else if (publishMap[currentAsesmenKey] !== undefined) {
          isPublished = publishMap[currentAsesmenKey];
        }
        setIsPublishedForCurrentAsesmen(isPublished);

        // Build grid scores dictionary
        const newGrid: Record<string, { nilai: number | string; catatan: string }> = {};
        currentStudents.forEach((s) => {
          const row = savedScores?.find((r) => r.siswa_id === s.id);
          const cachedCatatan = catatanMap[`${s.id}_${selectedMapelId}_${selectedJenisAsesmen}`] || '';
          if (row) {
            newGrid[s.id] = {
              nilai: row.nilai,
              catatan: (row as any).catatan || cachedCatatan || '',
            };
          } else {
            newGrid[s.id] = {
              nilai: '',
              catatan: cachedCatatan || '',
            };
          }
        });
        setGridScores(newGrid);

        // Update Leger Data for this class
        const { data: allNilaiKelas } = await supabase
          .from('nilai')
          .select('siswa_id, mapel_id, nilai')
          .in('siswa_id', studentIds)
          .eq('semester', semester)
          .eq('tahun_ajaran', tahunAjaran);

        if (allNilaiKelas && isMounted) {
          const newLeger: Record<string, Record<string, number>> = {};
          // Calculate average per subject for each student
          const accumulator: Record<string, Record<string, { sum: number; count: number }>> = {};
          allNilaiKelas.forEach((n) => {
            if (!accumulator[n.siswa_id]) accumulator[n.siswa_id] = {};
            if (!accumulator[n.siswa_id][n.mapel_id]) {
              accumulator[n.siswa_id][n.mapel_id] = { sum: 0, count: 0 };
            }
            accumulator[n.siswa_id][n.mapel_id].sum += n.nilai;
            accumulator[n.siswa_id][n.mapel_id].count += 1;
          });

          Object.keys(accumulator).forEach((sId) => {
            newLeger[sId] = {};
            Object.keys(accumulator[sId]).forEach((mId) => {
              const { sum, count } = accumulator[sId][mId];
              newLeger[sId][mId] = Math.round(sum / (count || 1));
            });
          });
          setLegerData(newLeger);
        }
      } catch (err) {
        console.warn('Error fetching grid scores:', err);
      } finally {
        if (isMounted) setLoadingGrid(false);
      }
    }

    loadGridScores();
    return () => {
      isMounted = false;
    };
  }, [
    isOrangTua,
    selectedKelasId,
    selectedMapelId,
    selectedJenisAsesmen,
    semester,
    tahunAjaran,
    currentStudents,
    currentAsesmenKey,
  ]);

  // 3. Load Orang Tua Child & Real Grades (Strictly Real Data, No Fake Values)
  useEffect(() => {
    if (!isOrangTua) return;

    let isMounted = true;
    async function loadOrangTuaData() {
      setLoadingOrangTua(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) {
          if (isMounted) setLoadingOrangTua(false);
          return;
        }

        const meta = user.user_metadata;
        let child: any = null;

        // Attempt 1: by wali_murid_id
        const { data: byWali } = await supabase
          .from('siswa')
          .select('*, kelas:kelas_id(id, nama_kelas)')
          .eq('wali_murid_id', user.id)
          .maybeSingle();
        child = byWali;

        // Attempt 2: by siswa_id in metadata
        if (!child && meta?.siswa_id) {
          const { data: byMetaId } = await supabase
            .from('siswa')
            .select('*, kelas:kelas_id(id, nama_kelas)')
            .eq('id', meta.siswa_id)
            .maybeSingle();
          child = byMetaId;
        }

        // Attempt 3: by NISN extracted from email
        if (!child && user.email) {
          const extractedNisn = user.email.split('@')[0].replace(/[^0-9]/g, '');
          if (extractedNisn && extractedNisn.length >= 8) {
            const { data: byNisn } = await supabase
              .from('siswa')
              .select('*, kelas:kelas_id(id, nama_kelas)')
              .eq('nisn', extractedNisn)
              .maybeSingle();
            child = byNisn;
          }
        }

        // Auto-link if found but wali_murid_id not set
        if (child && (!child.wali_murid_id || child.wali_murid_id !== user.id)) {
          await supabase.from('siswa').update({ wali_murid_id: user.id }).eq('id', child.id);
        }

        if (!isMounted) return;
        setParentChild(child);

        if (child) {
          // Fetch mapel list
          const { data: mData } = await supabase.from('mapel').select('*').order('nama_mapel');
          const availableMapel: Mapel[] = mData && mData.length > 0 ? mData : DEFAULT_MAPEL;

          // Fetch real scores for this child
          const { data: childScores } = await supabase
            .from('nilai')
            .select('*')
            .eq('siswa_id', child.id)
            .eq('semester', semester)
            .eq('tahun_ajaran', tahunAjaran);

          // Publication settings map from storage
          let publishMap: Record<string, boolean> = {};
          let catatanMap: Record<string, string> = {};
          if (typeof window !== 'undefined') {
            try {
              publishMap = JSON.parse(localStorage.getItem(PUBLISHED_ASESMEN_KEY) || '{}');
              catatanMap = JSON.parse(localStorage.getItem(CATATAN_NILAI_KEY) || '{}');
            } catch (e) {}
          }

          // Build per-mapel report
          const grades = availableMapel.map((m) => {
            // Find all scores for this mapel
            const mapelScores = (childScores || []).filter((cs) => {
              if (cs.mapel_id !== m.id) return false;

              // Check if published
              const rowPublished = (cs as any).is_published;
              if (rowPublished === false) return false;

              const rowKey = `${child.kelas_id}_${m.id}_${cs.jenis_ujian}_${cs.semester}_${cs.tahun_ajaran}`;
              if (publishMap[rowKey] === false) return false;

              return true;
            });

            if (mapelScores.length > 0) {
              const sum = mapelScores.reduce((acc, curr) => acc + (curr.nilai || 0), 0);
              const avg = Math.round(sum / mapelScores.length);
              const latestNote =
                (mapelScores[mapelScores.length - 1] as any).catatan ||
                catatanMap[`${child.id}_${m.id}_${mapelScores[mapelScores.length - 1].jenis_ujian}`] ||
                `Telah menyelesaikan asesmen pembelajaran ${m.nama_mapel} dengan baik.`;

              return {
                mapelId: m.id,
                mapelNama: m.nama_mapel,
                kkm: m.kkm,
                skor: avg,
                catatan: latestNote,
                hasNilai: true,
              };
            }

            // Guru belum input nilai atau nilai disembunyikan (draft)
            return {
              mapelId: m.id,
              mapelNama: m.nama_mapel,
              kkm: m.kkm,
              skor: null,
              catatan: 'Nilai belum diinput oleh guru mata pelajaran atau masih dalam proses rekapitulasi.',
              hasNilai: false,
            };
          });

          setParentChildGrades(grades);
        }
      } catch (err) {
        console.warn('Error loading parent grades:', err);
      } finally {
        if (isMounted) setLoadingOrangTua(false);
      }
    }

    loadOrangTuaData();
    return () => {
      isMounted = false;
    };
  }, [isOrangTua, semester, tahunAjaran]);

  // Statistics calculation for the current grid (Guru view)
  const stats = useMemo(() => {
    const scores = currentStudents
      .map((s) => {
        const val = gridScores[s.id]?.nilai;
        return typeof val === 'number' ? val : val ? parseInt(String(val), 10) : null;
      })
      .filter((v): v is number => v !== null && !isNaN(v));

    if (scores.length === 0) return { avg: 0, highest: 0, lowest: 0, passRate: 0, filledCount: 0 };
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = Math.round((sum / scores.length) * 10) / 10;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const passedCount = scores.filter((sc) => sc >= kkm).length;
    const passRate = Math.round((passedCount / scores.length) * 100);
    return { avg, highest, lowest, passRate, filledCount: scores.length };
  }, [currentStudents, gridScores, kkm]);

  // Handler: Update score for a single student (smooth typing, no sticky 0)
  const handleScoreChange = (studentId: string, rawVal: string) => {
    if (rawVal === '') {
      setGridScores((prev) => ({
        ...prev,
        [studentId]: {
          nilai: '',
          catatan: prev[studentId]?.catatan || '',
        },
      }));
      return;
    }
    const num = parseInt(rawVal, 10);
    const clamped = isNaN(num) ? 0 : Math.max(0, Math.min(100, num));
    setGridScores((prev) => ({
      ...prev,
      [studentId]: {
        nilai: clamped,
        catatan: prev[studentId]?.catatan || '',
      },
    }));
  };

  // Handler: Update note for a student
  const handleNoteChange = (studentId: string, catatan: string) => {
    setGridScores((prev) => ({
      ...prev,
      [studentId]: {
        nilai: prev[studentId]?.nilai !== undefined ? prev[studentId]?.nilai : '',
        catatan,
      },
    }));
  };

  // Toggle Per-Asesmen Publication
  const handleTogglePublication = () => {
    const nextVal = !isPublishedForCurrentAsesmen;
    setIsPublishedForCurrentAsesmen(nextVal);

    if (typeof window !== 'undefined') {
      try {
        const map = JSON.parse(localStorage.getItem(PUBLISHED_ASESMEN_KEY) || '{}');
        map[currentAsesmenKey] = nextVal;
        localStorage.setItem(PUBLISHED_ASESMEN_KEY, JSON.stringify(map));
      } catch (e) {}
    }

    showToast({
      type: nextVal ? 'success' : 'info',
      title: nextVal ? 'Status: Publik ke Wali Murid' : 'Status: Disembunyikan (Draft Guru)',
      message: nextVal
        ? `Nilai ${selectedJenisAsesmen} akan langsung tampil di portal wali murid saat disimpan.`
        : `Nilai ${selectedJenisAsesmen} disembunyikan dari portal wali murid (hanya terlihat oleh guru/wali kelas).`,
    });
  };

  // Global Action: Publikasikan atau Sembunyikan Semua Nilai Kelas Ini
  const handleGlobalPublicationChange = async (publish: boolean) => {
    if (!selectedKelasId) return;
    const kelasObj = kelasList.find((k) => k.id === selectedKelasId);
    const kelasName = kelasObj?.nama_kelas || 'Kelas Terpilih';

    try {
      // 1. Update local storage publication map for all combinations of mapel & asesmen for this class
      if (typeof window !== 'undefined') {
        const map = JSON.parse(localStorage.getItem(PUBLISHED_ASESMEN_KEY) || '{}');
        mapelList.forEach((m) => {
          jenisAsesmenList.forEach((ja) => {
            const key = `${selectedKelasId}_${m.id}_${ja.nama}_${semester}_${tahunAjaran}`;
            map[key] = publish;
          });
        });
        localStorage.setItem(PUBLISHED_ASESMEN_KEY, JSON.stringify(map));
      }

      // 2. Also try updating Supabase `nilai` table if is_published column exists
      const studentIds = currentStudents.map((s) => s.id);
      if (studentIds.length > 0) {
        try {
          await supabase
            .from('nilai')
            .update({ is_published: publish })
            .in('siswa_id', studentIds)
            .eq('semester', semester)
            .eq('tahun_ajaran', tahunAjaran);
        } catch (e) {
          // Fault tolerant: ignore if column not yet added
        }
      }

      setIsPublishedForCurrentAsesmen(publish);

      showToast({
        type: publish ? 'success' : 'info',
        title: publish ? 'Semua Nilai Dipublikasikan' : 'Semua Nilai Disembunyikan',
        message: publish
          ? `Seluruh nilai ${kelasName} telah dibuka dan dapat dipantau oleh wali murid.`
          : `Seluruh nilai ${kelasName} dikunci sebagai draft internal guru.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        message: 'Gagal memperbarui pengaturan publikasi global.',
      });
    }
  };

  // Save all scores to database with fault tolerance
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Filter students with filled scores
      const upsertRows = currentStudents
        .map((s) => {
          const raw = gridScores[s.id]?.nilai;
          if (raw === '' || raw === undefined) return null;
          const num = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
          if (isNaN(num)) return null;

          return {
            siswa_id: s.id,
            mapel_id: currentMapel.id,
            jenis_ujian: selectedJenisAsesmen,
            nilai: num,
            semester,
            tahun_ajaran: tahunAjaran,
            catatan: gridScores[s.id]?.catatan || null,
            is_published: isPublishedForCurrentAsesmen,
            created_at: new Date().toISOString(),
          };
        })
        .filter(Boolean) as any[];

      if (upsertRows.length > 0) {
        // Try saving with is_published & catatan
        const { error: upsertErr } = await supabase.from('nilai').upsert(upsertRows);
        if (upsertErr) {
          // Fallback: If column 'catatan' or 'is_published' doesn't exist yet, save standard columns
          const fallbackRows = upsertRows.map(({ is_published, catatan, ...rest }) => rest);
          const { error: fbErr } = await supabase.from('nilai').upsert(fallbackRows);
          if (fbErr) throw fbErr;
        }
      }

      // Persist publication state & notes locally
      if (typeof window !== 'undefined') {
        try {
          const pubMap = JSON.parse(localStorage.getItem(PUBLISHED_ASESMEN_KEY) || '{}');
          pubMap[currentAsesmenKey] = isPublishedForCurrentAsesmen;
          localStorage.setItem(PUBLISHED_ASESMEN_KEY, JSON.stringify(pubMap));

          const catMap = JSON.parse(localStorage.getItem(CATATAN_NILAI_KEY) || '{}');
          currentStudents.forEach((s) => {
            const note = gridScores[s.id]?.catatan;
            if (note) {
              catMap[`${s.id}_${selectedMapelId}_${selectedJenisAsesmen}`] = note;
            }
          });
          localStorage.setItem(CATATAN_NILAI_KEY, JSON.stringify(catMap));
        } catch (e) {}
      }

      // Update Leger state
      setLegerData((prev) => {
        const next = { ...prev };
        currentStudents.forEach((s) => {
          const raw = gridScores[s.id]?.nilai;
          const num = typeof raw === 'number' ? raw : raw !== '' ? parseInt(String(raw), 10) : 0;
          if (!next[s.id]) next[s.id] = {};
          if (num > 0) {
            next[s.id][selectedMapelId] = num;
          }
        });
        return next;
      });

      const countSaved = upsertRows.length;
      showToast({
        type: 'success',
        title: 'Nilai Berhasil Disimpan',
        message: `${countSaved} nilai siswa untuk mata pelajaran ${currentMapel.nama_mapel} telah tersimpan${
          isPublishedForCurrentAsesmen ? ' dan dipublikasikan ke Wali Murid' : ' (Draft Guru)'
        }.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        message: err.message || 'Gagal menyimpan nilai ke server.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Export Leger to Excel
  const handleExportLeger = () => {
    const selectedClassObj = kelasList.find((k) => k.id === selectedKelasId);
    const headers = [
      'No',
      'NISN',
      'Nama Peserta Didik',
      ...mapelList.map((m) => m.nama_mapel),
      'Total Nilai',
      'Rata-rata',
      'Status Ketuntasan',
    ];

    const rows = currentStudents.map((s, idx) => {
      const studentGrades = mapelList.map((m) => legerData[s.id]?.[m.id] || 0);
      const total = studentGrades.reduce((a, b) => a + b, 0);
      const avg = Math.round((total / (mapelList.length || 1)) * 10) / 10;
      const allPassed = mapelList.every((m) => (legerData[s.id]?.[m.id] || 0) >= m.kkm);

      return [
        idx + 1,
        s.nisn || '-',
        s.nama_lengkap,
        ...studentGrades,
        total,
        avg,
        allPassed ? 'TUNTAS' : 'REMIDIAL',
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leger Nilai');
    XLSX.writeFile(wb, `Leger_Nilai_${selectedClassObj?.nama_kelas || 'Kelas'}_${tahunAjaran.replace('/', '-')}.xlsx`);
    showToast({ type: 'success', message: 'Leger nilai berhasil diekspor ke Excel!' });
  };

  // Print Leger
  const handlePrint = () => {
    window.print();
  };

  // =========================================================================
  // VIEW 1: ORANG TUA / WALI MURID VIEW (DATA REAL SISWA & KONTROL PUBLIKASI)
  // =========================================================================
  if (isOrangTua) {
    if (loadingOrangTua) {
      return (
        <div className="min-h-screen flex flex-col bg-[#F5F0E8] text-[#1A1A1A]">
          <Navbar schoolName="Portal Nilai Siswa" showLogout={true} />
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-[#DDD8CE] shadow-xs">
              <RefreshCw className="w-5 h-5 text-[#922B21] animate-spin" />
              <span className="text-sm font-semibold text-[#555]">Memuat capaian nilai ananda...</span>
            </div>
          </div>
          <BottomNav role="orangtua" />
        </div>
      );
    }

    // Hitung rata-rata dan ketuntasan HANYA dari nilai yang sudah diinput guru
    const gradedSubjects = parentChildGrades.filter((g) => g.hasNilai && g.skor !== null);
    const totalScore = gradedSubjects.reduce((acc, curr) => acc + (curr.skor || 0), 0);
    const avgScore = gradedSubjects.length > 0 ? Math.round((totalScore / gradedSubjects.length) * 10) / 10 : null;
    const passedSubjects = gradedSubjects.filter((g) => (g.skor || 0) >= g.kkm).length;

    const childName = parentChild?.nama_lengkap || 'Data Siswa Belum Tertaut';
    const childNisn = parentChild?.nisn || '-';
    const childClass = (parentChild?.kelas as any)?.nama_kelas || 'Kelas I';

    return (
      <div className="min-h-screen flex flex-col bg-[#F5F0E8] pb-24 text-[#1A1A1A]">
        <Navbar schoolName="Portal Nilai Siswa" showLogout={true} />

        <main className="w-full max-w-4xl mx-auto px-4 py-5 flex-1 space-y-5">
          {/* Back link & Header */}
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard/orangtua"
              className="text-xs font-bold text-[#922B21] hover:underline inline-flex items-center gap-1"
            >
              <span>← Kembali ke Dashboard</span>
            </Link>
            <span className="text-xs text-[#666] font-medium">Semester {semester} · TP {tahunAjaran}</span>
          </div>

          {/* Child Identity Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DDD8CE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FDEDEC] text-[#922B21] border border-[#F1948A] flex items-center justify-center font-bold text-xl uppercase">
                {childName.charAt(0) || 'S'}
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#922B21] uppercase tracking-wider block">
                  Laporan Capaian Belajar Ananda
                </span>
                <h1 className="font-serif font-bold text-xl text-[#1A1A1A]">
                  {childName}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-xs text-[#666]">
                  <span>NISN: {childNisn}</span>
                  <span>•</span>
                  <span className="font-semibold text-[#922B21] bg-[#FDEDEC] px-2 py-0.5 rounded-md">
                    {childClass}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick KPI Badge: Only calculated if grades exist */}
            <div className="flex items-center gap-3 bg-[#FAF8F2] p-3 rounded-xl border border-[#DDD8CE]">
              <div className="text-right">
                <span className="block text-[10px] text-[#666] uppercase font-bold tracking-wider">
                  Rata-rata Nilai
                </span>
                <span className={`font-serif font-bold text-2xl ${avgScore !== null ? 'text-emerald-700' : 'text-[#888]'}`}>
                  {avgScore !== null ? avgScore : '—'}
                </span>
              </div>
              <div className="w-px h-8 bg-[#DDD8CE]" />
              <div>
                <span className="block text-[10px] text-[#666] uppercase font-bold tracking-wider">
                  Ketuntasan
                </span>
                {gradedSubjects.length > 0 ? (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md block mt-0.5">
                    {passedSubjects}/{gradedSubjects.length} Tuntas
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-[#666] bg-[#EDE8DE] px-2 py-0.5 rounded-md block mt-0.5">
                    Belum ada nilai
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* If no child account connected */}
          {!parentChild && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong className="block font-bold">Akun Anda belum tertaut dengan data ananda.</strong>
                Silakan hubungi admin sekolah atau wali kelas untuk menghubungkan email akun wali murid dengan nama siswa yang bersangkutan.
              </div>
            </div>
          )}

          {/* Subject Cards Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-base text-[#1A1A1A] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#922B21]" />
                <span>Daftar Nilai Capaian Kompetensi</span>
              </h2>
              <span className="text-xs text-[#777]">
                {gradedSubjects.length} dari {parentChildGrades.length} mapel telah dinilai
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {parentChildGrades.map((g, idx) => {
                const hasScore = g.hasNilai && g.skor !== null;
                const isPassed = hasScore && (g.skor as number) >= g.kkm;
                const percentage = hasScore ? Math.min(100, Math.round(((g.skor as number) / 100) * 100)) : 0;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white border border-[#DDD8CE] shadow-xs hover:border-[#922B21]/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-sm text-[#1A1A1A] leading-snug">
                            {g.mapelNama}
                          </h3>
                          <span className="text-[11px] text-[#666]">
                            Standar KKM: <strong className="text-[#1A1A1A]">{g.kkm}</strong>
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          {hasScore ? (
                            <>
                              <span
                                className={`font-serif font-bold text-2xl block leading-none ${
                                  isPassed ? 'text-emerald-700' : 'text-[#922B21]'
                                }`}
                              >
                                {g.skor}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block mt-1 ${
                                  isPassed
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-[#FDEDEC] text-[#922B21] border border-[#F1948A]'
                                }`}
                              >
                                {isPassed ? 'TUNTAS' : 'PERLU BIMBINGAN'}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="font-serif font-bold text-2xl block leading-none text-[#A09D95]">
                                —
                              </span>
                              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block mt-1 bg-[#F5F0E8] text-[#777] border border-[#DDD8CE]">
                                BELUM DIINPUT
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-[#F5F0E8] rounded-full h-2 mb-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            hasScore ? (isPassed ? 'bg-emerald-600' : 'bg-[#922B21]') : 'bg-transparent'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      {/* Teacher's narrative feedback */}
                      <div className="p-2.5 rounded-lg bg-[#FAF8F2] border border-[#DDD8CE]/60 text-xs text-[#4A4A4A]">
                        <span className="text-[10px] font-bold text-[#922B21] uppercase block mb-0.5">
                          Catatan Guru Pengampu:
                        </span>
                        <p className={`leading-relaxed ${hasScore ? 'italic' : 'text-[#777]'}`}>
                          {hasScore ? `“${g.catatan}”` : g.catatan}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        <BottomNav role="orangtua" />
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: GURU, WALI KELAS & KEPALA SEKOLAH VIEW (KONTROL PUBLIKASI LENGKAP)
  // =========================================================================
  return (
    <AppShell
      role={isKepalaSekolah ? 'kepala_sekolah' : 'guru'}
      pageTitle={isKepalaSekolah ? 'Monitoring Nilai & Asesmen Sekolah' : 'Nilai & Asesmen Siswa'}
      pageSubtitle={
        isKepalaSekolah
          ? 'Pemantauan komprehensif capaian nilai siswa dan buku leger seluruh kelas'
          : 'Alur input nilai guru mata pelajaran, kontrol publikasi wali murid, dan buku leger'
      }
    >
      <div className="space-y-6">
        {/* Banner Khusus Kepala Sekolah */}
        {isKepalaSekolah && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 shadow-xs animate-in fade-in duration-200">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs">Mode Pengawasan Eksekutif Kepala Sekolah</h4>
              <p className="text-[11px] text-amber-800 leading-snug">
                Anda memiliki akses pemantauan ke seluruh rombel kelas (Kelas 1–6) dan buku leger lengkap tanpa batasan wali kelas (mode read-only).
              </p>
            </div>
          </div>
        )}

        {/* TOP TAB TOGGLE: Input Asesmen Mapel VS Buku Leger Rombel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-[#DDD8CE] shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`grid gap-1.5 p-1 bg-[#F5F0E8] rounded-xl border border-[#DDD8CE]/70 ${isWaliKelas || isKepalaSekolah ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <button
                onClick={() => setActiveTab('input')}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'input'
                    ? 'bg-[#922B21] text-white shadow-xs'
                    : 'text-[#666] hover:text-[#1A1A1A]'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Input / Cek Nilai</span>
              </button>

              {/* Buku Leger Tab: visible for Wali Kelas OR Kepala Sekolah */}
              {(isWaliKelas || isKepalaSekolah) && (
                <button
                  onClick={() => setActiveTab('leger')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'leger'
                      ? 'bg-[#922B21] text-white shadow-xs'
                      : 'text-[#666] hover:text-[#1A1A1A]'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Buku Leger</span>
                </button>
              )}
            </div>

            {/* Wali Kelas / Kepala Sekolah badge */}
            {isKepalaSekolah ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-[11px] font-bold text-amber-900">
                <Award className="w-3.5 h-3.5 text-amber-700" />
                <span>Pengawasan Pimpinan</span>
              </div>
            ) : isWaliKelas ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Wali Kelas {waliKelasNama}</span>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 px-2 text-xs text-[#666]">
            <span>Tahun Ajaran:</span>
            <span className="font-bold text-[#1A1A1A] bg-[#FAF8F2] px-2.5 py-1 rounded-lg border border-[#DDD8CE]">
              {tahunAjaran} · Sem {semester}
            </span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: INPUT NILAI GURU MAPEL & KONTROL PUBLIKASI */}
        {/* =================================================================== */}
        {activeTab === 'input' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Filter Card: Kelas, Mapel, Asesmen & Publikasi Global */}
            <div className="bg-white rounded-2xl p-5 border border-[#DDD8CE] shadow-xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Pilih Kelas Diajar - restricted for Wali Kelas */}
                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#922B21]" />
                    <span>1. Kelas / Rombel Diajar:</span>
                  </label>
                  {isWaliKelas ? (
                    <div className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>{waliKelasNama}</span>
                      <span className="ml-auto text-[10px] font-normal text-emerald-600">Hak akses Wali Kelas</span>
                    </div>
                  ) : (
                    <select
                      value={selectedKelasId}
                      onChange={(e) => setSelectedKelasId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF8F2] border border-[#DDD8CE] rounded-xl text-xs font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                    >
                      {allowedKelasList.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama_kelas}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 2. Pilih Mata Pelajaran */}
                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#922B21]" />
                    <span>2. Mata Pelajaran Diampu:</span>
                  </label>
                  <select
                    value={selectedMapelId}
                    onChange={(e) => setSelectedMapelId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F2] border border-[#DDD8CE] rounded-xl text-xs font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                  >
                    {mapelList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama_mapel} (KKM: {m.kkm})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Jenis Asesmen */}
                <div>
                  <label className="block text-xs font-bold text-[#3D3D3D] mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#922B21]" />
                    <span>3. Jenis Asesmen / Ujian:</span>
                  </label>
                  <select
                    value={selectedJenisAsesmen}
                    onChange={(e) => setSelectedJenisAsesmen(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F2] border border-[#DDD8CE] rounded-xl text-xs font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
                  >
                    {jenisAsesmenList.map((ja) => (
                      <option key={ja.id} value={ja.nama}>
                        {ja.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* KONTROL PUBLIKASI KE WALI MURID: Per-Asesmen Switch & Global Actions */}
              {!isKepalaSekolah && (
                <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#DDD8CE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Switch Per-Asesmen */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleTogglePublication}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isPublishedForCurrentAsesmen ? 'bg-emerald-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isPublishedForCurrentAsesmen ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1A1A1A]">
                          Status Nilai Asesmen Ini:
                        </span>
                        {isPublishedForCurrentAsesmen ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                            <Eye className="w-3 h-3 text-emerald-700" />
                            <span>Tampil ke Wali Murid</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 bg-gray-200 px-2 py-0.5 rounded-md border border-gray-300">
                            <EyeOff className="w-3 h-3 text-gray-600" />
                            <span>Disembunyikan (Draft Guru)</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#666]">
                        {isPublishedForCurrentAsesmen
                          ? 'Wali murid dapat langsung melihat capaian nilai dan catatan kompetensi asesmen ini.'
                          : 'Nilai asesmen ini dikunci untuk konsumsi guru saja (di portal ortu bertuliskan belum diinput).'}
                      </p>
                    </div>
                  </div>

                  {/* Tombol Aksi Global Seluruh Nilai Kelas */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleGlobalPublicationChange(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                      title="Buka akses semua nilai untuk kelas ini agar bisa dilihat orang tua"
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Publikasikan Semua Nilai Kelas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGlobalPublicationChange(false)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-[11px] font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                      title="Kunci semua nilai kelas ini sebagai draft guru"
                    >
                      <Lock className="w-3.5 h-3.5 text-gray-600" />
                      <span>Sembunyikan Semua</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Statistical KPI Ribbon */}
              <div className="pt-2 border-t border-[#DDD8CE] grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#FAF8F2] border border-[#DDD8CE]/80">
                  <span className="block text-[10px] text-[#666] uppercase font-bold tracking-wider">
                    Jumlah Siswa Terdata
                  </span>
                  <span className="font-bold text-lg text-[#1A1A1A]">
                    {currentStudents.length} Siswa
                  </span>
                  <span className="block text-[10px] text-[#777] mt-0.5">
                    ({stats.filledCount} telah diisi)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="block text-[10px] text-emerald-800 uppercase font-bold tracking-wider">
                    Rata-rata Nilai
                  </span>
                  <span className="font-serif font-bold text-lg text-emerald-800">
                    {stats.avg > 0 ? stats.avg : '—'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="block text-[10px] text-blue-800 uppercase font-bold tracking-wider">
                    Ketuntasan (≥ KKM {kkm})
                  </span>
                  <span className="font-bold text-lg text-blue-900">
                    {stats.filledCount > 0 ? `${stats.passRate}%` : '—'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="block text-[10px] text-amber-800 uppercase font-bold tracking-wider">
                    Tertinggi / Terendah
                  </span>
                  <span className="font-bold text-lg text-amber-900">
                    {stats.filledCount > 0 ? `${stats.highest} / ${stats.lowest}` : '— / —'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick-Input Table View */}
            <div className="bg-white rounded-2xl border border-[#DDD8CE] shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-[#DDD8CE] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#1A1A1A]">
                    Tabel Penulisan Nilai Asesmen
                  </h3>
                  <p className="text-xs text-[#666]">
                    Ketik skor 0–100. Status KKM & ketuntasan otomatis terkalkulasi saat diketik.
                  </p>
                </div>

                {isKepalaSekolah ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-semibold shadow-xs">
                    <Shield className="w-3.5 h-3.5 text-amber-700" />
                    <span>Mode Read-Only Kepala Sekolah</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={saving || loadingGrid}
                    onClick={handleSaveAll}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Menyimpan...' : 'Simpan Semua Nilai'}</span>
                  </button>
                )}
              </div>

              {loadingGrid ? (
                <div className="p-12 text-center text-xs text-[#777] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#922B21]" />
                  <span>Memuat data nilai tersimpan...</span>
                </div>
              ) : currentStudents.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#777]">
                  Belum ada siswa yang terdaftar di rombel kelas ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F0E8]/70 border-b border-[#DDD8CE] text-[#666] font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-center w-12">No</th>
                        <th className="px-4 py-3 w-64">Nama Siswa</th>
                        <th className="px-4 py-3 text-center w-28">Skor Nilai (0-100)</th>
                        <th className="px-4 py-3 text-center w-28">Status KKM</th>
                        <th className="px-4 py-3">Catatan / Deskripsi Capaian Kompetensi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDD8CE]/60">
                      {currentStudents.map((s, idx) => {
                        const rawScore = gridScores[s.id]?.nilai;
                        const hasInput = rawScore !== '' && rawScore !== undefined;
                        const numericScore = typeof rawScore === 'number' ? rawScore : hasInput ? parseInt(String(rawScore), 10) : 0;
                        const currentNote = gridScores[s.id]?.catatan || '';
                        const isPassed = numericScore >= kkm;

                        return (
                          <tr key={s.id} className="hover:bg-[#FAF8F2]/60 transition-colors">
                            <td className="px-4 py-3 text-center text-[#666] font-medium">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-[#1A1A1A]">{s.nama_lengkap}</div>
                              <div className="text-[11px] text-[#7A7A7A]">NISN: {s.nisn || '-'}</div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                disabled={isKepalaSekolah}
                                value={rawScore !== undefined ? rawScore : ''}
                                placeholder="0"
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => handleScoreChange(s.id, e.target.value)}
                                className={`w-20 px-2.5 py-1.5 rounded-xl border text-center font-bold text-sm font-mono focus:outline-none transition-all ${
                                  !hasInput
                                    ? 'border-[#DDD8CE] bg-white text-[#1A1A1A]'
                                    : isPassed
                                    ? 'border-emerald-300 bg-emerald-50/50 text-emerald-800 focus:ring-2 focus:ring-emerald-500'
                                    : 'border-[#F1948A] bg-[#FDEDEC]/50 text-[#922B21] focus:ring-2 focus:ring-[#922B21]'
                                } ${isKepalaSekolah ? 'cursor-not-allowed opacity-80 bg-gray-50' : ''}`}
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              {hasInput ? (
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block ${
                                    isPassed
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-[#FDEDEC] text-[#922B21]'
                                  }`}
                                >
                                  {isPassed ? 'TUNTAS' : 'REMIDIAL'}
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#999] italic">
                                  Belum diisi
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <textarea
                                rows={1}
                                disabled={isKepalaSekolah}
                                value={currentNote}
                                placeholder="Ketik catatan kemajuan belajar atau tindak lanjut..."
                                onChange={(e) => handleNoteChange(s.id, e.target.value)}
                                className={`w-full px-3 py-1.5 rounded-xl border border-[#DDD8CE] bg-white text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21] resize-y min-h-[38px] leading-relaxed transition-all ${
                                  isKepalaSekolah ? 'cursor-not-allowed opacity-80 bg-gray-50' : ''
                                }`}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table Footer Actions */}
              <div className="px-5 py-3.5 bg-[#FAF8F2] border-t border-[#DDD8CE] flex items-center justify-between">
                <span className="text-xs text-[#666]">
                  Nilai tersimpan langsung sinkron ke <strong>Buku Leger Wali Kelas</strong> dan portal wali murid.
                </span>
                {!isKepalaSekolah && (
                  <button
                    type="button"
                    disabled={saving || loadingGrid}
                    onClick={handleSaveAll}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#922B21] hover:bg-[#771F18] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Menyimpan...' : 'Simpan Semua Nilai'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: BUKU LEGER KELAS (WALI KELAS & KEPALA SEKOLAH) */}
        {/* =================================================================== */}
        {activeTab === 'leger' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Header Leger & Status Setoran Guru */}
            <div className="bg-white rounded-2xl p-5 border border-[#DDD8CE] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
                    Buku Leger Nilai Rombel ({kelasList.find((k) => k.id === selectedKelasId)?.nama_kelas || 'Kelas Terpilih'})
                  </h3>
                  <p className="text-xs text-[#666]">
                    Rekapitulasi seluruh mata pelajaran dari seluruh guru pengampu semester ini
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportLeger}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#DDD8CE] bg-white hover:bg-[#F5F0E8] text-xs font-bold text-[#1A1A1A] transition-colors cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-[#922B21]" />
                    <span>Ekspor Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-xs font-bold text-white transition-colors cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Leger</span>
                  </button>
                </div>
              </div>

              {/* Status Setoran Guru Mapel */}
              <div className="pt-3 border-t border-[#DDD8CE]">
                <span className="text-[11px] font-bold text-[#666] uppercase tracking-wider block mb-2">
                  Status Setoran Nilai Guru Mata Pelajaran:
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {mapelList.map((m) => {
                    const filledCount = currentStudents.filter((s) => (legerData[s.id]?.[m.id] || 0) > 0).length;
                    const isComplete = currentStudents.length > 0 && filledCount === currentStudents.length;

                    return (
                      <div
                        key={m.id}
                        className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                          isComplete
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : filledCount > 0
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isComplete ? 'bg-emerald-600' : filledCount > 0 ? 'bg-amber-600' : 'bg-gray-400'
                          }`}
                        />
                        <span className="font-semibold text-[11px]">{m.nama_mapel}</span>
                        <span className="text-[10px] opacity-75">
                          ({filledCount}/{currentStudents.length})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Matrix Table: Students x Subjects */}
            <div className="bg-white rounded-2xl border border-[#DDD8CE] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F0E8]/80 border-b border-[#DDD8CE] text-[#666] font-semibold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-3 text-center w-10 sticky left-0 bg-[#F5F0E8] z-10">No</th>
                      <th className="px-3 py-3 w-52 sticky left-10 bg-[#F5F0E8] z-10 border-r border-[#DDD8CE]">
                        Nama Siswa
                      </th>
                      {mapelList.map((m) => (
                        <th key={m.id} className="px-2.5 py-3 text-center min-w-[70px]">
                          <span className="block truncate max-w-[90px]" title={m.nama_mapel}>
                            {m.nama_mapel.split(' ')[0]}
                          </span>
                          <span className="text-[9px] text-[#888]">KKM {m.kkm}</span>
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center bg-[#FAF8F2] font-bold border-l border-[#DDD8CE]">Total</th>
                      <th className="px-3 py-3 text-center bg-emerald-50 text-emerald-900 font-bold">Rata-rata</th>
                      <th className="px-3 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDD8CE]/60">
                    {currentStudents.map((s, idx) => {
                      const studentScores = mapelList.map((m) => legerData[s.id]?.[m.id] || 0);
                      const filledGrades = studentScores.filter((val) => val > 0);
                      const total = studentScores.reduce((a, b) => a + b, 0);
                      const avg = filledGrades.length > 0 ? Math.round((total / filledGrades.length) * 10) / 10 : 0;
                      const allPassed =
                        filledGrades.length > 0 && mapelList.every((m) => (legerData[s.id]?.[m.id] || 0) >= m.kkm);

                      return (
                        <tr key={s.id} className="hover:bg-[#FAF8F2]/60 transition-colors">
                          <td className="px-3 py-3 text-center text-[#666] font-medium sticky left-0 bg-white z-10">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-3 font-bold text-[#1A1A1A] sticky left-10 bg-white z-10 border-r border-[#DDD8CE]">
                            <div className="truncate max-w-[200px]">{s.nama_lengkap}</div>
                          </td>
                          {mapelList.map((m) => {
                            const val = legerData[s.id]?.[m.id] || 0;
                            const isPassed = val >= m.kkm;
                            return (
                              <td
                                key={m.id}
                                className={`px-2 py-3 text-center font-mono font-semibold ${
                                  val === 0
                                    ? 'text-[#AAA] italic'
                                    : isPassed
                                    ? 'text-[#1A1A1A]'
                                    : 'text-[#922B21] font-bold bg-[#FDEDEC]/40'
                                }`}
                              >
                                {val || '-'}
                              </td>
                            );
                          })}
                          <td className="px-3 py-3 text-center font-mono font-bold text-[#1A1A1A] bg-[#FAF8F2] border-l border-[#DDD8CE]">
                            {total > 0 ? total : '—'}
                          </td>
                          <td className="px-3 py-3 text-center font-mono font-bold text-emerald-800 bg-emerald-50/50">
                            {avg > 0 ? avg : '—'}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {filledGrades.length === 0 ? (
                              <span className="text-[10px] text-[#999] italic">Belum Ada</span>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  allPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-[#FDEDEC] text-[#922B21]'
                                }`}
                              >
                                {allPassed ? 'TUNTAS' : 'REMIDIAL'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function NilaiPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-[#666]">Memuat modul nilai siswa...</div>}>
      <NilaiContent />
    </Suspense>
  );
}
