-- =========================================================================
-- LAPIS LADA: PENGUATAN KEAMANAN ROW LEVEL SECURITY (RLS)
-- Jalankan skrip ini di Supabase SQL Editor untuk menutup celah akses publik.
-- =========================================================================

-- 1. GALERI KEGIATAN: Publik hanya boleh melihat foto. Hanya staf/guru/admin yang boleh upload/edit/hapus.
DROP POLICY IF EXISTS "Lihat galeri publik" ON public.galeri_kegiatan;
CREATE POLICY "Lihat galeri publik" ON public.galeri_kegiatan 
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Kelola galeri" ON public.galeri_kegiatan;
CREATE POLICY "Kelola galeri" ON public.galeri_kegiatan 
  FOR ALL TO authenticated USING (
    public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah')
  ) WITH CHECK (
    public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah')
  );

-- 2. KAIH KEGIATAN: Publik boleh baca. Hanya user terautentikasi (guru/ortu) yang boleh posting.
-- Hanya pembuat (author) atau admin/guru yang boleh mengubah/menghapus.
DROP POLICY IF EXISTS "Baca KAIH Kegiatan" ON public.kaih_kegiatan;
CREATE POLICY "Baca KAIH Kegiatan" ON public.kaih_kegiatan 
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Kelola KAIH Kegiatan" ON public.kaih_kegiatan;
CREATE POLICY "Kelola KAIH Kegiatan" ON public.kaih_kegiatan 
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Ubah Hapus KAIH Kegiatan" ON public.kaih_kegiatan;
CREATE POLICY "Ubah Hapus KAIH Kegiatan" ON public.kaih_kegiatan 
  FOR ALL TO authenticated USING (
    created_by = auth.uid() OR public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah')
  ) WITH CHECK (
    created_by = auth.uid() OR public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah')
  );

-- 3. KAIH GARDEN & FOREST: Publik boleh baca, hanya akun login yang dapat menyiram/update XP.
DROP POLICY IF EXISTS "Baca KAIH Garden" ON public.kaih_garden;
CREATE POLICY "Baca KAIH Garden" ON public.kaih_garden 
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Kelola KAIH Garden" ON public.kaih_garden;
CREATE POLICY "Kelola KAIH Garden" ON public.kaih_garden 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Baca KAIH Forest" ON public.kaih_class_forest;
CREATE POLICY "Baca KAIH Forest" ON public.kaih_class_forest 
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Kelola KAIH Forest" ON public.kaih_class_forest;
CREATE POLICY "Kelola KAIH Forest" ON public.kaih_class_forest 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
