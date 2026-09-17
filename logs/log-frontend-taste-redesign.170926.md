# Log Pembaruan & Rencana: Frontend Taste Redesign & Compliance Audit
**Tanggal**: 17 September 2026  
**Berkas Log**: `/logs/log-frontend-taste-redesign.170926.md`  
**Aplikasi**: LAPIS LADA (Layanan Pusat Informasi Sekolah Latsari Dua)  
**Institusi**: UPT SD Negeri Latsari 2 Bancar, Tuban, Jawa Timur  

---

## 1. Konteks & Tujuan (Context & Objectives)

Sesi ini berfokus pada empat tujuan utama:
1. **Perombakan Landing Page & Profil Sekolah (`src/app/page.tsx`)**:
   - Menghilangkan dua tombol login besar (*bulky buttons*) di tengah kartu profil sekolah yang mengganggu kenyamanan visual.
   - Mengintegrasikan foto kegiatan upacara bendera sekolah sebagai *hero image* utama dengan *gradient overlay* marun formal.
   - Menonjolkan nama aplikasi **"LAPIS LADA"** sebagai identitas resmi sistem manajemen sekolah.
   - Mengubah layout kaku vertikal menjadi tata letak modern dengan *Quick Stats Bar* dan *Interactive Navigation Tabs*.

2. **Modularisasi Taste Skill (Anti-Slop Frontend Guidelines)**:
   - Mengadopsi framework pedoman antarmuka `design-taste-frontend` (`SKILL.md`).
   - Memecah berkas acuan `SKILL.md` menjadi 5 modul aturan terstruktur di dalam direktori `.agents/rules/` sesuai standar kustomisasi Antigravity.
   - Mengonfigurasi `GEMINI.md` dan `skill.md` sebagai rujukan terindeks.

3. **Audit Kepatuhan Menyeluruh (Comprehensive UI/UX Compliance Audit)**:
   - Memeriksa seluruh basis kode dan antarmuka terhadap larangan keras (*forbidden tells*) dan arahan desain dalam 5 modul aturan.
   - Melakukan refaktorisasi instan pada setiap poin pelanggaran yang ditemukan.

4. **Verifikasi Visual & Deployment**:
   - Verifikasi tangkapan layar langsung menggunakan *browser subagent*.
   - Build static export Next.js dan *live deployment* ke jaringan CDN global Cloudflare Pages.

---

## 2. Rincian Implementasi & Perubahan Kode

### A. Tampilan Landing Page (`src/app/page.tsx`) & Navbar (`src/components/layout/Navbar.tsx`)
- **Standout Branding LAPIS LADA**:
  - Judul aplikasi dibuat berukuran besar (*extrabold*, 3xl-5xl) dengan gradasi teks emas-putih elegan, bayangan halus, serta lencana `PORTAL INFORMASI RESMI`.
  - Pada Navbar, merek `LAPIS LADA` diperkuat dengan lencana `PORTAL` beraksen emas.
- **Hero Image Banner**:
  - Berkas gambar upacara sekolah diunduh dan disimpan secara lokal di `/public/hero-upacara.jpg` (102 KB) untuk menghindari kegagalan *hotlinking* atau pemblokiran CORS.
  - Dilapisi *multi-layer gradient overlay* marun-gelap (`#922B21` / `#771F18` / `#140605`) untuk memastikan teks memiliki kontras tajam.
- **Access Pill Bar (Menggantikan 2 Tombol Login Besar)**:
  - Dua tombol login besar dihapus dari bagian tengah hero.
  - Digantikan oleh sepasang *pill button* ergonomis di sudut bawah hero:
    - `Portal Wali Murid` (Putih bersih dengan ikon `UserCheck`)
    - `Portal Guru & Tendik` (*Frosted glass* dengan ikon `GraduationCap`)
- **Tab Navigasi Interaktif**:
  - `Identitas Sekolah`: Rincian legalitas NPSN, NSS, NIS, jenjang, dan alamat.
  - `Visi & Misi`: Kutipan visi berbingkai *illuminated quote* dan kartu misi bernomor rapi.
  - `Layanan LAPIS LADA`: Showcase fitur pilar sistem.
  - `Kontak & Lokasi`: Tombol langsung WhatsApp Kepala Sekolah, email, telepon kantor, dan Google Maps interaktif.

### B. Struktur Modular Taste Skill (`.agents/rules/`)
Berkas aturan `SKILL.md` (87 KB) dipecah menjadi 5 berkas modular:
1. **`01_frontend_taste_core.md`** (14.3 KB):
   - Brief inference protocol, The Three Dials (`DESIGN_VARIANCE`, `MOTION_INTENSITY`, `VISUAL_DENSITY`), Design System mapping, arsitektur default, dan Dark Mode protocol.
2. **`02_frontend_taste_design.md`** (27.0 KB):
   - Arahan rekayasa desain: tipografi (sans over serif), kalibrasi warna (larangan AI-purple glow, pembatasan saturasi), anti-center bias, layout discipline, materi & kartu, strategi gambar, dan kunci tema.
