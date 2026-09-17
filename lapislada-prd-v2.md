# PRD — LAPIS LADA v2
**Layanan Pintar untuk Sekolah Dasar**
Versi dokumen: 2.1 · Status: Draft
Dibuat dari: lapislada.html + revisi fitur

---

## 1. Ringkasan Produk

LAPIS LADA adalah web app manajemen komunikasi sekolah dasar berbasis Next.js + Supabase.
Ditargetkan untuk SD negeri di Indonesia yang ingin menggantikan buku penghubung fisik,
WA grup guru, dan tumpukan berkas administrasi dengan satu platform terpadu.

**Stack teknologi:**
- Frontend : Next.js + React (PWA-ready, mobile-first)
- Backend & DB : Supabase (PostgreSQL + Auth + RLS)
- Hosting : Cloudflare Pages
- File/Materi : Google Drive (link-based, zero storage cost)
- Domain : Custom `.web.id`
- Notifikasi : PWA Push Notification + WA click-to-chat (fallback)

**Model bisnis:** Jual-putus per sekolah · Rp 3.500.000 · DP 50% → Go-live → Pelunasan 50%

---

## 2. Prinsip Desain

### 2.1 Mobile-First
Semua halaman dirancang untuk layar 390px (iPhone 14 / Android standar) sebagai
ukuran primer. Desktop tetap didukung penuh melalui responsive breakpoint, namun
keputusan layout selalu dimulai dari mobile.

Breakpoint:
- Mobile : < 640px (default / primer)
- Tablet : 640px – 1024px
- Desktop : > 1024px

### 2.2 Panduan Warna

Diambil dari landing page lapislada.html — dipakai konsisten di seluruh app.

| Token | Nilai Hex | Penggunaan |
|---|---|---|
| `--red` | `#C0392B` | Aksi utama, tombol primer, ikon aktif |
| `--red-deep` | `#922B21` | Navbar, header, hover state tombol |
| `--red-light` | `#F1948A` | Badge, label sekunder, teks di atas bg gelap |
| `--red-pale` | `#FDEDEC` | Background highlight, card aktif |
| `--sand` | `#F5F0E8` | Background halaman utama |
| `--sand-mid` | `#E8E0D0` | Divider, background card netral |
| `--ink` | `#1A1A1A` | Teks utama |
| `--ink-mid` | `#3D3D3D` | Teks sekunder |
| `--muted` | `#6B6B6B` | Placeholder, label kecil |
| `--white` | `#FFFFFF` | Card background, teks di atas merah |
| `--border` | `#DDD8CE` | Garis pembatas, border input |

**Tipografi:**
- Display/Judul : Georgia, 'Times New Roman', serif → `--font-display`
- Body/UI : -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial → `--font-body`

**Radius:**
- Kecil (`--r-sm`) : 6px → tombol, badge
- Sedang (`--r-md`) : 12px → card, input
- Besar (`--r-lg`) : 20px → modal, sheet

---

## 3. PWA (Progressive Web App)

LAPIS LADA dikirim sebagai PWA sehingga pengguna tidak perlu download dari Play Store.

### 3.1 Spesifikasi PWA

| Fitur PWA | Keterangan |
|---|---|
| **Install prompt** | Browser menampilkan "Tambah ke layar utama" secara otomatis |
| **App manifest** | `manifest.json` dengan nama, ikon, warna tema `#922B21`, `display: standalone` |
| **Service Worker** | Cache-first untuk aset statis; network-first untuk data API |
| **Offline mode** | Halaman yang sudah dibuka tetap bisa dilihat saat internet putus |
| **Sync otomatis** | Data baru tersinkronisasi saat koneksi kembali (Background Sync API) |
| **Push Notification** | Notifikasi browser untuk: entri buku penghubung baru dari ortu, pengumuman baru |
| **Ikon** | 192×192 dan 512×512 px, format PNG, background merah `#922B21` |
| **Splash screen** | Warna background `#922B21`, teks putih |

### 3.2 Strategi Cache Service Worker

