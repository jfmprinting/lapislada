import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fqggetataxahzbwchbsh.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxZ2dldGF0YXhhaHpid2NoYnNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY1MTIzNCwiZXhwIjoyMTA1MjI3MjM0fQ.xVkO2Bvah-xYsQnFbb0MdkK823vDMsDqwJc_hI8rE2s';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: Request) {
  try {
    // 1. Enforce Authentication & Admin Role (A01: Broken Access Control)
    const authHeader = request.headers.get('Authorization') || '';
    const callerToken = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!callerToken) {
      return NextResponse.json(
        { error: 'Akses ditolak: Token autentikasi wajib disertakan.' },
        { status: 401 }
      );
    }

    const { data: { user: callerUser }, error: authCheckErr } = await supabaseAdmin.auth.getUser(callerToken);
    if (authCheckErr || !callerUser) {
      return NextResponse.json(
        { error: 'Sesi login tidak valid atau telah kedaluwarsa. Silakan login kembali.' },
        { status: 401 }
      );
    }

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

    if (!isCallerAdmin) {
      console.warn(`[SECURITY ALERT] Unauthorized password reset attempt by user: ${callerUser.id} (${callerUser.email})`);
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Administrator atau Kepala Sekolah yang berwenang mereset password pengguna.' },
        { status: 403 }
      );
    }

    // 2. Validate and Sanitize Input (A05: Injection)
    const body = await request.json();
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
        await supabaseAdmin
          .from('siswa')
          .update({
            ...(authUserId ? { wali_murid_id: authUserId } : {}),
            ...(cleanPhone ? { no_hp_wali: cleanPhone } : {}),
          })
          .eq('id', targetUserId);
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
    });
  } catch (err: any) {
    console.error('Error in admin-reset-password:', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memperbarui password.' },
      { status: 500 }
    );
  }
}
