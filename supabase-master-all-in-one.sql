-- =========================================================================
-- LAPIS LADA v2 — MASTER SETUP BASIS DATA LENGKAP (ALL-IN-ONE)
-- Jalankan skrip ini di SQL Editor Supabase pada proyek baru Anda.
-- Seluruh tabel, fungsi, trigger, dan kebijakan RLS diatur sekaligus secara urut.
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 2. TABEL PROFIL SEKOLAH
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profil_sekolah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_sekolah TEXT NOT NULL DEFAULT 'UPT SD Negeri Latsari 2 Bancar',
    npsn TEXT NOT NULL DEFAULT '20504924',
    nss TEXT DEFAULT '101050612003',
    nis TEXT DEFAULT '100020',
    akreditasi TEXT DEFAULT 'B',
    tahun_berdiri INT DEFAULT 1987,
    alamat TEXT DEFAULT 'Jl. Desa Latsari No.190',
    kecamatan TEXT DEFAULT 'Bancar',
    kabupaten TEXT DEFAULT 'Tuban',
    provinsi TEXT DEFAULT 'Jawa Timur',
    kode_pos TEXT DEFAULT '62354',
    telepon TEXT DEFAULT '(0356) 411000',
    hp_kepsek TEXT DEFAULT '082230898376',
    email TEXT DEFAULT 'sdnlatsari2@gmail.com',
    visi TEXT DEFAULT 'Terwujudnya peserta didik yang beriman, bertaqwa, cerdas, terampil, mandiri, dan berwawasan lingkungan.',
    misi TEXT DEFAULT '1. Menanamkan keimanan dan ketaqwaan melalui pengamalan ajaran agama.\n2. Melaksanakan pembelajaran dan bimbingan secara efektif.\n3. Mengembangkan potensi bakat dan minat siswa.',
    logo_url TEXT DEFAULT '/logo.webp',
    maps_embed_url TEXT DEFAULT 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.854890696347!2d111.7766!3d-6.7865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNDcnMTEuNCJTIDExMcKwNDYnMzUuOCJF!5e0!3m2!1sid!2sid!4v1',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inisialisasi awal profil sekolah
