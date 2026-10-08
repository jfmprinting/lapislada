-- =========================================================================
-- LAPIS LADA: Tabel Galeri Kegiatan Sekolah & Kebijakan Akses (RLS)
-- Jalankan skrip ini di SQL Editor dashboard Supabase
-- =========================================================================

-- 1. Buat Tabel public.galeri_kegiatan jika belum ada
CREATE TABLE IF NOT EXISTS public.galeri_kegiatan (
    id TEXT PRIMARY KEY,
    judul TEXT NOT NULL,
    kategori TEXT NOT NULL DEFAULT 'Pramuka & Ekskul',
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    foto_url TEXT NOT NULL,
    deskripsi TEXT,
    created_by UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.galeri_kegiatan ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Publik (Anon & Authenticated) dapat melihat galeri foto kegiatan
DROP POLICY IF EXISTS "Publik dapat melihat galeri" ON public.galeri_kegiatan;
CREATE POLICY "Publik dapat melihat galeri"
    ON public.galeri_kegiatan FOR SELECT
    TO anon, authenticated
    USING (true);

-- 4. Policy: Admin, Guru, dan Kepala Sekolah dapat menambah, mengedit, dan menghapus galeri
DROP POLICY IF EXISTS "Kelola galeri kegiatan" ON public.galeri_kegiatan;
CREATE POLICY "Kelola galeri kegiatan"
    ON public.galeri_kegiatan FOR ALL
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

-- 5. Data Awal Bawaan Sekolah (Default Seed)
INSERT INTO public.galeri_kegiatan (id, judul, kategori, tanggal, foto_url, deskripsi)
VALUES
('g-1', 'Upacara Bendera Khidmat Memperingati Hari Pendidikan Nasional', 'Upacara & Nasionalisme', '2026-05-02', '/hero-upacara.jpg', 'Seluruh peserta didik dan dewan guru UPT SD Negeri Latsari 2 Bancar mengikuti upacara bendera dengan khidmat. Membangun kedisiplinan dan rasa cinta tanah air sejak dini.'),
('g-2', 'Latihan Gabungan Kepramukaan Siaga & Penggalang', 'Pramuka & Ekskul', '2026-08-14', '/galeri-pramuka.jpg', 'Kegiatan kepramukaan mengasah kemandirian, keterampilan tali-temali, pioneering, dan kerjasama beregu di halaman sekolah yang asri.'),
('g-3', 'Pembiasaan Sholat Dhuha Berjamaah & Budi Pekerti Mulia', 'Keagamaan & Karakter', '2026-09-04', '/galeri-keagamaan.jpg', 'Rutinitas keagamaan setiap pagi di musholla sekolah sebagai wujud nyata penguatan Profil Pelajar Pancasila yang beriman dan bertakwa kepada Tuhan YME.'),
('g-4', 'Gerakan Literasi Membaca Bersama di Pojok Baca Ceria', 'Akademik & Literasi', '2026-09-11', '/galeri-literasi.jpg', 'Peserta didik aktif membaca buku cerita edukatif dan berdiskusi bersama teman sekelas untuk menumbuhkan minat baca dan nalar kritis sepanjang hayat.')
ON CONFLICT (id) DO NOTHING;
