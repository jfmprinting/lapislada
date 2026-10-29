// Cloudflare Pages Function for Admin Update User
// Protected by RBAC (Role-Based Access Control) & Token Verification

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
        JSON.stringify({ error: 'Konfigurasi server SUPABASE_SERVICE_ROLE_KEY belum disetel pada environment server.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    const authHeader = context.request.headers.get('Authorization') || '';
    const callerToken = authHeader.replace(/^Bearer\s+/i, '').trim();

    // 1. Enforce Authentication (A01: Broken Access Control)
    if (!callerToken) {
      return new Response(
        JSON.stringify({ error: 'Akses ditolak: Token autentikasi wajib disertakan.' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 2. Verify Caller Identity via Supabase Auth
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
    const callerRole = callerData?.user_metadata?.role;
    const callerJabatan = callerData?.user_metadata?.jabatan;

    let isCallerAdmin = callerRole === 'admin' || callerRole === 'kepala_sekolah' || callerJabatan === 'kepala_sekolah';

    if (!isCallerAdmin && callerData?.id) {
      const profileCheck = await fetch(
        `${SUPABASE_URL}/rest/v1/users_profile?id=eq.${encodeURIComponent(callerData.id)}&select=role`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        }
      );
      if (profileCheck.ok) {
        const pRows = await profileCheck.json();
        if (pRows?.[0]?.role === 'admin' || pRows?.[0]?.role === 'kepala_sekolah') {
          isCallerAdmin = true;
        }
      }
    }

    // 3. Enforce Admin Privilege Check (A01 & A06)
    if (!isCallerAdmin) {
      console.warn(`[SECURITY ALERT] Unauthorized admin update attempt by user: ${callerData?.id} (${callerData?.email})`);
      return new Response(
        JSON.stringify({ error: 'Akses ditolak: Hanya Administrator atau Kepala Sekolah yang berwenang mengubah data pendidik.' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 4. Validate Input Data (A05: Injection & Data Validation)
    const body = await context.request.json();
    const { id, nama, email, telepon, role, wali_kelas_id } = body;

    if (!id || typeof id !== 'string' || !nama || typeof nama !== 'string') {
      return new Response(
        JSON.stringify({ error: 'ID dan nama lengkap pengguna wajib diisi dengan format yang benar.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const cleanName = nama.trim().slice(0, 150);
    const cleanEmail = email && typeof email === 'string' ? email.toLowerCase().trim().slice(0, 100) : null;
    const cleanTelepon = telepon && typeof telepon === 'string' ? telepon.trim().slice(0, 30) : null;
    const cleanRole = ['guru', 'admin', 'kepala_sekolah', 'orangtua'].includes(role) ? role : 'guru';

    // 5. Update Supabase Auth user metadata & email if user exists in auth.users
    try {
      const authUserRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      });

      if (authUserRes.ok) {
        const authUserData = await authUserRes.json();
        const existingMeta = authUserData?.user_metadata || {};

        await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...(cleanEmail ? { email: cleanEmail } : {}),
            user_metadata: {
              ...existingMeta,
              nama: cleanName,
              role: cleanRole,
              jabatan: cleanRole === 'kepala_sekolah' ? 'kepala_sekolah' : null,
            },
          }),
        });
      }
    } catch (authErr) {
      console.warn('Notice: auth.admin update skipped or failed:', authErr);
    }

    // 6. Update users_profile in database with parameterized encoding
    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/users_profile?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        nama: cleanName,
        email: cleanEmail,
        telepon: cleanTelepon,
        role: cleanRole,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!profileRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Gagal memperbarui profil pengguna di database.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 7. Update wali kelas assignment
    if (wali_kelas_id && typeof wali_kelas_id === 'string') {
      // Clear old class
      await fetch(`${SUPABASE_URL}/rest/v1/kelas?wali_kelas_id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wali_kelas_id: null }),
      });
      // Assign new class
      await fetch(`${SUPABASE_URL}/rest/v1/kelas?id=eq.${encodeURIComponent(wali_kelas_id)}`, {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wali_kelas_id: id }),
      });
    } else if (wali_kelas_id === '') {
      // Cleared assignment
      await fetch(`${SUPABASE_URL}/rest/v1/kelas?wali_kelas_id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wali_kelas_id: null }),
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Data pengguna berhasil diperbarui.' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err: any) {
    console.error('Error in admin-update-user:', err);
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan sistem saat memperbarui data pengguna.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}
