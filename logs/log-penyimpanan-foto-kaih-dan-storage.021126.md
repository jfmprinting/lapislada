# Log Investigasi & Perbaikan Penyimpanan Foto KAIH & Supabase Storage (02/11/26)

## 1. Konteks & Keluhan Pengguna
- **Keluhan Klien**: Klien (guru dan wali murid) mengeluhkan bahwa foto-foto kegiatan pembiasaan karakter yang diunggah di menu KAIH tidak tersimpan.
- **Pemeriksaan Storage Supabase**: Pengguna mengecek dashboard Supabase Storage (`storage/files`) dan mendapati storage kosong / belum ada bucket file.
- **Pertanyaan Inti**: Apakah memang foto-foto yang diunggah wali murid dan guru di menu KAIH benar-benar tidak tersimpan?

---

## 2. Hasil Investigasi Teknis Mendalam

### A. Mengapa Storage di Supabase Kosong?
1. **Desain Awal Aplikasi**: Menu KAIH sejak awal **TIDAK menggunakan Supabase Storage bucket**, melainkan menggunakan kompresi instan sisi browser (`compressImageFile` di `src/lib/supabase.ts`) menjadi Data URL WebP/JPEG ringan (~40–80 KB) yang disimpan langsung ke dalam kolom teks `foto_url` pada tabel PostgreSQL `public.kaih_kegiatan`.
2. **Kondisi Data Eksisting**: Di database Supabase PostgreSQL aktif saat ini tercatat ada **797 baris data KAIH**, dan seluruhnya memuat foto-foto kegiatan dalam format Base64 Data URL secara utuh.
3. Itulah sebabnya menu Storage di Supabase kosong (0 bucket): sistem sebelumnya tidak pernah membuat atau mengarahkan file ke bucket storage.

### B. Mengapa Foto KAIH yang Baru Diunggah Tidak Tersimpan ke Supabase?
Ditemukan 3 akar masalah kritis pada kode `src/app/kaih/page.tsx`:
1. **Hardcoded Dummy Foreign Key (`kelas_id: 'c1-4a'` & `siswa_id: 's-1'`)**:
   - Pada `handleSubmitActivity`, baris pembuatan record baru menyematkan `kelas_id: 'c1-4a'` (dummy bawaan prototipe awal).
   - Di PostgreSQL Supabase, tabel `kaih_kegiatan` memiliki foreign key constraint `kaih_kegiatan_kelas_id_fkey` ke tabel `kelas(id)` yang menggunakan ID UUID nyata (misal: `f8ca2451-a6e3-4665-8f4b-629c7c735d05`).
   - Akibatnya, setiap kali ada guru atau wali murid yang menekan tombol Simpan, PostgreSQL langsung **menolak** penyimpanan data dengan error `violates foreign key constraint "kaih_kegiatan_kelas_id_fkey"`.
2. **Silent Error Swallowing**:
   - Error database tersebut di-*catch* dan hanya dicatat pada `console.warn`.
   - Kode tetap memanggil `saveKegiatanList(updated)` yang menyimpannya ke `localStorage` HP/browser perangkat pengunggah saja, lalu menampilkan toast sukses: *"Kegiatan Tercatat!"*.
   - Akibatnya, pengguna mengira foto sudah tersimpan di cloud, padahal hanya ada di memori lokal HP mereka sendiri dan tidak pernah masuk ke database Supabase sehingga guru/admin tidak bisa melihatnya.
3. **Ketiadaan State `kelasId`**:
   - Komponen KAIH mendeteksi nama kelas siswa/guru, namun tidak pernah menyimpan UUID `kelas_id` dari database ke dalam React state untuk dikirimkan saat `upsert`.

---

## 3. Solusi & Tindakan yang Telah Dilakukan

1. **Pembuatan Bucket Storage Otomatis & Skrip RLS**:
   - Membuat bucket publik `kaih-photos` di Supabase Storage dengan batas ukuran 5 MB per file.
   - Menyediakan skrip SQL `scripts/fix_kaih_and_storage.sql` untuk memastikan perizinan publik baca dan tulis pada `storage.objects` serta tabel `kaih_kegiatan`.
2. **Dukungan Hybrid Storage + Base64 Fallback**:
   - Memodifikasi `handleImageChange` dan `handleSubmitActivity` di `src/app/kaih/page.tsx`:
     - Jika pengguna mengunggah foto, aplikasi mencoba mengunggah file langsung ke Supabase Storage bucket `kaih-photos`.
     - Jika berhasil, URL publik Supabase Storage disimpan ke kolom `foto_url`. File foto kini dapat dipantau langsung di menu Storage Supabase Dashboard.
     - Jika terjadi kendala jaringan/storage, sistem secara mulus (*graceful fallback*) menggunakan Data URL terkompresi sehingga foto tidak pernah hilang.
3. **Perbaikan Foreign Key & State Tracking**:
   - Menambahkan state `kelasId` yang mengambil UUID kelas resmi dari profil guru atau data anak murid (`matchedSiswa.kelas_id` / `kData[0].id`).
   - Membersihkan nilai dummy: jika kelas atau siswa tidak teridentifikasi, nilai dikirimkan sebagai `null` (diizinkan di schema PostgreSQL) dan **BUKAN** `'c1-4a'` atau `'s-1'`.
   - Menghapus silent error: jika terjadi kegagalan `upsert` ke Supabase, sistem menampilkan notifikasi error yang jelas ke pengguna sehingga kendala terpantau transparan.
4. **Verifikasi & Pengujian**:
   - Menjalankan `npx tsc --noEmit` -> 0 error.
   - Menjalankan `npm test` -> 8/8 test suite lulus.

