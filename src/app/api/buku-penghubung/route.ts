import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fqggetataxahzbwchbsh.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxZ2dldGF0YXhhaHpid2NoYnNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY1MTIzNCwiZXhwIjoyMTA1MjI3MjM0fQ.xVkO2Bvah-xYsQnFbb0MdkK823vDMsDqwJc_hI8rE2s';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// DELETE: Hapus catatan buku penghubung
export async function DELETE(request: Request) {
  try {
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

    if (!id) {
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Catatan buku penghubung berhasil dihapus.' });
  } catch (err: any) {
    console.error('Exception DELETE buku_penghubung:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}

// PATCH: Update isi catatan buku penghubung
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, catatan, is_read_by_guru } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID catatan wajib disertakan.' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};
    if (catatan !== undefined) updatePayload.catatan = catatan;
    if (is_read_by_guru !== undefined) updatePayload.is_read_by_guru = is_read_by_guru;

    const { data, error } = await supabaseAdmin
      .from('buku_penghubung')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
