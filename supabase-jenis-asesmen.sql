-- =========================================================================
-- LAPIS LADA: Tabel Jenis Asesmen / Ujian & Kebijakan Akses (RLS)
-- Jalankan skrip ini di SQL Editor dashboard Supabase
-- =========================================================================

-- 1. Buat Tabel public.jenis_asesmen jika belum ada
CREATE TABLE IF NOT EXISTS public.jenis_asesmen (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    kategori TEXT NOT NULL CHECK (kategori IN ('Formatif', 'Sumatif')),
    kode TEXT,
    aktif BOOLEAN NOT NULL DEFAULT true,
    urutan INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.jenis_asesmen ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Guru, Admin, Kepala Sekolah, dan Publik dapat membaca jenis asesmen
DROP POLICY IF EXISTS "Lihat jenis asesmen" ON public.jenis_asesmen;
CREATE POLICY "Lihat jenis asesmen"
    ON public.jenis_asesmen FOR SELECT
    TO anon, authenticated
    USING (true);

-- 4. Policy: Admin, Guru, dan Kepala Sekolah dapat mengelola jenis asesmen
DROP POLICY IF EXISTS "Kelola jenis asesmen" ON public.jenis_asesmen;
CREATE POLICY "Kelola jenis asesmen"
    ON public.jenis_asesmen FOR ALL
    TO authenticated
    USING (
        public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah')
        OR (auth.jwt()->'user_metadata'->>'role') IN ('admin', 'guru', 'kepala_sekolah')
        OR (auth.jwt()->'user_metadata'->>'jabatan') = 'kepala_sekolah'
    )
    WITH CHECK (
        public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah')
        OR (auth.jwt()->'user_metadata'->>'role') IN ('admin', 'guru', 'kepala_sekolah')
        OR (auth.jwt()->'user_metadata'->>'jabatan') = 'kepala_sekolah'
    );

-- 5. Data Awal Bawaan Sistem (Default Seed)
INSERT INTO public.jenis_asesmen (id, nama, kategori, kode, aktif, urutan)
VALUES
('ja-1', 'Formatif (Tujuan Pembelajaran 1)', 'Formatif', 'FTP1', true, 1),
('ja-2', 'Formatif (Tujuan Pembelajaran 2)', 'Formatif', 'FTP2', true, 2),
('ja-3', 'Sumatif Lingkup Materi (Bab 1)', 'Sumatif', 'SLM1', true, 3),
('ja-4', 'Sumatif Lingkup Materi (Bab 2)', 'Sumatif', 'SLM2', true, 4),
('ja-5', 'Sumatif Tengah Semester (STS / UTS)', 'Sumatif', 'STS', true, 5),
('ja-6', 'Sumatif Akhir Semester (SAS / PAS)', 'Sumatif', 'SAS', true, 6)
ON CONFLICT (id) DO NOTHING;
