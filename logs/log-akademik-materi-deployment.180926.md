# Log Pembaruan & Rencana: Akademik, Materi Pelajaran, Asesmen & Deployment
**Tanggal**: 18 September 2026  
**Berkas Log**: `/logs/log-akademik-materi-deployment.180926.md`  
**Aplikasi**: LAPIS LADA (Layanan Pusat Informasi Sekolah Latsari Dua)  
**Institusi**: UPT SD Negeri Latsari 2 Bancar, Tuban, Jawa Timur  

---

## 1. Konteks & Ringkasan Kebutuhan (Context & Requirements)

Sesi kerja ini menindaklanjuti serangkaian penyempurnaan fitur sistem informasi akademik dan manajemen sekolah berdasarkan kebutuhan lapangan:

1. **Hak Akses & Restriksi Kelas untuk Wali Kelas (`/nilai`)**:
   - Guru wali kelas (misalnya Bu Sari, Wali Kelas 4A) yang bukan guru mapel lintas kelas hanya boleh menginput dan mengelola nilai siswa di kelas perwaliannya sendiri.
   - Mencegah kekeliruan penginputan nilai antar-kelas serta mengamankan akses Buku Leger nilai hanya untuk wali kelas bersangkutan.

2. **Master Jenis Asesmen / Ujian Sekolah (`/admin/jenis-asesmen`)**:
   - Perlunya antarmuka master data di sisi Admin untuk mengelola jenis asesmen Kurikulum Merdeka (Asesmen Formatif & Sumatif seperti Tugas, Ulangan Harian, STS, SAS, Praktik, dll.).
   - Pilihan jenis asesmen pada form input nilai guru harus tersinkronisasi dinamis dengan master data ini.

3. **Manajemen Materi Pelajaran Mandiri untuk Guru (`/materi`)**:
   - Guru mapel dan wali kelas harus dapat melakukan operasi CRUD (Tambah, Edit, Hapus, Lihat) bahan ajar atau modul lembar belajar siswa (integrasi Zero Storage via link Google Drive).
   - Tampilan materi dilengkapi filter kelas, mapel, pencarian real-time, dan tombol uji coba link tautan.

4. **Klarifikasi Alur Deployment Cloudflare Pages**:
   - Verifikasi mekanisme rilis kode terbaru ke Cloudflare Pages (`lapislada-c33.pages.dev`), memastikan perubahan kode di branch `main` ter-deploy sempurna ke live build melalui Wrangler CLI.

5. **Aksesibilitas & Keamanan Akun Orang Tua**:
   - Verifikasi fungsionalitas akun demo/otomatis orang tua siswa dan penyediaan tombol **Keluar Akun (Logout)** yang mudah diakses dari dashboard orang tua.

---

## 2. Rincian Implementasi & Perubahan Kode

### A. Restriksi Kelas Wali Kelas pada Modul Nilai (`src/app/nilai/page.tsx`)
- **Deteksi Peran Wali Kelas**:
  - Menambahkan query ke tabel `kelas` pada Supabase untuk memeriksa apakah `currentUser.id` terdaftar sebagai `wali_kelas_id`.
  - Mengatur state `isWaliKelas`, `waliKelasNama`, dan `allowedKelasList`.
  - Akun demo Bu Sari (`a40c3f9b-9232-4dfb-87e4-534f4aad201e`) telah dipetakan ke `Kelas 4A` (`983d08fb-7625-4eba-93f2-50f02986c8d3`).
- **UI Locking & Guardrails**:
  - Jika pengguna adalah Wali Kelas, dropdown pemilihan kelas digantikan dengan lencana hijau aman berlabel **"Hak akses Wali Kelas: Kelas 4A"**.
  - Dropdown kelas lain terkunci otomatis untuk mencegah pengisian nilai ke rombel lain.
  - Tab **Buku Leger** hanya dimunculkan untuk pengguna dengan hak akses Wali Kelas.
  - Pilihan jenis asesmen pada modal input nilai memuat daftar dinamis dari master jenis asesmen.

### B. Halaman Master Jenis Asesmen Admin (`src/app/admin/jenis-asesmen/page.tsx`)
- **Fitur Baru (New Route)**:
  - CRUD lengkap untuk jenis asesmen: Tambah Asesmen Baru, Edit Nama/Bobot/Kategori, Hapus, dan Toggle Aktif/Nonaktif.
  - Pengelompokan visual berbasis kategori: **Asesmen Formatif** (lencana biru) dan **Asesmen Sumatif** (lencana kuning/amber).
  - Tombol **Reset ke Standar** untuk mengembalikan 6 asesmen default (Tugas Harian, Kuis, Formatif Praktik, Ulangan Harian/Sumatif Bab, STS, dan SAS).
  - Penyimpanan persisten lokal `lapislada_jenis_asesmen` yang langsung terbaca oleh modul input nilai guru.
- **Integrasi Navigasi Sidebar (`src/components/layout/AppShell.tsx`)**:
  - Menambahkan menu baru di sidebar Admin: **Master Data → Jenis Asesmen** (ikon `ClipboardList`).

### C. Modul CRUD Materi Pelajaran untuk Guru & Admin (`src/app/materi/page.tsx`)
- **Hak Akses CRUD Diperluas**:
  - Memperbarui guard `canEdit` agar baik **Admin** maupun **Guru** memiliki hak penuh mengelola materi pelajaran.
  - Menyediakan tombol aksi **`+ Tambah Materi`** pada header utama halaman `/materi`.
  - Kartu materi dilengkapi tombol **Edit (pensil)** dan **Hapus (tempat sampah)** dengan dialog konfirmasi aman.
