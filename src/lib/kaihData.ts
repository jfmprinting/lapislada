import { KaihKegiatan } from './supabase';

const todayStr = new Date().toISOString().split('T')[0];

export const INITIAL_KAIH_KEGIATAN: KaihKegiatan[] = [
  {
    id: 'kaih-s-1',
    tipe: 'sekolah',
    kelas_id: 'c1-4a',
    siswa_id: null,
    kategori_id: 2,
    kategori_nama: 'Beribadah Tepat Waktu',
    judul: 'Sholat Dhuha Berjamaah di Musholla',
    deskripsi: 'Pembiasaan sholat Dhuha bersama seluruh siswa Kelas 4A dipimpin wali kelas sebelum memulai pembelajaran jam pertama.',
    jam: '07:15 WIB',
    tanggal: todayStr,
    foto_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
    creator_nama: 'Bu Sari, S.Pd (Wali Kelas 4A)',
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'kaih-s-2',
    tipe: 'sekolah',
    kelas_id: 'c1-4a',
    siswa_id: null,
    kategori_id: 3,
    kategori_nama: 'Berolahraga / Aktivitas Fisik',
    judul: 'Senam Kesegaran Jasmani & Peregangan Bersama',
    deskripsi: 'Aktivitas fisik gerak badan dan jalan santai 20 menit di halaman sekolah untuk menjaga kebugaran tubuh.',
    jam: '09:00 WIB',
    tanggal: todayStr,
    foto_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80',
    creator_nama: 'Bu Sari, S.Pd (Wali Kelas 4A)',
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: 'kaih-r-1',
    tipe: 'rumah',
    kelas_id: 'c1-4a',
    siswa_id: 's-1',
    kategori_id: 1,
    kategori_nama: 'Bangun Pagi & Merapikan Tempat Tidur',
    judul: 'Bangun Subuh & Merapikan Kamar Sendiri',
    deskripsi: 'Ananda bangun pukul 04.45 WIB, merapikan selimut, bantal, dan menyiapkan tas sekolah secara mandiri.',
    jam: '05:10 WIB',
    tanggal: todayStr,
    foto_url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&auto=format&fit=crop&q=80',
    creator_nama: 'Pak Budi Santoso (Wali Murid)',
    apresiasi_guru: true,
    catatan_guru: 'Alhamdulillah, sangat mandiri dan tertib! Pertahankan ya Ananda.',
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    siswa: {
      nama_lengkap: 'Ahmad Budi Santoso',
      kelas: { nama_kelas: 'Kelas 4A' },
    },
  },
  {
    id: 'kaih-r-2',
    tipe: 'rumah',
    kelas_id: 'c1-4a',
    siswa_id: 's-1',
    kategori_id: 5,
    kategori_nama: 'Makan Makanan Bergizi Seimbang',
    judul: 'Sarapan Sehat Sayur Bayam, Telur & Buah Pisang',
    deskripsi: 'Sarapan sebelum berangkat ke sekolah dengan gizi seimbang serta minum air putih yang cukup.',
    jam: '06:20 WIB',
    tanggal: todayStr,
    foto_url: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop&q=80',
    creator_nama: 'Pak Budi Santoso (Wali Murid)',
    apresiasi_guru: true,
    catatan_guru: 'Hebat, sarapan bergizi membuat konsentrasi belajar makin prima.',
    created_at: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
    siswa: {
      nama_lengkap: 'Ahmad Budi Santoso',
      kelas: { nama_kelas: 'Kelas 4A' },
    },
  },
];

export interface BroadcastOptions {
  namaSekolah?: string;
  namaKelas?: string;
  namaGuru?: string;
  portalUrl?: string;
}

