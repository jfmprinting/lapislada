-- =============================================================================
-- KAIH GARDEN GAMIFICATION MIGRATION
-- Fitur: 7 Tanaman Mini (1 per Pilar) + Hutan Kelas Bersama + Streak Tracking
-- Jalankan file ini di Supabase SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE 1: kaih_garden
-- Status tanaman gamifikasi per siswa, per bulan
-- Setiap baris = 1 bulan x 1 pilar x 1 siswa
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kaih_garden (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id         text NOT NULL,          -- referensi ke siswa.id
  kelas_id         text NOT NULL,          -- referensi ke kelas.id
  bulan_tahun      text NOT NULL,          -- format: 'YYYY-MM' (contoh: '2026-10')
  pilar_id         integer NOT NULL CHECK (pilar_id BETWEEN 1 AND 7),

  -- Game state
  xp               integer NOT NULL DEFAULT 0,
  level_tanaman    integer NOT NULL DEFAULT 0 CHECK (level_tanaman BETWEEN 0 AND 5),
  streak_hari      integer NOT NULL DEFAULT 0,
  last_watered_at  timestamptz,            -- kapan terakhir disiram

  -- Contributions breakdown
  xp_dari_guru     integer NOT NULL DEFAULT 0,
  xp_dari_ortu     integer NOT NULL DEFAULT 0,
  xp_bonus_apresiasi integer NOT NULL DEFAULT 0,

  -- Metadata
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  UNIQUE (siswa_id, pilar_id, bulan_tahun)
);

COMMENT ON TABLE public.kaih_garden IS
  'Status gamifikasi 7 tanaman karakter per siswa per bulan.';

-- -----------------------------------------------------------------------------
-- TABLE 2: kaih_class_forest
-- Agregasi hutan kelas per kelas per minggu
-- Untuk leaderboard gotong royong dan pantauan kepala sekolah
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kaih_class_forest (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas_id             text NOT NULL,
  minggu_iso           text NOT NULL,         -- format: 'YYYY-Www' (contoh: '2026-W42')

  -- Engagement metrics
  total_siswa          integer NOT NULL DEFAULT 0,
  siswa_aktif_ortu     integer NOT NULL DEFAULT 0,
  siswa_aktif_guru     integer NOT NULL DEFAULT 0,

  -- Sinergi score (0-100)
  sinergi_score        numeric(5,2) NOT NULL DEFAULT 0,

  -- Total XP kelas
  total_xp_kelas       integer NOT NULL DEFAULT 0,

  -- Maskot mingguan yang ter-unlock
  maskot_unlock        text,   -- 'kupu_emas' | 'burung_nuri' | 'rusa_hutan' | null

  -- Metadata
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  UNIQUE (kelas_id, minggu_iso)
);

COMMENT ON TABLE public.kaih_class_forest IS
  'Agregasi mingguan performa hutan kelas untuk leaderboard dan pantauan kepala sekolah.';

-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_kaih_garden_siswa_bulan
  ON public.kaih_garden (siswa_id, bulan_tahun);

CREATE INDEX IF NOT EXISTS idx_kaih_garden_kelas_bulan
  ON public.kaih_garden (kelas_id, bulan_tahun);

CREATE INDEX IF NOT EXISTS idx_kaih_class_forest_kelas_minggu
  ON public.kaih_class_forest (kelas_id, minggu_iso);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
ALTER TABLE public.kaih_garden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaih_class_forest ENABLE ROW LEVEL SECURITY;

-- Semua authenticated user bisa READ
CREATE POLICY "kaih_garden_read_all"
  ON public.kaih_garden FOR SELECT TO authenticated USING (true);

CREATE POLICY "kaih_class_forest_read_all"
  ON public.kaih_class_forest FOR SELECT TO authenticated USING (true);

-- Authenticated user bisa INSERT/UPDATE (guru & ortu)
CREATE POLICY "kaih_garden_write_authenticated"
  ON public.kaih_garden FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "kaih_class_forest_write_authenticated"
  ON public.kaih_class_forest FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Anon read (untuk preview tanpa login)
CREATE POLICY "kaih_garden_read_anon"
  ON public.kaih_garden FOR SELECT TO anon USING (true);

CREATE POLICY "kaih_class_forest_read_anon"
  ON public.kaih_class_forest FOR SELECT TO anon USING (true);

-- -----------------------------------------------------------------------------
-- HELPER FUNCTION: Konversi XP ke level tanaman
-- Thresholds: Lv0=0, Lv1=5, Lv2=15, Lv3=30, Lv4=50, Lv5=75
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kaih_xp_to_level(xp_val integer)
RETURNS integer
LANGUAGE sql IMMUTABLE AS
$$
  SELECT CASE
    WHEN xp_val >= 75 THEN 5
    WHEN xp_val >= 50 THEN 4
    WHEN xp_val >= 30 THEN 3
    WHEN xp_val >= 15 THEN 2
    WHEN xp_val >= 5  THEN 1
    ELSE 0
  END;
$$;

-- -----------------------------------------------------------------------------
-- TRIGGER: Auto-update updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS
$$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_kaih_garden_updated_at') THEN
    CREATE TRIGGER set_kaih_garden_updated_at
      BEFORE UPDATE ON public.kaih_garden
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_kaih_class_forest_updated_at') THEN
    CREATE TRIGGER set_kaih_class_forest_updated_at
      BEFORE UPDATE ON public.kaih_class_forest
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$$;

-- =============================================================================
-- SELESAI. XP Rules:
--   +3 XP  : Guru mencatat kegiatan sekolah untuk pilar tersebut
--   +4 XP  : Orang tua mencatat kegiatan rumah untuk pilar tersebut
--   +3 XP  : Guru memberikan Apresiasi (bonus "Pupuk Emas")
--   +7 XP  : Bonus "Harmoni Sempurna" (sekolah+rumah keduanya terisi 1 hari)
--   Streak : Bertambah jika ada kegiatan di hari sebelumnya
-- =============================================================================
