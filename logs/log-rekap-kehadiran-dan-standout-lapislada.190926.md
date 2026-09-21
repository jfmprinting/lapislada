# Log Pembaruan & Rencana: Rekap Kehadiran Bulanan & Standout Showcase LAPIS LADA
**Tanggal**: 19 September 2026  
**Berkas Log**: `/logs/log-rekap-kehadiran-dan-standout-lapislada.190926.md`  
**Aplikasi**: LAPIS LADA (Layanan Pusat Informasi Sekolah Latsari Dua)  
**Institusi**: UPT SD Negeri Latsari 2 Bancar, Tuban, Jawa Timur  
**Status**: ✅ Selesai Diimplementasikan, Teruji Build Produksi, & Terverifikasi Aktif  

---

## 1. Latar Belakang & Konteks Kebutuhan

Dalam sesi pengembangan ini, terdapat dua kebutuhan penting dari pengguna:

1. **Rekap Kehadiran Siswa Bulanan per Kelas (`/kehadiran`)**:
   - Sebelumnya, modul kehadiran hanya menyediakan formulir pencatatan absensi harian untuk 1 kelas berjalan dan log riwayat perorangan untuk orang tua. Belum ada rekapitulasi bulanan berbasis rombel/kelas, perhitungan akumulasi H/S/I/A, persentase kehadiran, maupun pencetakan laporan bulanan dinas.
   - Diperlukan fitur **Rekap Kehadiran Bulanan per Kelas** lengkap dengan filter kelas, bulan, tahun, tampilan ringkasan dan kisi-kisi tanggal (1–31), kartu KPI kelas, ekspor Excel, dan cetak laporan resmi.

2. **Standout Showcase LAPIS LADA di Halaman Utama (`/`)**:
   - Informasi inti mengenai **LAPIS LADA** sebelumnya terkubur di dalam tab horizontal (*Layanan LAPIS LADA*) yang sejajar dengan tab *Identitas*, *Visi Misi*, *Galeri*, dan *Kontak*.
   - Karena aplikasi ini berpusat pada **LAPIS LADA** sebagai sistem inovasi sekolah terpadu, informasi filosofis, 4 fungsi keunggulan utama, dan komitmen sekolah harus tampil mencolok (*standout*) sebagai **Dedicated Showcase Section** permanen yang langsung terlihat oleh pengunjung tanpa harus mengklik tab.

---

## 2. Rincian Implementasi Fitur 1: Rekap Kehadiran Bulanan Siswa per Kelas

