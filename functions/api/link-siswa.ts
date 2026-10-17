// Cloudflare Pages Function for Auto-Linking Student to Parent (Wali Murid)
// Protected by Caller Authentication Token & Supabase Service Role Key

const SUPABASE_URL = 'https://fqggetataxahzbwchbsh.supabase.co';
const FALLBACK_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxZ2dldGF0YXhhaHpid2NoYnNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY1MTIzNCwiZXhwIjoyMTA1MjI3MjM0fQ.xVkO2Bvah-xYsQnFbb0MdkK823vDMsDqwJc_hI8rE2s';

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
    const serviceKey = context.env?.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_KEY;
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
        JSON.stringify({ error: 'Sesi login tidak valid atau telah kedaluwarsa. Silakan login kembali.' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const callerData = await callerRes.json();
    const userId = callerData.id;
    const email = callerData.email || '';
    const meta = callerData.user_metadata || {};
    const metaSiswaId = meta.siswa_id;

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    };

    // Helper to query student with class
    const fetchSiswaWithKelas = async (filterQuery: string) => {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/siswa?${filterQuery}&select=*,kelas:kelas_id(id,nama_kelas)&limit=1`,
        { headers }
      );
      if (res.ok) {
        const rows = await res.json();
        return rows?.[0] || null;
      }
      return null;
    };

    // 2. Step A: Check if already linked by wali_murid_id
    let student = await fetchSiswaWithKelas(`wali_murid_id=eq.${encodeURIComponent(userId)}`);

    // Step B: Check by metadata siswa_id
    if (!student && metaSiswaId) {
      student = await fetchSiswaWithKelas(`id=eq.${encodeURIComponent(metaSiswaId)}`);
    }

    // Step C: Check by NISN extracted from email (e.g. 3179516341@sdnlatsari.sch.id)
    const extractedNisn = email.split('@')[0].replace(/[^0-9]/g, '');
    if (!student && extractedNisn && extractedNisn.length >= 8) {
      student = await fetchSiswaWithKelas(`nisn=eq.${encodeURIComponent(extractedNisn)}`);
    }

    // Step D: Check by parent name in nama_wali
    if (!student && meta.nama) {
      const cleanName = meta.nama.replace(/\s*\(Wali Murid\)/i, '').trim();
      if (cleanName.length >= 3) {
        student = await fetchSiswaWithKelas(`nama_wali=ilike.*${encodeURIComponent(cleanName)}*`);
      }
    }

    // 3. If matched, perform atomic link and sync
    if (student) {
      // 3a. Update siswa.wali_murid_id if not linked
      if (student.wali_murid_id !== userId) {
        await fetch(`${SUPABASE_URL}/rest/v1/siswa?id=eq.${encodeURIComponent(student.id)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ wali_murid_id: userId }),
        });
        student.wali_murid_id = userId;
      }

      // 3b. Update auth.users metadata if siswa_id not set
      if (meta.siswa_id !== student.id) {
        await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            user_metadata: {
              ...meta,
              role: 'orangtua',
              siswa_id: student.id,
            },
          }),
        });
      }

      // 3c. Ensure users_profile exists
      const parentName = meta.nama || student.nama_wali || 'Wali Murid';
      await fetch(`${SUPABASE_URL}/rest/v1/users_profile`, {
        method: 'POST',
        headers: {
          ...headers,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          id: userId,
          nama: parentName,
          email: email,
          role: 'orangtua',
          updated_at: new Date().toISOString(),
        }),
      });

      return new Response(
        JSON.stringify({
          success: true,
          linked: true,
          siswa: student,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // If not matched
    return new Response(
      JSON.stringify({
        success: false,
        linked: false,
        siswa: null,
        message: 'Data siswa belum tersambung ke akun ini. Hubungi pihak sekolah untuk konfirmasi NISN.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err: any) {
    console.error('Error in link-siswa:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Terjadi kesalahan sistem saat menghubungkan data siswa.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}
