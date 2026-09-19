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
  tujuan?: string | null;
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

export type Nilai = {
  id: string;
  siswa_id: string;
  mapel_id: string;
  jenis_ujian: string; // Formatif, Sumatif 1, UTS, UAS/SAS, Tugas
  nilai: number;
  semester?: number;
  tahun_ajaran?: string;
  catatan?: string | null;
  created_by?: string | null;
  created_at?: string;
  siswa?: Siswa;
  mapel?: Mapel;
};

export type GaleriKegiatan = {
  id: string;
  judul: string;
  kategori: string;
  tanggal: string;
  foto_url: string;
  deskripsi?: string | null;
  created_by?: string | null;
  created_at?: string;
};

export interface PilarKaih {
  id: number;
  judul: string;
  deskripsi: string;
  badge: string;
  ikon: string;
  bgHex: string;
  textHex: string;
}

export const PILAR_KAIH: PilarKaih[] = [
  {
    id: 1,
    judul: 'Bangun Pagi & Merapikan Tempat Tidur',
    deskripsi: 'Disiplin mengawali hari sebelum subuh/pagi dan merapikan kamar.',
    badge: 'Disiplin',
    ikon: '🌅',
    bgHex: '#FEF9E7',
    textHex: '#B7950B',
  },
  {
    id: 2,
    judul: 'Beribadah Tepat Waktu',
    deskripsi: 'Menjalankan sholat berjamaah / kewajiban ibadah sesuai agamanya.',
    badge: 'Religius',
    ikon: '🕌',
    bgHex: '#E8F8F5',
    textHex: '#117A65',
  },
  {
    id: 3,
    judul: 'Berolahraga / Aktivitas Fisik',
    deskripsi: 'Senam pagi, peregangan, atau olahraga gerak badan 15-30 menit.',
    badge: 'Kebugaran',
    ikon: '🏃',
    bgHex: '#EBF5FB',
    textHex: '#2980B9',
  },
  {
    id: 4,
    judul: 'Gemar Belajar & Membaca Buku',
    deskripsi: 'Membaca buku literasi non-pelajaran atau mengulang materi pelajaran.',
    badge: 'Literasi',
    ikon: '📚',
    bgHex: '#F4ECF7',
    textHex: '#884EA0',
  },
  {
    id: 5,
    judul: 'Makan Makanan Bergizi Seimbang',
    deskripsi: 'Sarapan bernutrisi, perbanyak air putih, dan konsumsi sayur/buah.',
    badge: 'Gizi Sehat',
    ikon: '🥗',
    bgHex: '#EAFAF1',
    textHex: '#27AE60',
  },
  {
    id: 6,
    judul: 'Bermasyarakat & Membantu Orang Tua',
    deskripsi: 'Sopan santun kepada sesama, membantu pekerjaan rumah, gotong royong.',
    badge: 'Gotong Royong',
    ikon: '🤝',
    bgHex: '#FBEEE6',
    textHex: '#BA4A00',
  },
  {
    id: 7,
    judul: 'Tidur Cepat (Tepat Waktu)',
    deskripsi: 'Istirahat malam maksimal pukul 21.00 WIB untuk menjaga kesehatan.',
    badge: 'Kesehatan',
    ikon: '🌙',
    bgHex: '#F2F4F4',
    textHex: '#566573',
  },
];

export type KaihKegiatan = {
  id: string;
  tipe: 'sekolah' | 'rumah';
  kelas_id?: string | null;
  siswa_id?: string | null;
  kategori_id: number;
  kategori_nama: string;
  judul: string;
  deskripsi?: string | null;
  jam?: string | null;
  tanggal: string; // YYYY-MM-DD
  foto_url?: string | null;
  created_by?: string | null;
  creator_nama?: string | null;
  apresiasi_guru?: boolean;
  catatan_guru?: string | null;
  created_at?: string;
  siswa?: {
    nama_lengkap: string;
    kelas?: {
      nama_kelas: string;
    };
  };
};

/**
 * Mengompresi file gambar dari kamera atau galeri HP secara instan di browser
 * Menghasilkan Data URL (JPEG/WebP) ukuran kompak (~60-120 KB)
 */
export async function compressImageFile(
  file: File,
  maxWidth = 960,
  maxHeight = 960,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Prioritaskan WebP jika didukung, fallback JPEG
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch (e) {
          // ignore fallback
        }
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}