export function generateKaihWhatsAppBroadcast(
  kegiatan: KaihKegiatan,
  options?: BroadcastOptions
): string {
  const sekolah = options?.namaSekolah || 'SDN Latsari 2 Bancar';
  const kelas = options?.namaKelas || 'Kelas I';
  const guru = options?.namaGuru || kegiatan.creator_nama || 'Wali Kelas';
  const url = options?.portalUrl || 'https://lapislada.web.id';

  // Format tanggal Indonesia ramah
  let formattedDate = kegiatan.tanggal;
  try {
    const d = new Date(kegiatan.tanggal);
    if (!isNaN(d.getTime())) {
      formattedDate = new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    }
  } catch (e) {
    // fallback
  }

  const pilarId = Number(kegiatan.kategori_id);
  const jam = kegiatan.jam || 'Pagi hari';
  const judul = kegiatan.judul;
  const deskripsi = kegiatan.deskripsi || 'Pembiasaan karakter anak hebat hari ini di sekolah.';

  switch (pilarId) {
    case 1:
      return `✨ *LAPORAN KEGIATAN KAIH (7 KEBIASAAN ANAK INDONESIA HEBAT)* ✨
🏛️ *${sekolah} — ${kelas}*

Assalamu'alaikum Wr. Wb. / Selamat Pagi Bapak/Ibu Wali Murid yang kami hormati,

Semoga Bapak/Ibu dan keluarga senantiasa dalam keadaan sehat dan penuh keberkahan.

Hari ini, *${formattedDate}*, ananda ${kelas} membiasakan karakter positif:
🌅 *Pilar 1: Bangun Pagi & Merapikan Tempat Tidur (Disiplin & Mandiri)*
📌 *Kegiatan:* ${judul}
⏰ *Waktu:* ${jam}
📝 *Catatan Guru:* 
"${deskripsi}"

💡 *Pesan Kolaborasi untuk Ayah/Bunda di Rumah:*
Mari bimbing ananda untuk konsisten bangun pagi secara mandiri tanpa dibangunkan berulang kali, serta merapikan tempat tidur dan perlengkapan sekolahnya sendiri. Kebiasaan kecil ini adalah pondasi rasa tanggung jawab masa depannya.

📸 Foto dokumentasi & setor pembiasaan ananda di rumah dapat diakses di Aplikasi LAPIS LADA:
👉 ${url}

Terima kasih atas kerja sama dan pendampingan hebat Ayah/Bunda di rumah! 🙏✨

Hormat kami,
*${guru}*
${sekolah}`;

    case 2:
      return `✨ *LAPORAN KEGIATAN KAIH (7 KEBIASAAN ANAK INDONESIA HEBAT)* ✨
🏛️ *${sekolah} — ${kelas}*

Assalamu'alaikum Wr. Wb. / Selamat Pagi Bapak/Ibu Wali Murid yang kami hormati,

Alhamdulillah, puji syukur ke hadirat Tuhan Yang Maha Esa atas nikmat sehat dan kesempatan mendidik ananda tercinta.

Hari ini, *${formattedDate}*, di sekolah kami membimbing ananda ${kelas} dalam kegiatan:
🕌 *Pilar 2: Beribadah Tepat Waktu (Religius & Akhlak Mulia)*
📌 *Kegiatan:* ${judul}
⏰ *Waktu:* ${jam}
📝 *Catatan Guru:* 
"${deskripsi}"

💡 *Pesan Kolaborasi untuk Ayah/Bunda di Rumah:*
Menjaga sholat/ibadah tepat waktu melatih kelembutan hati dan ketaatan ananda. Mohon Ayah/Bunda berkenan mengingatkan serta mendampingi ananda menunaikan ibadah di rumah ketika adzan/waktunya tiba.

📸 Dokumentasi kegiatan hari ini sudah diunggah di Portal LAPIS LADA:
👉 ${url}

Semoga ananda tumbuh menjadi insan yang berakhlak mulia dan berbakti. Aamiin. 🤲

Salam hangat,
*${guru}*
${sekolah}`;

    case 3:
      return `✨ *LAPORAN KEGIATAN KAIH (7 KEBIASAAN ANAK INDONESIA HEBAT)* ✨
🏛️ *${sekolah} — ${kelas}*

Semangat Pagi Ayah dan Bunda Wali Murid ${kelas}! ☀️

Di dalam tubuh yang sehat terdapat jiwa yang kuat! Hari ini, *${formattedDate}*, ananda mengikuti aktivitas kebugaran:
🏃 *Pilar 3: Berolahraga & Aktivitas Fisik (Kebugaran Jasmani)*
📌 *Kegiatan:* ${judul}
⏰ *Waktu:* ${jam}
📝 *Catatan Guru:* 
"${deskripsi}"

💡 *Pesan Kolaborasi untuk Ayah/Bunda di Rumah:*
Di sela-sela waktu bermain di rumah, mari ajak ananda melakukan gerak badan aktif atau olahraga ringan minimal 15–30 menit, serta kurangi waktu screen time (gadget). Tubuh bugar membuat konsentrasi belajar makin prima!

📸 Dokumentasi keceriaan ananda berolahraga dapat dilihat di Aplikasi LAPIS LADA:
👉 ${url}

Salam sehat dan bugar,
*${guru}*
${sekolah}`;

    case 4:
      return `✨ *LAPORAN KEGIATAN KAIH (7 KEBIASAAN ANAK INDONESIA HEBAT)* ✨
🏛️ *${sekolah} — ${kelas}*

Assalamu'alaikum Wr. Wb. / Salam Sejahtera Bapak/Ibu Wali Murid yang kami banggakan,

Membaca adalah jendela dunia dan kunci kecerdasan akal. Hari ini, *${formattedDate}*, ananda ${kelas} telah melaksanakan kegiatan literasi:
📚 *Pilar 4: Gemar Belajar & Membaca Buku (Literasi & Bernalar Kritis)*
📌 *Kegiatan:* ${judul}
⏰ *Waktu:* ${jam}
📝 *Catatan Guru:* 
"${deskripsi}"

💡 *Pesan Kolaborasi untuk Ayah/Bunda di Rumah:*
Mari sediakan waktu 15 menit setiap malam untuk membaca buku cerita/pengetahuan bersama ananda di rumah. Jadikan membaca sebagai kebiasaan yang menyenangkan, bukan beban.

📸 Catatan literasi & materi belajar ananda dapat dipantau di Aplikasi LAPIS LADA:
👉 ${url}

Mari bersama kita tumbuhkan generasi cinta ilmu dan gemar membaca! 📖✨

Hormat kami,
*${guru}*
${sekolah}`;

    case 5:
      return `✨ *LAPORAN KEGIATAN KAIH (7 KEBIASAAN ANAK INDONESIA HEBAT)* ✨
🏛️ *${sekolah} — ${kelas}*

Selamat Siang Ayah & Bunda Hebat ${kelas}! 🌿

Pertumbuhan optimal berawal dari asupan yang baik. Pada hari *${formattedDate}*, kami membiasakan ananda dalam program:
🥗 *Pilar 5: Makan Makanan Bergizi Seimbang (Gizi Sehat)*
📌 *Kegiatan:* ${judul}
⏰ *Waktu:* ${jam}
📝 *Catatan Guru:* 
"${deskripsi}"

💡 *Pesan Kolaborasi untuk Ayah/Bunda di Rumah:*
Dukungan Ayah/Bunda dalam membawakan bekal sehat (sayur, buah, protein) serta membiasakan ananda minum air putih yang cukup dan membatasi jajan sembarangan sangat menentukan tumbuh kembang dan daya tahan tubuh ananda.

📸 Cek dokumentasi makan sehat bersama di Portal LAPIS LADA:
👉 ${url}

Terima kasih atas cinta dan asupan gizi terbaik yang selalu Ayah/Bunda siapkan untuk ananda! 🥦🍎🥛

Salam hangat,
*${guru}*
${sekolah}`;

    case 6:
      return `✨ *LAPORAN KEGIATAN KAIH (7 KEBIASAAN ANAK INDONESIA HEBAT)* ✨
🏛️ *${sekolah} — ${kelas}*

Assalamu'alaikum Wr. Wb. / Salam Kebajikan Bapak/Ibu Wali Murid yang kami hormati,

Mendidik anak tidak hanya soal nilai akademis, melainkan budi pekerti dan kepedulian sosial. Hari ini, *${formattedDate}*, ananda ${kelas} belajar mempraktikkan:
🤝 *Pilar 6: Bermasyarakat & Membantu Orang Tua (Gotong Royong & Empati)*
📌 *Kegiatan:* ${judul}
⏰ *Waktu:* ${jam}
📝 *Catatan Guru:* 
"${deskripsi}"

💡 *Pesan Kolaborasi untuk Ayah/Bunda di Rumah:*
Di rumah, mohon beri kesempatan ananda untuk membantu tugas-tugas ringan (merapikan meja makan, menyapu, melipat pakaian, atau menyapa tetangga dengan ramah). Pembiasaan ini melatih empati dan rasa tanggung jawab sosial sejak dini.

📸 Dokumentasi aksi baik ananda hari ini dapat dilihat di Aplikasi LAPIS LADA:
👉 ${url}

Bersama kita wujudkan putra-putri berkarakter luhur! 🤝❤️

Hormat kami,
*${guru}*
${sekolah}`;

    case 7:
    default:
      return `✨ *LAPORAN KEGIATAN KAIH (7 KEBIASAAN ANAK INDONESIA HEBAT)* ✨
🏛️ *${sekolah} — ${kelas}*

Selamat Sore/Malam Bapak/Ibu Wali Murid ${kelas} yang berbahagia,

Setelah seharian ananda beraktivitas dan menimba ilmu di sekolah pada hari *${formattedDate}*, kami mengingatkan pentingnya:
🌙 *Pilar 7: Tidur Cepat & Tepat Waktu (Kesehatan & Pemulihan)*
📌 *Kegiatan/Edukasi Kelas:* ${judul}
⏰ *Waktu:* ${jam}
📝 *Catatan Guru:* 
"${deskripsi}"

💡 *Pesan Kolaborasi untuk Ayah/Bunda di Rumah:*
Mohon dampingi ananda untuk menyelesaikan tugas sekolah lebih awal dan tidur malam sebelum pukul 21.00 WIB. Tidur cukup 8–9 jam sangat krusial bagi regenerasi sel tubuh, daya ingat, dan keceriaan ananda saat bangun esok pagi.

📸 Info & pencatatan jam tidur ananda dapat dilaporkan melalui Portal LAPIS LADA:
👉 ${url}

Selamat beristirahat bersama keluarga tercinta. Sampai jumpa di sekolah esok pagi! 🌙✨

Salam takzim,
*${guru}*
${sekolah}`;
  }
}
