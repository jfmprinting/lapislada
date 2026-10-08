-- =========================================================================
-- LAPIS LADA: Migrasi SQL untuk Publikasi Nilai & Catatan Asesmen
-- Jalankan skrip ini di SQL Editor dashboard Supabase
-- =========================================================================

-- 1. Tambahkan kolom catatan & is_published pada tabel public.nilai jika belum ada
ALTER TABLE public.nilai 
    ADD COLUMN IF NOT EXISTS catatan TEXT;

ALTER TABLE public.nilai 
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- 2. Tambahkan constraint unik untuk kombinasi penilaian agar upsert selalu rapi
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'nilai_siswa_mapel_ujian_unique'
    ) THEN
        ALTER TABLE public.nilai
            ADD CONSTRAINT nilai_siswa_mapel_ujian_unique 
            UNIQUE (siswa_id, mapel_id, jenis_ujian, semester, tahun_ajaran);
    END IF;
END $$;

-- 3. Perbarui RLS Policy tabel nilai agar orang tua hanya dapat melihat nilai
-- yang berstatus dipublikasikan (is_published = true) milik anaknya sendiri
DROP POLICY IF EXISTS "Lihat nilai" ON public.nilai;

CREATE POLICY "Lihat nilai"
    ON public.nilai FOR SELECT
    TO authenticated
    USING (
        -- Guru, Admin, dan Kepala Sekolah dapat melihat semua nilai (termasuk draft)
        public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah')
        OR (auth.jwt()->'user_metadata'->>'role') IN ('admin', 'guru', 'kepala_sekolah')
        OR (auth.jwt()->'user_metadata'->>'jabatan') = 'kepala_sekolah'
        -- Orang tua hanya melihat nilai anaknya yang sudah dipublikasikan (is_published = true)
        OR (
            (is_published = true)
            AND (
                siswa_id IN (SELECT id FROM public.siswa WHERE wali_murid_id = auth.uid())
                OR siswa_id = (auth.jwt()->'user_metadata'->>'siswa_id')::uuid
            )
        )
    );

-- 4. Pastikan RLS Policy tabel siswa mengizinkan orang tua membaca data anaknya
DROP POLICY IF EXISTS "Lihat siswa" ON public.siswa;

CREATE POLICY "Lihat siswa"
    ON public.siswa FOR SELECT
    TO authenticated
    USING (
        public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah')
        OR (auth.jwt()->'user_metadata'->>'role') IN ('admin', 'guru', 'kepala_sekolah')
        OR (auth.jwt()->'user_metadata'->>'jabatan') = 'kepala_sekolah'
        OR wali_murid_id = auth.uid()
        OR id = (auth.jwt()->'user_metadata'->>'siswa_id')::uuid
    );