```
/ (profil sekolah)     → cache-first (konten jarang berubah)
/login                 → network-first
/dashboard             → network-first (data real-time)
/buku-penghubung       → network-first + fallback offline
aset statis (JS/CSS)   → cache-first, update di background
```

### 3.3 Notifikasi Push

Notifikasi dikirim ke guru ketika:
- Orang tua menulis entri baru di buku penghubung
- (Opsional v3) Ada siswa belum diabsen jam 08.00 pagi

Notifikasi dikirim ke orang tua ketika:
- Guru menulis entri baru di buku penghubung untuk anak mereka
- Ada pengumuman baru dari sekolah/kelas

Fallback jika notifikasi push tidak aktif: badge unread counter di icon menu.

---

## 4. Peran Pengguna (Roles)

| Role | Akses |
|---|---|
| **Admin Sekolah** | CRUD semua data, kelola akun pengguna, kelola dokumen BOS, edit profil sekolah |
| **Guru / Wali Kelas** | Input absen, nilai, buku penghubung, pengumuman kelas, materi, CRUD dokumen BOS |
| **Wali Murid (Orang Tua)** | Lihat data anak, baca & tulis buku penghubung, lihat pengumuman |

---

## 5. Modul yang Sudah Ada (v1)

### Modul 01 — Kehadiran Siswa
Guru input absen per kelas per hari. Wali murid cek status hadir/tidak anak secara real-time.

### Modul 02 — Nilai Siswa
Input nilai per mata pelajaran per siswa. Wali murid pantau perkembangan nilai tanpa nunggu rapor.

### Modul 03 — Buku Penghubung *(diperbarui di v2 — lihat Bagian 6.1)*
Pengganti buku penghubung fisik. v1: guru menulis → ortu membaca (satu arah).

### Modul 04 — Dashboard Wali Kelas
Satu halaman ringkas: lihat semua data kelas, buat catatan, kirim pengumuman.

### Modul 05 — Pengumuman
Admin/wali kelas buat pengumuman resmi sekolah atau kelas. Tidak tenggelam di WA grup.

### Modul 06 — Materi Download
Guru paste link Google Drive → wali murid klik, langsung buka. Zero storage cost di server.

### Modul 07 — KAIH (Warisan ABAT)
Rekap 7 Kebiasaan Anak Indonesia Hebat — dipertahankan dari versi sebelumnya.

---

## 6. Fitur Baru v2

### 6.1 Buku Penghubung Dua Arah

**Masalah:** Buku penghubung v1 hanya satu arah. Orang tua tidak bisa melaporkan
kondisi anak di rumah (sakit, izin, catatan belajar, dll).

**Perubahan:**
- Orang tua dapat menulis entri baru (bukan hanya membaca)
- Guru tetap bisa menulis seperti biasa
- Entri dibedakan secara visual: label [Guru] vs [Orang Tua]
- Guru menerima notifikasi PWA + badge unread ketika ada entri baru dari ortu
- Orang tua hanya bisa menulis untuk anak mereka sendiri (RLS tetap berlaku)

**Perubahan skema DB (`buku_penghubung`):**

| Kolom baru | Tipe | Keterangan |
|---|---|---|
| `author_role` | enum: `'guru'`/`'orangtua'` | Siapa yang menulis |
| `parent_entry_id` | uuid nullable FK | Jika ini balasan atas entri tertentu |
| `is_read_by_guru` | boolean default false | Penanda notif belum dibaca guru |

**RLS update:**
- INSERT: izinkan `role = 'orangtua'` yang terhubung ke siswa bersangkutan
- SELECT: ortu hanya lihat entri untuk siswa mereka; guru lihat semua di kelasnya

---

### 6.2 CRUD Dokumen BOS

**Masalah:** Tidak ada tempat terpusat untuk dokumen Dana BOS. Admin/guru simpan
sendiri di GDrive pribadi yang tidak terstruktur.

**Fitur:**
- Modul baru "Dokumen BOS" — khusus guru dan admin
- Setiap entri menyimpan link Google Drive (konsisten dengan Modul 06)
- Wali murid tidak dapat mengakses modul ini

