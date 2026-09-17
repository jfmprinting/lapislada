'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import {
  Award,
  Calendar,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  GraduationCap,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { supabase, ProfilSekolah } from '@/lib/supabase';

const DEFAULT_PROFIL: ProfilSekolah = {
  id: 'default',
  nama_sekolah: 'UPT SD Negeri Latsari 2 Bancar',
  npsn: '20504924',
  nss: '101050612003',
  nis: '100020',
  akreditasi: 'B',
  tahun_berdiri: 1987,
  alamat: 'Jl. Desa Latsari No.190',
  kecamatan: 'Bancar',
  kabupaten: 'Tuban',
  provinsi: 'Jawa Timur',
  kode_pos: '62354',
  telepon: '(0356) 411000',
  hp_kepsek: '082230898376',
  email: 'sdnlatsari2@gmail.com',
  visi: 'Terwujudnya peserta didik yang beriman, bertaqwa, cerdas, terampil, mandiri, dan berwawasan lingkungan.',
  misi: '1. Menanamkan keimanan dan ketaqwaan melalui pembiasaan ibadah dan akhlak mulia.\n2. Melaksanakan proses pembelajaran yang aktif, inovatif, kreatif, dan menyenangkan.\n3. Mengembangkan bakat, minat, dan potensi peserta didik secara optimal.\n4. Menumbuhkan kepedulian sosial dan kesadaran menjaga kelestarian lingkungan hidup.',
  logo_url: '/logo.webp',
  maps_embed_url:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.854890696347!2d111.7766!3d-6.7865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNDcnMTEuNCJTIDExMcKwNDYnMzUuOCJF!5e0!3m2!1sid!2sid!4v1700000000000',
};

