// Cloudflare Pages Function for Admin Password Reset
// Runs on Cloudflare Edge Serverless Workers

const SUPABASE_URL = 'https://fqggetataxahzbwchbsh.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxZ2dldGF0YXhhaHpid2NoYnNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY1MTIzNCwiZXhwIjoyMTA1MjI3MjM0fQ.xVkO2Bvah-xYsQnFbb0MdkK823vDMsDqwJc_hI8rE2s';

export async function onRequestPost(context: any) {
  try {
    const serviceKey = context.env?.SUPABASE_SERVICE_ROLE_KEY || SERVICE_ROLE_KEY;
    const body = await context.request.json();
    const { email, password, role, nama, phone, targetUserId } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email dan password wajib diisi.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    // 1. Search if user exists in Supabase auth.users
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
      // 2a. Update existing user's password
      const updateRes = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users/${existingUser.id}`,
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
        const errJson = await updateRes.json();
        throw new Error(errJson.message || 'Gagal memperbarui password akun.');
      }
    } else {
      // 2b. Create new user in auth.users
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

    // 3. Update phone number in database if provided
    if (phone && targetUserId) {
      if (role === 'orangtua') {
        await fetch(`${SUPABASE_URL}/rest/v1/siswa?id=eq.${targetUserId}`, {
          method: 'PATCH',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ no_hp_wali: phone }),
        });
      } else {
        await fetch(`${SUPABASE_URL}/rest/v1/users_profile?id=eq.${targetUserId}`, {
          method: 'PATCH',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ telepon: phone }),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password akun berhasil diperbarui di server.',
        userId: authUserId,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Terjadi kesalahan pada server.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
