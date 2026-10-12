import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fqggetataxahzbwchbsh.supabase.co';
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxZ2dldGF0YXhhaHpid2NoYnNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY1MTIzNCwiZXhwIjoyMTA1MjI3MjM0fQ.xVkO2Bvah-xYsQnFbb0MdkK823vDMsDqwJc_hI8rE2s';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, email, telepon, role, wali_kelas_id } = body;

    if (!id || !nama) {
      return NextResponse.json({ error: 'ID dan nama lengkap wajib diisi.' }, { status: 400 });
    }

    const cleanName = nama.trim();
    const cleanEmail = email ? email.toLowerCase().trim() : null;
    const cleanTelepon = telepon ? telepon.trim() : null;
    const cleanRole = role || 'guru';

    // 1. Update Supabase Auth user metadata & email if user exists in auth.users
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

    // 2. Update users_profile
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
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    // 3. Update wali kelas assignment
    if (wali_kelas_id) {
      // Clear old class
      await supabaseAdmin.from('kelas').update({ wali_kelas_id: null }).eq('wali_kelas_id', id);
      // Assign new class
      await supabaseAdmin.from('kelas').update({ wali_kelas_id: id }).eq('id', wali_kelas_id);
    } else if (wali_kelas_id === '') {
      // Cleared assignment
      await supabaseAdmin.from('kelas').update({ wali_kelas_id: null }).eq('wali_kelas_id', id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in admin-update-user:', err);
    return NextResponse.json({ error: err.message || 'Gagal menyimpan perubahan pengguna.' }, { status: 500 });
  }
}