3. **`03_frontend_taste_motion.md`** (11.8 KB):
   - Protokol animasi: *motivated motion*, canonical skeletons (Sticky-Stack, Horizontal-Pan, Scroll-Reveal Stagger), larangan `window.addEventListener('scroll')`, dan aproksimasi CSS Apple Liquid Glass.
4. **`04_frontend_taste_tells.md`** (16.2 KB):
   - AI Tells: larangan keras em-dash (`—`), larangan 3 kartu identik mendatar, larangan data fiktif generik ("Jane Doe"), larangan neon outer glow, serta Reference Vocabulary pola modern.
5. **`05_frontend_taste_workflow.md`** (17.6 KB):
   - Alur kerja redesign (audit-first, preserve vs overhaul), Block Library contract, dan Final Pre-Flight Checklist.
- **Root Files**:
  - `GEMINI.md`: Berkas acuan utama root workspace yang mengindeks ke-5 modul aturan di `.agents/rules/`.
  - `skill.md`: Berkas referensi komprehensif di root.

### C. Refaktorisasi Kepatuhan UI/UX (Compliance Audit & Fixes)
1. **Eliminasi Karakter Em-Dash (`—`) 100% (Rule 9.G)**:
   - Ditemukan dan dibersihkan dari:
     - `src/app/layout.tsx:6`
     - `src/app/kaih/page.tsx:42`
     - `src/app/buku-penghubung/page.tsx:329, 332, 335`
     - `public/manifest.json:2`
   - Diganti dengan tanda titik dua (`:`), tanda kurung, atau tanda strip standar. Hasil pencarian ripgrep: **0 em-dash tersisa**.
2. **Pemberantasan Pola 3-Kartu Simetris (Rule 9.C & 4.3)**:
   - Bagian pilar layanan di `src/app/page.tsx` sebelumnya menggunakan `grid-cols-3` simetris.
   - Dirombak menjadi **Asymmetric Bento Grid**:
     - *Kartu Utama (7 kolom)*: Buku Penghubung Digital 2 Arah (lengkap dengan badge *Pilar Utama*, narasi detail, dan 3 pill status).
     - *Kartu Sekunder (5 kolom bertumpuk)*: Presensi Terpadu Realtime & Transparansi BOS/Nilai.
3. **Migrasi Font ke `next/font/google` (Rule 3.A)**:
   - Menghapus tag `<link>` font HTML mentah pada `layout.tsx`.
   - Menggunakan modul bawaan `next/font/google` (`Plus_Jakarta_Sans` & `Lora`) dengan `display: "swap"` dan CSS variable injection untuk mengeliminasi CLS (*Cumulative Layout Shift*).
4. **Stabilitas Viewport Mobile (Rule 3.E)**:
   - Mengganti `h-screen` dan `min-h-screen` menjadi `h-[100dvh]` dan `min-h-[100dvh]` pada `src/components/layout/AppShell.tsx` dan `src/app/page.tsx` untuk mencegah lonjakan layout akibat address bar peramban mobile.
5. **Guardrail Aksesibilitas Gerak (Rule 6.B)**:
   - Menambahkan aturan `@media (prefers-reduced-motion: reduce)` pada `src/app/globals.css` guna menjamin kenyamanan pengguna dengan preferensi gerak terbatas.

---

## 3. Verifikasi & Pengujian (Verification)

1. **Next.js Static Build**:
   - Perintah: `npm run build`
   - Hasil: Sukses dalam ~1.4 detik, 19 rute statis ter-generate sempurna tanpa galat TypeScript atau CSS.
2. **Browser Subagent Visual Verification**:
   - Halaman utama dimuat di browser headless.
   - Hasil verifikasi:
     - Hero banner upacara bendera dan tipografi LAPIS LADA tampil memukau dan berbobot.
     - Akses portal pill berfungsi mulus tanpa dominasi berlebih.
     - Bento Grid pada tab Layanan LAPIS LADA tampil asimetris dan modern.
     - Tangkapan layar bukti tersimpan di direktori artefak kerja.

---

## 4. Riwayat Git & Cloudflare Pages Deployment

### Riwayat Commit:
- `dee3755`: *feat: perbarui tampilan landing page dengan hero upacara, branding standout LAPIS LADA, dan tata letak modern*
- `5deb1f1`: *chore: tambahkan aturan frontend (GEMINI.md & .agents/rules) dari SKILL.md*
- `a34dce9`: *feat: pecah aturan frontend menjadi 5 modul di .agents/rules sesuai struktur tasteskill*
- `11c88cb`: *refactor: sesuaikan UI/UX dengan 100% aturan taste skill (hapus em-dash, bento grid pilar, next/font, 100dvh, reduced motion)*

### Tautan Deployment Live:
- **Production URL**: [https://lapislada-c33.pages.dev](https://lapislada-c33.pages.dev)
- **Deployment Hash**: [https://bfa1b10c.lapislada-c33.pages.dev](https://bfa1b10c.lapislada-c33.pages.dev)
- **Status CDN**: Aktif, global edge network, HTTPS/SSL terenkripsi.
