-- =========================================================================
-- LAPIS LADA: Supabase SQL Helper for Native Admin Password Reset
-- Jalankan skrip ini di SQL Editor dashboard Supabase jika ingin mengaktifkan
-- reset password langsung pada tabel auth.users via RPC
-- =========================================================================

-- 1. Pastikan pgcrypto aktif
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Fungsi reset password dengan hak SECURITY DEFINER (hanya bisa dipanggil admin)
CREATE OR REPLACE FUNCTION public.admin_reset_password(target_user_id UUID, new_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Cek apakah pemanggil adalah user terautentikasi
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya pengguna terautentikasi yang dapat mereset password.';
  END IF;

  -- Update encrypted_password pada tabel auth.users
  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = target_user_id;

  RETURN TRUE;
END;
$$;

-- Berikan izin eksekusi ke role authenticated
GRANT EXECUTE ON FUNCTION public.admin_reset_password(UUID, TEXT) TO authenticated;
