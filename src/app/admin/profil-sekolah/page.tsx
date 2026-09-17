'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, CheckCircle2, AlertCircle, School, Globe } from 'lucide-react';
import { supabase, ProfilSekolah } from '@/lib/supabase';
import AppShell from '@/components/layout/AppShell';

export default function AdminProfilSekolahPage() {
  const [form, setForm] = useState<ProfilSekolah>({
    id: '',
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
    misi: '1. Menanamkan keimanan dan ketaqwaan melalui pengamalan ajaran agama.\n2. Melaksanakan pembelajaran dan bimbingan secara efektif.\n3. Mengembangkan potensi bakat dan minat siswa.',
    logo_url: '/logo.webp',
    maps_embed_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.854890696347!2d111.7766!3d-6.7865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNDcnMTEuNCJTIDExMcKwNDYnMzUuOCJF!5e0!3m2!1sid!2sid!4v1',
  });

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function fetchProfil() {
      const { data } = await supabase.from('profil_sekolah').select('*').limit(1).maybeSingle();
      if (data) {
        setForm(data);
      }
    }
    fetchProfil();
  }, []);

  const handleChange = (field: keyof ProfilSekolah, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const payload = {
        ...form,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profil_sekolah').upsert(payload);
      if (error) throw error;

      setStatusMsg({ type: 'success', text: 'Perubahan profil sekolah berhasil disimpan!' });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Gagal menyimpan. Pastikan tabel profil_sekolah sudah di-migrate di Supabase.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      role="admin"
      pageTitle="Kelola Profil Sekolah Publik"
      pageSubtitle="Data ini ditampilkan pada landing page publik (/) untuk masyarakat & wali murid"
    >
      <div className="max-w-4xl space-y-6">
        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-[#DDD8CE]">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E8E0D0]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#922B21] text-white">
                <School className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  Informasi Sekolah & Identitas Resmi
                </h2>
                <p className="text-xs text-[#6B6B6B]">
                  Lengkapi data NPSN, kontak kepala sekolah, visi misi, dan Google Maps
                </p>
              </div>
            </div>

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F2] hover:bg-[#F5F0E8] text-xs font-bold text-[#922B21] border border-[#DDD8CE] transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Lihat Halaman Publik &rarr;</span>
            </Link>
          </div>

          {statusMsg && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-xs ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-[#FDEDEC] text-[#922B21] border border-[#F1948A]'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-[#C0392B]" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5 text-xs">
            <div>
              <label className="block font-bold text-[#3D3D3D] mb-1.5">
                Nama Resmi Sekolah *
              </label>
              <input
                type="text"
                required
                value={form.nama_sekolah}
                onChange={(e) => handleChange('nama_sekolah', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#3D3D3D] mb-1.5">
                  NPSN *
                </label>
                <input
                  type="text"
                  required
                  value={form.npsn}
                  onChange={(e) => handleChange('npsn', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#3D3D3D] mb-1.5">
                  NSS
                </label>
                <input
                  type="text"
                  value={form.nss || ''}
                  onChange={(e) => handleChange('nss', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-[#3D3D3D] mb-1.5">
                  NIS
                </label>
                <input
                  type="text"
                  value={form.nis || ''}
                  onChange={(e) => handleChange('nis', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#3D3D3D] mb-1.5">
                  Akreditasi
                </label>
                <select
                  value={form.akreditasi || 'B'}
                  onChange={(e) => handleChange('akreditasi', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                >
                  <option value="A">Akreditasi A (Unggul)</option>
                  <option value="B">Akreditasi B (Baik)</option>
                  <option value="C">Akreditasi C (Cukup)</option>
                  <option value="Belum">Belum Terakreditasi</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-[#3D3D3D] mb-1.5">
                  Tahun Berdiri
                </label>
                <input
                  type="number"
                  value={form.tahun_berdiri || ''}
                  onChange={(e) => handleChange('tahun_berdiri', parseInt(e.target.value) || null)}
                  placeholder="1987"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#3D3D3D] mb-1.5">
                Alamat Lengkap Sekolah
              </label>
              <textarea
                rows={2}
                value={form.alamat || ''}
                onChange={(e) => handleChange('alamat', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-[#3D3D3D] mb-1.5">
                  Kecamatan
                </label>
                <input
                  type="text"
                  value={form.kecamatan || ''}
                  onChange={(e) => handleChange('kecamatan', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#3D3D3D] mb-1.5">
                  Kabupaten
                </label>
                <input
                  type="text"
                  value={form.kabupaten || ''}
                  onChange={(e) => handleChange('kabupaten', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#3D3D3D] mb-1.5">
                  Provinsi
                </label>
                <input
                  type="text"
                  value={form.provinsi || ''}
                  onChange={(e) => handleChange('provinsi', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#3D3D3D] mb-1.5">
                  Kode Pos
                </label>
                <input
                  type="text"
                  value={form.kode_pos || ''}
                  onChange={(e) => handleChange('kode_pos', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#3D3D3D] mb-1.5">
                  HP Kepala Sekolah (Untuk Tombol WhatsApp Publik)
                </label>
                <input
                  type="text"
                  value={form.hp_kepsek || ''}
                  onChange={(e) => handleChange('hp_kepsek', e.target.value)}
                  placeholder="082230898376"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#3D3D3D] mb-1.5">
                  Email Resmi Sekolah
                </label>
                <input
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="sdnlatsari2@gmail.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#3D3D3D] mb-1.5">
                Visi Sekolah
              </label>
              <textarea
                rows={3}
                value={form.visi || ''}
                onChange={(e) => handleChange('visi', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#3D3D3D] mb-1.5">
                Misi Sekolah (Pisahkan per baris)
              </label>
              <textarea
                rows={4}
                value={form.misi || ''}
                onChange={(e) => handleChange('misi', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#3D3D3D] mb-1.5">
                  Link URL Logo Sekolah
                </label>
                <input
                  type="text"
                  value={form.logo_url || ''}
                  onChange={(e) => handleChange('logo_url', e.target.value)}
                  placeholder="/logo.webp"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#3D3D3D] mb-1.5">
                  Google Maps Embed URL
                </label>
                <input
                  type="text"
                  value={form.maps_embed_url || ''}
                  onChange={(e) => handleChange('maps_embed_url', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DDD8CE] bg-white text-[#1A1A1A]"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 rounded-xl bg-[#C0392B] hover:bg-[#a93226] text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan Perubahan...' : 'Simpan Profil Sekolah →'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
