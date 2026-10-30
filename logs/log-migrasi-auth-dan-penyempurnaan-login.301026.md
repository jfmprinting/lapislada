# Log Dokumentasi: Migrasi Auth Supabase Baru & Penyempurnaan Sistem Login
**Tanggal:** 30 Oktober 2026 (301026)  
**Aplikasi:** LAPIS LADA — Layanan Pusat Informasi Sekolah UPT SD Negeri Latsari 2 Bancar  
**Domain Produksi:** `https://lapislada.web.id`  
**Supabase Baru:** `https://kgufgvhbukartxqxbeyl.supabase.co` (`lapisladav2`)  
**Penulis/Pelaksana:** Tim Pengembang & Antigravity Assistant

---

## 1. Latar Belakang & Masalah (Problem Statement)
Setelah proyek dipindahkan dari project Supabase lama (`fqgqetatxahzbwchbsh`) ke project Supabase baru (`kgufgvhbukartxqxbeyl`) akibat isu kuota egress (402), muncul beberapa kendala operasional:

1. **Guru & Wali Murid Gagal Login:**
   - Tabel publik (`public.users_profile`, `public.siswa`, dll.) berhasil diimpor via CSV, namun tabel autentikasi internal Supabase (`auth.users`) belum terpindahkan.
   - Hasil pengecekan awal menunjukkan baru 1 akun yang terdaftar di `auth.users`, sementara 104 akun lainnya (guru, kepala sekolah, admin, dan wali murid) tidak memiliki kredensial login di project baru.

2. **Benturan Kredensial Placeholder (Duplicate Key):**
   - Saat mencoba memasukkan data `auth.users`, terjadi benturan `duplicate key value violates unique constraint "users_email_partial_key"` untuk akun admin Pak Muhammad Najih karena ada akun dummy sementara dengan ID berbeda yang dibuat sebelumnya.

3. **Error 500 saat Login (GoTrue Internal Requirement):**
   - Import langsung via SQL menyebabkan kolom token (`confirmation_token`, `recovery_token`, dll.) bernilai `NULL`. GoTrue Supabase mewajibkan kolom-kolom ini bernilai string kosong `''` bukan `NULL`, memicu status HTTP 500 saat mencoba login.

4. **Kekhawatiran Admin Terkait Password & Kemudahan Login:**
   - Admin khawatir harus mereset satu per satu kata sandi guru dan 90+ wali murid.
   - Di modal admin muncul keterangan membingungkan *"Kata Sandi Belum Pernah Disimpan"*.
   - Pengguna harus mengetik ulang username dan password setiap kali kembali ke halaman login.

---

## 2. Rincian Solusi & Langkah Implementasi

### A. Migrasi Kredensial 100% dari Supabase Lama (Tanpa Ganti Password)
1. Mengekstrak 111 data kredensial terenkripsi (`auth.users` dengan hash `bcrypt`) dari SQL Editor project lama dalam 2 tahap (`LIMIT` dan `OFFSET 100`).
2. Menghapus akun placeholder sementara Pak Najih yang bentrok (`id: cc1af0dc-...`) sehingga ID asli `94adfe8e-8654-489e-b769-7420e7defeef` (yang tersambung sebagai Wali Kelas V) dapat terpasang dengan bersih.
3. Merumuskan skrip SQL lengkap `scripts/restore_auth_users.sql`:
   - Memasukkan seluruh 111 record ke `auth.users` dengan hash password lama masing-masing.
   - Mengisi `auth.identities` untuk autentikasi provider email.
   - Menyetel `email_confirmed_at` agar pengguna bisa langsung masuk tanpa verifikasi email.
4. Menjalankan penyesuaian kolom token GoTrue:
   ```sql
   UPDATE auth.users
   SET
     confirmation_token = COALESCE(confirmation_token, ''),
     recovery_token = COALESCE(recovery_token, ''),
     email_change_token_new = COALESCE(email_change_token_new, ''),
     email_change = COALESCE(email_change, ''),
     email_change_token_current = COALESCE(email_change_token_current, ''),
     phone_change = COALESCE(phone_change, ''),
     phone_change_token = COALESCE(phone_change_token, ''),
     reauthentication_token = COALESCE(reauthentication_token, ''),
     is_super_admin = COALESCE(is_super_admin, false),
     email_change_confirm_status = COALESCE(email_change_confirm_status, 0);
   ```
5. **Hasil Verifikasi:** Pengujian login langsung ke server Supabase menggunakan akun guru (Pak Santoso) dengan kata sandi lama berhasil 100% (`HTTP 200 OK`).

---

### B. Penyempurnaan Tampilan & Kontrol Modal Admin (`ResetPasswordModal.tsx`)
1. **Penegasan Status Akun Aktif:**
   - Menambahkan status `accountExists`.
   - Jika akun sudah terdaftar aktif di server tetapi belum memiliki catatan teks tersimpan, modal menampilkan badge dan pesan hijau:
     > **Akun Aktif (Password Lama Tetap Berlaku)**
     > *Akun ini sudah aktif di server dengan kata sandi terenkripsi. Pengguna tetap dapat login menggunakan password lama mereka.*
2. **Restorasi `password_display` Khusus Admin:**
   - Memperbarui `functions/api/admin-reset-password.ts` agar admin yang berwenang tetap dapat membaca teks password tersimpan untuk dibagikan kembali ke WhatsApp wali murid tanpa perlu mereset ulang akun.

---

### C. Fitur Auto-Login & Penyimpanan Sesi di Perangkat (`src/app/login/page.tsx`)
1. **Auto-Redirect Sesi Aktif:**
   - Saat pengguna membuka `/login`, aplikasi otomatis memeriksa status sesi Supabase di `localStorage`. Jika sesi masih aktif (pengguna belum menekan tombol logout), pengguna langsung dialihkan ke dashboard masing-masing (`/dashboard`, `/dashboard/orangtua`, atau `/dashboard/kepala-sekolah`).
2. **Ingat Akun & Kata Sandi (`lapislada_saved_login`):**
   - Menambahkan opsi centang *"Simpan akun & kata sandi di perangkat ini"* (aktif secara default).
   - Menyimpan kredensial di `localStorage` perangkat dan memuatnya kembali saat halaman login dibuka.
   - Menambahkan atribut form standar `autoComplete="username"` dan `autoComplete="current-password"` untuk mendukung fitur autofill bawaan browser/HP.

---

## 3. Hasil Pengujian & Verifikasi
- **Automated Tests:** `node --test tests/**/*.test.cjs` -> **6/6 tests passed (100% pass)**.
- **TypeScript Static Check:** `npx tsc --noEmit` -> **0 error**.
- **Live Auth Check:**
  - Total user aktif di `auth.users`: **111 user**.
  - Total profil di `public.users_profile`: **111 profil**.
  - Total siswa di `public.siswa`: **129 siswa**.
  - Uji otentikasi akun guru menggunakan sandi lama: **Status 200 OK**.

---

## 4. Riwayat Git Commit
- `c897b25`: `feat(auth): show active account status, restore admin password display, and add remember-me auto-login`
- Branch: `main` (sudah tersinkronisasi penuh dengan `origin/main`).
