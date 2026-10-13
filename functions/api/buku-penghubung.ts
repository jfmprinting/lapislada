// Cloudflare Pages Function for Buku Penghubung API
// Runs on Cloudflare Edge Serverless Workers

const SUPABASE_URL = 'https://fqggetataxahzbwchbsh.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxZ2dldGF0YXhhaHpid2NoYnNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY1MTIzNCwiZXhwIjoyMTA1MjI3MjM0fQ.xVkO2Bvah-xYsQnFbb0MdkK823vDMsDqwJc_hI8rE2s';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestDelete(context: any) {
  try {
    const serviceKey = context.env?.SUPABASE_SERVICE_ROLE_KEY || SERVICE_ROLE_KEY;
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

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID catatan buku penghubung wajib disertakan.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const delRes = await fetch(`${SUPABASE_URL}/rest/v1/buku_penghubung?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    if (!delRes.ok) {
      const errText = await delRes.text();
      console.error('Error delete buku_penghubung:', errText);
      return new Response(
        JSON.stringify({ error: 'Gagal menghapus catatan buku penghubung.' }),
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
      JSON.stringify({ error: err.message || 'Terjadi kesalahan sistem.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

export async function onRequestPatch(context: any) {
  try {
    const serviceKey = context.env?.SUPABASE_SERVICE_ROLE_KEY || SERVICE_ROLE_KEY;
    const body = await context.request.json();
    const { id, catatan, is_read_by_guru } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'ID catatan wajib disertakan.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const updatePayload: Record<string, any> = {};
    if (catatan !== undefined) updatePayload.catatan = catatan;
    if (is_read_by_guru !== undefined) updatePayload.is_read_by_guru = is_read_by_guru;

    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/buku_penghubung?id=eq.${id}`, {
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
      const errText = await patchRes.text();
      console.error('Error PATCH buku_penghubung:', errText);
      return new Response(
        JSON.stringify({ error: 'Gagal memperbarui catatan buku penghubung.' }),
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
      JSON.stringify({ error: err.message || 'Terjadi kesalahan sistem.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}
