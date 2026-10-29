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
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Token autentikasi tidak ditemukan.' }, { status: 401 });
    }

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ error: 'Sesi login tidak valid atau telah kedaluwarsa.' }, { status: 401 });
    }

    const meta = user.user_metadata || {};
    const metaSiswaId = meta.siswa_id;
    const email = user.email || '';

    let student: any = null;

    // Step A: by wali_murid_id
    const { data: byWali } = await supabaseAdmin
      .from('siswa')
      .select('*, kelas:kelas_id(id,nama_kelas)')
      .eq('wali_murid_id', user.id)
      .maybeSingle();
    student = byWali;

    // Step B: by meta.siswa_id
    if (!student && metaSiswaId) {
      const { data: byMeta } = await supabaseAdmin
        .from('siswa')
        .select('*, kelas:kelas_id(id,nama_kelas)')
        .eq('id', metaSiswaId)
        .maybeSingle();
      student = byMeta;
    }

    // Step C: by NISN extracted from email
    const extractedNisn = email.split('@')[0].replace(/[^0-9]/g, '');
    if (!student && extractedNisn && extractedNisn.length >= 8) {
      const { data: byNisn } = await supabaseAdmin
        .from('siswa')
        .select('*, kelas:kelas_id(id,nama_kelas)')
        .eq('nisn', extractedNisn)
        .maybeSingle();
      student = byNisn;
    }

    // Step D: by parent name in nama_wali
    if (!student && meta.nama) {
      const cleanName = meta.nama.replace(/\s*\(Wali Murid\)/i, '').trim();
      if (cleanName.length >= 3) {
        const { data: byNama } = await supabaseAdmin
          .from('siswa')
          .select('*, kelas:kelas_id(id,nama_kelas)')
          .ilike('nama_wali', `%${cleanName}%`)
          .maybeSingle();
        student = byNama;
      }
    }

    if (student) {
      // Update siswa.wali_murid_id if missing
      if (student.wali_murid_id !== user.id) {
        await supabaseAdmin
          .from('siswa')
          .update({ wali_murid_id: user.id })
          .eq('id', student.id);
        student.wali_murid_id = user.id;
      }

      // Update auth.users metadata if siswa_id not set
      if (meta.siswa_id !== student.id) {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...meta,
            role: 'orangtua',
            siswa_id: student.id,
          },
        });
      }

      // Upsert users_profile
      const parentName = meta.nama || student.nama_wali || 'Wali Murid';
      await supabaseAdmin.from('users_profile').upsert({
        id: user.id,
        nama: parentName,
        email: email,
        role: 'orangtua',
        updated_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        linked: true,
        siswa: student,
      });
    }

    return NextResponse.json({
      success: false,
      linked: false,
      siswa: null,
      message: 'Data siswa belum tersambung ke akun ini.',
    });
  } catch (err: any) {
    console.error('Error in api/link-siswa:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