**Skema DB baru (`dokumen_bos`):**

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | — |
| `judul` | text | Misal: "SPJ BOS Triwulan 1 2026" |
| `kategori` | text | SPJ / RKAS / Laporan / SK / lainnya |
| `link_gdrive` | text | URL Google Drive (wajib `drive.google.com`) |
| `tahun_anggaran` | int | — |
| `triwulan` | int nullable | 1–4 |
| `uploaded_by` | uuid FK → users | — |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

**RLS:** SELECT + CRUD hanya `role = 'guru'` atau `role = 'admin'`

---

### 6.3 Landing Page / Profil Sekolah (Halaman Awal Publik)

**Masalah:** Halaman `/` langsung ke login. Tidak ada info sekolah untuk orang
tua baru, tamu, atau keperluan publikasi.

**Fitur:**
- Halaman `/` jadi halaman publik (tanpa login)
- Konten dikelola admin via halaman `/admin/profil-sekolah`
- Satu record per deployment (satu app = satu sekolah)

**Konten blok:**

| Blok | Isi |
|---|---|
| Hero | Nama sekolah, logo, akreditasi |
| Identitas | NPSN, NSS, NIS, alamat lengkap |
| Profil | Tahun berdiri, jumlah siswa/guru, visi-misi |
| Kontak | HP kepsek, email, Google Maps embed |
| CTA | Tombol "Login Guru" dan "Login Orang Tua" |

**Skema DB baru (`profil_sekolah`):** satu baris, dikelola admin.
Kolom: `nama_sekolah`, `npsn`, `nss`, `nis`, `akreditasi`, `tahun_berdiri`,
`alamat`, `kecamatan`, `kabupaten`, `provinsi`, `kode_pos`, `telepon`,
`hp_kepsek`, `email`, `visi`, `misi`, `logo_url`, `maps_embed_url`, `updated_at`

**RLS:** SELECT publik (tanpa auth) · UPDATE hanya admin

---

## 7. ASCII Wireframe — Mobile (390px)

Semua wireframe menggunakan lebar 40 karakter (representasi ~390px mobile).
Legend: `[ ]` = tombol · `[___]` = input field · `░` = gambar/area visual

---

### WF-01 · Halaman Profil Sekolah `/` (Publik)

```
┌────────────────────────────────────────┐
│ 🏫 SDN Latsari 2 Bancar        [Masuk]│  ← navbar sticky, bg --red-deep
├────────────────────────────────────────┤
│                                        │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← logo sekolah (foto/ikon)
│                                        │
│  UPT SD Negeri Latsari 2 Bancar        │  ← nama sekolah, font-display
│  Akreditasi B · Berdiri 1987           │  ← badge akreditasi
│                                        │
│  ╔══════════╗  ╔══════════╗            │
│  ║ 👤 Login ║  ║ 👨‍🏫 Guru  ║            │  ← 2 tombol CTA
│  ║  Ortu    ║  ║          ║            │
│  ╚══════════╝  ╚══════════╝            │
├────────────────────────────────────────┤
│  📋 Identitas Sekolah                  │  ← section header
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│  NPSN        20504924                  │
│  NSS         101050612003              │
│  Alamat      Jl. Desa Latsari No.190   │
│  Kecamatan   Bancar                    │
│  Kabupaten   Tuban, Jawa Timur         │
├────────────────────────────────────────┤
│  📖 Visi & Misi                        │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│  [teks visi sekolah...]                │
│  [teks misi sekolah...]                │
├────────────────────────────────────────┤
│  📞 Kontak                             │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│  HP Kepsek   082230898376              │
│  Email       sdnlatsari2@gmail.com     │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Google Maps embed
└────────────────────────────────────────┘
```

---

### WF-02 · Halaman Login `/login`

