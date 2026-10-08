-- =========================================================================
-- LAPIS LADA: Tabel Karakter KAIH (Pembiasaan Karakter Siswa) & RLS
-- Jalankan skrip ini di SQL Editor dashboard Supabase
-- =========================================================================

-- 1. Buat Tabel public.kaih_kegiatan jika belum ada
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

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.kaih_kegiatan ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Semua pengguna (Guru, Wali Murid, Siswa) dapat membaca kegiatan KAIH
DROP POLICY IF EXISTS "Lihat kegiatan KAIH" ON public.kaih_kegiatan;
CREATE POLICY "Lihat kegiatan KAIH"
    ON public.kaih_kegiatan FOR SELECT
    TO anon, authenticated
    USING (true);

-- 4. Policy: Guru, Admin, dan Orang Tua dapat menambahkan & mengelola kegiatan KAIH
DROP POLICY IF EXISTS "Kelola kegiatan KAIH" ON public.kaih_kegiatan;
CREATE POLICY "Kelola kegiatan KAIH"
    ON public.kaih_kegiatan FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Data Awal Bawaan Karakter KAIH (Seed)
INSERT INTO public.kaih_kegiatan (id, tipe, kelas_id, siswa_id, kategori_id, kategori_nama, judul, deskripsi, jam, tanggal, foto_url, creator_nama, apresiasi_guru, catatan_guru)
VALUES
('kaih-s-1', 'sekolah', 'c1-4a', NULL, 2, 'Beribadah Tepat Waktu', 'Sholat Dhuha Berjamaah di Musholla', 'Pembiasaan sholat Dhuha bersama seluruh siswa dipimpin guru sebelum jam pertama.', '07:15 WIB', CURRENT_DATE, 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80', 'Wali Kelas', true, 'Alhamdulillah, tertib dan khusyuk.'),
('kaih-s-2', 'sekolah', 'c1-4a', NULL, 3, 'Berolahraga / Aktivitas Fisik', 'Senam Kesegaran Jasmani Bersama', 'Aktivitas fisik gerak badan dan peregangan di halaman sekolah untuk menjaga kebugaran tubuh.', '09:00 WIB', CURRENT_DATE, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80', 'Guru PJOK', true, 'Semangat dan ceria!')
ON CONFLICT (id) DO NOTHING;
