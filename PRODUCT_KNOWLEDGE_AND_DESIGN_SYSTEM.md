# 📘 Product Knowledge & Design System — LAPIS LADA
> **Dokumen Panduan Identitas Brand untuk AI Image Generator (Logo & Wordmark)**  
> *Gunakan isi dokumen ini sebagai konteks (briefing) saat meminta AI menghasilkan logo, wordmark, atau app icon.*

---

## 1. Ringkasan Product Knowledge (Brand Identity)

### 1.1 Profil & Kepanjangan Produk
* **Nama Produk:** **LAPIS LADA**
* **Kepanjangan Resmi:** **Layanan Pusat Informasi Sekolah Latsari Dua** *(juga dikenal sebagai Layanan Pintar untuk Sekolah Dasar)*
* **Institusi Induk:** UPT SD Negeri Latsari 2 (Kecamatan Bancar/Tuban, Jawa Timur)
* **Kategori Produk:** Web Application & Progressive Web App (PWA) — Sistem Manajemen Komunikasi & Buku Penghubung Terpadu Sekolah Dasar.

### 1.2 Masalah yang Diselesaikan
* Menggantikan buku penghubung fisik berbasis kertas yang sering hilang, rusak, atau lupa dibawa siswa.
* Menggantikan grup percakapan WhatsApp yang berisik, tidak terstruktur, dan rentan menenggelamkan informasi penting.
* Menghadirkan transparansi anggaran BOS (Bantuan Operasional Sekolah) dan tata kelola administrasi sekolah secara akuntabel.
* Memberikan akses langsung bagi orang tua untuk memantau presensi/kehadiran anak, agenda belajar, pembiasaan karakter (KAIH), dan komunikasi dua arah dengan wali kelas secara real-time.

### 1.3 Target Pengguna
1. **Wali Murid / Orang Tua:** Memerlukan antarmuka yang ramah, tidak intimidatif, jelas terbaca di layar smartphone, dan menghadirkan rasa tenang/terhubung dengan perkembangan anak.
2. **Guru & Tenaga Pendidik:** Memerlukan kecepatan input harian (presensi kelas, catatan sikap) dengan tampilan ringkas, teratur, dan efisien.
3. **Kepala Sekolah & Pengawas Dinas:** Memerlukan data yang sah, rapi, transparan, dan memiliki wibawa resmi institusi negara.

### 1.4 Karakter & Kepribadian Brand (*Brand Personality*)
* **Hangat & Bersahaja:** Terinspirasi dari atmosfer sekolah dasar Indonesia—hangatnya buku rapor fisik, kertas arsip, dan hubungan kekeluargaan warga sekolah.
* **Resmi & Berwibawa:** Memiliki legitimasi sekolah dasar negeri percontohan yang akuntabel, legal, dan tepercaya.
* **Modern, Terstruktur, & Tanpa Hambatan (*Anti-Slop*):** Teknologi fungsional yang melayani manusia; bersih, ergonomis, tanpa ornamen grafis futuristik yang berlebihan.

---

## 2. Sistem Desain (*Design System Tokens*)

### 2.1 Palet Warna Khas (Brand Color Tokens)
Logo **wajib** berakar pada palet warna resmi aplikasi di bawah ini:

