import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fqggetataxahzbwchbsh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxZ2dldGF0YXhhaHpid2NoYnNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTEyMzQsImV4cCI6MjEwNTIyNzIzNH0.d5FM0HOkYVfPws2y7mU71ouQvXB2Y1ENvoL3MT3WaZg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Creates an ephemeral Supabase client without persisting sessions to localStorage.
 * Ideal for creating new user accounts (auth.signUp) on behalf of users without signing out the current admin.
 */
export const createEphemeralClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

export type ProfilSekolah = {
  id: string;
  nama_sekolah: string;
  npsn: string;
  nss?: string | null;
  nis?: string | null;
  akreditasi?: string | null;
  tahun_berdiri?: number | null;
  alamat?: string | null;
  kecamatan?: string | null;
  kabupaten?: string | null;
  provinsi?: string | null;
  kode_pos?: string | null;
  telepon?: string | null;
  hp_kepsek?: string | null;
  email?: string | null;
  visi?: string | null;
  misi?: string | null;
  logo_url?: string | null;
  maps_embed_url?: string | null;
  updated_at?: string;
};

export type UserProfile = {
  id: string;
  nama: string;
  role: 'admin' | 'guru' | 'orangtua';
  email?: string | null;
  telepon?: string | null;
  created_at?: string;
};

export type BukuPenghubungItem = {
  id: string;
  siswa_id: string;
  author_id: string;
  author_role: 'guru' | 'orangtua';
  catatan: string;
  parent_entry_id?: string | null;
  is_read_by_guru: boolean;
  created_at: string;
  users_profile?: {
    nama: string;
  };
  siswa?: {
    nama_lengkap: string;
  };
};

export type DokumenBOS = {
  id: string;
  judul: string;
  kategori: string;
  link_gdrive: string;
  tahun_anggaran: number;
  triwulan?: number | null;
  uploaded_by?: string | null;
  created_at?: string;
  updated_at?: string;
  users_profile?: {
    nama: string;
  };
};

export type Siswa = {
  id: string;
  nisn?: string | null;
  nis?: string | null;
  nama_lengkap: string;
  jenis_kelamin?: 'L' | 'P' | null;
  kelas_id?: string | null;
  wali_murid_id?: string | null;
  nama_wali?: string | null;
  no_hp_wali?: string | null;
  alamat?: string | null;
  created_at?: string;
  kelas?: {
    nama_kelas: string;
  };
};

export type Kelas = {
  id: string;
  nama_kelas: string;
  wali_kelas_id?: string | null;
  tahun_ajaran: string;
  created_at?: string;
  wali_kelas?: {
    id: string;
    nama: string;
    email?: string | null;
    telepon?: string | null;
  };
};

export type Mapel = {
  id: string;
  nama_mapel: string;
  kkm: number;
  created_at?: string;
};

export type Kehadiran = {
  id: string;
  siswa_id: string;
  kelas_id: string;
  tanggal: string;
  status: 'H' | 'S' | 'I' | 'A';
  keterangan?: string | null;
};