**Berkas**: [`src/app/kehadiran/page.tsx`](file:///d:/1.%20MIZTERGOOD/04%20-%20Keuangan%20dan%20Bisnis/JASA/11.%20PAK%20SANS/1.%20LAPIS%20LADA/src/app/kehadiran/page.tsx)

### A. Arsitektur Navigasi Dual-Tab (Guru & Admin)
Halaman `/kehadiran` kini memiliki navigasi tab terpadu:
- **Tab 1: Absensi Harian**:
  - Filter pilihan Kelas & Tanggal presensi.
  - Quick Counter harian (Hadir, Sakit, Izin, Alpha).
  - Tombol cepat **✓ Tandai Semua Hadir**.
  - Tombol aksi toggle status presensi `[H]`, `[S]`, `[I]`, `[A]` per siswa.
  - Tombol simpan dengan sinkronisasi ke database Supabase `kehadiran`.
- **Tab 2: Rekap Bulanan per Kelas**:
  - Filter **Kelas**: Terhubung dinamis dengan data master `kelas` di Supabase (Kelas 1 s/d Kelas 6).
  - Filter **Bulan**: Pilihan bulan (Januari s/d Desember).
  - Filter **Tahun**: Pilihan tahun kalender.
  - Pilihan **Mode Tampilan**: Toggle antara mode **Ringkasan** dan mode **Grid 1–31**.

### B. Kartu Metrik KPI Kelas
6 kartu indikator yang secara otomatis mengalkulasi data presensi satu kelas:
- **Total Siswa**: Jumlah siswa terdaftar pada kelas terpilih.
- **Kehadiran Kelas (%)**: Rata-rata persentase kehadiran kelas dengan status kedisiplinan.
- **Total Hadir (H)**: Total akumulasi kehadiran siswa dalam bulan tersebut.
- **Total Sakit (S)**: Total akumulasi sakit dengan surat/catatan orang tua.
- **Total Izin (I)**: Total akumulasi izin keperluan keluarga/acara.
- **Total Alpha (A)**: Total akumulasi tanpa keterangan.

### C. Mode Tampilan Fleksibel
1. **Mode Ringkasan (Summary Table)**:
   - Kolom: No, NIS, Nama Siswa, L/P, Hadir (H), Sakit (S), Izin (I), Alpha (A), Hari Efektif, Persentase Kehadiran (%), dan Status.
   - Dilengkapi *badge* visual persentase kehadiran (Hijau $\ge 90\%$, Kuning $75-89\%$, Merah $< 75\%$).
   - Baris *footer* akumulasi total dan rata-rata kelas.
2. **Mode Matriks Tanggal (Grid 1–31)**:
   - Kisi-kisi tanggal 1 sampai akhir bulan kalender berjalan.
   - Penandaan otomatis hari Minggu (*M/Libur*) dengan warna lembut.
   - Badge status presensi harian `H`, `S`, `I`, `A` di setiap tanggal.
   - Kolom rekapitulasi total di ujung kanan tabel.
3. **Pencarian Cepat**:
   - Kotak pencarian instan nama siswa atau NIS.

### D. Fitur Ekspor & Cetak Laporan Resmi
- **Ekspor Excel (`.xlsx`)**:
  - Dihasilkan via pustaka SheetJS (`xlsx`) dengan format nama otomatis: `Rekap_Kehadiran_[NamaKelas]_[Bulan]_[Tahun].xlsx`.
  - Berisi kop sekolah, metadata kelas, header terstruktur, rincian siswa, dan ringkasan rata-rata kelas.
- **Cetak Laporan / PDF (`window.print()`)**:
  - Format cetak standar dinas pendidikan lengkap dengan **Kop Surat Resmi UPT SD Negeri Latsari 2 Bancar**.
  - Kolom tanda tangan resmi: **Kepala Sekolah** (*H. MIZTERGOOD, M.Pd*) di sebelah kiri dan **Wali Kelas** di sebelah kanan.

---

## 3. Rincian Implementasi Fitur 2: Standout Showcase Section LAPIS LADA

**Berkas**: [`src/app/page.tsx`](file:///d:/1.%20MIZTERGOOD/04%20-%20Keuangan%20dan%20Bisnis/JASA/11.%20PAK%20SANS/1.%20LAPIS%20LADA/src/app/page.tsx)

### A. Reposisi Menjadi Section Unggulan Permanen
- LAPIS LADA dikeluarkan dari tab horizontal dan dijadikan **Dedicated Showcase Section** tepat di bawah *Hero Banner* dan *Quick Stats*.
- Setiap pengunjung yang membuka situs langsung disambut oleh identitas sistem, makna singkatan, dan fungsi utama tanpa perlu klik tab.

### B. Kandungan Konten & Desain Bento 4 Pilar
1. **Header & Pengantar**:
   - Badge: `✨ INOVASI SISTEM INFORMASI TERPADU`
   - Judul: **LAPIS LADA** (*Layanan Pusat Informasi Sekolah Latsari 2*)
   - Narasi Filosofis:
     > *"Inovasi sistem informasi terpadu yang berfungsi sebagai pusat kendali komunikasi, transparansi, dan pelayanan data bagi seluruh warga sekolah dan masyarakat. Layanan ini dirancang khusus untuk menjembatani kebutuhan informasi antara pihak sekolah, orang tua/wali murid, siswa, serta instansi terkait secara cepat, tepat, dan akurat."*

2. **Bento Grid 4 Fungsi & Keunggulan Utama**:
   - **Pilar 01 — Pusat Informasi Satu Pintu** (Ikon `Layers`): Akses mudah terhadap pengumuman sekolah, agenda kegiatan, program akademis, hingga prestasi siswa.
   - **Pilar 02 — Transparansi Data & Administrasi** (Ikon `ShieldCheck`): Pengelolaan tata usaha dan penyampaian laporan perkembangan sekolah secara terbuka dan akuntabel.
   - **Pilar 03 — Saluran Komunikasi Interaktif** (Ikon `BookOpen`): Wadah aspirasi, layanan pengaduan, dan konsultasi orang tua melalui Buku Penghubung Digital 2 Arah.
   - **Pilar 04 — Digitalisasi Layanan Sekolah** (Ikon `Clock`): Efisiensi birokrasi sekolah berbasis teknologi digital modern yang adaptif, cepat, tepat, dan akurat.

3. **Blok Komitmen & Akses Cepat (CTA Bar)**:
   - Kutipan Komitmen UPT SD Negeri Latsari 2 untuk menciptakan lingkungan pendidikan informatif, akuntabel, dan terkoneksi demi generasi cerdas dan berkarakter.
   - Tombol akses cepat: **Portal Orang Tua** dan **Portal Guru**.

### C. Restrukturisasi Tab Profil Lembaga
Tab navigasi di bawah section LAPIS LADA kini lebih ringkas dan fokus pada identitas sekolah:
- **Identitas Sekolah**
- **Visi, Misi & Tujuan**
- **Galeri Kegiatan**
- **Kontak & Lokasi**

---

## 4. Hasil Pengujian & Verifikasi Kualitas

| Komponen Pengujian | Perintah / Alat | Status | Hasil |
| :--- | :--- | :---: | :--- |
| **Pengecekan Tipe TypeScript** | `npx tsc --noEmit` | ✅ Lolos | 0 error kompilasi |
| **Kompilasi Produksi Next.js** | `npm run build` (Turbopack) | ✅ Lolos | 22/22 rute berhasil dibuild |
| **Pemeriksaan Konten Render** | `read_url_content` (localhost:3000) | ✅ Terverifikasi | Section LAPIS LADA tampil penuh di halaman utama |
| **Integrasi SheetJS Excel** | Pustaka `xlsx` | ✅ Terverifikasi | Ekspor file `.xlsx` berjalan lancar |

---

## 5. Ringkasan File yang Diubah

1. [`src/app/kehadiran/page.tsx`](file:///d:/1.%20MIZTERGOOD/04%20-%20Keuangan%20dan%20Bisnis/JASA/11.%20PAK%20SANS/1.%20LAPIS%20LADA/src/app/kehadiran/page.tsx):
   - Penambahan tab navigasi *Absensi Harian* & *Rekap Bulanan per Kelas*.
   - Filter kelas, bulan, tahun, perhitungan matriks presensi, ekspor Excel, dan cetak kop resmi.
2. [`src/app/page.tsx`](file:///d:/1.%20MIZTERGOOD/04%20-%20Keuangan%20dan%20Bisnis/JASA/11.%20PAK%20SANS/1.%20LAPIS%20LADA/src/app/page.tsx):
   - Promosi LAPIS LADA menjadi dedicated standout showcase section.
   - Implementasi bento grid 4 fungsi & keunggulan utama serta blok komitmen sekolah.
   - Pembersihan tab horizontal profil sekolah.
3. [`logs/log-rekap-kehadiran-dan-standout-lapislada.190926.md`](file:///d:/1.%20MIZTERGOOD/04%20-%20Keuangan%20dan%20Bisnis/JASA/11.%20PAK%20SANS/1.%20LAPIS%20LADA/logs/log-rekap-kehadiran-dan-standout-lapislada.190926.md):
   - Dokumentasi lengkap rencana, konteks, dan implementasi teknis.
