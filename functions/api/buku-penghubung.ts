// Cloudflare Pages Function for Buku Penghubung API
// Protected by Caller Authentication Verification

const SUPABASE_URL = 'https://fqggetataxahzbwchbsh.supabase.co';
const FALLBACK_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxZ2dldGF0YXhhaHpid2NoYnNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY1MTIzNCwiZXhwIjoyMTA1MjI3MjM0fQ.xVkO2Bvah-xYsQnFbb0MdkK823vDMsDqwJc_hI8rE2s';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

async function verifyAuth(context: any, serviceKey: string) {
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
    const serviceKey = context.env?.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_KEY;
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
    const serviceKey = context.env?.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_KEY;
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

    const updatePayload: Record<string, any> = {};
    if (catatan !== undefined) updatePayload.catatan = String(catatan).slice(0, 2000);
    if (is_read_by_guru !== undefined) updatePayload.is_read_by_guru = Boolean(is_read_by_guru);

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
