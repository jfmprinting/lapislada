// Cloudflare Pages Function for Admin Password Reset
// Protected by RBAC (Role-Based Access Control) & Token Verification

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
      console.warn(`[SECURITY ALERT] Unauthorized admin password reset attempt by user: ${callerData?.id} (${callerData?.email})`);
      return new Response(
        JSON.stringify({ error: 'Akses ditolak: Hanya Administrator atau Kepala Sekolah yang berwenang mereset password pengguna.' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 4. Validate Input Data (A05: Injection & Data Validation)
    const body = await context.request.json();
    const { email, password, role, nama, phone, targetUserId } = body;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email dan password wajib diisi.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password minimal harus 6 karakter demi keamanan akun.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const cleanEmail = email.toLowerCase().trim().slice(0, 100);
    const cleanPassword = password.trim();

    // 5. Search if user exists in Supabase auth.users
    const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
    const listData = await listRes.json();
    const existingUser = listData?.users?.find(
      (u: any) => u.email?.toLowerCase() === cleanEmail
    );

    let authUserId = existingUser?.id;

    if (existingUser) {
      // 5a. Update existing user's password
      const updateRes = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(existingUser.id)}`,
        {
          method: 'PUT',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: cleanPassword,
            user_metadata: {
              ...existingUser.user_metadata,
              role: role || existingUser.user_metadata?.role || 'orangtua',
              nama: nama || existingUser.user_metadata?.nama,
            },
          }),
        }
      );
      if (!updateRes.ok) {
        throw new Error('Gagal memperbarui password akun di Supabase Auth.');
      }
    } else {
      // 5b. Create new user in auth.users
      const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
          email_confirm: true,
          user_metadata: {
            role: role || 'orangtua',
            nama: nama,
            siswa_id: targetUserId,
          },
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.message || 'Gagal mendaftarkan akun baru.');
      }
      authUserId = createData.user?.id;
    }

    // 6. Update phone number in database if provided
    if (phone && targetUserId && typeof targetUserId === 'string') {
      const cleanPhone = String(phone).trim().slice(0, 30);
      if (role === 'orangtua') {
        await fetch(`${SUPABASE_URL}/rest/v1/siswa?id=eq.${encodeURIComponent(targetUserId)}`, {
          method: 'PATCH',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ no_hp_wali: cleanPhone }),
        });
      } else {
        await fetch(`${SUPABASE_URL}/rest/v1/users_profile?id=eq.${encodeURIComponent(targetUserId)}`, {
          method: 'PATCH',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ telepon: cleanPhone }),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password akun berhasil diperbarui di server.',
        userId: authUserId,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err: any) {
    console.error('Error in admin-reset-password:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Terjadi kesalahan sistem saat memperbarui password.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}
