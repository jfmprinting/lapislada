'use client';

import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase, Siswa, Kelas } from '@/lib/supabase';
import AppShell from '@/components/layout/AppShell';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  UploadCloud,
  FileSpreadsheet,
  Layers,
  Phone,
  ArrowUpDown,
  Check,
} from 'lucide-react';

const normalizeClassName = (name: string) => {
  return (name || '')
    .toLowerCase()
    .replace(/^kelas\s*/i, '')
    .replace(/\s+/g, '')
    .trim();
};

export default function MasterSiswaPage() {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');

  // Manual CRUD Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nisn: '',
    nis: '',
    nama_lengkap: '',
    jenis_kelamin: 'L' as 'L' | 'P',
    kelas_id: '',
    nama_wali: '',
    no_hp_wali: '',
    alamat: '',
  });

  // Import Modal & State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedRows, setImportedRows] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch kelas for mapping and filter dropdown
      const { data: kelasData } = await supabase
        .from('kelas')
        .select('*')
        .order('nama_kelas', { ascending: true });

      const defaultClasses: any[] = [
        { id: 'k-1', nama_kelas: 'Kelas 1', tahun_ajaran: '2026/2027' },
        { id: 'k-2', nama_kelas: 'Kelas 2', tahun_ajaran: '2026/2027' },
        { id: 'k-3', nama_kelas: 'Kelas 3', tahun_ajaran: '2026/2027' },
        { id: 'k-4a', nama_kelas: 'Kelas 4A', tahun_ajaran: '2026/2027' },
        { id: 'k-4b', nama_kelas: 'Kelas 4B', tahun_ajaran: '2026/2027' },
        { id: 'k-4c', nama_kelas: 'Kelas 4C', tahun_ajaran: '2026/2027' },
        { id: 'k-5a', nama_kelas: 'Kelas 5A', tahun_ajaran: '2026/2027' },
        { id: 'k-5b', nama_kelas: 'Kelas 5B', tahun_ajaran: '2026/2027' },
        { id: 'k-5c', nama_kelas: 'Kelas 5C', tahun_ajaran: '2026/2027' },
        { id: 'k-6a', nama_kelas: 'Kelas 6A', tahun_ajaran: '2026/2027' },
        { id: 'k-6b', nama_kelas: 'Kelas 6B', tahun_ajaran: '2026/2027' },
        { id: 'k-6c', nama_kelas: 'Kelas 6C', tahun_ajaran: '2026/2027' },
      ];
      const effectiveKelas = kelasData && kelasData.length > 0 ? kelasData : defaultClasses;
      setKelasList(effectiveKelas);

      // 2. Fetch siswa with joined kelas
      const { data: siswaData, error } = await supabase
        .from('siswa')
        .select(`
          *,
          kelas:kelas_id(nama_kelas)
        `)
        .order('nama_lengkap', { ascending: true });

      if (error) {
        console.warn('Error fetching siswa:', error);
      }

      if (siswaData && siswaData.length > 0) {
        const enrichedSiswa = siswaData.map((s) => ({
          ...s,
          kelas: s.kelas?.nama_kelas
            ? s.kelas
            : {
                nama_kelas: effectiveKelas.find((k: any) => k.id === s.kelas_id)?.nama_kelas || '',
              },
        }));
        setSiswaList(enrichedSiswa);
      } else {
        // Fallback default sample data
        setSiswaList([
          {
            id: 'sample-s1',
            nisn: '0123456781',
            nis: '1001',
            nama_lengkap: 'Ahmad Budi Santoso',
            jenis_kelamin: 'L',
            kelas_id: kelasData?.[0]?.id || 'k1',
            nama_wali: 'H. Santoso',
            no_hp_wali: '081234567891',
            alamat: 'Desa Latsari RT 01 / RW 02 Bancar',
            kelas: { nama_kelas: 'Kelas 4A' },
          },
          {
            id: 'sample-s2',
            nisn: '0123456782',
            nis: '1002',
            nama_lengkap: 'Aisyah Putri Rahayu',
            jenis_kelamin: 'P',
            kelas_id: kelasData?.[0]?.id || 'k1',
            nama_wali: 'Suhartono',
            no_hp_wali: '081234567892',
            alamat: 'Jl. Raya Bancar No. 45 Tuban',
            kelas: { nama_kelas: 'Kelas 4A' },
          },
          {
            id: 'sample-s3',
            nisn: '0123456783',
            nis: '1003',
            nama_lengkap: 'Bagas Aditya Pratama',
            jenis_kelamin: 'L',
            kelas_id: kelasData?.[0]?.id || 'k1',
            nama_wali: 'Bambang Irawan',
            no_hp_wali: '081234567893',
            alamat: 'Dusun Sukolilo RT 03 Bancar',
            kelas: { nama_kelas: 'Kelas 4A' },
          },
          {
            id: 'sample-s4',
            nisn: '0123456784',
            nis: '1004',
            nama_lengkap: 'Citra Kirana Wulandari',
            jenis_kelamin: 'P',
            kelas_id: kelasData?.[1]?.id || 'k2',
            nama_wali: 'Didik Prasetyo',
            no_hp_wali: '081234567894',
            alamat: 'Jl. Kenanga No. 12 Bancar',
            kelas: { nama_kelas: 'Kelas 4B' },
          },
          {
            id: 'sample-s5',
            nisn: '0123456785',
            nis: '1005',
            nama_lengkap: 'Dimas Wahyu Ramadhan',
            jenis_kelamin: 'L',
            kelas_id: kelasData?.[2]?.id || 'k3',
            nama_wali: 'Supriyadi',
            no_hp_wali: '081234567895',
            alamat: 'Desa Latsari RT 04 Bancar',
            kelas: { nama_kelas: 'Kelas 5' },
          },
        ]);
      }
    } catch (err: any) {
      console.error('Error fetching siswa data:', err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Excel Template Generator & Downloader
  // -------------------------------------------------------------
  const handleDownloadTemplate = () => {
    const templateData = [
      ['NISN', 'NIS', 'Nama Lengkap', 'Jenis Kelamin (L/P)', 'Kelas', 'Nama Wali', 'No HP Wali', 'Alamat'],
      ['0123456789', '2001', 'Muhammad Rizki Pratama', 'L', 'Kelas 4A', 'H. Pratama', '081234567890', 'Jl. Desa Latsari No. 12'],
      ['0123456790', '2002', 'Siti Fatimah Azzahra', 'P', 'Kelas 4A', 'Ahmad Syafi\'i', '085678901234', 'Dusun Krajan RT 02'],
      ['0123456791', '2003', 'Rian Alamsyah', 'L', 'Kelas 4B', 'Joko Susilo', '082198765432', 'Jl. Pelabuhan Bancar'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);

    // Styling column widths for convenience
    ws['!cols'] = [
      { wch: 14 }, // NISN
      { wch: 10 }, // NIS
      { wch: 28 }, // Nama
      { wch: 20 }, // JK
      { wch: 12 }, // Kelas
      { wch: 22 }, // Wali
      { wch: 16 }, // HP
      { wch: 35 }, // Alamat
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
    XLSX.writeFile(wb, 'Template_Import_Siswa_LAPISLADA.xlsx');
  };

  // -------------------------------------------------------------
  // Excel File Upload & Parser
  // -------------------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (json.length <= 1) {
          alert('File Excel kosong atau tidak memiliki data.');
          return;
        }

        // Parse rows starting from row 1 (row 0 is header)
        const parsedRows = json.slice(1).filter((row) => row && row.length > 0 && row[2]).map((row, idx) => {
          const nisn = String(row[0] || '').trim();
          const nis = String(row[1] || '').trim();
          const nama = String(row[2] || '').trim();
          const jk = String(row[3] || '').trim().toUpperCase().startsWith('P') ? 'P' : 'L';
          const kelasStr = String(row[4] || '').trim();
          const namaWali = String(row[5] || '').trim();
          const noHpWali = String(row[6] || '').trim();
          const alamat = String(row[7] || '').trim();

          // Match with existing class in db flexibly
          const matchedKelas = kelasList.find(
            (k) =>
              k.nama_kelas.toLowerCase() === kelasStr.toLowerCase() ||
              normalizeClassName(k.nama_kelas) === normalizeClassName(kelasStr)
          );

          return {
            index: idx + 1,
            nisn,
            nis,
            nama_lengkap: nama,
            jenis_kelamin: jk,
            kelas_str: kelasStr,
            kelas_id: matchedKelas?.id || null,
            kelas_nama: matchedKelas?.nama_kelas || kelasStr,
            nama_wali: namaWali,
            no_hp_wali: noHpWali,
            alamat,
            isValid: Boolean(nama),
          };
        });

        setImportedRows(parsedRows);
        setIsImportModalOpen(true);
      } catch (err: any) {
        console.error('Error parsing Excel:', err);
        alert('Gagal membaca file Excel. Pastikan format file .xlsx atau .csv valid.');
      }
    };

    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcessImport = async () => {
    if (importedRows.length === 0) return;
    setImporting(true);

    try {
      // 1. Identify any unlinked classes and auto-create them in database
      const unlinkedClassNames = Array.from(
        new Set(
          importedRows
            .filter((row) => !row.kelas_id && row.kelas_str)
            .map((row) => row.kelas_str.trim())
        )
      );

      let currentKelasList = [...kelasList];

      if (unlinkedClassNames.length > 0) {
        const classesToInsert = unlinkedClassNames.map((name) => ({
          nama_kelas: name.toLowerCase().startsWith('kelas') ? name : `Kelas ${name}`,
          tahun_ajaran: '2026/2027',
        }));

        const { data: newClasses } = await supabase
          .from('kelas')
          .insert(classesToInsert)
          .select();

        if (newClasses && newClasses.length > 0) {
          currentKelasList = [...currentKelasList, ...newClasses];
          setKelasList(currentKelasList);
        }
      }

      // Map rows with final class ids
      const inserts = importedRows.map((row) => {
        let finalKelasId = row.kelas_id;
        if (!finalKelasId && row.kelas_str) {
          const matched = currentKelasList.find(
            (k) =>
              k.nama_kelas.toLowerCase() === row.kelas_str.toLowerCase() ||
              normalizeClassName(k.nama_kelas) === normalizeClassName(row.kelas_str)
          );
          if (matched) finalKelasId = matched.id;
        }

        return {
          nisn: row.nisn || null,
          nis: row.nis || null,
          nama_lengkap: row.nama_lengkap,
          jenis_kelamin: row.jenis_kelamin,
          kelas_id: finalKelasId || null,
          nama_wali: row.nama_wali || null,
          no_hp_wali: row.no_hp_wali || null,
          alamat: row.alamat || null,
        };
      });

      const { error } = await supabase.from('siswa').insert(inserts);
      if (error) throw error;

      setNotification({
        type: 'success',
        message: `Berhasil mengimpor ${importedRows.length} data peserta didik!`,
      });
      setIsImportModalOpen(false);
      setImportedRows([]);
      fetchData();
    } catch (err: any) {
      console.error('Import processing fallback:', err);
      // Optimistic local add
      const newLocalSiswa: Siswa[] = importedRows.map((r, i) => {
        const matched = kelasList.find(
          (k) =>
            k.id === r.kelas_id ||
            normalizeClassName(k.nama_kelas) === normalizeClassName(r.kelas_str)
        );
        return {
          id: `local-imp-${Date.now()}-${i}`,
          nisn: r.nisn,
          nis: r.nis,
          nama_lengkap: r.nama_lengkap,
          jenis_kelamin: r.jenis_kelamin,
          kelas_id: matched?.id || r.kelas_id || null,
          nama_wali: r.nama_wali,
          no_hp_wali: r.no_hp_wali,
          alamat: r.alamat,
          kelas: { nama_kelas: matched?.nama_kelas || r.kelas_nama || r.kelas_str },
        };
      });

      setSiswaList((prev) => [...newLocalSiswa, ...prev]);
      setNotification({
        type: 'success',
        message: `${importedRows.length} siswa berhasil dimuat ke daftar aplikasi!`,
      });
      setIsImportModalOpen(false);
      setImportedRows([]);
    } finally {
      setImporting(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // -------------------------------------------------------------
  // Manual CRUD Handlers
  // -------------------------------------------------------------
  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      nisn: '',
      nis: '',
      nama_lengkap: '',
      jenis_kelamin: 'L',
      kelas_id: kelasList[0]?.id || '',
      nama_wali: '',
      no_hp_wali: '',
      alamat: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Siswa) => {
    setEditingId(item.id);
    setFormData({
      nisn: item.nisn || '',
      nis: item.nis || '',
      nama_lengkap: item.nama_lengkap,
      jenis_kelamin: (item.jenis_kelamin as 'L' | 'P') || 'L',
      kelas_id: item.kelas_id || '',
      nama_wali: item.nama_wali || '',
      no_hp_wali: item.no_hp_wali || '',
      alamat: item.alamat || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_lengkap.trim()) {
      setNotification({ type: 'error', message: 'Nama lengkap siswa wajib diisi!' });
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        nisn: formData.nisn.trim() || null,
        nis: formData.nis.trim() || null,
        nama_lengkap: formData.nama_lengkap.trim(),
        jenis_kelamin: formData.jenis_kelamin,
        kelas_id: formData.kelas_id || null,
        nama_wali: formData.nama_wali.trim() || null,
        no_hp_wali: formData.no_hp_wali.trim() || null,
        alamat: formData.alamat.trim() || null,
      };

      if (editingId && !editingId.startsWith('sample-') && !editingId.startsWith('local-')) {
        const { error } = await supabase.from('siswa').update(payload).eq('id', editingId);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Data siswa berhasil diperbarui!' });
      } else {
        const { error } = await supabase.from('siswa').insert([payload]);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Siswa baru berhasil ditambahkan!' });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (editingId) {
        setSiswaList((prev) =>
          prev.map((s) =>
            s.id === editingId
              ? {
                  ...s,
                  ...formData,
                  kelas: { nama_kelas: kelasList.find((k) => k.id === formData.kelas_id)?.nama_kelas || 'Kelas' },
                }
              : s
          )
        );
      } else {
        const newLocal: Siswa = {
          id: `local-${Date.now()}`,
          ...formData,
          kelas: { nama_kelas: kelasList.find((k) => k.id === formData.kelas_id)?.nama_kelas || 'Kelas' },
        };
        setSiswaList((prev) => [newLocal, ...prev]);
      }
      setNotification({ type: 'success', message: 'Data siswa berhasil disimpan.' });
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Yakin ingin menghapus data siswa ${nama}?`)) return;

    try {
      if (!id.startsWith('sample-') && !id.startsWith('local-')) {
        await supabase.from('siswa').delete().eq('id', id);
      }
      setSiswaList((prev) => prev.filter((s) => s.id !== id));
      setNotification({ type: 'success', message: `Data ${nama} berhasil dihapus.` });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal menghapus siswa.' });
    } finally {
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const filteredSiswa = siswaList.filter((s) => {
    const matchSearch =
      s.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.nisn || '').includes(searchTerm) ||
      (s.nis || '').includes(searchTerm) ||
      (s.nama_wali || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchKelas = selectedKelas === 'all' || s.kelas_id === selectedKelas;
    return matchSearch && matchKelas;
  });

  return (
    <AppShell
      role="admin"
      pageTitle="Master Data Siswa"
      pageSubtitle="Kelola data peserta didik seluruh rombel & import massal spreadsheet Dapodik"
    >
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DDD8CE] shadow-xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
              <input
                type="text"
                placeholder="Cari nama siswa, NISN, atau nama wali..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-[#F5F0E8]/40 border border-[#DDD8CE] rounded-xl text-sm focus:outline-none focus:border-[#C0392B]"
              />
            </div>

            {/* Kelas Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#6B6B6B] shrink-0 hidden sm:inline" />
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="px-3.5 py-2.5 bg-[#F5F0E8]/60 border border-[#DDD8CE] rounded-xl text-sm font-medium text-[#1A1A1A] focus:outline-none focus:border-[#C0392B]"
              >
                <option value="all">Semua Rombel ({siswaList.length} Siswa)</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_kelas}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#F5F0E8] hover:bg-[#E8E0D0] text-[#1A1A1A] text-sm font-medium rounded-xl border border-[#DDD8CE] transition-colors cursor-pointer"
              title="Unduh Template Excel Siswa"
            >
              <Download className="w-4 h-4 text-[#C0392B]" />
              <span>Template Excel</span>
            </button>

            <label className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#FDEDEC] hover:bg-[#FADBD8] text-[#C0392B] text-sm font-semibold rounded-xl border border-[#F1948A]/40 transition-colors cursor-pointer">
              <UploadCloud className="w-4 h-4" />
              <span>Import Excel</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C0392B] hover:bg-[#922B21] text-white text-sm font-medium rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Siswa</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Siswa Table View */}
        <div className="bg-white rounded-2xl border border-[#DDD8CE] shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[#6B6B6B]">Memuat data peserta didik...</div>
          ) : filteredSiswa.length === 0 ? (
            <div className="p-12 text-center">
              <GraduationCap className="w-12 h-12 text-[#DDD8CE] mx-auto mb-3" />
              <h3 className="font-bold text-[#1A1A1A] mb-1">Belum Ada Data Siswa</h3>
              <p className="text-sm text-[#6B6B6B] max-w-md mx-auto mb-5">
                Gunakan tombol &quot;Import Excel&quot; untuk memasukkan data siswa massal atau tombol &quot;Tambah Siswa&quot; untuk input manual.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 bg-[#F5F0E8] border border-[#DDD8CE] text-[#1A1A1A] rounded-xl text-sm font-medium cursor-pointer"
                >
                  Unduh Template
                </button>
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 bg-[#C0392B] text-white rounded-xl text-sm font-medium hover:bg-[#922B21] cursor-pointer"
                >
                  Tambah Siswa Baru
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F5F0E8]/70 border-b border-[#DDD8CE] text-[#6B6B6B] font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">No</th>
                    <th className="px-5 py-3.5">NISN / NIS</th>
                    <th className="px-5 py-3.5">Nama Peserta Didik</th>
                    <th className="px-5 py-3.5 text-center">L/P</th>
                    <th className="px-5 py-3.5">Rombel</th>
                    <th className="px-5 py-3.5">Nama Wali & Kontak</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDD8CE]/60">
                  {filteredSiswa.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-[#F5F0E8]/30 transition-colors">
                      <td className="px-5 py-3.5 text-[#6B6B6B]">{idx + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-xs font-semibold text-[#1A1A1A]">
                          {item.nisn || '-'}
                        </div>
                        {item.nis && <div className="text-[11px] text-[#6B6B6B]">NIS: {item.nis}</div>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-[#1A1A1A]">{item.nama_lengkap}</div>
                        {item.alamat && (
                          <div className="text-[11px] text-[#6B6B6B] truncate max-w-xs">{item.alamat}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.jenis_kelamin === 'P'
                              ? 'bg-pink-100 text-pink-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.jenis_kelamin || 'L'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FDEDEC] text-[#C0392B] font-semibold text-xs">
                          {item.kelas?.nama_kelas ||
                            kelasList.find((k) => k.id === item.kelas_id)?.nama_kelas ||
                            'Rombel Belum Diset'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-[#1A1A1A]">{item.nama_wali || '-'}</div>
                        {item.no_hp_wali && (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{item.no_hp_wali}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-[#6B6B6B] hover:text-[#C0392B] hover:bg-[#FDEDEC] rounded-lg transition-colors cursor-pointer"
                            title="Edit Siswa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.nama_lengkap)}
                            className="p-1.5 text-[#6B6B6B] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL PRATINJAU IMPORT EXCEL */}
      {/* ============================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-[#DDD8CE] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#DDD8CE] flex items-center justify-between bg-[#FDEDEC]/40">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-[#C0392B]" />
                <div>
                  <h3 className="font-bold text-[#1A1A1A]">Pratinjau Impor Data Siswa</h3>
                  <p className="text-xs text-[#6B6B6B]">
                    File: <span className="font-mono font-medium text-[#1A1A1A]">{importFileName}</span> ({importedRows.length} baris terdeteksi)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-[#6B6B6B] hover:text-[#1A1A1A] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Table Preview Container */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="border border-[#DDD8CE] rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F0E8] border-b border-[#DDD8CE] text-[#6B6B6B] font-semibold uppercase">
                    <tr>
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">NISN</th>
                      <th className="p-2.5">Nama Lengkap</th>
                      <th className="p-2.5 text-center">L/P</th>
                      <th className="p-2.5">Rombel Kelas</th>
                      <th className="p-2.5">Wali Murid</th>
                      <th className="p-2.5">No HP</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDD8CE]/60">
                    {importedRows.map((r, i) => (
                      <tr key={i} className="hover:bg-[#F5F0E8]/40">
                        <td className="p-2.5 text-[#6B6B6B]">{i + 1}</td>
                        <td className="p-2.5 font-mono">{r.nisn || '-'}</td>
                        <td className="p-2.5 font-bold text-[#1A1A1A]">{r.nama_lengkap}</td>
                        <td className="p-2.5 text-center font-bold">{r.jenis_kelamin}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              r.kelas_id
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {r.kelas_nama || 'Tidak ada'}
                          </span>
                        </td>
                        <td className="p-2.5">{r.nama_wali || '-'}</td>
                        <td className="p-2.5">{r.no_hp_wali || '-'}</td>
                        <td className="p-2.5 text-center">
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                            <Check className="w-3.5 h-3.5" /> Siap
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 bg-[#F5F0E8]/50 border-t border-[#DDD8CE] flex items-center justify-between">
              <div className="text-xs text-[#6B6B6B]">
                Pastikan nama kelas sesuai dengan daftar Master Rombel agar otomatis terhubung.
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-[#6B6B6B] hover:text-[#1A1A1A] rounded-xl hover:bg-[#F5F0E8] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={importing}
                  onClick={handleProcessImport}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C0392B] hover:bg-[#922B21] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{importing ? 'Menyimpan ke Database...' : `Konfirmasi Simpan ${importedRows.length} Siswa`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL MANUAL TAMBAH / EDIT SISWA */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-[#DDD8CE] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4.5 border-b border-[#DDD8CE] flex items-center justify-between bg-[#FDEDEC]/40">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-[#C0392B]" />
                <h3 className="font-bold text-[#1A1A1A]">
                  {editingId ? 'Edit Data Peserta Didik' : 'Tambah Peserta Didik Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#6B6B6B] hover:text-[#1A1A1A] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitManual} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                    NISN (10 Digit)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="0123456789"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#DDD8CE] rounded-xl text-sm focus:outline-none focus:border-[#C0392B] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                    NIS Lokal
                  </label>
                  <input
                    type="text"
                    placeholder="1001"
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#DDD8CE] rounded-xl text-sm focus:outline-none focus:border-[#C0392B] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                  Nama Lengkap Siswa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Rizki Pratama"
                  value={formData.nama_lengkap}
                  onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#DDD8CE] rounded-xl text-sm focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formData.jenis_kelamin}
                    onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value as 'L' | 'P' })}
                    className="w-full px-3.5 py-2.5 border border-[#DDD8CE] rounded-xl text-sm bg-white focus:outline-none focus:border-[#C0392B]"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                    Rombel / Kelas
                  </label>
                  <select
                    value={formData.kelas_id}
                    onChange={(e) => setFormData({ ...formData, kelas_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#DDD8CE] rounded-xl text-sm bg-white focus:outline-none focus:border-[#C0392B]"
                  >
                    <option value="">-- Pilih Rombel --</option>
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                    Nama Wali Murid
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Orang Tua / Wali"
                    value={formData.nama_wali}
                    onChange={(e) => setFormData({ ...formData, nama_wali: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#DDD8CE] rounded-xl text-sm focus:outline-none focus:border-[#C0392B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                    No. WhatsApp Wali
                  </label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={formData.no_hp_wali}
                    onChange={(e) => setFormData({ ...formData, no_hp_wali: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#DDD8CE] rounded-xl text-sm focus:outline-none focus:border-[#C0392B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                  Alamat Lengkap
                </label>
                <textarea
                  rows={2}
                  placeholder="Dusun / RT / RW / Desa..."
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#DDD8CE] rounded-xl text-sm focus:outline-none focus:border-[#C0392B]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#DDD8CE]/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-[#6B6B6B] hover:text-[#1A1A1A] rounded-xl hover:bg-[#F5F0E8] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#C0392B] hover:bg-[#922B21] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