```
┌────────────────────────────────────────┐
│        LAPIS LADA                      │  ← logo + nama app, centered
│   Layanan Pintar Sekolah Dasar         │  ← tagline kecil
├────────────────────────────────────────┤
│                                        │
│  Masuk sebagai                         │
│  ┌──────────────┐  ┌──────────────┐    │
│  │  👨‍🏫 Guru /   │  │  👤 Orang    │    │  ← toggle role
│  │    Admin     │  │    Tua       │    │
│  └──────────────┘  └──────────────┘    │
│                                        │
│  Email                                 │
│  [________________________________]    │
│                                        │
│  Password                              │
│  [________________________________]    │
│                                        │
│  [        Masuk →                 ]    │  ← tombol --red
│                                        │
│  Lupa password? Hubungi admin          │  ← teks kecil, --muted
│                                        │
└────────────────────────────────────────┘
```

---

### WF-03 · Dashboard Guru `/dashboard`

```
┌────────────────────────────────────────┐
│ LAPIS LADA          Kelas 4A  [Notif🔴]│  ← navbar, badge notif unread
├────────────────────────────────────────┤
│  Selamat pagi, Bu Sari 👋              │
│  Rabu, 17 Sep 2026                     │
├────────────────────────────────────────┤
│  ⚠️ Belum input absen hari ini         │  ← alert card --red-pale
│  [ Input Absen Sekarang → ]            │
├────────────────────────────────────────┤
│  📓 Buku Penghubung                    │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│  ● [Ortu] Budi S. — 2 jam lalu    🔴  │  ← unread dari ortu
│  ● [Guru] Sari — kemarin               │
│  [ Lihat Semua → ]                     │
├────────────────────────────────────────┤
│  📢 Pengumuman Terbaru                 │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│  ● Libur Maulid 14 Sep 2026            │
│  [ Lihat Semua → ]                     │
├────────────────────────────────────────┤
│  Menu Cepat                            │
│  ┌────────┐┌────────┐┌────────┐        │
│  │ ✅ Absen││📊 Nilai││📢 Umumkan│      │  ← 3-kolom icon menu
│  └────────┘└────────┘└────────┘        │
│  ┌────────┐┌────────┐┌────────┐        │
│  │📁 Materi││📁 BOS  ││🎯 KAIH │        │
│  └────────┘└────────┘└────────┘        │
├────────────────────────────────────────┤
│  🏠    📓    📢    👤                  │  ← bottom nav bar
└────────────────────────────────────────┘
```

---

### WF-04 · Dashboard Orang Tua `/dashboard/orangtua`

```
┌────────────────────────────────────────┐
│ LAPIS LADA                    [Notif🔴]│
├────────────────────────────────────────┤
│  Halo, Pak Budi 👋                     │
│  Memantau: Ahmad Budi · Kelas 4A       │
├────────────────────────────────────────┤
│  📊 Kehadiran Bulan Ini                │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │  18  │ │   1  │ │   0  │ │   1  │  │
│  │ Hadir│ │Sakit │ │ Izin │ │Alpha │  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
├────────────────────────────────────────┤
│  📓 Buku Penghubung                    │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│  [Guru] Bu Sari — hari ini        🔴  │  ← unread
│  Ahmad mengerjakan PR dengan baik...  │
│                                        │
│  [ + Tulis Catatan ke Guru ]           │  ← tombol baru v2
│  [ Lihat Semua → ]                     │
├────────────────────────────────────────┤
│  📢 Pengumuman                         │
│  ● Libur Maulid 14 Sep 2026            │
│  [ Lihat Semua → ]                     │
├────────────────────────────────────────┤
│  🏠    📓    📊    👤                  │  ← bottom nav
└────────────────────────────────────────┘
```

---

### WF-05 · Buku Penghubung — Tampilan Guru `/buku-penghubung`

```
┌────────────────────────────────────────┐
│ ← Buku Penghubung          [+ Tulis]   │
│   Kelas 4A                             │
├────────────────────────────────────────┤
│  Filter: [ Semua ▼ ]  [ Semua Siswa ▼]│
├────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │
│  │ [ORANG TUA] · Ahmad Budi         │  │  ← label orang tua, bg --red-pale
│  │ Hari ini 09.15                   │  │
│  │ Ahmad tadi malam kurang tidur    │  │
│  │ karena sakit perut ringan.       │  │  ← konten catatan
│  │ Mohon dipantau ya Bu 🙏          │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ [GURU] · Bu Sari                 │  │  ← label guru, bg --white
│  │ Kemarin 14.00                    │  │
│  │ Ahmad mengikuti pelajaran dengan │  │
│  │ baik. PR Matematika dikumpulkan. │  │
│  └──────────────────────────────────┘  │
├────────────────────────────────────────┤
│  [+ Tulis Catatan Baru]                │  ← sticky bottom button
└────────────────────────────────────────┘
```

