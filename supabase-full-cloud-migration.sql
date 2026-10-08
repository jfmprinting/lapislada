-- =========================================================================
-- LAPIS LADA: MASTER MIGRASI 100% FULL-CLOUD DATABASE
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda.
-- Seluruh perintah bersifat idempotent (aman dijalankan berkali-kali).
-- =========================================================================

-- =========================================================================
-- BAGIAN 1: TABEL KARAKTER KAIH (Pembiasaan Karakter Siswa 7 Kebiasaan Anak Indonesia Hebat)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.kaih_kegiatan (
    id TEXT PRIMARY KEY,
    tipe TEXT NOT NULL CHECK (tipe IN ('sekolah', 'rumah')),
    kelas_id TEXT,
    siswa_id TEXT,
    kategori_id INT NOT NULL,
    kategori_nama TEXT NOT NULL,
    judul TEXT NOT NULL,
    deskripsi TEXT,
    jam TEXT,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    foto_url TEXT,
    created_by UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
    creator_nama TEXT,
    apresiasi_guru BOOLEAN DEFAULT false,
    catatan_guru TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

INSERT INTO public.kaih_kegiatan (id, tipe, kelas_id, siswa_id, kategori_id, kategori_nama, judul, deskripsi, jam, tanggal, foto_url, creator_nama, apresiasi_guru, catatan_guru)
VALUES
('kaih-s-1', 'sekolah', 'c1-4a', NULL, 2, 'Beribadah Tepat Waktu', 'Sholat Dhuha Berjamaah di Musholla', 'Pembiasaan sholat Dhuha bersama seluruh siswa dipimpin guru sebelum jam pertama.', '07:15 WIB', CURRENT_DATE, 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80', 'Wali Kelas', true, 'Alhamdulillah, tertib dan khusyuk.'),
('kaih-s-2', 'sekolah', 'c1-4a', NULL, 3, 'Berolahraga / Aktivitas Fisik', 'Senam Kesegaran Jasmani Bersama', 'Aktivitas fisik gerak badan dan peregangan di halaman sekolah untuk menjaga kebugaran tubuh.', '09:00 WIB', CURRENT_DATE, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80', 'Guru PJOK', true, 'Semangat dan ceria!')
ON CONFLICT (id) DO NOTHING;


-- =========================================================================
-- BAGIAN 2: PENGUMUMAN SEKOLAH (Modul 05)
-- =========================================================================
ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Baca pengumuman publik" ON public.pengumuman;
CREATE POLICY "Baca pengumuman publik"
    ON public.pengumuman FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Kelola pengumuman" ON public.pengumuman;
CREATE POLICY "Kelola pengumuman"
    ON public.pengumuman FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Seed pengumuman awal jika belum ada data
INSERT INTO public.pengumuman (judul, konten, target_role)
SELECT 'Pelaksanaan Asesmen Sumatif Tengah Semester (ASTS) Ganjil', 'Diberitahukan kepada seluruh wali murid bahwa ASTS akan diselenggarakan sesuai kalender akademik. Jadwal mata pelajaran dan kisi-kisi dapat diakses melalui menu Materi.', 'semua'
WHERE NOT EXISTS (SELECT 1 FROM public.pengumuman LIMIT 1);


-- =========================================================================
-- BAGIAN 3: DOKUMEN BOS (Bantuan Operasional Sekolah)
-- =========================================================================
ALTER TABLE public.dokumen_bos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lihat dokumen BOS" ON public.dokumen_bos;
CREATE POLICY "Lihat dokumen BOS"
    ON public.dokumen_bos FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Kelola dokumen BOS" ON public.dokumen_bos;
CREATE POLICY "Kelola dokumen BOS"
    ON public.dokumen_bos FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Seed dokumen BOS awal jika belum ada data
INSERT INTO public.dokumen_bos (judul, kategori, link_gdrive, tahun_anggaran, triwulan)
SELECT 'Laporan Pertanggungjawaban (SPJ) BOS Tahap 1 2026', 'SPJ', 'https://drive.google.com/file/d/1demo-spj-bos-2026-t1/view', 2026, 1
WHERE NOT EXISTS (SELECT 1 FROM public.dokumen_bos LIMIT 1);

INSERT INTO public.dokumen_bos (judul, kategori, link_gdrive, tahun_anggaran, triwulan)
SELECT 'RKAS Perubahan BOS 2026', 'RKAS', 'https://drive.google.com/file/d/1demo-rkas-2026/view', 2026, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.dokumen_bos WHERE judul = 'RKAS Perubahan BOS 2026');

INSERT INTO public.dokumen_bos (judul, kategori, link_gdrive, tahun_anggaran, triwulan)
SELECT 'SK Tim Pengelola BOSP 2026', 'SK', 'https://drive.google.com/file/d/1demo-sk-bosp-2026/view', 2026, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.dokumen_bos WHERE judul = 'SK Tim Pengelola BOSP 2026');


-- =========================================================================
-- BAGIAN 4: PUBLIKASI NILAI & CATATAN ASESMEN (Tabel public.nilai)
-- =========================================================================
ALTER TABLE public.nilai 
    ADD COLUMN IF NOT EXISTS catatan TEXT;

ALTER TABLE public.nilai 
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

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

ALTER TABLE public.nilai ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lihat nilai" ON public.nilai;
CREATE POLICY "Lihat nilai"
    ON public.nilai FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Kelola nilai" ON public.nilai;
CREATE POLICY "Kelola nilai"
    ON public.nilai FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);


