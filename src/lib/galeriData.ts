import { GaleriKegiatan } from './supabase';

export const INITIAL_GALERI: GaleriKegiatan[] = [
  {
    id: 'g-1',
    judul: 'Upacara Bendera Khidmat Memperingati Hari Pendidikan Nasional',
    kategori: 'Upacara & Nasionalisme',
    tanggal: '2026-05-02',
    foto_url: '/hero-upacara.jpg',
    deskripsi:
      'Seluruh peserta didik dan dewan guru UPT SD Negeri Latsari 2 Bancar mengikuti upacara bendera dengan khidmat. Membangun kedisiplinan dan rasa cinta tanah air sejak dini.',
  },
  {
    id: 'g-2',
    judul: 'Latihan Gabungan Kepramukaan Siaga & Penggalang',
    kategori: 'Pramuka & Ekskul',
    tanggal: '2026-08-14',
    foto_url: '/galeri-pramuka.jpg',
    deskripsi:
      'Kegiatan kepramukaan mengasah kemandirian, keterampilan tali-temali, pioneering, dan kerjasama beregu di halaman sekolah yang asri.',
  },
  {
    id: 'g-3',
    judul: 'Pembiasaan Sholat Dhuha Berjamaah & Budi Pekerti Mulia',
    kategori: 'Keagamaan & Karakter',
    tanggal: '2026-09-04',
    foto_url: '/galeri-keagamaan.jpg',
    deskripsi:
      'Rutinitas keagamaan setiap pagi di musholla sekolah sebagai wujud nyata penguatan Profil Pelajar Pancasila yang beriman dan bertakwa kepada Tuhan YME.',
  },
  {
    id: 'g-4',
    judul: 'Gerakan Literasi Membaca Bersama di Pojok Baca Ceria',
    kategori: 'Akademik & Literasi',
    tanggal: '2026-09-11',
    foto_url: '/galeri-literasi.jpg',
    deskripsi:
      'Peserta didik aktif membaca buku cerita edukatif dan berdiskusi bersama teman sekelas untuk menumbuhkan minat baca dan nalar kritis sepanjang hayat.',
  },
];

export const KATEGORI_GALERI_LIST = [
  'Semua',
  'Upacara & Nasionalisme',
  'Keagamaan & Karakter',
  'Pramuka & Ekskul',
  'Akademik & Literasi',
  'Karya & Seni',
] as const;
