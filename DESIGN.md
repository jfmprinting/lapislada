# PANDUAN DESAIN SISTEM (DESIGN.md) — LAPIS LADA
**Layanan Pintar untuk Sekolah Dasar**  
*Dokumen Referensi Desain UI/UX & Standar Komponen Front-End*  
*Basis Acuan: `lapislada-prd-v2.md` & Taste Skill (Anti-Slop Frontend Guidelines)*

---

## 1. Filosofi & Arah Desain

### 1.1 Identitas Produk
LAPIS LADA dirancang untuk Sekolah Dasar Negeri di Indonesia. Karakter visualnya mengusung prinsip **"Hangat, Berwibawa, Bersahaja, dan Tanpa Hambatan"**:
- **Hangat & Bersahaja:** Nuansa warna terinspirasi dari buku rapor fisik, kertas arsip sekolah, dan kain seragam, memancarkan atmosfer yang ramah bagi orang tua dan guru dari berbagai kelompok usia.
- **Berwibawa & Akademis:** Penggunaan tipografi serif klasik pada judul instansi memberikan legitimasi resmi sekolah negeri tanpa terkesan kaku atau birokratis kuno.
- **Tanpa Hambatan (Zero Slop & Ergonomis):** Bebas dari ornamen sintetis murahan (seperti efek glow ungu AI atau gradasi acak tak bertuan). Desain berfokus pada kecepatan input absensi harian guru di kelas dan keterbacaan tinggi di layar smartphone orang tua.

### 1.2 Konfigurasi Taste (The Three Dials)
Berdasarkan pedoman antarmuka Taste Skill:
- **`DESIGN_VARIANCE` = 0.35 (Terstruktur & Konsisten):** Mengedepankan pola tata letak yang mudah diprediksi, konsisten antar-modul, serta meminimalisir kurva belajar guru/wali murid.
- **`MOTION_INTENSITY` = 0.20 (Fungsional & Ringan):** Animasi hanya difungsikan sebagai umpan balik interaksi (sentuhan tombol, transisi tab, slide drawer/modal). Seluruh animasi wajib mendukung `prefers-reduced-motion`.
- **`VISUAL_DENSITY` (Berdasarkan Peran):**
  - **Guru & Admin (0.65 - Padat & Produktif):** Tampilan tabel absensi, filter dokumen BOS, dan antrean entri buku penghubung memprioritaskan efisiensi ruang pandang agar minim scrolling saat jam kerja.
  - **Orang Tua & Publik (0.40 - Lega & Ramah):** Tampilan dashboard orang tua dan beranda publik memiliki kartu yang lebih lapang, kontras tinggi, teks lebih besar, serta tombol aksi yang mencolok.

---

## 2. Palet Warna & Token Sistem

Palet warna utama diambil langsung dari landing page kanonikal `lapislada.html` dan didefinisikan ke dalam CSS Variables serta Tailwind utility tokens.

### 2.1 Palet Utama (Brand Tokens)

| Token CSS | Hex Code | Utility Tailwind | Peran & Penggunaan Wajib |
|---|---|---|---|
| `--red-deep` | `#922B21` | `bg-brand-red-deep` | Navbar sticky atas, theme-color PWA, hover state tombol primer, header modal |
| `--red` | `#C0392B` | `bg-brand-red` | Aksi primer (CTA), tombol submit utama, toggle aktif, badge notifikasi unread |
| `--red-light` | `#F1948A` | `bg-brand-red-light` | Aksen sekunder, border kartu prioritas, chip kategori aktif |
| `--red-pale` | `#FDEDEC` | `bg-brand-red-pale` | Background kartu unread, entri catatan dari Orang Tua, kartu alert absen |
| `--sand` | `#F5F0E8` | `bg-brand-sand` | Background utama seluruh aplikasi (kanvas hangat, menggantikan putih silau) |
| `--sand-mid` | `#E8E0D0` | `bg-brand-sand-mid` | Pembatas section, background kartu netral, scrollbar thumb, badge non-aktif |
| `--ink` | `#1A1A1A` | `text-brand-ink` | Teks judul utama, isi teks berbobot tinggi (WCAG AAA contrast) |
| `--ink-mid` | `#3D3D3D` | `text-brand-ink-mid` | Teks paragraf sekunder, label formulir, deskripsi entri |
| `--muted` | `#6B6B6B` | `text-brand-muted` | Placeholder input, timestamp catatan, label kecil pendukung |
| `--white` | `#FFFFFF` | `bg-white` | Permukaan kartu utama (card surface), dialog modal, teks kontras di atas merah |
| `--border` | `#DDD8CE` | `border-brand-border`| Garis batas kartu, garis tabel, outline formulir input |

