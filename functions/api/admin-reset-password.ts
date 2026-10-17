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

async function verifyAdminCaller(context: any, serviceKey: string) {
  const authHeader = context.request.headers.get('Authorization') || '';
  const callerToken = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!callerToken) return null;

  const callerRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${callerToken}`,
    },
  });

  if (!callerRes.ok) return null;

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

  if (!isCallerAdmin) return null;
  return callerData;
}

// GET: Ambil data akun & password aktif tersimpan
export async function onRequestGet(context: any) {
  try {
    const serviceKey = context.env?.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_KEY;
    const adminUser = await verifyAdminCaller(context, serviceKey);

    if (!adminUser) {
      return new Response(
        JSON.stringify({ error: 'Akses ditolak: Hanya Administrator atau Kepala Sekolah yang berwenang melihat kata sandi pengguna.' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const url = new URL(context.request.url);
    const emailParam = url.searchParams.get('email')?.toLowerCase().trim();
    const userIdParam = url.searchParams.get('userId')?.trim();

    if (!emailParam && !userIdParam) {
      return new Response(
        JSON.stringify({ error: 'Parameter email atau userId wajib disertakan.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    let targetAuthUser: any = null;

    if (userIdParam) {
      const userRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(userIdParam)}`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      });
      if (userRes.ok) {
        targetAuthUser = await userRes.json();
      }
    }

    if (!targetAuthUser && emailParam) {
      const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        targetAuthUser = listData?.users?.find(
          (u: any) => u.email?.toLowerCase() === emailParam
        ) || null;
      }
    }

    if (!targetAuthUser) {
      return new Response(
        JSON.stringify({ success: true, exists: false, password: null }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const passwordDisplay = targetAuthUser.user_metadata?.password_display || null;

    return new Response(
      JSON.stringify({
        success: true,
        exists: true,
        userId: targetAuthUser.id,
        email: targetAuthUser.email,
        nama: targetAuthUser.user_metadata?.nama || null,
        role: targetAuthUser.user_metadata?.role || null,
        password: passwordDisplay,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err: any) {
    console.error('Error in onRequestGet admin-reset-password:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Terjadi kesalahan sistem saat mengambil data akun.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

export async function onRequestPost(context: any) {
  try {
    const serviceKey = context.env?.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_KEY;
    const adminUser = await verifyAdminCaller(context, serviceKey);

    if (!adminUser) {
      return new Response(
        JSON.stringify({ error: 'Akses ditolak: Hanya Administrator atau Kepala Sekolah yang berwenang mengakses data akun atau mereset password pengguna.' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const body = await context.request.json();

    // Query Detail Akun & Kata Sandi Aktif Tersimpan
    if (body?.action === 'get_account') {
      const emailParam = body?.email?.toLowerCase().trim();
      const userIdParam = body?.userId?.trim();

      if (!emailParam && !userIdParam) {
        return new Response(
          JSON.stringify({ error: 'Parameter email atau userId wajib disertakan.' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      let targetAuthUser: any = null;

      if (userIdParam) {
        const userRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(userIdParam)}`, {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        });
        if (userRes.ok) {
          targetAuthUser = await userRes.json();
        }
      }

      if (!targetAuthUser && emailParam) {
        const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        });
        if (listRes.ok) {
          const listData = await listRes.json();
          targetAuthUser = listData?.users?.find(
            (u: any) => u.email?.toLowerCase() === emailParam
          ) || null;
        }
      }

      if (!targetAuthUser) {
        return new Response(
          JSON.stringify({ success: true, exists: false, password: null }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const passwordDisplay = targetAuthUser.user_metadata?.password_display || null;

      return new Response(
        JSON.stringify({
          success: true,
          exists: true,
          userId: targetAuthUser.id,
          email: targetAuthUser.email,
          nama: targetAuthUser.user_metadata?.nama || null,
          role: targetAuthUser.user_metadata?.role || null,
          password: passwordDisplay,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 4. Validate Input Data for Password Reset (A05: Injection & Data Validation)
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
              password_display: cleanPassword,
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
            password_display: cleanPassword,
          },
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.message || 'Gagal mendaftarkan akun baru.');
      }
      authUserId = createData.user?.id;
    }

    const cleanPhone = phone ? String(phone).trim().slice(0, 30) : null;

    // 6. Sync student record if role is orangtua
    if (role === 'orangtua') {
      let resolvedStudentId = targetUserId;

      // If targetUserId is not provided, try to find student by NISN from email
      if (!resolvedStudentId) {
        const extractedNisn = cleanEmail.split('@')[0].replace(/[^0-9]/g, '');
        if (extractedNisn && extractedNisn.length >= 8) {
          const sRes = await fetch(`${SUPABASE_URL}/rest/v1/siswa?nisn=eq.${encodeURIComponent(extractedNisn)}&select=id&limit=1`, {
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
            },
          });
          if (sRes.ok) {
            const sData = await sRes.json();
            if (sData?.[0]?.id) resolvedStudentId = sData[0].id;
          }
        }
      }

      if (resolvedStudentId && typeof resolvedStudentId === 'string') {
        const studentPatch: any = {};
        if (authUserId) studentPatch.wali_murid_id = authUserId;
        if (cleanPhone) studentPatch.no_hp_wali = cleanPhone;

        if (Object.keys(studentPatch).length > 0) {
          await fetch(`${SUPABASE_URL}/rest/v1/siswa?id=eq.${encodeURIComponent(resolvedStudentId)}`, {
            method: 'PATCH',
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(studentPatch),
          });
        }
      }
    } else if (cleanPhone && targetUserId && typeof targetUserId === 'string') {
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

    // 7. Ensure users_profile exists for all created/updated users
    if (authUserId) {
      await fetch(`${SUPABASE_URL}/rest/v1/users_profile`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          id: authUserId,
          nama: nama || (role === 'orangtua' ? 'Wali Murid' : 'Pengguna'),
          email: cleanEmail,
          role: role || 'orangtua',
          telepon: cleanPhone,
          updated_at: new Date().toISOString(),
        }),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password akun berhasil diperbarui di server.',
        userId: authUserId,
        password: cleanPassword,
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
