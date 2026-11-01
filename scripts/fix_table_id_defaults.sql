-- =========================================================================
-- PERBAIKAN DEFAULT ID UUID OTOMATIS PADA SELURUH TABEL POSTGRESQL
-- Mengatasi error: null value in column "id" violates not-null constraint
-- =========================================================================

-- 1. Pastikan ekstensi pgcrypto / uuid-ossp aktif
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Pasang default ID otomatis (gen_random_uuid()::text) untuk tabel dengan id TEXT
ALTER TABLE public.pengumuman 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE public.dokumen_bos 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE public.materi 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE public.siswa 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE public.kelas 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE public.mapel 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE public.jenis_asesmen 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE public.galeri_kegiatan 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

ALTER TABLE public.kaih_kegiatan 
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- 3. Untuk tabel users_profile (tipe id UUID)
ALTER TABLE public.users_profile 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