-- =========================================================================
-- BAGIAN 5: MASTER JENIS ASESMEN (public.jenis_asesmen)
-- =========================================================================
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

ALTER TABLE public.jenis_asesmen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lihat jenis asesmen" ON public.jenis_asesmen;
CREATE POLICY "Lihat jenis asesmen"
    ON public.jenis_asesmen FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Kelola jenis asesmen" ON public.jenis_asesmen;
CREATE POLICY "Kelola jenis asesmen"
    ON public.jenis_asesmen FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

INSERT INTO public.jenis_asesmen (id, nama, kategori, kode, aktif, urutan)
VALUES
('ja-1', 'Formatif (Tujuan Pembelajaran 1)', 'Formatif', 'FTP1', true, 1),
('ja-2', 'Formatif (Tujuan Pembelajaran 2)', 'Formatif', 'FTP2', true, 2),
('ja-3', 'Sumatif Lingkup Materi (Bab 1)', 'Sumatif', 'SLM1', true, 3),
('ja-4', 'Sumatif Lingkup Materi (Bab 2)', 'Sumatif', 'SLM2', true, 4),
('ja-5', 'Sumatif Tengah Semester (STS / UTS)', 'Sumatif', 'STS', true, 5),
('ja-6', 'Sumatif Akhir Semester (SAS / PAS)', 'Sumatif', 'SAS', true, 6)
ON CONFLICT (id) DO NOTHING;


-- =========================================================================
-- BAGIAN 6: GALERI KEGIATAN SEKOLAH (public.galeri_kegiatan)
-- =========================================================================
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

ALTER TABLE public.galeri_kegiatan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Publik dapat melihat galeri" ON public.galeri_kegiatan;
CREATE POLICY "Publik dapat melihat galeri"
    ON public.galeri_kegiatan FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Kelola galeri kegiatan" ON public.galeri_kegiatan;
CREATE POLICY "Kelola galeri kegiatan"
    ON public.galeri_kegiatan FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

INSERT INTO public.galeri_kegiatan (id, judul, kategori, tanggal, foto_url, deskripsi)
VALUES
('g-1', 'Upacara Bendera Khidmat Memperingati Hari Pendidikan Nasional', 'Upacara & Nasionalisme', '2026-05-02', '/hero-upacara.jpg', 'Seluruh peserta didik dan dewan guru UPT SD Negeri Latsari 2 Bancar mengikuti upacara bendera dengan khidmat. Membangun kedisiplinan dan rasa cinta tanah air sejak dini.'),
('g-2', 'Latihan Gabungan Kepramukaan Siaga & Penggalang', 'Pramuka & Ekskul', '2026-08-14', '/galeri-pramuka.jpg', 'Kegiatan kepramukaan mengasah kemandirian, keterampilan tali-temali, pioneering, dan kerjasama beregu di halaman sekolah yang asri.'),
('g-3', 'Pembiasaan Sholat Dhuha Berjamaah & Budi Pekerti Mulia', 'Keagamaan & Karakter', '2026-09-04', '/galeri-keagamaan.jpg', 'Rutinitas keagamaan setiap pagi di musholla sekolah sebagai wujud nyata penguatan Profil Pelajar Pancasila yang beriman dan bertakwa kepada Tuhan YME.'),
('g-4', 'Gerakan Literasi Membaca Bersama di Pojok Baca Ceria', 'Akademik & Literasi', '2026-09-11', '/galeri-literasi.jpg', 'Peserta didik aktif membaca buku cerita edukatif dan berdiskusi bersama teman sekelas untuk menumbuhkan minat baca dan nalar kritis sepanjang hayat.')
ON CONFLICT (id) DO NOTHING;
