-- =========================================================================
-- PERBAIKAN SUPABASE STORAGE & ROW LEVEL SECURITY (RLS) UNTUK MENU KAIH
-- Jalankan skrip ini di Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kgufgvhbukartxqxbeyl/sql
-- =========================================================================

-- 1. Pastikan bucket 'kaih-photos' ada dan bersifat PUBLIK
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'kaih-photos',
    'kaih-photos',
    true,
    5242880, -- Batas 5 MB per foto
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- 2. Kebijakan RLS Storage agar publik bisa membaca foto kegiatan
DROP POLICY IF EXISTS "Public Read kaih-photos" ON storage.objects;
CREATE POLICY "Public Read kaih-photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'kaih-photos');

-- 3. Kebijakan RLS Storage agar pengguna (guru & wali murid) bisa mengunggah foto
DROP POLICY IF EXISTS "Allow Upload kaih-photos" ON storage.objects;
CREATE POLICY "Allow Upload kaih-photos"
    ON storage.objects FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'kaih-photos');

DROP POLICY IF EXISTS "Allow Update kaih-photos" ON storage.objects;
CREATE POLICY "Allow Update kaih-photos"
    ON storage.objects FOR UPDATE
    TO anon, authenticated
    USING (bucket_id = 'kaih-photos');

DROP POLICY IF EXISTS "Allow Delete kaih-photos" ON storage.objects;
CREATE POLICY "Allow Delete kaih-photos"
    ON storage.objects FOR DELETE
    TO anon, authenticated
    USING (bucket_id = 'kaih-photos');

-- 4. Kebijakan RLS Tabel public.kaih_kegiatan
ALTER TABLE public.kaih_kegiatan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lihat kegiatan KAIH" ON public.kaih_kegiatan;
CREATE POLICY "Lihat kegiatan KAIH"
    ON public.kaih_kegiatan FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Kelola kegiatan KAIH" ON public.kaih_kegiatan;
CREATE POLICY "Kelola kegiatan KAIH"
    ON public.kaih_kegiatan FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

