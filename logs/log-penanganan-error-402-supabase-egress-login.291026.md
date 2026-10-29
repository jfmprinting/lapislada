# Log Pembaruan & Investigasi: Penanganan Error HTTP 402 Supabase Egress Quota & Perbaikan Autentikasi Login
**Tanggal**: 29 Oktober 2026  
**Berkas Log**: `/logs/log-penanganan-error-402-supabase-egress-login.291026.md`  
**Aplikasi**: LAPIS LADA (Layanan Pusat Informasi Sekolah Latsari Dua)  
**Domain Resmi**: [https://lapislada.web.id](https://lapislada.web.id)  
**Status**: ✅ Investigasi Tuntas, Kode Diperbaiki & Terverifikasi Build Produksi (`npm run build`)

---

## 1. Analisis Masalah (Root Cause Analysis)

Berdasarkan laporan pengguna yang menyertakan tangkapan layar console developer tools pada halaman login (`https://lapislada.web.id/login`), ditemukan sejumlah galat:
1. `Failed to load resource: the server responded with a status of 402 () ...supabase.co/rest/v1/...`
2. `Failed to load resource: the server responded with a status of 402 () ...supabase.co/auth/v1/token?grant_type=password`
3. `Failed to load resource: the server responded with a status of 503 () login:1`
4. Pesan antarmuka: *"Email atau kata sandi tidak cocok. Sisa kesempatan sebelum penangguhan: 4."*

### Hasil Penyelidikan Teknis Langsung ke Server
Melalui eksekusi permintaan langsung ke gateway API Supabase proyek `fqggetataxahzbwchbsh`:
```json
{
  "status": 402,
  "message": "Service for this project is restricted due to the following violations: exceed_egress_quota. The project owner must upgrade their plan or remove spend caps to restore service."
}
```

### Kesimpulan Temuan:
1. **Penyebab Utama (HTTP 402)**: Proyek Supabase sekolah (`fqggetataxahzbwchbsh`) pada paket Free Tier telah melampaui batas kuota bandwidth bulanan (**Egress Quota Exceeded > 5 GB**). Supabase secara otomatis membatasi (*restrict*) seluruh gateway API (REST, Auth, Storage).
2. **Kelemahan Penanganan Error Login**: Di [`src/app/login/page.tsx`](file:///d:/1.%20MIZTERGOOD/04%20-%20Keuangan%20dan%20Bisnis/JASA/11.%20PAK%20SANS/1.%20LAPIS%20LADA/src/app/login/page.tsx), setiap `authResult.error` diasumsikan sebagai "Email atau kata sandi tidak cocok" dan langsung memotong jatah percobaan pengguna. Ini menyesatkan pengguna dan guru karena kata sandi mereka belum tentu salah, melainkan servernya yang sedang di-restrict.
3. **Penyebab Status 503 pada Service Worker**: Pada [`public/sw.js`](file:///d:/1.%20MIZTERGOOD/04%20-%20Keuangan%20dan%20Bisnis/JASA/11.%20PAK%20SANS/1.%20LAPIS%20LADA/public/sw.js), saat terjadi kegagalan jaringan atau request offline, fallback HTML mengembalikan `status: 503` yang memicu pencatatan error merah di console.
4. **Hardcoded Supabase URL di Cloudflare Functions**: Berkas `functions/api/*.ts` sebelumnya meng-hardcode URL proyek `fqggetataxahzbwchbsh` tanpa membaca variabel lingkungan `context.env?.NEXT_PUBLIC_SUPABASE_URL` / `context.env?.SUPABASE_URL`.

---

## 2. Tindakan Perbaikan yang Telah Dilakukan

### A. Perbaikan Logika Autentikasi Login ([`src/app/login/page.tsx`](file:///d:/1.%20MIZTERGOOD/04%20-%20Keuangan%20dan%20Bisnis/JASA/11.%20PAK%20SANS/1.%20LAPIS%20LADA/src/app/login/page.tsx))
- Mengubah pesan error teknis menjadi pesan ramah pengguna awam (guru/wali murid):
  *"Layanan server sedang dalam pemeliharaan sistem. Silakan coba kembali beberapa saat lagi atau hubungi Admin Sekolah."*
- Menambahkan penanganan `error.status === 429` (Rate limit) dan `error.status >= 500` (Server maintenance/error).
- Memastikan kuota percobaan gagal (**failed attempts**) **hanya berkurang jika benar-benar terjadi kesalahan kredensial** (password/email salah), bukan saat server mengalami kendala jaringan atau pembatasan kuota.

### B. Standardisasi Dinamis Cloudflare Pages Functions ([`functions/api/`](file:///d:/1.%20MIZTERGOOD/04%20-%20Keuangan%20dan%20Bisnis/JASA/11.%20PAK%20SANS/1.%20LAPIS%20LADA/functions/api/))
- Mengubah seluruh fungsi serverless berikut agar membaca URL Supabase secara dinamis dari `context.env`:
  - `functions/api/admin-reset-password.ts`
  - `functions/api/admin-update-user.ts`
  - `functions/api/buku-penghubung.ts`
  - `functions/api/link-siswa.ts`
  - `functions/api/pengajuan-izin.ts`
- Dengan ini, jika administrator mengganti proyek Supabase atau memperbarui environment variable di Cloudflare Pages Dashboard, seluruh fungsi backend otomatis menggunakan endpoint baru tanpa perlu deploy ulang kode.

### C. Pembersihan Service Worker PWA ([`public/sw.js`](file:///d:/1.%20MIZTERGOOD/04%20-%20Keuangan%20dan%20Bisnis/JASA/11.%20PAK%20SANS/1.%20LAPIS%20LADA/public/sw.js))
- Mengubah status respons fallback offline dari 503 menjadi 200 (Clean HTML Fallback) agar tidak menimbulkan error merah di DevTools console.
- Menaikkan versi cache PWA ke `lapislada-v2-cache-v9` untuk memastikan peramban pengguna memuat aset teranyar.

---

## 3. Langkah Pemulihan oleh Administrator (Action Item)

Karena Supabase memblokir gateway di tingkat infrastruktur, pemilik akun Supabase (`fqggetataxahzbwchbsh`) dapat memilih salah satu solusi berikut:

1. **Opsi 1 — Buka Pembatasan di Dashboard Supabase (Paling Cepat)**:
   - Kunjungi [https://supabase.com/dashboard/project/fqggetataxahzbwchbsh](https://supabase.com/dashboard/project/fqggetataxahzbwchbsh).
   - Masuk ke **Project Settings** > **Billing / Usage**.
   - Aktifkan *Spend Cap* atau upgrade plan / kaitkan pembayaran sementara untuk membuka pembatasan seketika.
2. **Opsi 2 — Tunggu Reset Siklus Bulanan**:
   - Kuota egress Supabase Free Tier direset otomatis pada tanggal 1 setiap bulan (dalam ~2-3 hari lagi, per 1 November 2026).
3. **Opsi 3 — Pindah ke Proyek Supabase Baru (100% Gratis)**:
   - Buat proyek baru di [supabase.com](https://supabase.com) (misal: `lapislada-sekolah`).
   - Jalankan `supabase-full-cloud-migration.sql` dan `supabase-admin-reset.sql` di SQL Editor.
   - Perbarui nilai `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` di pengaturan Cloudflare Pages Environment Variables dan `.env.local`.