| Peran Warna | Hex Code | RGB | Filosofi & Penggunaan |
|---|---|---|---|
| **Crimson Red (Primer)** | `#C0392B` | `rgb(192, 57, 43)` | Warna aksi utama sekolah, melambangkan energi belajar, ketegasan, dan keberanian |
| **Deep Maroon (Institusi)** | `#922B21` | `rgb(146, 43, 33)` | Melambangkan wibawa lembaga resmi, kestabilan, kedewasaan, dan kepercayaan publik |
| **Warm Sand (Latar Belakang)** | `#F5F0E8` | `rgb(245, 240, 232)` | Warna kanvas khas aplikasi (pengganti putih silau), analogi kertas buku rapor & arsip |
| **Sand Mid (Aksen Pembatas)** | `#E8E0D0` | `rgb(232, 224, 208)` | Warna garis pembatas netral, border, dan elemen pendukung |
| **Deep Ink / Charcoal (Teks)** | `#1A1A1A` | `rgb(26, 26, 26)` | Kontras hitam tinta pena arsip, memberikan keterbacaan maksimal (*high contrast*) |
| **Amber Gold (Aksen Prestasi)** | `#F59E0B` | `rgb(245, 158, 11)` | Sentuhan bintang prestasi siswa, cahaya mercusuar informasi, dan titik fokus |
| **Rose Salmon (Aksen Halus)** | `#F1948A` | `rgb(241, 148, 138)` | Garis transisi halus, badge sekunder, dan aksen penghubung |
| **Pure White** | `#FFFFFF` | `rgb(255, 255, 255)` | Warna permukaan kartu dan teks kontras di atas latar merah marun |

### 2.2 Hierarki Tipografi
* **Display / Brand Identity:** 
  * Karakter: Kombinasi *Geometric Sans-Serif* modern (seperti Plus Jakarta Sans, Outfit, DM Sans) dengan sentuhan *Transitional Serif* (seperti Lora, Georgia) untuk mencerminkan nuansa institusi pendidikan resmi.
  * Styling Wordmark: Huruf kapital seimbang (*All-Caps* atau *Structured Title-Case*), kerning lapang (*tracking* tidak terlalu rapat), proporsi geometris kokoh.

### 2.3 Simbolisme & Metafora Visual (Kunci Desain Logo)
1. **Metafora "Lapis" (Layering):**
   * Merepresentasikan tingkatan kelas siswa (berjenjang menuju masa depan).
   * Merepresentasikan lembaran-lembaran buku penghubung dan arsip transparansi BOS.
   * Visual: Bilah berundak (*tiered horizontal steps*), lapisan warna yang harmonis.
2. **Koneksi Dua Arah (Two-Way Nexus):**
   * Jembatan penghubung yang menyatukan pihak sekolah (guru) dan keluarga (orang tua).
   * Visual: Lengkungan busur halus (*connector arc*), garis kontinu antarkata.
3. **Titik Pusat / Mercusuar Data (Smart Beacon Dot):**
   * Menggambarkan fungsi portal sebagai pusat satu pintu layanan informasi sekolah.
   * Visual: Aksen titik emas/merah pada huruf "I" atau tanda aksen penutup.

---

## 3. Batasan Desain untuk AI (*Negative Constraints & Anti-Slop Rules*)

Agar hasil logo dari AI tidak terlihat seperti "AI slop" atau logo murahan:

* ❌ **JANGAN** menggunakan gradasi neon ungu/cyan ala AI tech (*no purple/cyan AI glow, no cyberpunk aesthetic*).
* ❌ **JANGAN** membuat efek 3D glossy, bevel plastik, atau pencahayaan fotorealistik yang rumit.
* ❌ **JANGAN** menggunakan perisai (*shield*) klise atau lambang mahkota ala kerajaan Eropa kuno.
* ❌ **JANGAN** membuat ilustrasi maskot kartun yang kekanak-kanakan secara berlebihan.
* ❌ **JANGAN** salah mengeja teks: Nama wajib tertulis tepat: **"LAPIS LADA"**.
* ✅ **WAJIB:** Desain flat vektor, minimalis, bersih (*clean vector logo*), mudah diskalakan, dan terbaca jelas pada ukuran kecil (Favicon 32×32 piksel maupun Header Website).

---

## 4. Format Prompt AI Generator Siap Pakai

Berikut template prompt yang dapat langsung Anda salin dan tempelkan ke tools seperti **Ideogram**, **Midjourney v6**, **DALL-E 3 / ChatGPT**, atau **Recraft.ai**:

