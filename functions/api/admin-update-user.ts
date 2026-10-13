// Cloudflare Pages Function for Admin Update User
// Runs on Cloudflare Edge Serverless Workers

const SUPABASE_URL = 'https://fqggetataxahzbwchbsh.supabase.co';
const SERVICE_ROLE_KEY =
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
    const serviceKey = context.env?.SUPABASE_SERVICE_ROLE_KEY || SERVICE_ROLE_KEY;
    const body = await context.request.json();
    const { id, nama, email, telepon, role, wali_kelas_id } = body;

    if (!id || !nama) {
      return new Response(
        JSON.stringify({ error: 'ID dan nama lengkap wajib diisi.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const cleanName = nama.trim();
    const cleanEmail = email ? email.toLowerCase().trim() : null;
    const cleanTelepon = telepon ? telepon.trim() : null;
    const cleanRole = role || 'guru';

    // 1. Update Supabase Auth user metadata & email if user exists in auth.users
    try {
      const authUserRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      });

      if (authUserRes.ok) {
        const authUserData = await authUserRes.json();
        const existingMeta = authUserData?.user_metadata || {};

        await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
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

    // 2. Update users_profile
    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/users_profile?id=eq.${id}`, {
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
      const errText = await profileRes.text();
      console.error('Error updating users_profile:', errText);
      return new Response(
        JSON.stringify({ error: 'Gagal memperbarui profil pengguna di database.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 3. Update wali kelas assignment
    if (wali_kelas_id) {
      // Clear old class
      await fetch(`${SUPABASE_URL}/rest/v1/kelas?wali_kelas_id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wali_kelas_id: null }),
      });
      // Assign new class
      await fetch(`${SUPABASE_URL}/rest/v1/kelas?id=eq.${wali_kelas_id}`, {
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
      await fetch(`${SUPABASE_URL}/rest/v1/kelas?wali_kelas_id=eq.${id}`, {
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
      JSON.stringify({ error: err.message || 'Gagal menyimpan perubahan pengguna.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}
