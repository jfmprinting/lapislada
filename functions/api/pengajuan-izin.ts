// Cloudflare Pages Function for Pengajuan Izin/Sakit Siswa oleh Orang Tua
// Protected by Caller Authentication Token & Guardian Verification

function getSupabaseConfig(context: any) {
  const url = context.env?.NEXT_PUBLIC_SUPABASE_URL || context.env?.SUPABASE_URL || 'https://kgufgvhbukartxqxbeyl.supabase.co';
  const key = context.env?.SUPABASE_SERVICE_ROLE_KEY;
  return { url, key };
}

let SUPABASE_URL = 'https://kgufgvhbukartxqxbeyl.supabase.co';

function initSupabaseUrl(context: any) {
  SUPABASE_URL = context.env?.NEXT_PUBLIC_SUPABASE_URL || context.env?.SUPABASE_URL || 'https://kgufgvhbukartxqxbeyl.supabase.co';
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context: any) {
  try {
    initSupabaseUrl(context);
    const { key: serviceKey } = getSupabaseConfig(context);
    if (!serviceKey) {
      return new Response(
        JSON.stringify({ error: 'Konfigurasi server SUPABASE_SERVICE_ROLE_KEY belum disetel.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    const authHeader = context.request.headers.get('Authorization') || '';
    const callerToken = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!callerToken) {
      return new Response(
        JSON.stringify({ error: 'Akses ditolak: Token autentikasi wajib disertakan.' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 1. Verify caller identity with Supabase Auth
    const callerRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${callerToken}`,
      },
    });

    if (!callerRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Sesi login tidak valid atau telah kedaluwarsa.' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const callerData = await callerRes.json();
    const userId = callerData.id;
    const callerMeta = callerData.user_metadata || {};
    const callerRole = callerMeta.role;

    const body = await context.request.json();
    const { siswa_id, tanggal, status, alasan, foto_url } = body;

    if (!siswa_id || !tanggal || !status || !alasan) {
      return new Response(
        JSON.stringify({ error: 'Data formulir tidak lengkap.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    };

    // 2. Query siswa & kelas
    const siswaRes = await fetch(
      `${SUPABASE_URL}/rest/v1/siswa?id=eq.${encodeURIComponent(siswa_id)}&select=id,nama_lengkap,nama_wali,kelas_id,wali_murid_id`,
      { headers }
    );
    const siswaList = await siswaRes.json();
    const siswa = siswaList?.[0];

    if (!siswa) {
      return new Response(
        JSON.stringify({ error: 'Data siswa tidak ditemukan.' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 2b. Authorization check: Only guardian or school staff can submit excuse
    const isStaff = callerRole === 'admin' || callerRole === 'guru' || callerRole === 'kepala_sekolah';
    const isGuardian = siswa.wali_murid_id === userId || callerMeta.siswa_id === siswa.id;

    if (!isStaff && !isGuardian) {
      return new Response(
        JSON.stringify({ error: 'Akses ditolak: Anda hanya dapat mengajukan izin untuk siswa yang terhubung dengan akun Anda.' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    let parentName = callerMeta.nama || siswa.nama_wali || 'Wali Murid';
    parentName = parentName.replace(/\s*\(Wali Murid\)/i, '').trim();

    const keteranganPayload = JSON.stringify({
      alasan: alasan.trim(),
      foto_url: foto_url || null,
      diajukan_oleh: parentName,
      tipe: 'orangtua',
      submitted_at: new Date().toISOString(),
      status_label: status === 'S' ? 'Sakit' : 'Izin',
    });

    // 3. Upsert kehadiran
    const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/kehadiran`, {
      method: 'POST',
      headers: {
        ...headers,
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        siswa_id: siswa.id,
        kelas_id: siswa.kelas_id,
        tanggal: tanggal,
        status: status,
        keterangan: keteranganPayload,
        recorded_by: userId,
      }),
    });

    if (!upsertRes.ok) {
      const errTxt = await upsertRes.text();
      return new Response(
        JSON.stringify({ error: `Gagal menyimpan presensi: ${errTxt}` }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 4. Catat notifikasi di buku_penghubung
    try {
      const statusIndo = status === 'S' ? 'Sakit' : 'Izin';
      await fetch(`${SUPABASE_URL}/rest/v1/buku_penghubung`, {
        method: 'POST',
        headers: {
          ...headers,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          siswa_id: siswa.id,
          author_id: userId,
          author_role: 'orangtua',
          catatan: `[SURAT IZIN ONLINE] Ananda ${siswa.nama_lengkap} izin tidak masuk sekolah (${statusIndo}) pada tanggal ${tanggal}. Alasan: "${alasan.trim()}". Surat/foto bukti telah terlampir di presensi kelas.`,
          is_read_by_guru: false,
        }),
      });
    } catch {}

    return new Response(
      JSON.stringify({
        success: true,
        message: `Surat izin ${status === 'S' ? 'Sakit' : 'Izin'} untuk ananda ${siswa.nama_lengkap} berhasil dikirim ke wali kelas.`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Terjadi kesalahan sistem internal.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}
