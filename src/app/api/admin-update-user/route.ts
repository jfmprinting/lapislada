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
      console.warn(`[SECURITY ALERT] Unauthorized admin update attempt by user: ${callerUser.id} (${callerUser.email})`);
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Administrator atau Kepala Sekolah yang berwenang mengubah data pendidik.' },
        { status: 403 }
      );
    }

    // 2. Validate and Sanitize Input (A05: Injection)
    const body = await request.json();
    const { id, nama, email, telepon, role, wali_kelas_id } = body;

    if (!id || typeof id !== 'string' || !nama || typeof nama !== 'string') {
      return NextResponse.json({ error: 'ID dan nama lengkap wajib diisi.' }, { status: 400 });
    }

    const cleanName = nama.trim().slice(0, 150);
    const cleanEmail = email && typeof email === 'string' ? email.toLowerCase().trim().slice(0, 100) : null;
    const cleanTelepon = telepon && typeof telepon === 'string' ? telepon.trim().slice(0, 30) : null;
    const cleanRole = ['guru', 'admin', 'kepala_sekolah', 'orangtua'].includes(role) ? role : 'guru';

    // 3. Update Supabase Auth user metadata & email if user exists in auth.users
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id);
      if (authUser?.user) {
        await supabaseAdmin.auth.admin.updateUserById(id, {
          ...(cleanEmail ? { email: cleanEmail } : {}),
          user_metadata: {
            ...authUser.user.user_metadata,
            nama: cleanName,
            role: cleanRole,
            jabatan: cleanRole === 'kepala_sekolah' ? 'kepala_sekolah' : null,
          },
        });
      }
    } catch (authErr) {
      console.warn('Notice: auth.admin update skipped or failed:', authErr);
    }

    // 4. Update users_profile
    const { error: profileErr } = await supabaseAdmin
      .from('users_profile')
      .update({
        nama: cleanName,
        email: cleanEmail,
        telepon: cleanTelepon,
        role: cleanRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (profileErr) {
      console.error('Error updating users_profile:', profileErr);
      return NextResponse.json({ error: 'Gagal memperbarui profil pengguna di database.' }, { status: 500 });
    }

    // 5. Update wali kelas assignment
    if (wali_kelas_id && typeof wali_kelas_id === 'string') {
      await supabaseAdmin.from('kelas').update({ wali_kelas_id: null }).eq('wali_kelas_id', id);
      await supabaseAdmin.from('kelas').update({ wali_kelas_id: id }).eq('id', wali_kelas_id);
    } else if (wali_kelas_id === '') {
      await supabaseAdmin.from('kelas').update({ wali_kelas_id: null }).eq('wali_kelas_id', id);
    }

    return NextResponse.json({ success: true, message: 'Data pengguna berhasil diperbarui.' });
  } catch (err: any) {
    console.error('Error in admin-update-user:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem saat memperbarui data pengguna.' }, { status: 500 });
  }
}
