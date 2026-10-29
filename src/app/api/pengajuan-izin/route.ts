import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kgufgvhbukartxqxbeyl.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function verifyCaller(request: Request) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// POST: Pengajuan Izin/Sakit dari Orang Tua (atau Input Khusus Guru)
export async function POST(request: Request) {
  try {
    const caller = await verifyCaller(request);
    if (!caller) {
      return NextResponse.json(
        { error: 'Akses ditolak: Sesi Anda tidak valid atau telah berakhir.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { siswa_id, tanggal, status, alasan, foto_url } = body;

    if (!siswa_id) {
      return NextResponse.json({ error: 'Data siswa (siswa_id) wajib disertakan.' }, { status: 400 });
    }

    if (!tanggal) {
      return NextResponse.json({ error: 'Tanggal izin wajib ditentukan.' }, { status: 400 });
    }

    if (!status || !['S', 'I'].includes(status)) {
      return NextResponse.json({ error: 'Status izin harus berupa Sakit (S) atau Izin (I).' }, { status: 400 });
    }

    if (!alasan || !alasan.trim()) {
      return NextResponse.json({ error: 'Keterangan atau alasan izin wajib diisi.' }, { status: 400 });
    }

    // 1. Dapatkan data siswa & kelas
    const { data: siswaData, error: siswaErr } = await supabaseAdmin
      .from('siswa')
      .select('id, nama_lengkap, nama_wali, wali_murid_id, kelas_id, kelas:kelas_id(id, nama_kelas)')
      .eq('id', siswa_id)
      .single();

    if (siswaErr || !siswaData) {
      return NextResponse.json({ error: 'Siswa tidak ditemukan dalam database sekolah.' }, { status: 404 });
    }

    // 2. Dapatkan nama wali pengaju
    let parentName = caller.user_metadata?.nama || siswaData.nama_wali || 'Wali Murid';
    parentName = parentName.replace(/\s*\(Wali Murid\)/i, '').trim();

    // 3. Susun metadata terstruktur di kolom keterangan
    const keteranganPayload = JSON.stringify({
      alasan: alasan.trim(),
      foto_url: foto_url || null,
      diajukan_oleh: parentName,
      tipe: 'orangtua',
      submitted_at: new Date().toISOString(),
      status_label: status === 'S' ? 'Sakit' : 'Izin',
    });

    // 4. Upsert ke tabel kehadiran via Service Role (bypass RLS)
    const { data: kehadiranData, error: upsertErr } = await supabaseAdmin
      .from('kehadiran')
      .upsert(
        {
          siswa_id: siswaData.id,
          kelas_id: siswaData.kelas_id,
          tanggal: tanggal,
          status: status,
          keterangan: keteranganPayload,
          recorded_by: caller.id,
        },
        {
          onConflict: 'siswa_id,tanggal',
        }
      )
      .select()
      .single();

    if (upsertErr) {
      console.error('Error upsert kehadiran:', upsertErr);
      return NextResponse.json({ error: 'Gagal mencatat izin ke daftar absensi sekolah.' }, { status: 500 });
    }

    // 5. Buat entri notifikasi di buku_penghubung agar guru wali kelas langsung menerima alert
    try {
      const statusIndo = status === 'S' ? 'Sakit' : 'Izin';
      const formattedDate = new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(tanggal));

      await supabaseAdmin.from('buku_penghubung').insert({
        siswa_id: siswaData.id,
        author_id: caller.id,
        author_role: 'orangtua',
        catatan: `[SURAT IZIN ONLINE] Pemberitahuan bahwa ananda ${siswaData.nama_lengkap} izin tidak masuk sekolah (${statusIndo}) pada hari ${formattedDate}. Alasan: "${alasan.trim()}". Surat/foto bukti telah terlampir di presensi kelas.`,
        is_read_by_guru: false,
      });
    } catch (notifErr) {
      console.warn('Gagal membuat buku penghubung notifikasi:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `Surat izin ${status === 'S' ? 'Sakit' : 'Izin'} untuk ananda ${siswaData.nama_lengkap} berhasil dikirim ke wali kelas.`,
      kehadiran: kehadiranData,
    });
  } catch (error: any) {
    console.error('Server error pengajuan izin:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan sistem internal.' }, { status: 500 });
  }
}