---

### WF-06 · Buku Penghubung — Form Tulis (Guru & Ortu)

```
┌────────────────────────────────────────┐
│ ← Tulis Catatan                        │
├────────────────────────────────────────┤
│                                        │
│  Untuk siswa:                          │
│  [Ahmad Budi — Kelas 4A           ▼]  │  ← dropdown (guru); fixed (ortu)
│                                        │
│  Catatan:                              │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  │  [textarea, 4 baris]             │  │
│  │                                  │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│  Maks. 500 karakter                    │
│                                        │
│  [ Batalkan ]     [ Kirim Catatan → ]  │
│                                        │
└────────────────────────────────────────┘
```

---

### WF-07 · Dokumen BOS — List `/dokumen-bos`

```
┌────────────────────────────────────────┐
│ ← Dokumen BOS               [+ Tambah]│
├────────────────────────────────────────┤
│  Filter:                               │
│  [Tahun: 2026 ▼]  [Kategori: Semua ▼] │
├────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │
│  │ 📄 SPJ BOS Triwulan 1 2026       │  │
│  │ Kategori: SPJ · TW 1 · 2026      │  │
│  │ Diupload: Bu Sari · 12 Mar 2026  │  │
│  │ [ 🔗 Buka GDrive ] [✏️] [🗑️]    │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ 📄 RKAS 2026                     │  │
│  │ Kategori: RKAS · 2026            │  │
│  │ Diupload: Admin · 3 Jan 2026     │  │
│  │ [ 🔗 Buka GDrive ] [✏️] [🗑️]    │  │
│  └──────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘
```

---

### WF-08 · Dokumen BOS — Form Tambah/Edit

```
┌────────────────────────────────────────┐
│ ← Tambah Dokumen BOS                  │
├────────────────────────────────────────┤
│                                        │
│  Judul Dokumen *                       │
│  [________________________________]    │
│                                        │
│  Kategori *                            │
│  [ SPJ ▼ ]   (atau ketik manual)       │
│                                        │
│  Tahun Anggaran *                      │
│  [________________________________]    │
│                                        │
│  Triwulan                              │
│  [ — ▼ ]  (opsional: 1 / 2 / 3 / 4)  │
│                                        │
│  Link Google Drive *                   │
│  [________________________________]    │
│  https://drive.google.com/...          │  ← hint validasi
│                                        │
│  [ Batalkan ]    [ Simpan Dokumen → ]  │
│                                        │
└────────────────────────────────────────┘
```

---

### WF-09 · Input Absen `/kehadiran`

```
┌────────────────────────────────────────┐
│ ← Absensi Kelas              Rabu 17/9│
│   Kelas 4A · 20 Siswa                  │
├────────────────────────────────────────┤
│  Status:  [Belum Selesai 🔴]           │
├────────────────────────────────────────┤
│  No  Nama                 Status       │
│  ─── ──────────────────── ──────────  │
│   1  Ahmad Budi           [H][S][I][A]│
│   2  Budi Santoso         [H][S][I][A]│
│   3  Citra Dewi           [H][S][I][A]│
│   4  ...                              │
│                                        │
│  H=Hadir · S=Sakit · I=Izin · A=Alpha │
├────────────────────────────────────────┤
│  [ Tandai Semua Hadir ]                │
│  [ Simpan Absen → ]                    │
└────────────────────────────────────────┘
```

---

### WF-10 · Admin — Edit Profil Sekolah `/admin/profil-sekolah`