### 2.2 Warna Semantik (Status Kehadiran & Notifikasi)
Absensi siswa menggunakan 4 warna semantik standar Kementerian/Dinas Pendidikan dengan kontras terjaga:

| Status | Kode | Warna Teks / Dot | Background Badge | Deskripsi Penggunaan |
|---|---|---|---|---|
| **Hadir** | **H** | `#1B5E20` (Hijau Rimba) | `#E8F5E9` | Kehadiran aktif siswa di kelas |
| **Sakit** | **S** | `#B45309` (Kuning Kunyit) | `#FEF3C7` | Surat keterangan dokter/sakit dari wali murid |
| **Izin** | **I** | `#1D4ED8` (Biru Arsip) | `#EFF6FF` | Izin keperluan keluarga/resmi |
| **Alpha** | **A** | `#B91C1C` (Merah Peringatan)| `#FEE2E2` | Tanpa keterangan / perlu perhatian guru |

### 2.3 Aturan Anti-Slop Warna
- **DILARANG** menggunakan warna ungu AI neon (`#8B5CF6`, violet glow) atau gradasi kosmik generic.
- **DILARANG** menggunakan background `#000000` pekat untuk dark mode buatan jika tidak diminta; aplikasi ini berorientasi siang hari bertema kertas arsip (`--sand`).
- **DILARANG** memasang teks abu-abu terang pada background putih (`--muted` hanya diizinkan untuk keterangan ukuran >= 12px dengan kontras memenuhi standar WCAG AA).

---

## 3. Tipografi & Skala Teks

Sistem tipografi LAPIS LADA menerapkan **Dual-Font Hierarchy** untuk memisahkan wibawa institusi dengan keterbacaan data fungsional.

### 3.1 Font Families

```css
/* Teks Judul & Nama Sekolah (Wibawa Institusi) */
--font-display: Georgia, 'Times New Roman', serif;

/* Teks UI Fungsional, Angka, & Formulir */
--font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
```

- **Kapan memakai `--font-display` (Serif):**
  - Nama Sekolah / Kop Resmi ("UPT SD Negeri Latsari 2 Bancar").
  - Judul Halaman Utama Publik & Judul Hero.
  - Visi & Misi Sekolah.
  - Judul Piagam / Rekap Karakter KAIH.
- **Kapan memakai `--font-body` (Sans-Serif):**
  - Seluruh elemen antarmuka operasional (tombol, input formulir, tab navigasi).
  - Teks pesan Buku Penghubung, daftar siswa, tabel nilai, dan dokumen BOS.
  - Angka metrik dan counter unread.

### 3.2 Skala & Proporsi Tipografi

| Skala | Ukuran / Line-Height | Tailwind Class | Penggunaan Ideal |
|---|---|---|---|
| **Display Lg** | `28px` / `34px` | `text-2xl sm:text-3xl font-serif` | Hero headline profil sekolah publik |
| **Heading 1** | `22px` / `28px` | `text-xl sm:text-2xl font-serif` | Judul modul utama (Dashboard, Buku Penghubung) |
| **Heading 2** | `17px` / `24px` | `text-base sm:text-lg font-semibold`| Judul seksi kartu, nama anak di dashboard ortu |
| **Body Primary** | `15px` / `22px` | `text-[15px] sm:text-base` | Pesan buku penghubung, isi pengumuman, input teks |
| **Body Secondary**| `13px` / `18px` | `text-xs sm:text-sm text-[#3D3D3D]` | Metadata (diunggah oleh, kategori, tanggal) |
| **Micro Caption** | `11px` / `14px` | `text-[11px] font-medium` | Label badge status, counter unread, teks tab bar |

