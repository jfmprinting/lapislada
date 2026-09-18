'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, UserCheck, GraduationCap, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialRole = searchParams.get('role') === 'orangtua' ? 'orangtua' : 'guru';
  const [role, setRole] = useState<'guru' | 'orangtua'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.user) {
        const userRole = data.user?.user_metadata?.role || role;
        if (userRole === 'orangtua') {
          router.push('/dashboard/orangtua');
        } else {
          router.push('/dashboard');
        }
        return;
      }

      // Fallback check: Check credentials registry for passwords reset by admin
      try {
        const storedRegistry = localStorage.getItem('lapislada_credentials_registry');
        if (storedRegistry) {
          const registry = JSON.parse(storedRegistry);
          const entry = registry[email.toLowerCase().trim()];
          if (entry && entry.password === password.trim()) {
            const fallbackEmail = entry.role === 'orangtua' ? 'ortu@guru.com' : 'guru@demo.com';
            await supabase.auth.signInWithPassword({
              email: fallbackEmail,
              password: 'demo123',
            });
            if (entry.role === 'orangtua') {
              router.push('/dashboard/orangtua');
            } else {
              router.push('/dashboard');
            }
            return;
          }
        }
      } catch (regErr) {
        console.warn('Credentials registry check error:', regErr);
      }

      if (error) {
        throw error;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login gagal. Periksa kembali email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  // Demo shortcut for effortless testing
  const fillDemo = (type: 'guru' | 'orangtua' | 'admin') => {
    if (type === 'guru') {
      setRole('guru');
      setEmail('guru@demo.com');
      setPassword('demo123');
    } else if (type === 'orangtua') {
      setRole('orangtua');
      setEmail('ortu@guru.com');
      setPassword('demo123');
    } else {
      setRole('guru');
      setEmail('admin@demo.com');
      setPassword('demo123');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F5F0E8] px-4 py-8">
      {/* Container max-w-md (390px mobile-first) */}
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-md border border-[#DDD8CE] p-6 sm:p-8">
        {/* BRANDING HEADER */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center justify-center mb-3">
            <div className="w-16 h-16 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-md border border-[#DDD8CE] overflow-hidden">
              <img src="/logo.webp" alt="Logo Sekolah" className="w-full h-full object-contain" />
            </div>
          </Link>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1A1A1A]">
            LAPIS LADA
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5 font-medium">
            Layanan Pusat Informasi Sekolah Latsari Dua
          </p>
        </div>

        {/* ROLE TOGGLE (WF-02) */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-[#6B6B6B] mb-2 text-center uppercase tracking-wider">
            Masuk sebagai
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F5F0E8] rounded-xl border border-[#DDD8CE]">
            <button
              type="button"
              onClick={() => setRole('guru')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                role === 'guru'
                  ? 'bg-[#922B21] text-white shadow-sm'
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Guru / Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('orangtua')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                role === 'orangtua'
                  ? 'bg-[#922B21] text-white shadow-sm'
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Orang Tua</span>
            </button>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-[#FDEDEC] border border-[#F1948A] flex items-start gap-2 text-xs text-[#922B21]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#3D3D3D] mb-1">
              Email Pengguna
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'guru' ? 'guru@sekolah.sch.id' : 'email.orangtua@gmail.com'}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#DDD8CE] bg-white text-xs text-[#1A1A1A] placeholder-[#6B6B6B] focus:outline-none focus:ring-2 focus:ring-[#C0392B] focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3D3D3D] mb-1">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#DDD8CE] bg-white text-xs text-[#1A1A1A] placeholder-[#6B6B6B] focus:outline-none focus:ring-2 focus:ring-[#C0392B] focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-[#C0392B] hover:bg-[#a93226] text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {loading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* DEMO ACCOUNTS HELPER */}
        <div className="mt-6 pt-5 border-t border-[#DDD8CE]">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#6B6B6B] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C0392B]" />
            <span>Mode Uji Coba Cepat (Demo):</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => fillDemo('guru')}
              className="py-1.5 px-2 bg-[#F5F0E8] hover:bg-[#E8E0D0] text-[#1A1A1A] rounded-md text-[10px] font-semibold border border-[#DDD8CE] transition"
            >
              Demo Guru
            </button>
            <button
              type="button"
              onClick={() => fillDemo('orangtua')}
              className="py-1.5 px-2 bg-[#F5F0E8] hover:bg-[#E8E0D0] text-[#1A1A1A] rounded-md text-[10px] font-semibold border border-[#DDD8CE] transition"
            >
              Demo Ortu
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="py-1.5 px-2 bg-[#F5F0E8] hover:bg-[#E8E0D0] text-[#1A1A1A] rounded-md text-[10px] font-semibold border border-[#DDD8CE] transition"
            >
              Demo Admin
            </button>
          </div>
        </div>

        <div className="mt-5 text-center">
          <p className="text-[11px] text-[#6B6B6B]">
            Lupa password atau belum terdaftar?{' '}
            <span className="font-semibold text-[#922B21]">Hubungi Admin Sekolah</span>
          </p>
          <Link
            href="/"
            className="inline-block mt-3 text-xs font-medium text-[#C0392B] hover:underline"
          >
            &larr; Kembali ke Profil Sekolah
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs">Memuat...</div>}>
      <LoginForm />
    </Suspense>
  );
}
