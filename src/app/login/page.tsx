'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Lock, Mail, AlertCircle, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds

function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [remainingCooldown, setRemainingCooldown] = useState(0);

  // A04: Purge any legacy plaintext credentials registry from localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('lapislada_credentials_registry');
    } catch {}
  }, []);

  // Cooldown timer ticker
  useEffect(() => {
    if (!lockoutTime) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= lockoutTime) {
        setLockoutTime(null);
        setRemainingCooldown(0);
        setFailedAttempts(0);
        setErrorMessage(null);
      } else {
        setRemainingCooldown(Math.ceil((lockoutTime - now) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTime]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lockoutTime && Date.now() < lockoutTime) {
      setErrorMessage(`Terlalu banyak percobaan gagal. Silakan tunggu ${remainingCooldown} detik demi keamanan.`);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    try {
      let authResult = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      // Smart fallback: Bantu orang tua jika terjadi salah ketik huruf mirip pada format sandi sekolah
      // (Misal: 'KelasI' Romawi I vs angka '1' vs huruf 'l' kecil, atau angka romawi lainnya)
      if (authResult.error && /LadaKelas/i.test(cleanPassword)) {
        const variants: string[] = [];
        
        // Varian Kelas 1 (I kapital vs angka 1 vs huruf l kecil)
        if (/Kelas[1l]/i.test(cleanPassword)) {
          variants.push(cleanPassword.replace(/Kelas[1l]/i, 'KelasI'));
          variants.push(cleanPassword.replace(/Kelas[1l]/i, 'Kelas1'));
        }
        if (/KelasI\b/i.test(cleanPassword)) {
          variants.push(cleanPassword.replace(/KelasI/i, 'Kelas1'));
          variants.push(cleanPassword.replace(/KelasI/i, 'Kelasl'));
        }

        // Varian Kelas 2..6 Romawi vs Angka Arab
        if (/Kelas2/i.test(cleanPassword)) variants.push(cleanPassword.replace(/Kelas2/i, 'KelasII'));
        if (/KelasII/i.test(cleanPassword)) variants.push(cleanPassword.replace(/KelasII/i, 'Kelas2'));
        if (/Kelas3/i.test(cleanPassword)) variants.push(cleanPassword.replace(/Kelas3/i, 'KelasIII'));
        if (/KelasIII/i.test(cleanPassword)) variants.push(cleanPassword.replace(/KelasIII/i, 'Kelas3'));
        if (/Kelas4/i.test(cleanPassword)) variants.push(cleanPassword.replace(/Kelas4/i, 'KelasIV'));
        if (/KelasIV/i.test(cleanPassword)) variants.push(cleanPassword.replace(/KelasIV/i, 'Kelas4'));
        if (/Kelas5/i.test(cleanPassword)) variants.push(cleanPassword.replace(/Kelas5/i, 'KelasV'));
        if (/KelasV/i.test(cleanPassword)) variants.push(cleanPassword.replace(/KelasV/i, 'Kelas5'));
        if (/Kelas6/i.test(cleanPassword)) variants.push(cleanPassword.replace(/Kelas6/i, 'KelasVI'));
        if (/KelasVI/i.test(cleanPassword)) variants.push(cleanPassword.replace(/KelasVI/i, 'Kelas6'));

        for (const variant of variants) {
          if (variant === cleanPassword) continue;
          const retry = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: variant,
          });
          if (!retry.error && retry.data?.user) {
            authResult = retry;
            break;
          }
        }
      }

      const { data, error } = authResult;

      if (!error && data?.user) {
        // Reset counter on successful login
        setFailedAttempts(0);
        setLockoutTime(null);

        let userRole = data.user?.user_metadata?.role;
        let userJabatan = data.user?.user_metadata?.jabatan;

        // Fetch users_profile table for authoritative role
        const { data: prof } = await supabase
          .from('users_profile')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (prof?.role) {
          userRole = prof.role;
          if (prof.role !== 'kepala_sekolah') {
            userJabatan = undefined;
          }
        }

        // Fallback: check if linked to a student as wali murid
        if (!userRole) {
          const { data: siswa } = await supabase
            .from('siswa')
            .select('id')
            .eq('wali_murid_id', data.user.id)
            .maybeSingle();
          if (siswa) {
            userRole = 'orangtua';
          }
        }

        // Automatic smart redirection based on user's actual role
        if (
          userRole === 'kepala_sekolah' ||
          userJabatan === 'kepala_sekolah' ||
          cleanEmail === 'kepsek@demo.com'
        ) {
          router.push('/dashboard/kepala-sekolah');
        } else if (userRole === 'orangtua') {
          // Pre-emptively link student with backend service role
          if (data.session?.access_token) {
            fetch('/api/link-siswa', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${data.session.access_token}`,
              },
            }).catch(() => {});
          }
          router.push('/dashboard/orangtua');
        } else {
          router.push('/dashboard');
        }
        return;
      }

      // Handle Authentication Failure (A07: Authentication & Brute Force Prevention)
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);

      if (nextFailures >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
        setLockoutTime(lockUntil);
        setRemainingCooldown(60);
        setErrorMessage('Terlalu banyak percobaan login gagal berturut-turut. Akun ditangguhkan sementara selama 60 detik.');
      } else {
        const hint = /LadaKelas/i.test(cleanPassword)
          ? ' (Tips: Perhatikan huruf kapital, angka Romawi vs angka biasa, dan simbol tanda pagar/seru).'
          : '';
        setErrorMessage(`Email atau kata sandi tidak cocok. Sisa kesempatan sebelum penangguhan: ${MAX_FAILED_ATTEMPTS - nextFailures}.${hint}`);
      }
    } catch {
      setErrorMessage('Terjadi kendala saat menghubungi server autentikasi. Silakan periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
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

        {/* ERROR MESSAGE */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-[#FDEDEC] border border-[#F1948A] flex items-start gap-2 text-xs text-[#922B21]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#3D3D3D] mb-1">
              Email Akun
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@sdnlatsari.sch.id atau email Anda"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#DDD8CE] bg-white text-xs text-[#1A1A1A] placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-[#C0392B] focus:border-transparent transition"
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
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-[#DDD8CE] bg-white text-xs text-[#1A1A1A] placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-[#C0392B] focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#1A1A1A] focus:outline-none cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || Boolean(lockoutTime)}
            className="w-full py-2.5 px-4 rounded-lg bg-[#C0392B] hover:bg-[#a93226] text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <span>Memproses...</span>
            ) : lockoutTime ? (
              <span>Ditangguhkan ({remainingCooldown}s)</span>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
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
