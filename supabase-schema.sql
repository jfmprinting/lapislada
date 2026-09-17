-- =========================================================
-- LAPIS LADA v2 — Database Schema & Row Level Security (RLS)
-- Target: Supabase (PostgreSQL)
-- Single Source of Truth: lapislada-prd-v2.md
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel Profil Sekolah (Fitur 6.3 PRD - 1 record per deployment)
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
    logo_url TEXT DEFAULT '',
    maps_embed_url TEXT DEFAULT 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.854890696347!2d111.7766!3d-6.7865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNDcnMTEuNCJTIDExMcKwNDYnMzUuOCJF!5e0!3m2!1sid!2sid!4v1',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Users Profile (Integrasi dengan Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS public.users_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'guru', 'orangtua')),
    email TEXT,
    telepon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Kelas
CREATE TABLE IF NOT EXISTS public.kelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kelas TEXT NOT NULL, -- contoh: 'Kelas 4A', 'Kelas 1'
    wali_kelas_id UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
    tahun_ajaran TEXT NOT NULL DEFAULT '2025/2026',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Siswa
CREATE TABLE IF NOT EXISTS public.siswa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nisn TEXT UNIQUE,
    nis TEXT,
    nama_lengkap TEXT NOT NULL,
    jenis_kelamin TEXT CHECK (jenis_kelamin IN ('L', 'P')),
    kelas_id UUID REFERENCES public.kelas(id) ON DELETE SET NULL,
    wali_murid_id UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
    nama_wali TEXT,
    no_hp_wali TEXT,
    alamat TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Kehadiran (Modul 01)
CREATE TABLE IF NOT EXISTS public.kehadiran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
    kelas_id UUID NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('H', 'S', 'I', 'A')), -- Hadir, Sakit, Izin, Alpha
    keterangan TEXT,
    recorded_by UUID REFERENCES public.users_profile(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(siswa_id, tanggal)
);

-- 6. Tabel Mapel (Mata Pelajaran)
CREATE TABLE IF NOT EXISTS public.mapel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_mapel TEXT NOT NULL,
    kkm NUMERIC DEFAULT 75,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel Nilai Siswa (Modul 02)
