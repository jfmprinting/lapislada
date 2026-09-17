'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, CheckCircle2, AlertCircle, School } from 'lucide-react';
import { supabase, ProfilSekolah } from '@/lib/supabase';
import Navbar from '@/components/layout/Navbar';

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
    logo_url: '',
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
      // Upsert to profil_sekolah table
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
    <div className="min-h-screen flex flex-col bg-[#F5F0E8] text-[#1A1A1A]">
      <Navbar schoolName="Admin LAPIS LADA" showLoginCta={false} />

      <main className="w-full max-w-md mx-auto sm:max-w-xl md:max-w-2xl px-4 py-5 flex-1">
        {/* HEADER BAR */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6B6B] hover:text-[#922B21] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <span className="text-xs font-bold text-[#922B21] bg-[#FDEDEC] px-2.5 py-1 rounded-md border border-[#F1948A]">
            Khusus Admin
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#DDD8CE]">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#E8E0D0]">
            <div className="p-2 rounded-lg bg-[#922B21] text-white">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg text-[#1A1A1A]">
                Profil Sekolah Publik
              </h1>
              <p className="text-[11px] text-[#6B6B6B]">
                Data ini akan langsung tampil pada halaman publik (/)
              </p>
            </div>
          </div>

          {statusMsg && (
            <div
              className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-xs ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-[#FDEDEC] text-[#922B21] border border-[#F1948A]'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-[#C0392B]" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#3D3D3D] mb-1">
                Nama Resmi Sekolah *
              </label>
              <input
                type="text"
                required
                value={form.nama_sekolah}
                onChange={(e) => handleChange('nama_sekolah', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#3D3D3D] mb-1">
                  NPSN *
                </label>
                <input
                  type="text"
                  required
                  value={form.npsn}
                  onChange={(e) => handleChange('npsn', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#3D3D3D] mb-1">
                  NSS
                </label>
                <input
                  type="text"
                  value={form.nss || ''}
                  onChange={(e) => handleChange('nss', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#3D3D3D] mb-1">
                  NIS
                </label>
                <input
                  type="text"
                  value={form.nis || ''}
                  onChange={(e) => handleChange('nis', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#3D3D3D] mb-1">
                  Akreditasi
                </label>
                <select
                  value={form.akreditasi || 'B'}
                  onChange={(e) => handleChange('akreditasi', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                >
                  <option value="A">Akreditasi A (Unggul)</option>
                  <option value="B">Akreditasi B (Baik)</option>
                  <option value="C">Akreditasi C (Cukup)</option>
                  <option value="Belum">Belum Terakreditasi</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#3D3D3D] mb-1">
                Tahun Berdiri
              </label>
              <input
                type="number"
                value={form.tahun_berdiri || ''}
                onChange={(e) => handleChange('tahun_berdiri', parseInt(e.target.value) || null)}
                placeholder="1987"
                className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#3D3D3D] mb-1">
                Alamat Lengkap
              </label>
              <textarea
                rows={2}
                value={form.alamat || ''}
                onChange={(e) => handleChange('alamat', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#3D3D3D] mb-1">
                  Kecamatan
                </label>
                <input
                  type="text"
                  value={form.kecamatan || ''}
                  onChange={(e) => handleChange('kecamatan', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#3D3D3D] mb-1">
                  Kabupaten
                </label>
                <input
                  type="text"
                  value={form.kabupaten || ''}
                  onChange={(e) => handleChange('kabupaten', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#3D3D3D] mb-1">
                  Provinsi
                </label>
                <input
                  type="text"
                  value={form.provinsi || ''}
                  onChange={(e) => handleChange('provinsi', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#3D3D3D] mb-1">
                  Kode Pos
                </label>
                <input
                  type="text"
                  value={form.kode_pos || ''}
                  onChange={(e) => handleChange('kode_pos', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#3D3D3D] mb-1">
                  HP Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={form.hp_kepsek || ''}
                  onChange={(e) => handleChange('hp_kepsek', e.target.value)}
                  placeholder="082230898376"
                  className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#3D3D3D] mb-1">
                  Email Sekolah
                </label>
                <input
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="sdnlatsari2@gmail.com"
                  className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#3D3D3D] mb-1">
                Visi Sekolah
              </label>
              <textarea
                rows={3}
                value={form.visi || ''}
                onChange={(e) => handleChange('visi', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#3D3D3D] mb-1">
                Misi Sekolah (Pisahkan dengan baris baru)
              </label>
              <textarea
                rows={4}
                value={form.misi || ''}
                onChange={(e) => handleChange('misi', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#3D3D3D] mb-1">
                Link URL Logo (Google Drive / Web)
              </label>
              <input
                type="url"
                value={form.logo_url || ''}
                onChange={(e) => handleChange('logo_url', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#3D3D3D] mb-1">
                Google Maps Embed URL
              </label>
              <input
                type="text"
                value={form.maps_embed_url || ''}
                onChange={(e) => handleChange('maps_embed_url', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#DDD8CE] bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C0392B]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 px-4 rounded-lg bg-[#C0392B] hover:bg-[#a93226] text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan Profil'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