---

## 4. Geometri, Ruang & Prinsip Mobile-First

### 4.1 Breakpoints & Dimensi Acuan
Aplikasi didesain **Mobile-First** dengan titik acuan viewport ponsel cerdas:
- **Mobile (Ukuran Primer):** `< 640px` (Target canvas pengujian: `390px` × `844px`).
- **Tablet:** `640px – 1024px`.
- **Desktop:** `> 1024px` (Maksimal container: `max-w-5xl` terpusat).

### 4.2 Border Radius

```css
--r-sm: 6px;   /* Tombol kecil, badge status (H/S/I/A), pill chip */
--r-md: 12px;  /* Kartu entri, wadah input formulir, container info */
--r-lg: 20px;  /* Bottom sheet modal, hero card, popup dialog konfirmasi */
```

### 4.3 Elevasi & Garis Tepi (Elevation & Borders)
- **Lapisan Kartu (Card Surface):** Selalu menggunakan background `#FFFFFF` dipadukan dengan border halus `1px solid var(--border)` (`#DDD8CE`).
- **Bayangan (Soft Shadows):** Hindari drop-shadow hitam pekat atau blur raksasa. Gunakan bayangan bernuansa hangat:
  ```css
  /* Kartu Standar */
  box-shadow: 0 1px 3px rgba(146, 43, 33, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03);
  
  /* Kartu Interaktif Hover / Sheet Modal */
  box-shadow: 0 8px 24px -4px rgba(26, 26, 26, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04);
  ```

### 4.4 Ukuran Sentuh Minimal (Touch Target Rules)
Karena mayoritas pengguna adalah guru dan wali murid yang mengakses via perangkat seluler di sela kegiatan:
- Semua tombol aksi, checkbox, tombol pilihan status [H][S][I][A], dan ikon menu wajib memiliki area sentuh minimal **44px × 44px**.
- Jarak antar tombol interaktif berdekatan minimal **8px** untuk mencegah salah pencet (*fat-finger safeguard*).

---

## 5. Anatomi & Spesifikasi Komponen

### 5.1 Bilah Navigasi Atas (Top App Bar)
- **Tinggi:** `52px` (mobile), `56px` (desktop).
- **Latar Belakang:** `--red-deep` (`#922B21`) dengan border bawah tipis `#771F18`.
- **Elemen:**
  - Kiri: Logo sekolah lingkaran/rounded (`36px × 36px`), teks "LAPIS LADA", dan badge kecil nama instansi.
  - Kanan: Tombol notifikasi ber-badge titik merah (`🔴`) dan tombol aksi profil / logout.
  - Sifat: `sticky top-0 z-50` dengan efek transisi warna solid (tanpa glassmorphism buram berlebih yang mengorbankan performa HP murah).

### 5.2 Bilah Navigasi Bawah (Bottom Navigation Bar)
Khusus layar seluler (`< 768px`), navigasi utama diakses melalui bottom bar yang menempel di bawah layar:
- **Tinggi:** `60px` + `padding-bottom: env(safe-area-inset-bottom)`.
- **Latar Belakang:** `#FFFFFF` dengan garis atas `1px solid #DDD8CE`.
- **4 Hub Menu Guru:** `[ Beranda ]` `[ Buku Penghubung 🔴 ]` `[ Dokumen BOS ]` `[ Profil ]`.
- **4 Hub Menu Orang Tua:** `[ Beranda ]` `[ Buku Penghubung 🔴 ]` `[ Nilai & Absen ]` `[ Profil ]`.
- **Indikator Aktif:** Ikon & teks berubah menjadi warna `--red` (`#C0392B`) dengan pill background lembut `--red-pale` (`#FDEDEC`).