export default function HomePage() {
  const [profil, setProfil] = useState<ProfilSekolah>(DEFAULT_PROFIL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfil() {
      try {
        const { data, error } = await supabase
          .from('profil_sekolah')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (data && !error) {
          setProfil(data);
        }
      } catch (err) {
        // Fallback to default
        console.info('Using default profil sekolah data');
      } finally {
        setLoading(false);
      }
    }
    loadProfil();
  }, []);

  const misiList = profil.misi
    ? profil.misi
        .split('\n')
        .map((m) => m.trim())
        .filter(Boolean)
    : [];

  const waKepsekUrl = profil.hp_kepsek
    ? `https://wa.me/62${profil.hp_kepsek.replace(/^0/, '').replace(/[^0-9]/g, '')}?text=Halo%20Kepala%20Sekolah%20${encodeURIComponent(
        profil.nama_sekolah
      )},%20saya%20ingin%20bertanya%20seputar%20informasi%20sekolah.`
    : '#';

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8] text-[#1A1A1A]">
      <Navbar schoolName={profil.nama_sekolah} />

      {/* Main container with mobile-first constraint (390px centered on desktop) */}
      <main className="w-full max-w-md mx-auto sm:max-w-xl md:max-w-2xl px-4 py-5 flex-1 flex flex-col gap-5">
        {/* HERO SECTION */}
        <section className="bg-gradient-to-b from-[#922B21] to-[#771F18] text-white rounded-2xl p-6 shadow-md border border-[#C0392B]/40 text-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#C0392B]/40 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#F1948A]/20 rounded-full blur-xl pointer-events-none" />

          {/* School Emblem / Logo */}
          <div className="relative mx-auto mb-4 w-24 h-24 rounded-2xl bg-white shadow-lg p-2 flex items-center justify-center border-2 border-[#F1948A] overflow-hidden">
            <img
              src={profil.logo_url || '/logo.webp'}
              alt={profil.nama_sekolah}
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>

          <h1 className="font-serif text-2xl font-bold tracking-tight text-white leading-tight mb-2">
            {profil.nama_sekolah}
          </h1>

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold text-[#F1948A] border border-white/20">
              <Award className="w-3.5 h-3.5 text-[#F1948A]" />
              Akreditasi {profil.akreditasi || 'B'}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-xs text-white/80 border border-white/10">
              <Calendar className="w-3.5 h-3.5" />
              Berdiri {profil.tahun_berdiri || 1987}
            </span>
          </div>

          {/* Action CTAs (WF-01) */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/15">
            <Link
              href="/login?role=orangtua"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-white hover:bg-[#FAF8F2] text-[#922B21] font-bold text-xs shadow transition active:scale-95 group"
            >
              <UserCheck className="w-5 h-5 mb-1 text-[#C0392B] group-hover:scale-110 transition-transform" />
              <span>Login Ortu</span>
              <span className="text-[10px] font-normal text-[#6B6B6B]">Wali Murid</span>
            </Link>

            <Link
              href="/login?role=guru"
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white font-bold text-xs shadow transition active:scale-95 border border-[#F1948A]/40 group"
            >
              <GraduationCap className="w-5 h-5 mb-1 text-white group-hover:scale-110 transition-transform" />
              <span>Login Guru</span>
              <span className="text-[10px] font-normal text-[#F1948A]">Guru & Admin</span>
            </Link>
          </div>
        </section>

        {/* IDENTITAS SEKOLAH (WF-01) */}
        <section className="bg-white rounded-xl p-5 shadow-sm border border-[#DDD8CE]">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#E8E0D0]">
            <div className="p-1.5 rounded-md bg-[#FDEDEC] text-[#922B21]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="font-serif font-bold text-base text-[#1A1A1A]">
              Identitas Sekolah
            </h2>
          </div>

          <dl className="grid grid-cols-1 gap-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-[#F5F0E8]">
              <dt className="text-[#6B6B6B]">NPSN</dt>
              <dd className="font-mono font-bold text-[#1A1A1A]">{profil.npsn}</dd>
            </div>
            {profil.nss && (
              <div className="flex justify-between py-1 border-b border-[#F5F0E8]">
                <dt className="text-[#6B6B6B]">NSS</dt>
                <dd className="font-mono font-medium text-[#1A1A1A]">{profil.nss}</dd>
              </div>
            )}
            {profil.nis && (
              <div className="flex justify-between py-1 border-b border-[#F5F0E8]">
                <dt className="text-[#6B6B6B]">NIS</dt>
                <dd className="font-mono font-medium text-[#1A1A1A]">{profil.nis}</dd>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-[#F5F0E8]">
              <dt className="text-[#6B6B6B]">Alamat</dt>
              <dd className="font-medium text-right text-[#1A1A1A] max-w-[200px]">
                {profil.alamat}
              </dd>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F5F0E8]">
              <dt className="text-[#6B6B6B]">Kecamatan</dt>
              <dd className="font-medium text-[#1A1A1A]">{profil.kecamatan}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-[#6B6B6B]">Kabupaten / Provinsi</dt>
              <dd className="font-medium text-[#1A1A1A]">
                {profil.kabupaten}, {profil.provinsi}
              </dd>
            </div>
          </dl>
        </section>

        {/* VISI & MISI (WF-01) */}
        <section className="bg-white rounded-xl p-5 shadow-sm border border-[#DDD8CE]">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#E8E0D0]">
            <div className="p-1.5 rounded-md bg-[#FDEDEC] text-[#922B21]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="font-serif font-bold text-base text-[#1A1A1A]">
              Visi & Misi
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-[#FDEDEC]/60 border border-[#F1948A]/30 p-3.5 rounded-lg">
              <span className="block font-bold text-[#922B21] mb-1 uppercase tracking-wider text-[10px]">
                Visi Sekolah
              </span>
              <p className="font-serif italic text-sm text-[#1A1A1A] leading-relaxed">
                &ldquo;{profil.visi}&rdquo;
              </p>
            </div>

            <div>
              <span className="block font-bold text-[#922B21] mb-2 uppercase tracking-wider text-[10px]">
                Misi Sekolah
              </span>
              <ul className="space-y-2 text-[#3D3D3D] leading-relaxed">
                {misiList.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C0392B] mt-1.5 shrink-0" />
                    <span>{m.replace(/^[0-9]+\.\s*/, '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* KONTAK & LOKASI (WF-01) */}
        <section className="bg-white rounded-xl p-5 shadow-sm border border-[#DDD8CE]">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#E8E0D0]">
            <div className="p-1.5 rounded-md bg-[#FDEDEC] text-[#922B21]">
              <Phone className="w-4 h-4" />
            </div>
            <h2 className="font-serif font-bold text-base text-[#1A1A1A]">
              Kontak & Lokasi
            </h2>
          </div>

          <div className="space-y-3 text-xs mb-4">
            {profil.hp_kepsek && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F5F0E8] border border-[#DDD8CE]">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#922B21]" />
                  <div>
                    <span className="block text-[10px] text-[#6B6B6B]">HP Kepala Sekolah</span>
                    <span className="font-semibold text-[#1A1A1A]">{profil.hp_kepsek}</span>
                  </div>
                </div>
                <a
                  href={waKepsekUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#25D366] text-white text-[11px] font-bold shadow-sm hover:bg-[#20ba59] transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat WA</span>
                </a>
              </div>
            )}

            {profil.email && (
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#F5F0E8] border border-[#DDD8CE]">
                <Mail className="w-4 h-4 text-[#922B21]" />
                <div className="flex-1">
                  <span className="block text-[10px] text-[#6B6B6B]">Email Resmi</span>
                  <a
                    href={`mailto:${profil.email}`}
                    className="font-semibold text-[#1A1A1A] hover:text-[#C0392B]"
                  >
                    {profil.email}
                  </a>
                </div>
              </div>
            )}

            {profil.telepon && (
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#F5F0E8] border border-[#DDD8CE]">
                <Phone className="w-4 h-4 text-[#922B21]" />
                <div>
                  <span className="block text-[10px] text-[#6B6B6B]">Telepon Kantor</span>
                  <span className="font-semibold text-[#1A1A1A]">{profil.telepon}</span>
                </div>
              </div>
            )}
          </div>

          {/* Google Maps Embed */}
          {profil.maps_embed_url && (
            <div className="rounded-lg overflow-hidden border border-[#DDD8CE] shadow-inner">
              <iframe
                title="Peta Lokasi Sekolah"
                src={profil.maps_embed_url}
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="text-center py-6 text-xs text-[#6B6B6B] border-t border-[#DDD8CE] mt-2">
          <p className="font-semibold text-[#1A1A1A]">
            {profil.nama_sekolah} &copy; {new Date().getFullYear()}
          </p>
          <p className="mt-1">
            Didukung oleh{' '}
            <span className="font-bold text-[#922B21]">LAPIS LADA v2</span>
          </p>
          <p className="text-[11px] text-[#6B6B6B]">
            (Layanan Pusat Informasi Sekolah Latsari Dua)
          </p>
        </footer>
      </main>
    </div>
  );
}