INSERT INTO public.profil_sekolah (id, nama_sekolah, npsn, nss, nis, akreditasi, tahun_berdiri, alamat, kecamatan, kabupaten, provinsi, kode_pos, hp_kepsek, email)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'UPT SD Negeri Latsari 2 Bancar',
    '20504924',
    '101050612003',
    '100020',
    'B',
    1987,
    'Jl. Desa Latsari No.190',
    'Bancar',
    'Tuban',
    'Jawa Timur',
    '62354',
    '082230898376',
    'sdnlatsari2@gmail.com'
) ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 3. TABEL USERS PROFILE (Terhubung ke auth.users)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.users_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'guru', 'orangtua', 'kepala_sekolah')),
    jabatan TEXT,
    email TEXT,
    telepon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper function: Get user role
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users_profile WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Trigger auto-create / sync users_profile saat user dibuat di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users_profile (id, nama, role, jabatan, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'orangtua'),
        NEW.raw_user_meta_data->>'jabatan',
        NEW.email
    )
    ON CONFLICT (id) DO UPDATE SET
        nama = EXCLUDED.nama,
        role = EXCLUDED.role,
        jabatan = COALESCE(EXCLUDED.jabatan, public.users_profile.jabatan),
        email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- 4. TABEL KELAS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.kelas (
    id TEXT PRIMARY KEY,
    nama_kelas TEXT NOT NULL,
    wali_kelas_id UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
    tahun_ajaran TEXT NOT NULL DEFAULT '2025/2026',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed kelas standar 1 s.d. 6
INSERT INTO public.kelas (id, nama_kelas, tahun_ajaran)
VALUES
('c1-1', 'Kelas 1', '2025/2026'),
('c1-2', 'Kelas 2', '2025/2026'),
('c1-3', 'Kelas 3', '2025/2026'),
('c1-4a', 'Kelas 4A', '2025/2026'),
('c1-5', 'Kelas 5', '2025/2026'),
('c1-6', 'Kelas 6', '2025/2026')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 5. TABEL SISWA
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.siswa (
    id TEXT PRIMARY KEY,
    nisn TEXT UNIQUE,
    nis TEXT,
    nama_lengkap TEXT NOT NULL,
    jenis_kelamin TEXT CHECK (jenis_kelamin IN ('L', 'P')),
    kelas_id TEXT REFERENCES public.kelas(id) ON DELETE SET NULL,
    wali_murid_id UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
    nama_wali TEXT,
    no_hp_wali TEXT,
    alamat TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 6. TABEL KEHADIRAN (Presensi & Izin/Sakit Mandiri)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.kehadiran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siswa_id TEXT NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
    kelas_id TEXT NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('H', 'S', 'I', 'A')),
    keterangan TEXT,
    recorded_by UUID REFERENCES public.users_profile(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(siswa_id, tanggal)
);

-- =========================================================================
-- 7. TABEL MAPEL (Mata Pelajaran)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.mapel (
    id TEXT PRIMARY KEY,
    nama_mapel TEXT NOT NULL,
    kkm NUMERIC DEFAULT 75,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed mapel standar SD
INSERT INTO public.mapel (id, nama_mapel, kkm)
VALUES
('m-pai', 'Pendidikan Agama Islam & Budi Pekerti', 75),
('m-pkn', 'Pendidikan Pancasila', 75),
('m-bin', 'Bahasa Indonesia', 75),
('m-mat', 'Matematika', 70),
('m-ipas', 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', 72),
('m-pjok', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 75),
('m-seni', 'Seni Budaya & Prakarya', 75),
('m-bjw', 'Bahasa Jawa', 75),
('m-bing', 'Bahasa Inggris', 70)
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 8. TABEL JENIS ASESMEN
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
-- 9. TABEL NILAI SISWA
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.nilai (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siswa_id TEXT NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
    mapel_id TEXT NOT NULL REFERENCES public.mapel(id) ON DELETE CASCADE,
    jenis_ujian TEXT NOT NULL,
    nilai NUMERIC NOT NULL,
    catatan TEXT,
    is_published BOOLEAN DEFAULT false,
    semester INT DEFAULT 1,
    tahun_ajaran TEXT DEFAULT '2025/2026',
    created_by UUID REFERENCES public.users_profile(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- =========================================================================
-- 10. TABEL BUKU PENGHUBUNG (Dua Arah Guru & Orang Tua)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.buku_penghubung (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siswa_id TEXT NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
    author_role TEXT NOT NULL CHECK (author_role IN ('guru', 'orangtua', 'admin')),
    catatan TEXT NOT NULL CHECK (char_length(catatan) <= 1000),
    parent_entry_id UUID REFERENCES public.buku_penghubung(id) ON DELETE CASCADE,
    is_read_by_guru BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 11. TABEL DOKUMEN BOS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.dokumen_bos (
    id TEXT PRIMARY KEY,
    judul TEXT NOT NULL,
    kategori TEXT NOT NULL,
    link_gdrive TEXT NOT NULL,
    tahun_anggaran INT NOT NULL,
    triwulan INT CHECK (triwulan BETWEEN 1 AND 4),
    uploaded_by UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 12. TABEL PENGUMUMAN
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.pengumuman (
    id TEXT PRIMARY KEY,
    judul TEXT NOT NULL,
    konten TEXT NOT NULL,
    kelas_id TEXT REFERENCES public.kelas(id) ON DELETE CASCADE,
    target_role TEXT DEFAULT 'semua' CHECK (target_role IN ('semua', 'guru', 'orangtua')),
    created_by UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.pengumuman (id, judul, konten, kelas_id, target_role)
VALUES
('p-1', 'Selamat Datang di Portal LAPIS LADA', 'Layanan Pusat Informasi Sekolah UPT SD Negeri Latsari 2 Bancar kini resmi dapat diakses secara digital.', NULL, 'semua')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 13. TABEL MATERI PELAJARAN (Google Drive)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.materi (
    id TEXT PRIMARY KEY,
    judul TEXT NOT NULL,
    deskripsi TEXT,
    kelas_id TEXT REFERENCES public.kelas(id) ON DELETE CASCADE,
    mapel_id TEXT REFERENCES public.mapel(id) ON DELETE CASCADE,
    link_gdrive TEXT NOT NULL,
    created_by UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 14. TABEL GALERI KEGIATAN
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.galeri_kegiatan (
    id TEXT PRIMARY KEY,
    judul TEXT NOT NULL,
    kategori TEXT NOT NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    foto_url TEXT NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.galeri_kegiatan (id, judul, kategori, tanggal, foto_url, deskripsi)
VALUES
('g-1', 'Upacara Bendera Khidmat Memperingati Hari Pendidikan Nasional', 'Upacara & Nasionalisme', '2026-05-02', '/hero-upacara.jpg', 'Seluruh peserta didik dan dewan guru UPT SD Negeri Latsari 2 Bancar mengikuti upacara bendera dengan khidmat. Membangun kedisiplinan dan rasa cinta tanah air sejak dini.'),
('g-2', 'Latihan Gabungan Kepramukaan Siaga & Penggalang', 'Pramuka & Ekskul', '2026-08-14', '/galeri-pramuka.jpg', 'Kegiatan kepramukaan mengasah kemandirian, keterampilan tali-temali, pioneering, dan kerjasama beregu di halaman sekolah yang asri.'),
('g-3', 'Pembiasaan Sholat Dhuha Berjamaah & Budi Pekerti Mulia', 'Keagamaan & Karakter', '2026-09-04', '/galeri-keagamaan.jpg', 'Rutinitas keagamaan setiap pagi di musholla sekolah sebagai wujud nyata penguatan Profil Pelajar Pancasila yang beriman dan bertakwa kepada Tuhan YME.'),
('g-4', 'Gerakan Literasi Membaca Bersama di Pojok Baca Ceria', 'Akademik & Literasi', '2026-09-11', '/galeri-literasi.jpg', 'Peserta didik aktif membaca buku cerita edukatif dan berdiskusi bersama teman sekelas untuk menumbuhkan minat baca dan nalar kritis sepanjang hayat.')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 15. TABEL KARAKTER KAIH (7 Kebiasaan Anak Indonesia Hebat)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.kaih (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siswa_id TEXT NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    bangun_pagi BOOLEAN DEFAULT FALSE,
    beribadah BOOLEAN DEFAULT FALSE,
    berolahraga BOOLEAN DEFAULT FALSE,
    gemar_belajar BOOLEAN DEFAULT FALSE,
    makan_sehat BOOLEAN DEFAULT FALSE,
    bermasyarakat BOOLEAN DEFAULT FALSE,
    tidur_cepat BOOLEAN DEFAULT FALSE,
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(siswa_id, tanggal)
);

CREATE TABLE IF NOT EXISTS public.kaih_kegiatan (
    id TEXT PRIMARY KEY,
    tipe TEXT NOT NULL CHECK (tipe IN ('sekolah', 'rumah')),
    kelas_id TEXT REFERENCES public.kelas(id) ON DELETE CASCADE,
    siswa_id TEXT REFERENCES public.siswa(id) ON DELETE CASCADE,
    kategori_id INT NOT NULL CHECK (kategori_id BETWEEN 1 AND 7),
    kategori_nama TEXT NOT NULL,
    judul TEXT NOT NULL,
    deskripsi TEXT,
    jam TEXT,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    foto_url TEXT,
    created_by UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
    creator_nama TEXT,
    apresiasi_guru BOOLEAN DEFAULT FALSE,
    catatan_guru TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15b. GAMIFIKASI KAIH GARDEN & FOREST
CREATE TABLE IF NOT EXISTS public.kaih_garden (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siswa_id TEXT NOT NULL,
    kelas_id TEXT NOT NULL,
    bulan_tahun TEXT NOT NULL,
    pilar_id INT NOT NULL CHECK (pilar_id BETWEEN 1 AND 7),
    xp INT NOT NULL DEFAULT 0,
    level_tanaman INT NOT NULL DEFAULT 0 CHECK (level_tanaman BETWEEN 0 AND 5),
    streak_hari INT NOT NULL DEFAULT 0,
    last_watered_at TIMESTAMPTZ,
    xp_dari_guru INT NOT NULL DEFAULT 0,
    xp_dari_ortu INT NOT NULL DEFAULT 0,
    xp_bonus_apresiasi INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (siswa_id, pilar_id, bulan_tahun)
);

CREATE TABLE IF NOT EXISTS public.kaih_class_forest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kelas_id TEXT NOT NULL,
    minggu_iso TEXT NOT NULL,
    total_siswa INT NOT NULL DEFAULT 0,
    siswa_aktif_ortu INT NOT NULL DEFAULT 0,
    siswa_aktif_guru INT NOT NULL DEFAULT 0,
    sinergi_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    total_xp_kelas INT NOT NULL DEFAULT 0,
    hutan_level INT NOT NULL DEFAULT 1 CHECK (hutan_level BETWEEN 1 AND 5),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (kelas_id, minggu_iso)
);

-- =========================================================================
-- 16. FUNGSI ADMIN RESET PASSWORD (RPC)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.admin_reset_password(target_user_id UUID, new_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya pengguna terautentikasi yang dapat mereset password.';
  END IF;

  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = target_user_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_password(UUID, TEXT) TO authenticated;

-- =========================================================================
-- 17. AKTIFKAN ROW LEVEL SECURITY (RLS) DI SEMUA TABEL
-- =========================================================================
ALTER TABLE public.profil_sekolah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kehadiran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jenis_asesmen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buku_penghubung ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dokumen_bos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeri_kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaih ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaih_kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaih_garden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaih_class_forest ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 18. KEBIJAKAN AKSES (POLICIES)
-- =========================================================================

-- Profil Sekolah
DROP POLICY IF EXISTS "Profil sekolah publik dibaca siapapun" ON public.profil_sekolah;
CREATE POLICY "Profil sekolah publik dibaca siapapun" ON public.profil_sekolah FOR SELECT USING (true);
DROP POLICY IF EXISTS "Profil sekolah diubah oleh admin" ON public.profil_sekolah;
CREATE POLICY "Profil sekolah diubah oleh admin" ON public.profil_sekolah FOR ALL USING (public.get_current_role() IN ('admin', 'kepala_sekolah'));

-- Users Profile
DROP POLICY IF EXISTS "Users baca profil sendiri" ON public.users_profile;
CREATE POLICY "Users baca profil sendiri" ON public.users_profile FOR SELECT USING (auth.uid() = id OR public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah'));
DROP POLICY IF EXISTS "Admin kelola users_profile" ON public.users_profile;
CREATE POLICY "Admin kelola users_profile" ON public.users_profile FOR ALL USING (public.get_current_role() IN ('admin', 'kepala_sekolah'));
DROP POLICY IF EXISTS "User update profil sendiri" ON public.users_profile;
CREATE POLICY "User update profil sendiri" ON public.users_profile FOR UPDATE USING (auth.uid() = id);

-- Kelas & Mapel
DROP POLICY IF EXISTS "Lihat kelas" ON public.kelas;
CREATE POLICY "Lihat kelas" ON public.kelas FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admin kelola kelas" ON public.kelas;
CREATE POLICY "Admin kelola kelas" ON public.kelas FOR ALL USING (public.get_current_role() IN ('admin', 'kepala_sekolah'));

DROP POLICY IF EXISTS "Lihat mapel" ON public.mapel;
CREATE POLICY "Lihat mapel" ON public.mapel FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admin kelola mapel" ON public.mapel;
CREATE POLICY "Admin kelola mapel" ON public.mapel FOR ALL USING (public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah'));

-- Jenis Asesmen
DROP POLICY IF EXISTS "Lihat jenis asesmen" ON public.jenis_asesmen;
CREATE POLICY "Lihat jenis asesmen" ON public.jenis_asesmen FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Kelola jenis asesmen" ON public.jenis_asesmen;
CREATE POLICY "Kelola jenis asesmen" ON public.jenis_asesmen FOR ALL TO authenticated USING (public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah'));

-- Siswa
DROP POLICY IF EXISTS "Lihat siswa" ON public.siswa;
CREATE POLICY "Lihat siswa" ON public.siswa FOR SELECT TO authenticated USING (
    public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah')
    OR wali_murid_id = auth.uid()
);
DROP POLICY IF EXISTS "Guru/Admin kelola siswa" ON public.siswa;
CREATE POLICY "Guru/Admin kelola siswa" ON public.siswa FOR ALL USING (public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah'));

-- Kehadiran
DROP POLICY IF EXISTS "Lihat kehadiran" ON public.kehadiran;
CREATE POLICY "Lihat kehadiran" ON public.kehadiran FOR SELECT TO authenticated USING (
    public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah')
    OR siswa_id IN (SELECT id FROM public.siswa WHERE wali_murid_id = auth.uid())
);
DROP POLICY IF EXISTS "Kelola kehadiran" ON public.kehadiran;
CREATE POLICY "Kelola kehadiran" ON public.kehadiran FOR ALL USING (
    public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah')
    OR siswa_id IN (SELECT id FROM public.siswa WHERE wali_murid_id = auth.uid())
);

-- Nilai
DROP POLICY IF EXISTS "Lihat nilai" ON public.nilai;
CREATE POLICY "Lihat nilai" ON public.nilai FOR SELECT TO authenticated USING (
    public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah')
    OR (
        (is_published = true)
        AND siswa_id IN (SELECT id FROM public.siswa WHERE wali_murid_id = auth.uid())
    )
);
DROP POLICY IF EXISTS "Guru/Admin kelola nilai" ON public.nilai;
CREATE POLICY "Guru/Admin kelola nilai" ON public.nilai FOR ALL USING (public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah'));

-- Buku Penghubung
DROP POLICY IF EXISTS "Baca buku penghubung" ON public.buku_penghubung;
CREATE POLICY "Baca buku penghubung" ON public.buku_penghubung FOR SELECT TO authenticated USING (
    public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah')
    OR siswa_id IN (SELECT id FROM public.siswa WHERE wali_murid_id = auth.uid())
);
DROP POLICY IF EXISTS "Tulis buku penghubung" ON public.buku_penghubung;
CREATE POLICY "Tulis buku penghubung" ON public.buku_penghubung FOR INSERT TO authenticated WITH CHECK (
    public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah')
    OR (
        public.get_current_role() = 'orangtua' 
        AND siswa_id IN (SELECT id FROM public.siswa WHERE wali_murid_id = auth.uid())
    )
);
DROP POLICY IF EXISTS "Update buku penghubung" ON public.buku_penghubung;
CREATE POLICY "Update buku penghubung" ON public.buku_penghubung FOR UPDATE TO authenticated USING (
    public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah')
);
DROP POLICY IF EXISTS "Hapus buku penghubung" ON public.buku_penghubung;
CREATE POLICY "Hapus buku penghubung" ON public.buku_penghubung FOR DELETE TO authenticated USING (
    public.get_current_role() IN ('admin', 'kepala_sekolah')
    OR author_id = auth.uid()
);

-- Galeri Kegiatan
DROP POLICY IF EXISTS "Lihat galeri publik" ON public.galeri_kegiatan;
CREATE POLICY "Lihat galeri publik" ON public.galeri_kegiatan FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Kelola galeri" ON public.galeri_kegiatan;
CREATE POLICY "Kelola galeri" ON public.galeri_kegiatan FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Pengumuman
DROP POLICY IF EXISTS "Baca pengumuman" ON public.pengumuman;
CREATE POLICY "Baca pengumuman" ON public.pengumuman FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Kelola pengumuman" ON public.pengumuman;
CREATE POLICY "Kelola pengumuman" ON public.pengumuman FOR ALL TO authenticated USING (public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah'));

-- Materi
DROP POLICY IF EXISTS "Baca materi" ON public.materi;
CREATE POLICY "Baca materi" ON public.materi FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Kelola materi" ON public.materi;
CREATE POLICY "Kelola materi" ON public.materi FOR ALL TO authenticated USING (public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah'));

-- Dokumen BOS
DROP POLICY IF EXISTS "Dokumen BOS" ON public.dokumen_bos;
CREATE POLICY "Dokumen BOS" ON public.dokumen_bos FOR ALL TO authenticated USING (public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah'));

-- KAIH
DROP POLICY IF EXISTS "Baca KAIH" ON public.kaih;
CREATE POLICY "Baca KAIH" ON public.kaih FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Kelola KAIH" ON public.kaih;
CREATE POLICY "Kelola KAIH" ON public.kaih FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Baca KAIH Kegiatan" ON public.kaih_kegiatan;
CREATE POLICY "Baca KAIH Kegiatan" ON public.kaih_kegiatan FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Kelola KAIH Kegiatan" ON public.kaih_kegiatan;
CREATE POLICY "Kelola KAIH Kegiatan" ON public.kaih_kegiatan FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Baca KAIH Garden" ON public.kaih_garden;
CREATE POLICY "Baca KAIH Garden" ON public.kaih_garden FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Kelola KAIH Garden" ON public.kaih_garden;
CREATE POLICY "Kelola KAIH Garden" ON public.kaih_garden FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Baca KAIH Forest" ON public.kaih_class_forest;
CREATE POLICY "Baca KAIH Forest" ON public.kaih_class_forest FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Kelola KAIH Forest" ON public.kaih_class_forest;
CREATE POLICY "Kelola KAIH Forest" ON public.kaih_class_forest FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

