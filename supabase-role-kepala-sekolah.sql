-- =========================================================================
-- LAPIS LADA: Migrasi SQL untuk Menambahkan Role Kepala Sekolah
-- Jalankan skrip ini di SQL Editor dashboard Supabase untuk menambahkan
-- role 'kepala_sekolah' secara native pada tabel public.users_profile
-- =========================================================================

-- 1. Perbarui check constraint pada tabel users_profile
ALTER TABLE public.users_profile 
    DROP CONSTRAINT IF EXISTS users_profile_role_check;

ALTER TABLE public.users_profile 
    ADD CONSTRAINT users_profile_role_check 
    CHECK (role IN ('admin', 'guru', 'orangtua', 'kepala_sekolah'));

-- 2. Perbarui trigger handle_new_user agar mengizinkan role kepala_sekolah
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users_profile (id, nama, role, email)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'nama', 'Pengguna Baru'),
        COALESCE(new.raw_user_meta_data->>'role', 'guru'),
        new.email
    )
    ON CONFLICT (id) DO UPDATE SET
        nama = EXCLUDED.nama,
        role = EXCLUDED.role,
        email = EXCLUDED.email;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Perbarui RLS Policy jika ada yang menyaring role
-- Kepala sekolah diberikan hak SELECT (read-only) luas untuk seluruh data sekolah
CREATE POLICY "Kepala sekolah baca semua data siswa"
    ON public.siswa FOR SELECT
    TO authenticated
    USING (
        public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah')
    );

CREATE POLICY "Kepala sekolah baca semua kehadiran"
    ON public.kehadiran FOR SELECT
    TO authenticated
    USING (
        public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah')
    );

CREATE POLICY "Kepala sekolah baca semua nilai"
    ON public.nilai FOR SELECT
    TO authenticated
    USING (
        public.get_current_role() IN ('admin', 'guru', 'kepala_sekolah')
    );