### 5.3 Kartu Buku Penghubung Dua Arah (Dua Entri Berbeda)
Untuk membedakan pengirim catatan secara sekilas tanpa membingungkan orang tua atau guru:

1. **Entri dari Orang Tua (`author_role = 'orangtua'`):**
   - **Background:** `--red-pale` (`#FDEDEC`).
   - **Badge Pembuat:** Pill kecil latar merah tua dengan tulisan putih `[ORANG TUA]`, diikuti nama orang tua & nama siswa.
   - **Border Kiri:** Aksen garis merah tebal `3px solid #C0392B`.
   - **Indikator Unread (untuk guru):** Titik merah berkedip lembut / badge "Baru".

2. **Entri dari Guru (`author_role = 'guru'`):**
   - **Background:** `#FFFFFF`.
   - **Badge Pembuat:** Pill kecil latar abu-abu/sand dengan tulisan gelap `[GURU]`, diikuti nama wali kelas.
   - **Border Kiri:** Garis netral `1px solid #DDD8CE`.

### 5.4 Matriks Absensi Cepat Guru (`/kehadiran`)
Setiap baris siswa memiliki kontrol sentuh 4-segmen responsif:
```
[ H (Hadir) ]  [ S (Sakit) ]  [ I (Izin) ]  [ A (Alpha) ]
```
- Status terpilih mendapatkan latar warna pekat statusnya (Hijau/Kuning/Biru/Merah) dengan teks putih tebal.
- Status tidak aktif berlatar `#FFFFFF` dengan outline `#DDD8CE` dan teks netral.
- Wajib memiliki tombol aksi massal di bagian atas: `[ Tandai Semua Hadir ]` untuk memangkas waktu kerja guru menjadi kurang dari 15 detik per kelas.

### 5.5 Formulir & Kontrol Input
- **Tinggi Input:** `44px` untuk single-line input.
- **Warna Border:** `#DDD8CE` (default), `#C0392B` dengan `ring-2 ring-[#C0392B]/20` saat aktif (`:focus`).
- **Hint Validasi Khusus (Google Drive):**
  - Input field Google Drive (pada modul Materi dan Dokumen BOS) wajib memiliki icon gembok/link dan keterangan otomatis: *"Pastikan akses tautan Google Drive diatur ke 'Siapa saja yang memiliki link dapat melihat'"*.
- **Textarea Catatan:** Dilengkapi counter karakter dinamis di pojok kanan bawah (misal: `120 / 500 karakter`).

### 5.6 Sistem Dialog & Feedback Notifikasi
- Hindari penggunaan default `window.alert()` atau `window.confirm()`.
- Gunakan komponen modal terstandarisasi berbasis `NotificationContext`:
  - **Toast Alert:** Melayang di area atas layar dengan auto-dismiss 3 detik (tipe: `success`, `error`, `info`).
  - **Confirm Modal:** Background backdrop gelap `rgba(0,0,0,0.5)`, dialog putih rounded-20px dengan tombol aksi konfirmasi merah tegas dan tombol batal netral.

### 5.7 Tombol & Widget Khusus "Pasang Aplikasi" PWA (In-Dashboard Install Trigger)
Untuk memastikan pengguna tidak kehilangan akses instalasi ketika pop-up otomatis browser tertutup atau terlewat (terutama di iOS Safari yang tidak memiliki pop-up otomatis):

1. **Aturan Penempatan (Hanya Area Terautentikasi):**
   - **DILARANG** memunculkan tombol/banner install di Halaman Publik (`/`) atau halaman login (`/login`) agar tidak mengganggu kesan pertama pengunjung umum.
   - **WAJIB** tersedia setelah pengguna masuk (login) ke dashboard sesuai perannya (`/dashboard`, `/dashboard/orangtua`, `/admin`).
   - **Posisi Komponen:**
     - **Desktop Sidebar:** Ditempatkan di bagian bawah navigasi samping (tepat di atas tombol Logout/Keluar) berbentuk kartu/tombol ringkas: `[ 📲 Pasang Aplikasi Sekolah ]`.
     - **Mobile Dashboard / Drawer:** Ditampilkan sebagai banner aksi bersahaja di bagian bawah menu profil / drawer seluler, serta banner informatif di dashboard yang dapat ditutup (*dismissible* via `localStorage`).

