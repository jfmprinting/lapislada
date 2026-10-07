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
    const body = await request.json();
    const { email, password, role, nama, phone, targetUserId } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    // 1. Search if user exists
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });
    
    if (listError) throw listError;

    const existingUser = listData.users.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    let authUserId = existingUser?.id;

    if (existingUser) {
      // 2a. Update existing user
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password: cleanPassword,
          email_confirm: true,
          user_metadata: {
            ...existingUser.user_metadata,
            role: role || existingUser.user_metadata?.role || 'orangtua',
            nama: nama || existingUser.user_metadata?.nama,
            siswa_id: targetUserId || existingUser.user_metadata?.siswa_id,
          },
        }
      );
      if (updateError) {
        throw new Error(updateError.message || 'Gagal memperbarui password akun.');
      }
    } else {
      // 2b. Create new user
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: cleanPassword,
        email_confirm: true,
        user_metadata: {
          role: role || 'orangtua',
          nama: nama,
          siswa_id: targetUserId,
        },
      });
      if (createError) {
        throw new Error(createError.message || 'Gagal mendaftarkan akun baru.');
      }
      authUserId = createData.user?.id;
    }

    // 3. Update phone number in database if provided
    if (phone && targetUserId) {
      if (role === 'orangtua') {
        await supabaseAdmin
          .from('siswa')
          .update({ no_hp_wali: phone })
          .eq('id', targetUserId);
      } else {
        await supabaseAdmin
          .from('users_profile')
          .update({ telepon: phone })
          .eq('id', targetUserId);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password akun berhasil diperbarui di server.',
      userId: authUserId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