CREATE TABLE IF NOT EXISTS public.nilai (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
    mapel_id UUID NOT NULL REFERENCES public.mapel(id) ON DELETE CASCADE,
    jenis_ujian TEXT NOT NULL, -- UH1, UTS, UAS, Tugas, dll
    nilai NUMERIC NOT NULL,
    semester INT DEFAULT 1,
    tahun_ajaran TEXT DEFAULT '2025/2026',
    created_by UUID REFERENCES public.users_profile(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabel Buku Penghubung (Dua Arah - Fitur 6.1 PRD v2)
CREATE TABLE IF NOT EXISTS public.buku_penghubung (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
    author_role TEXT NOT NULL CHECK (author_role IN ('guru', 'orangtua')),
    catatan TEXT NOT NULL CHECK (char_length(catatan) <= 500),
    parent_entry_id UUID REFERENCES public.buku_penghubung(id) ON DELETE CASCADE,
    is_read_by_guru BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabel Dokumen BOS (Fitur 6.2 PRD v2 - Khusus Guru & Admin)
CREATE TABLE IF NOT EXISTS public.dokumen_bos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul TEXT NOT NULL,
    kategori TEXT NOT NULL, -- SPJ / RKAS / Laporan / SK / lainnya
    link_gdrive TEXT NOT NULL,
    tahun_anggaran INT NOT NULL,
    triwulan INT CHECK (triwulan BETWEEN 1 AND 4),
    uploaded_by UUID REFERENCES public.users_profile(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tabel Pengumuman (Modul 05)
CREATE TABLE IF NOT EXISTS public.pengumuman (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul TEXT NOT NULL,
    konten TEXT NOT NULL,
    kelas_id UUID REFERENCES public.kelas(id) ON DELETE CASCADE, -- NULL jika untuk seluruh sekolah
    target_role TEXT DEFAULT 'semua' CHECK (target_role IN ('semua', 'guru', 'orangtua')),
    created_by UUID REFERENCES public.users_profile(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Tabel Materi Google Drive (Modul 06)
CREATE TABLE IF NOT EXISTS public.materi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul TEXT NOT NULL,
    deskripsi TEXT,
    kelas_id UUID REFERENCES public.kelas(id) ON DELETE CASCADE,
    mapel_id UUID REFERENCES public.mapel(id) ON DELETE CASCADE,
    link_gdrive TEXT NOT NULL,
    created_by UUID REFERENCES public.users_profile(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Tabel KAIH (Modul 07 - 7 Kebiasaan Anak Indonesia Hebat)
CREATE TABLE IF NOT EXISTS public.kaih (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
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

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

-- Enable RLS di semua tabel
ALTER TABLE public.profil_sekolah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kehadiran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buku_penghubung ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dokumen_bos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaih ENABLE ROW LEVEL SECURITY;

-- Helper function: Get user role
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users_profile WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. RLS profil_sekolah: publik bisa baca, update hanya admin
CREATE POLICY "Profil sekolah publik dibaca siapapun"
    ON public.profil_sekolah FOR SELECT
    USING (true);

CREATE POLICY "Profil sekolah diubah oleh admin"
    ON public.profil_sekolah FOR UPDATE
    USING (public.get_current_role() = 'admin');

CREATE POLICY "Profil sekolah diisi admin"
    ON public.profil_sekolah FOR INSERT
    WITH CHECK (public.get_current_role() = 'admin');

-- 2. RLS users_profile: pengguna membaca profilnya atau guru/admin membaca semua
CREATE POLICY "Users baca profil sendiri"
    ON public.users_profile FOR SELECT
    USING (auth.uid() = id OR public.get_current_role() IN ('admin', 'guru'));

CREATE POLICY "Admin kelola users_profile"
    ON public.users_profile FOR ALL
    USING (public.get_current_role() = 'admin');

CREATE POLICY "User update profil sendiri"
    ON public.users_profile FOR UPDATE
    USING (auth.uid() = id);

-- 3. RLS kelas: Semua authenticated user bisa melihat kelas, guru/admin kelola
CREATE POLICY "Lihat kelas"
    ON public.kelas FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin kelola kelas"
    ON public.kelas FOR ALL
    USING (public.get_current_role() = 'admin');

-- 4. RLS siswa:
-- Orang tua hanya melihat data anaknya
-- Guru & Admin melihat semua siswa
CREATE POLICY "Lihat siswa"
    ON public.siswa FOR SELECT
    TO authenticated
    USING (
        public.get_current_role() IN ('admin', 'guru')
        OR wali_murid_id = auth.uid()
    );

CREATE POLICY "Guru/Admin kelola siswa"
    ON public.siswa FOR ALL
    USING (public.get_current_role() IN ('admin', 'guru'));

-- 5. RLS kehadiran:
CREATE POLICY "Lihat kehadiran"
    ON public.kehadiran FOR SELECT
    TO authenticated
    USING (
        public.get_current_role() IN ('admin', 'guru')
        OR siswa_id IN (SELECT id FROM public.siswa WHERE wali_murid_id = auth.uid())
    );

CREATE POLICY "Guru/Admin input kehadiran"
    ON public.kehadiran FOR ALL
    USING (public.get_current_role() IN ('admin', 'guru'));

-- 6. RLS mapel: Semua authenticated user baca
CREATE POLICY "Lihat mapel"
    ON public.mapel FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin/Guru kelola mapel"
    ON public.mapel FOR ALL
    USING (public.get_current_role() IN ('admin', 'guru'));

-- 7. RLS nilai:
CREATE POLICY "Lihat nilai"
    ON public.nilai FOR SELECT
    TO authenticated
    USING (
        public.get_current_role() IN ('admin', 'guru')
        OR siswa_id IN (SELECT id FROM public.siswa WHERE wali_murid_id = auth.uid())
    );

CREATE POLICY "Guru/Admin kelola nilai"
    ON public.nilai FOR ALL
    USING (public.get_current_role() IN ('admin', 'guru'));

-- 8. RLS buku_penghubung (Core Feature 6.1):
-- SELECT: Guru/Admin lihat semua catatan kelasnya/sekolah; Ortu hanya lihat catatan anaknya
CREATE POLICY "Baca buku penghubung"
    ON public.buku_penghubung FOR SELECT
    TO authenticated
    USING (
        public.get_current_role() IN ('admin', 'guru')
        OR siswa_id IN (SELECT id FROM public.siswa WHERE wali_murid_id = auth.uid())
    );

-- INSERT: Guru bisa menulis untuk siswa manapun; Ortu hanya bisa menulis untuk anaknya sendiri
CREATE POLICY "Tulis buku penghubung"
    ON public.buku_penghubung FOR INSERT
    TO authenticated
    WITH CHECK (
        (public.get_current_role() IN ('admin', 'guru') AND author_role = 'guru')
        OR
        (public.get_current_role() = 'orangtua' AND author_role = 'orangtua' AND siswa_id IN (
            SELECT id FROM public.siswa WHERE wali_murid_id = auth.uid()
        ))
    );

CREATE POLICY "Update buku penghubung (mark as read)"
    ON public.buku_penghubung FOR UPDATE
    TO authenticated
    USING (
        public.get_current_role() IN ('admin', 'guru')
    );

-- 9. RLS dokumen_bos (Fitur 6.2): HANYA Guru dan Admin
CREATE POLICY "Dokumen BOS hanya guru dan admin"
    ON public.dokumen_bos FOR ALL
    TO authenticated
    USING (public.get_current_role() IN ('admin', 'guru'))
    WITH CHECK (public.get_current_role() IN ('admin', 'guru'));

-- 10. RLS pengumuman:
CREATE POLICY "Baca pengumuman"
    ON public.pengumuman FOR SELECT
    TO authenticated
    USING (
        target_role = 'semua'
        OR target_role = public.get_current_role()
        OR public.get_current_role() = 'admin'
    );

CREATE POLICY "Guru/Admin buat pengumuman"
    ON public.pengumuman FOR ALL
    USING (public.get_current_role() IN ('admin', 'guru'));

-- 11. RLS materi:
CREATE POLICY "Baca materi"
    ON public.materi FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Guru kelola materi"
    ON public.materi FOR ALL
    USING (public.get_current_role() IN ('admin', 'guru'));

-- 12. RLS KAIH:
CREATE POLICY "Baca KAIH"
    ON public.kaih FOR SELECT
    TO authenticated
    USING (
        public.get_current_role() IN ('admin', 'guru')
        OR siswa_id IN (SELECT id FROM public.siswa WHERE wali_murid_id = auth.uid())
    );

CREATE POLICY "Input KAIH"
    ON public.kaih FOR ALL
    USING (
        public.get_current_role() IN ('admin', 'guru')
        OR siswa_id IN (SELECT id FROM public.siswa WHERE wali_murid_id = auth.uid())
    );

-- Trigger untuk sync auto-create users_profile saat user baru terdaftar di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users_profile (id, nama, role, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'orangtua'),
        NEW.email
    )
    ON CONFLICT (id) DO UPDATE SET
        nama = EXCLUDED.nama,
        role = EXCLUDED.role,
        email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inisialisasi awal profil sekolah 1 baris
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
) ON CONFLICT DO NOTHING;
