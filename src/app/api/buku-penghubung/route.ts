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

async function verifyCaller(request: Request) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// DELETE: Hapus catatan buku penghubung
export async function DELETE(request: Request) {
  try {
    const caller = await verifyCaller(request);
    if (!caller) {
      return NextResponse.json({ error: 'Akses ditolak: Sesi Anda tidak valid atau telah berakhir.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idFromQuery = searchParams.get('id');

    let id = idFromQuery;
    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        // ignore json error if body is empty
      }
    }

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'ID catatan buku penghubung wajib disertakan.' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('buku_penghubung')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error delete buku_penghubung:', error);
      return NextResponse.json({ error: 'Gagal menghapus catatan buku penghubung.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Catatan buku penghubung berhasil dihapus.' });
  } catch (err: any) {
    console.error('Exception DELETE buku_penghubung:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}

// PATCH: Update isi catatan buku penghubung
export async function PATCH(request: Request) {
  try {
    const caller = await verifyCaller(request);
    if (!caller) {
      return NextResponse.json({ error: 'Akses ditolak: Sesi Anda tidak valid atau telah berakhir.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, catatan, is_read_by_guru } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID catatan wajib disertakan.' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};
    if (catatan !== undefined) updatePayload.catatan = String(catatan).slice(0, 2000);
    if (is_read_by_guru !== undefined) updatePayload.is_read_by_guru = Boolean(is_read_by_guru);

    const { data, error } = await supabaseAdmin
      .from('buku_penghubung')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Gagal memperbarui catatan buku penghubung.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}

// POST: Buat catatan buku penghubung baru (Guru atau Orang Tua)
export async function POST(request: Request) {
  try {
    const caller = await verifyCaller(request);
    if (!caller) {
      return NextResponse.json({ error: 'Akses ditolak: Sesi Anda tidak valid atau telah berakhir.' }, { status: 401 });
    }

    const body = await request.json();
    const { siswa_id, catatan, author_role, parent_entry_id } = body;

    if (!siswa_id || !catatan || typeof catatan !== 'string') {
      return NextResponse.json({ error: 'Data siswa dan catatan wajib diisi.' }, { status: 400 });
    }

    const role = author_role === 'orangtua' ? 'orangtua' : 'guru';
    const isReadByGuru = role === 'guru';

    const { data: newEntry, error } = await supabaseAdmin
      .from('buku_penghubung')
      .insert({
        siswa_id,
        author_id: caller.id,
        author_role: role,
        catatan: catatan.slice(0, 2000),
        parent_entry_id: parent_entry_id || null,
        is_read_by_guru: isReadByGuru,
      })
      .select(`
        id,
        siswa_id,
        author_id,
        author_role,
        catatan,
        parent_entry_id,
        is_read_by_guru,
        created_at,
        users_profile:author_id(nama),
        siswa:siswa_id(
          id,
          nama_lengkap,
          nis,
          nisn,
          jenis_kelamin,
          nama_wali,
          no_hp_wali,
          kelas:kelas_id(id, nama_kelas)
        )
      `)
      .single();

    if (error) {
      console.error('Error insert buku_penghubung:', error);
      return NextResponse.json({ error: error.message || 'Gagal menyimpan catatan buku penghubung.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: newEntry });
  } catch (err: any) {
    console.error('Exception POST buku_penghubung:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem saat menyimpan catatan.' }, { status: 500 });
  }
}