### 🎯 Prompt 1: Wordmark Minimalis Modern (Rekomendasi untuk Ideogram / Recraft)
> **Prompt:**
> ```text
> A premium, minimalist flat vector wordmark logo for a public school educational portal named "LAPIS LADA". Modern geometric sans-serif typography, clean letterforms. The word "LAPIS" in deep charcoal #1A1A1A with a golden amber #F59E0B smart accent dot on the letter "I". The word "LADA" in bold crimson red #C0392B. Clean cream warm sand #F5F0E8 background. Professional, authoritative yet warm Indonesian school identity, balanced kerning, graphic design award winning, vector logo, white space, zero gradient, SVG flat style, high contrast, crisp edges.
> ```
> **Negative Prompt:**
> ```text
> 3D effect, bevel, glossy, metallic, purple neon glow, gradient mesh, complex crest, medieval shield, misspelled text, blurry, realistic photo.
> ```

---

### 🎯 Prompt 2: Wordmark dengan Konsep Lembaran Berundak "Lapis" (Midjourney v6)
> **Prompt:**
> ```text
> Minimalist vector logotype for school portal "LAPIS LADA", graphic design by Pentagram. Custom typographic letter L with subtle geometric layered sheets representing educational transparency and books. Primary colors: deep crimson red (#C0392B), rich wine maroon (#922B21), and warm parchment sand (#F5F0E8). Sleek, timeless, institutional elegance, high legibility, flat 2D graphic mark, corporate identity system, isolated on neutral warm background --no 3d, glossy, shadows, photorealistic, neon, messy lines --ar 16:9 --v 6.1
> ```

---

### 🎯 Prompt 3: App Icon / PWA Favicon Monogram "LL" (Untuk Ikon Aplikasi HP)
> **Prompt:**
> ```text
> A modern flat vector app icon for school mobile app "LAPIS LADA". A bold geometric monogram of letters "LL" seamlessly interlocking with a subtle open book and tiered layers motif. Background is rounded squircle in deep maroon #922B21. The monogram icon in crisp white #FFFFFF with a warm gold #F59E0B dot accent. iOS app icon style, clean vector, minimalist, balanced grid system, high readability at 64px, flat design, no drop shadow.
> ```

---

### 🎯 Prompt 4: Prompt Berbahasa Indonesia (Untuk ChatGPT Plus / Bing Image Creator)
> **Prompt:**
> ```text
> Buatkan desain logo wordmark datar (flat vector logotype) yang minimalis dan elegan untuk aplikasi sistem informasi sekolah dasar bernama "LAPIS LADA". 
> Spesifikasi desain:
> 1. Teks utama bertuliskan "LAPIS LADA" dengan tipografi geometris sans-serif yang tegas, bersih, dan modern.
> 2. Skema warna: Merah Crimson (#C0392B) dipadukan dengan Merah Marun Tua (#922B21) dan aksen kecil warna Emas (#F59E0B) pada titik huruf.
> 3. Latar belakang kanvas berwarna krem pasir hangat (#F5F0E8).
> 4. Gaya desain: Flat vector, 2 dimensi, tanpa bayangan 3D, tanpa efek plastik mengilap, tanpa gradasi neon ungu.
> 5. Kesan visual: Resmi, terpercaya, ramah anak dan orang tua, berwibawa khas sekolah dasar negeri di Indonesia.
> ```

---

## 5. Ringkasan Parameter Implementasi Teknis

| Format Aset | Ukuran Target | Ruang Penggunaan |
|---|---|---|
| **SVG Vector (Wordmark)** | Responsif (ViewBox 340×74) | Header/Navbar Web Desktop & Mobile, Kop Surat, Laporan BOS |
| **PNG Transparent** | 1024×1024 px (High Res) | Banner Profil Sekolah, Media Sosial, Piagam & Sertifikat |
| **PWA App Icon** | 192×192 px & 512×512 px | Layaran Utama Smartphone (Android / iOS PWA Standalone) |
| **Favicon** | 32×32 px & 48×48 px | Tab browser browser laptop/desktop |
