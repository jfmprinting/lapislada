import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kgufgvhbukartxqxbeyl.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function verifyAdminCaller(request: Request) {
  const authHeader = request.headers.get('Authorization') || '';
  const callerToken = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!callerToken) return null;

  const { data: { user: callerUser }, error: authCheckErr } = await supabaseAdmin.auth.getUser(callerToken);
  if (authCheckErr || !callerUser) return null;

  const callerRole = callerUser.user_metadata?.role;
  const callerJabatan = callerUser.user_metadata?.jabatan;
  let isCallerAdmin = callerRole === 'admin' || callerRole === 'kepala_sekolah' || callerJabatan === 'kepala_sekolah';

  if (!isCallerAdmin) {
    const { data: pData } = await supabaseAdmin
      .from('users_profile')
      .select('role')
      .eq('id', callerUser.id)
      .maybeSingle();
    if (pData?.role === 'admin' || pData?.role === 'kepala_sekolah') {
      isCallerAdmin = true;
    }
  }

  if (!isCallerAdmin) return null;
  return callerUser;
}

export async function POST(request: Request) {
  try {
    // 1. Enforce Authentication & Admin Role (A01: Broken Access Control)
    const adminUser = await verifyAdminCaller(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Administrator atau Kepala Sekolah yang berwenang mengakses data akun atau mereset password pengguna.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Query Detail Akun & Kata Sandi Aktif Tersimpan
    if (body?.action === 'get_account') {
      const emailParam = body?.email?.toLowerCase().trim();
      const userIdParam = body?.userId?.trim();

      if (!emailParam && !userIdParam) {
        return NextResponse.json(
          { error: 'Parameter email atau userId wajib disertakan.' },
          { status: 400 }
        );
      }

      let targetAuthUser: any = null;

      if (userIdParam) {
        const { data: uData, error: uErr } = await supabaseAdmin.auth.admin.getUserById(userIdParam);
        if (!uErr && uData?.user) {
          targetAuthUser = uData.user;
        }
      }

      if (!targetAuthUser && emailParam) {
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          perPage: 1000,
        });
        if (!listError && listData?.users) {
          targetAuthUser = listData.users.find(
            (u) => u.email?.toLowerCase() === emailParam
          ) || null;
        }
      }

      if (!targetAuthUser) {
        return NextResponse.json({
          success: true,
          exists: false,
          password: null,
        });
      }

      const passwordDisplay = targetAuthUser.user_metadata?.password_display || null;

      return NextResponse.json({
        success: true,
        exists: true,
        userId: targetAuthUser.id,
        email: targetAuthUser.email,
        nama: targetAuthUser.user_metadata?.nama || null,
        role: targetAuthUser.user_metadata?.role || null,
        password: passwordDisplay,
      });
    }

    // 2. Validate and Sanitize Input for Reset Password (A05: Injection)
    const { email, password, role, nama, phone, targetUserId } = body;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal harus 6 karakter demi keamanan akun.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim().slice(0, 100);
    const cleanPassword = password.trim();

    // 3. Search if user exists
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });
    
    if (listError) throw listError;

    const existingUser = listData.users.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    let authUserId = existingUser?.id;

    if (existingUser) {
      // 3a. Update existing user
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password: cleanPassword,
          email_confirm: true,
          user_metadata: {
            ...existingUser.user_metadata,
            role: role || existingUser.user_metadata?.role || 'orangtua',
            jabatan: role === 'kepala_sekolah' ? 'kepala_sekolah' : null,
            nama: nama || existingUser.user_metadata?.nama,
            siswa_id: targetUserId || existingUser.user_metadata?.siswa_id,
            password_display: cleanPassword,
          },
        }
      );
      if (updateError) {
        throw new Error('Gagal memperbarui password akun di Supabase Auth.');
      }
    } else {
      // 3b. Create new user
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: cleanPassword,
        email_confirm: true,
        user_metadata: {
          role: role || 'orangtua',
          jabatan: role === 'kepala_sekolah' ? 'kepala_sekolah' : undefined,
          nama: nama,
          siswa_id: targetUserId,
          password_display: cleanPassword,
        },
      });
      if (createError) {
        throw new Error('Gagal mendaftarkan akun baru.');
      }
      authUserId = createData.user?.id;
    }

    // 4. Keep users_profile in sync
    if (authUserId) {
      try {
        await supabaseAdmin.from('users_profile').upsert({
          id: authUserId,
          nama: nama,
          email: cleanEmail,
          role: role || 'orangtua',
          telepon: phone || null,
          updated_at: new Date().toISOString(),
        });
      } catch (upsertErr) {
        if (role === 'kepala_sekolah') {
          await supabaseAdmin.from('users_profile').upsert({
            id: authUserId,
            nama: nama,
            email: cleanEmail,
            role: 'admin',
            telepon: phone || null,
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    // 5. Update student record or teacher record
    if (targetUserId && typeof targetUserId === 'string') {
      const cleanPhone = phone ? String(phone).trim().slice(0, 30) : null;
      if (role === 'orangtua') {
        let updated = false;
        if (targetUserId) {
          const { error: updErr } = await supabaseAdmin
            .from('siswa')
            .update({
              ...(authUserId ? { wali_murid_id: authUserId } : {}),
              ...(cleanPhone ? { no_hp_wali: cleanPhone } : {}),
            })
            .eq('id', targetUserId);
          if (!updErr) updated = true;
        }

        if (!updated) {
          const extractedNisn = cleanEmail.split('@')[0].replace(/[^0-9]/g, '');
          if (extractedNisn && extractedNisn.length >= 8) {
            await supabaseAdmin
              .from('siswa')
              .update({
                ...(authUserId ? { wali_murid_id: authUserId } : {}),
                ...(cleanPhone ? { no_hp_wali: cleanPhone } : {}),
              })
              .eq('nisn', extractedNisn);
          }
        }
      } else {
        if (authUserId && targetUserId !== authUserId) {
          await supabaseAdmin
            .from('kelas')
            .update({ wali_kelas_id: authUserId })
            .eq('wali_kelas_id', targetUserId);

          await supabaseAdmin
            .from('users_profile')
            .delete()
            .eq('id', targetUserId);
        } else {
          await supabaseAdmin
            .from('users_profile')
            .update({ ...(cleanPhone ? { telepon: cleanPhone } : {}) })
            .eq('id', targetUserId);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password akun berhasil diperbarui di server.',
      userId: authUserId,
      password: cleanPassword,
    });
  } catch (err: any) {
    console.error('Error in admin-reset-password:', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memperbarui password.' },
      { status: 500 }
    );
  }
}
