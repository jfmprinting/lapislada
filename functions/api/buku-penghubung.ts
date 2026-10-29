// Cloudflare Pages Function for Buku Penghubung API
// Protected by Caller Authentication Verification & Role-Based Authorization

function getSupabaseConfig(context: any) {
  const url = context.env?.NEXT_PUBLIC_SUPABASE_URL || context.env?.SUPABASE_URL || 'https://kgufgvhbukartxqxbeyl.supabase.co';
  const key = context.env?.SUPABASE_SERVICE_ROLE_KEY;
  return { url, key };
}

let SUPABASE_URL = 'https://kgufgvhbukartxqxbeyl.supabase.co';

function initSupabaseUrl(context: any) {
  SUPABASE_URL = context.env?.NEXT_PUBLIC_SUPABASE_URL || context.env?.SUPABASE_URL || 'https://kgufgvhbukartxqxbeyl.supabase.co';
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

async function verifyAuth(context: any, serviceKey: string) {
  initSupabaseUrl(context);
  const authHeader = context.request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function onRequestDelete(context: any) {
  try {
    initSupabaseUrl(context);
    const { key: serviceKey } = getSupabaseConfig(context);
    if (!serviceKey) {
      return new Response(
        JSON.stringify({ error: 'Konfigurasi server SUPABASE_SERVICE_ROLE_KEY belum disetel.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    const user = await verifyAuth(context, serviceKey);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Akses ditolak: Sesi tidak valid atau belum login.' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const url = new URL(context.request.url);
    let id = url.searchParams.get('id');

    if (!id) {
      try {
        const body = await context.request.json();
        id = body?.id;
      } catch {
        // ignore
      }
    }

    if (!id || typeof id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'ID catatan buku penghubung wajib disertakan.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 1. Fetch target entry to verify authorship and permissions
    const entryRes = await fetch(`${SUPABASE_URL}/rest/v1/buku_penghubung?id=eq.${encodeURIComponent(id)}&select=id,author_id`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    if (!entryRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Gagal memverifikasi catatan buku penghubung.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const entries = await entryRes.json();
    const entry = entries?.[0];
    if (!entry) {
      return new Response(
        JSON.stringify({ error: 'Catatan buku penghubung tidak ditemukan.' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const callerRole = user.user_metadata?.role;
    const isStaff = callerRole === 'admin' || callerRole === 'guru' || callerRole === 'kepala_sekolah';
    const isAuthor = entry.author_id === user.id;

    if (!isAuthor && !isStaff) {
      return new Response(
        JSON.stringify({ error: 'Akses ditolak: Anda hanya dapat menghapus catatan yang Anda buat sendiri.' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 2. Perform deletion
    const delRes = await fetch(`${SUPABASE_URL}/rest/v1/buku_penghubung?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    if (!delRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Gagal menghapus catatan buku penghubung di database.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Catatan buku penghubung berhasil dihapus.' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err: any) {
    console.error('Exception DELETE buku_penghubung:', err);
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan sistem saat menghapus data.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

export async function onRequestPatch(context: any) {
  try {
    initSupabaseUrl(context);
    const { key: serviceKey } = getSupabaseConfig(context);
    if (!serviceKey) {
      return new Response(
        JSON.stringify({ error: 'Konfigurasi server SUPABASE_SERVICE_ROLE_KEY belum disetel.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    const user = await verifyAuth(context, serviceKey);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Akses ditolak: Sesi tidak valid atau belum login.' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const body = await context.request.json();
    const { id, catatan, is_read_by_guru } = body;

    if (!id || typeof id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'ID catatan wajib disertakan.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 1. Fetch target entry to verify author
    const entryRes = await fetch(`${SUPABASE_URL}/rest/v1/buku_penghubung?id=eq.${encodeURIComponent(id)}&select=id,author_id`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    if (!entryRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Gagal memverifikasi catatan.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const entries = await entryRes.json();
    const entry = entries?.[0];
    if (!entry) {
      return new Response(
        JSON.stringify({ error: 'Catatan tidak ditemukan.' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const callerRole = user.user_metadata?.role;
    const isAuthor = entry.author_id === user.id;
    const isStaff = callerRole === 'admin' || callerRole === 'guru' || callerRole === 'kepala_sekolah';

    const updatePayload: Record<string, any> = {};

    if (catatan !== undefined) {
      if (!isAuthor && callerRole !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Akses ditolak: Anda hanya dapat mengubah isi pesan yang Anda tulis sendiri.' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      updatePayload.catatan = String(catatan).slice(0, 2000);
    }

    if (is_read_by_guru !== undefined) {
      if (!isStaff) {
        return new Response(
          JSON.stringify({ error: 'Akses ditolak: Hanya guru atau wali kelas yang dapat menandai pesan telah dibaca.' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      updatePayload.is_read_by_guru = Boolean(is_read_by_guru);
    }

    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/buku_penghubung?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(updatePayload),
    });

    if (!patchRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Gagal memperbarui catatan buku penghubung di database.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const updatedData = await patchRes.json();
    return new Response(
      JSON.stringify({ success: true, data: updatedData }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err: any) {
    console.error('Exception PATCH buku_penghubung:', err);
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan sistem saat memperbarui data.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

export async function onRequestPost(context: any) {
  try {
    initSupabaseUrl(context);
    const { key: serviceKey } = getSupabaseConfig(context);
    if (!serviceKey) {
      return new Response(
        JSON.stringify({ error: 'Konfigurasi server SUPABASE_SERVICE_ROLE_KEY belum disetel.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    const user = await verifyAuth(context, serviceKey);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Akses ditolak: Sesi tidak valid atau belum login.' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const body = await context.request.json();
    const { siswa_id, catatan, author_role, parent_entry_id } = body;

    if (!siswa_id || !catatan || typeof catatan !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Data siswa_id dan catatan wajib diisi.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const callerRole = user.user_metadata?.role;
    const isStaff = callerRole === 'admin' || callerRole === 'guru' || callerRole === 'kepala_sekolah';

    // Verify parent has rights to this student
    if (!isStaff) {
      const siswaCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/siswa?id=eq.${encodeURIComponent(siswa_id)}&select=id,wali_murid_id`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      });
      if (siswaCheckRes.ok) {
        const sRows = await siswaCheckRes.json();
        const student = sRows?.[0];
        const isLinkedGuardian = student && (student.wali_murid_id === user.id || user.user_metadata?.siswa_id === siswa_id);
        if (!isLinkedGuardian) {
          return new Response(
            JSON.stringify({ error: 'Akses ditolak: Anda hanya dapat mengirim catatan buku penghubung untuk siswa yang terhubung dengan akun Anda.' }),
            { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
      }
    }

    const role = author_role === 'orangtua' ? 'orangtua' : 'guru';
    const isReadByGuru = role === 'guru';

    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/buku_penghubung?select=id,siswa_id,author_id,author_role,catatan,parent_entry_id,is_read_by_guru,created_at,users_profile:author_id(nama),siswa:siswa_id(id,nama_lengkap,nis,nisn,jenis_kelamin,nama_wali,no_hp_wali,kelas:kelas_id(id,nama_kelas))`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        siswa_id,
        author_id: user.id,
        author_role: role,
        catatan: catatan.slice(0, 2000),
        parent_entry_id: parent_entry_id || null,
        is_read_by_guru: isReadByGuru,
      }),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      console.error('Error insert buku_penghubung:', errText);
      return new Response(
        JSON.stringify({ error: 'Gagal menyimpan catatan buku penghubung.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const insertedRows = await insertRes.json();
    return new Response(
      JSON.stringify({ success: true, data: insertedRows?.[0] || insertedRows }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err: any) {
    console.error('Exception POST buku_penghubung:', err);
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan sistem saat menyimpan data.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}