2. **Deteksi Status Instalasi (Smart Standalone Detection):**
   - Tombol/banner otomatis **DISEMBUNYIKAN (Hidden)** jika aplikasi sedang dijalankan dalam mode PWA terpasang:
     ```ts
     const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
       || (window.navigator as any).standalone === true;
     ```

3. **Perilaku Sesuai Platform Perangkat:**
   - **Android / Chrome / Edge:**
     - Menangkap event `beforeinstallprompt` dan menahannya (*defer*).
     - Saat pengguna menekan tombol, sistem langsung memicu dialog instalasi resmi sistem: `prompt()`.
   - **iOS Safari (iPhone / iPad):**
     - Karena Apple Safari tidak mendukung `beforeinstallprompt`, tombol akan membuka **Modal Panduan Edukatif 3 Langkah**:
       1. Ketuk tombol Bagikan (**Share** ikon kotak berpanah atas `⎋`) di bilah bawah Safari.
       2. Gulir ke bawah lalu pilih menu **"Tambahkan ke Layar Utama"** (`➕`).
       3. Ketuk **"Tambah"** di sudut kanan atas layar.

4. **Desain Visual Tombol PWA:**
   - **Latar Belakang:** `--sand-mid` (`#E8E0D0`) dengan border halus `--border` (`#DDD8CE`) atau aksen `--red-pale` (`#FDEDEC`).
   - **Ikon:** Ikon Smartphone / Download warna `--red` (`#C0392B`).
   - **Teks:** *"Pasang Aplikasi LAPIS LADA"* · Subteks: *"Akses 1-klik tanpa buka browser"*.
   - **Feedback:** Jika berhasil diinstal, muncul notifikasi toast konfirmasi sukses.

---

## 6. Standar Desain Berdasarkan Peran (Role-Based UX)

### 6.1 Halaman Publik & Profil Sekolah (`/`)
- **Tujuan:** Kesan pertama kredibilitas sekolah kepada calon wali murid, tamu dinas, dan pengawas.
- **Hero Section:**
  - Banner foto sekolah / latar hangat motif ornamen buku.
  - Logo sekolah beresolusi tajam, nama sekolah lengkap dengan font Serif Display.
  - Badge Akreditasi (misal: "Akreditasi B · NPSN 20504924").
  - Dua tombol CTA mencolok: `[ 👤 Masuk Wali Murid ]` dan `[ 👨‍🏫 Masuk Guru / Admin ]`.
- **Bagian Identitas & Visi Misi:** Disajikan dalam bentuk kartu bento bersih yang memisahkan Visi, Misi, Alamat, dan Kontak Kepala Sekolah.
- **Peta Lokasi:** Google Maps embed responsif dengan sudut melengkung `--r-md`.

### 6.2 Dashboard Guru & Wali Kelas (`/dashboard`)
- **Prioritas Informasi:**
  1. *Actionable Alert Card:* Peringatan jika absen hari ini belum diisi dengan tombol direct jump `[ Isi Absen Sekarang ]`.
  2. *Unread Buku Penghubung Queue:* Catatan orang tua yang belum terbaca ditandai badge merah di urutan teratas.
  3. *Quick Launch Grid:* 6 tombol pintasan cepat (Absen, Nilai, Umumkan, Materi, Dokumen BOS, KAIH).