```
┌────────────────────────────────────────┐
│ ← Profil Sekolah                       │
│   (tampil di halaman publik)           │
├────────────────────────────────────────┤
│  Nama Sekolah *                        │
│  [________________________________]    │
│                                        │
│  NPSN *          NSS                  │
│  [____________]  [____________________]│
│                                        │
│  NIS             Akreditasi           │
│  [____________]  [ B ▼ ]              │
│                                        │
│  Tahun Berdiri                         │
│  [________________________________]    │
│                                        │
│  Alamat Lengkap                        │
│  [________________________________]    │
│  [________________________________]    │
│                                        │
│  Kecamatan       Kabupaten            │
│  [____________]  [____________________]│
│                                        │
│  Provinsi        Kode Pos             │
│  [____________]  [________]           │
│                                        │
│  HP Kepala Sekolah                     │
│  [________________________________]    │
│                                        │
│  Email Sekolah                         │
│  [________________________________]    │
│                                        │
│  Visi                                  │
│  ┌──────────────────────────────────┐  │
│  │ [textarea]                       │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Misi                                  │
│  ┌──────────────────────────────────┐  │
│  │ [textarea]                       │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Link Logo (Google Drive / URL)        │
│  [________________________________]    │
│                                        │
│  Google Maps Embed URL                 │
│  [________________________________]    │
│                                        │
│  [ Simpan Perubahan → ]                │
│                                        │
└────────────────────────────────────────┘
```

---

## 8. Skema Database — Ringkasan

### Tabel yang sudah ada (v1)
`users` · `kelas` · `siswa` · `kehadiran` · `nilai` · `mapel` ·
`buku_penghubung` · `pengumuman` · `materi` · `kaih`

### Perubahan pada tabel yang ada
- `buku_penghubung`: +3 kolom (`author_role`, `parent_entry_id`, `is_read_by_guru`)
- RLS `buku_penghubung`: update policy INSERT untuk mengizinkan role orangtua

### Tabel baru
- `dokumen_bos` — Fitur 6.2
- `profil_sekolah` — Fitur 6.3

---

## 9. Halaman & Routing

| Path | Akses | Keterangan |
|---|---|---|
| `/` | Publik | Profil sekolah (BARU) |
| `/login` | Publik | Form login |
| `/dashboard` | Guru, Admin | Dashboard guru |
| `/dashboard/orangtua` | Wali Murid | Dashboard orang tua |
| `/buku-penghubung` | Guru, Wali Murid | Buku penghubung dua arah (DIPERBARUI) |
| `/kehadiran` | Guru | Input absen |
| `/nilai` | Guru | Input nilai |
| `/pengumuman` | Guru, Admin | Kelola pengumuman |
| `/materi` | Guru | Upload link materi |
| `/kaih` | Guru | Rekap KAIH |
| `/dokumen-bos` | Guru, Admin | CRUD dokumen BOS (BARU) |
| `/admin/profil-sekolah` | Admin | Edit profil sekolah (BARU) |

---

## 10. Prioritas Pengerjaan

| Prioritas | Fitur | Alasan |
|---|---|---|
| 🔴 High | Profil Sekolah (halaman publik) | Dibutuhkan saat onboarding, kesan pertama |
| 🔴 High | Buku Penghubung Dua Arah | Nilai jual utama vs v1 |
| 🔴 High | Setup PWA lengkap | Mobile-first — ortu akses via HP |
| 🟡 Medium | Dokumen BOS | Penting administratif, tapi tidak harian |

---

## 11. Catatan & Asumsi

- Semua file tetap pakai **Google Drive** — tidak ada upload ke server
- Profil sekolah hanya ada **satu record** per deployment
- Orang tua tidak bisa self-register — akun dibuat oleh admin
- Dokumen BOS tidak bisa diakses publik meski halaman `/` sudah publik
- **Hosting: Cloudflare Pages** — deploy dari GitHub, CDN global, free tier generous
- Notifikasi: **PWA Push** untuk yang aktif + **WA click-to-chat** sebagai fallback tanpa API berbayar

---

*PRD v2.1 — lapislada.html + 3 fitur baru + panduan warna + wireframe mobile + spec PWA*