- **Form Modal Terpadu**:
  - Field: Judul Materi, Pilihan Kelas (dropdown dari tabel `kelas`), Pilihan Mapel (dropdown dari tabel `mapel`), Deskripsi ringkas, dan Link Google Drive.
  - Fitur pembantu: tombol **Cek Link** yang langsung membuka URL Google Drive di tab baru sebelum disimpan.
- **Filter & Interaktivitas**:
  - Filter pencarian judul/deskripsi, filter dropdown Kelas, dan filter dropdown Mata Pelajaran.
  - Penanganan transparan antara data database Supabase `materi` dan data fallback demo lokal.

### D. Alur Deployment Cloudflare Pages & Penyelesaian Masalah
- **Identifikasi Masalah**:
  - Sebelumnya commit `6dc4c96` sudah di-push ke GitHub repository `https://github.com/jfmprinting/lapislada.git`.
  - Namun, browser pengguna masih mengakses URL commit preview lama (`https://e470bc80.lapislada-c33.pages.dev/materi`).
  - Proyek Cloudflare Pages pada lingkungan ini menggunakan mekanisme deployment langsung via Wrangler CLI (`npx wrangler pages deploy out --project-name=lapislada`).
- **Tindakan Penyelesaian**:
  1. Menjalankan `npm run build` yang menghasilkan 22 rute statis Next.js 16.3.5 ke folder `out/`.
  2. Melakukan deployment produksi langsung via Wrangler:
     `npx wrangler pages deploy out --project-name=lapislada --commit-dirty=true`
  3. Kode termutakhir ter-deploy sukses ke:
     - **Production Domain**: `https://lapislada-c33.pages.dev`
     - **Deployment Preview ID**: `https://b090f71c.lapislada-c33.pages.dev`
  4. Seluruh pembaruan di-commit dan di-push ke branch `main` di GitHub (`commit 5c4562d`).

### E. Penyempurnaan Sebelumnya yang Sudah Terintegrasi
- **Autentikasi Orang Tua & Logout**:
  - Pembuatan akun live orang tua pada `auth.users` via `createEphemeralClient()` serta fallback credential registry.
  - Menambahkan tombol **Keluar (Logout)** di Top Navbar dan kartu sambutan profil di `/dashboard/orangtua`.
  - Telah diverifikasi berjalan lancar melalui browser subagent: modal konfirmasi muncul dan redirect ke `/login?role=orangtua` berfungsi semestinya.
- **Galeri Kegiatan Sekolah**:
  - Rute publik `/galeri` dengan filter kategori kegiatan (Pramuka, Literasi, Keagamaan, dll.).
  - Rute admin `/admin/galeri` untuk penambahan foto, takarir (caption), dan tanggal kegiatan.
  - Tab "Galeri" pada landing page utama sekolah (`/`).
- **Pembaruan Visi, Misi & Tujuan**:
  - Teks visi, misi, dan 5 poin tujuan sekolah telah disinkronkan langsung dari dokumen acuan `visi_misi.md`.

---

## 3. Matriks Status Fitur (Feature Status Matrix)

| Modul / Fitur | Rute / Komponen | Hak Akses | Status | Catatan |
|---|---|---|---|---|
| **Restriksi Nilai Wali Kelas** | `/nilai` | Guru (Wali Kelas) | ✅ Selesai | Dropdown kelas terkunci ke rombel ampunan; Buku Leger aktif |
| **Master Jenis Asesmen** | `/admin/jenis-asesmen` | Admin | ✅ Selesai | CRUD Formatif & Sumatif; sinkron ke form nilai guru |
| **CRUD Materi Pelajaran** | `/materi` | Guru & Admin | ✅ Selesai | Tambah/Edit/Hapus materi; link Google Drive; filter aktif |
| **Galeri Kegiatan Sekolah** | `/galeri`, `/admin/galeri` | Publik & Admin | ✅ Selesai | Galeri foto kegiatan; filter kategori; admin management |
| **Reset Password & WA** | `/admin/guru`, `/admin/siswa` | Admin | ✅ Selesai | Generator password unik; modal kirim link/kredensial ke WA |
| **Logout Dashboard Ortu** | `/dashboard/orangtua` | Orang Tua | ✅ Selesai | Tombol keluar di navbar & profil; konfirmasi dialog aktif |
| **Cloudflare Live Deploy** | `lapislada-c33.pages.dev` | Semua | ✅ Live | Build statis 22 rute ter-deploy di Cloudflare Pages CDN |

---

## 4. Langkah Lanjutan & Rekomendasi Masa Depan (Next Steps)

1. **Pemetaan Guru Mapel Lintas Kelas (Jika Dibutuhkan di Masa Depan)**:
   - Saat ini arsitektur telah mengakomodasi batasan Wali Kelas (1 guru = 1 rombel).
   - Apabila sekolah menghendaki guru mapel (misalnya Guru PAI atau PJOK) mengajar di banyak kelas (4A, 4B, 5A), dapat dibuatkan tabel relasi baru `guru_mapel (guru_id, mapel_id, kelas_id)` di Supabase.

2. **Sinkronisasi Database untuk Jenis Asesmen**:
   - Jenis Asesmen saat ini disimpan pada level `localStorage` browser admin/guru (`lapislada_jenis_asesmen`) dengan nilai standar lengkap.
   - Jika ingin multi-admin tersinkronisasi lintas perangkat tanpa dependensi browser storage, tabel `jenis_asesmen` dapat ditambahkan ke schema Supabase.

3. **Cache Invalidation / Hard Refresh Reminder**:
   - Karena LAPIS LADA dilengkapi PWA Service Worker (`public/sw.js`), ingatkan pengguna untuk melakukan hard reload (`Ctrl + Shift + R` atau `Clear Site Data`) jika membuka URL preview lama.