### 6.3 Dashboard Orang Tua (`/dashboard/orangtua`)
- **Prioritas Informasi:**
  1. *Ringkasan Ananda:* Nama anak dan kelas terpampang jelas dengan sapaan hangat.
  2. *Widget Rekap Kehadiran Bulan Berjalan:* 4 kotak angka ringkas (Hadir, Sakit, Izin, Alpha).
  3. *Buku Penghubung Ananda:* Catatan guru terbaru + tombol direct `[ + Tulis Catatan ke Guru ]`.
  4. *Pengumuman Sekolah Terbaru:* Daftar pengumuman ringkas tanpa terganggu percakapan lain.

### 6.4 Modul Khusus Guru & Admin: Dokumen BOS (`/dokumen-bos`)
- **Sifat:** Modul internal administratif.
- **Filter Fleksibel:** Dropdown Tahun Anggaran dan Kategori (SPJ, RKAS, Laporan, SK).
- **Kartu Dokumen:** Ikon berkas Google Drive warna biru/hijau, label triwulan, tombol `[ 🔗 Buka GDrive ]` yang membuka tab baru secara aman (`rel="noopener noreferrer"`), serta tombol kelola bagi pemilik dokumen.

---

## 7. Pedoman Aksesibilitas & Performa (Anti-Slop Guardrails)

1. **Kontras Teks (WCAG AA Standard):**
   - Rasio kontras teks utama terhadap background minimal `4.5:1`.
   - Hindari teks warna putih di atas `--red-light` (gunakan teks putih hanya di atas `--red` dan `--red-deep`).
2. **Kinerja Jaringan Lemah (School Network Reality):**
   - Sekolah dasar di pedesaan/daerah sering mengalami fluktuasi koneksi.
   - Ukuran aset gambar logo dan banner wajib dioptimasi format WebP (maksimal `100 KB`).
   - Gunakan font lokal / system fallbacks terlebih dahulu sebelum Google Fonts selesai dimuat.
3. **PWA Standalone Checklist:**
   - Navigasi tidak boleh memunculkan scrollbar horizontal sekecil apa pun (`overflow-x: hidden`).
   - Sediakan padding ekstra di bagian bawah (`pb-24`) pada halaman yang memiliki `BottomNav` agar konten terakhir tidak tertutup bilah navigasi.
4. **Pencegahan AI Tells (Hal-hal yang Dilarang):**
   - Dilarang membuat 3 kartu fitur identik dengan ikon abstrak (misal: "Inovatif", "Modern", "Terdepan"). Isi konten wajib riil sesuai administrasi SD (Absen, Nilai, BOS, dsb).
   - Dilarang menyisipkan karakter em-dash panjang (`—`) yang tidak lazim dalam percakapan formal guru di Indonesia; gunakan tanda pisah wajar (`-` atau `·`).
   - Dilarang menggunakan placeholder nama fiktif bahasa Inggris (gunakan contoh nama siswa Indonesia: *Ahmad Budi, Siti Aminah, Rizky Pratama*).

---

## 8. Ringkasan Token untuk Implementasi Koding

```ts
// src/lib/design-tokens.ts
export const TOKENS = {
  colors: {
    red: '#C0392B',
    redDeep: '#922B21',
    redLight: '#F1948A',
    redPale: '#FDEDEC',
    sand: '#F5F0E8',
    sandMid: '#E8E0D0',
    ink: '#1A1A1A',
    inkMid: '#3D3D3D',
    muted: '#6B6B6B',
    white: '#FFFFFF',
    border: '#DDD8CE',
  },
  status: {
    hadir: { text: '#1B5E20', bg: '#E8F5E9', border: '#A5D6A7' },
    sakit: { text: '#B45309', bg: '#FEF3C7', border: '#FDE68A' },
    izin:  { text: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
    alpha: { text: '#B91C1C', bg: '#FEE2E2', border: '#FECACA' },
  },
  radius: {
    sm: '6px',
    md: '12px',
    lg: '20px',
  },
  font: {
    display: "Georgia, 'Times New Roman', serif",
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
  },
};
```

---
*Dokumen ini merupakan panduan tunggal kebenaran visual (Single Source of Truth) untuk pengembangan antarmuka LAPIS LADA ke depan.*
