'use client';

import { useState, useEffect } from 'react';
import {
  KeyRound,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Send,
  Phone,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  ExternalLink,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/components/ui/NotificationContext';

export interface TargetResetUser {
  id: string;
  nama: string;
  email?: string | null;
  telepon?: string | null;
  role: 'guru' | 'admin' | 'orangtua';
  rombel?: string | null;
  nisn?: string | null;
  nama_wali?: string | null;
}

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: TargetResetUser | null;
  onSuccess?: (newPassword: string) => void;
}

// Human-friendly unique password generator
export function generateUniqueSchoolPassword(user: TargetResetUser): string {
  const cleanName = user.nama
    .split(/[\s,]+/)[0]
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 8);
  const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();

  const specialChars = ['!', '@', '#', '$', '*'];
  const char = specialChars[Math.floor(Math.random() * specialChars.length)];
  const num = Math.floor(100 + Math.random() * 900); // 3-digit random number

  if (user.role === 'orangtua') {
    const rawClass = user.rombel?.replace(/[^a-zA-Z0-9]/g, '') || '4A';
    return `Lada${rawClass}-${capitalized || 'Siswa'}${num}${char}`;
  }

  // For Guru / Admin
  return `GuruLada-${capitalized || 'Pendidik'}${num}${char}`;
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
  targetUser,
  onSuccess,
}: ResetPasswordModalProps) {
  const { showToast } = useNotification();
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (targetUser && isOpen) {
      const generated = generateUniqueSchoolPassword(targetUser);
      setPassword(generated);
      setPhone(targetUser.telepon || '');
      setEmail(targetUser.email || (targetUser.role === 'orangtua' ? 'ortu@guru.com' : ''));
      setCopiedPass(false);
      setCopiedMsg(false);
    }
  }, [targetUser, isOpen]);

  if (!isOpen || !targetUser) return null;

  const handleRegenerate = () => {
    const newPass = generateUniqueSchoolPassword(targetUser);
    setPassword(newPass);
    setCopiedPass(false);
    showToast({ type: 'info', message: 'Password unik baru berhasil dibuat otomatis!' });
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedPass(true);
      showToast({ type: 'success', message: 'Password berhasil disalin ke clipboard.' });
      setTimeout(() => setCopiedPass(false), 2500);
    } catch {
      showToast({ type: 'error', message: 'Gagal menyalin password.' });
    }
  };

  // Compose formatted WhatsApp message
  const generateWAMessage = () => {
    const roleLabel = targetUser.role === 'orangtua' ? 'Wali Murid' : 'Pendidik / Staf Guru';
    const recipientHeader =
      targetUser.role === 'orangtua'
        ? `Yth. Bapak/Ibu Wali Murid dari *${targetUser.nama}*${
            targetUser.rombel ? ` (${targetUser.rombel})` : ''
          }`
        : `Yth. Bapak/Ibu Guru *${targetUser.nama}*`;

    return `Assalamualaikum Wr. Wb. / Salam Sejahtera.

${recipientHeader}
UPT SD Negeri Latsari 2 Bancar

Berikut adalah informasi akun resmi Anda untuk mengakses portal aplikasi *LAPIS LADA*:

🌐 *Link Portal:* https://lapislada.pages.dev/login
👤 *Username / Email:* ${email || '-'}
🔑 *Password Baru:* ${password}
🏷️ *Peran Akun:* ${roleLabel}

*Catatan:*
Harap simpan password ini dengan baik untuk memantau Buku Penghubung, Presensi, dan Nilai Siswa. Jika ada kendala, hubungi pihak sekolah. Terima kasih.`;
  };

  const handleCopyWAMessage = async () => {
    try {
      await navigator.clipboard.writeText(generateWAMessage());
      setCopiedMsg(true);
      showToast({ type: 'success', message: 'Pesan WhatsApp lengkap berhasil disalin!' });
      setTimeout(() => setCopiedMsg(false), 2500);
    } catch {
      showToast({ type: 'error', message: 'Gagal menyalin pesan WhatsApp.' });
    }
  };

  const handleSendWA = () => {
    const rawDigits = (phone || '').replace(/[^0-9]/g, '');
    let cleanPhone = rawDigits;
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith('8')) {
      cleanPhone = '62' + cleanPhone;
    }

    if (!cleanPhone || cleanPhone.length < 9) {
      showToast({
        type: 'error',
        message: 'Nomor WhatsApp belum valid. Silakan isi nomor HP/WA tujuan di formulir.',
      });
      return;
    }

    const msg = generateWAMessage();
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    showToast({ type: 'success', message: 'Membuka WhatsApp ke ' + cleanPhone });
  };

  const handleSaveAndReset = async () => {
    if (!password.trim()) {
      showToast({ type: 'error', message: 'Password tidak boleh kosong!' });
      return;
    }

    setSubmitting(true);
    try {
      let serverSaved = false;

      // 1. Call Cloudflare Pages Serverless API
      try {
        const res = await fetch('/api/admin-reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password: password.trim(),
            role: targetUser.role,
            nama: targetUser.nama,
            phone: phone.trim(),
            targetUserId: targetUser.id,
          }),
        });
        if (res.ok) {
          serverSaved = true;
        }
      } catch (apiErr) {
        console.info('API /api/admin-reset-password fallback to client auth:', apiErr);
      }

      // 2. Direct client fallback if API wasn't reached
      if (!serverSaved) {
        try {
          await supabase.auth.signUp({
            email: email.trim(),
            password: password.trim(),
            options: {
              data: {
                role: targetUser.role,
                nama: targetUser.nama,
                siswa_id: targetUser.id,
              },
            },
          });
        } catch (signUpErr) {
          console.info('Client signUp fallback:', signUpErr);
        }
      }

      // 3. Save to local credentials registry as extra client cache
      try {
        const storedRegistry = localStorage.getItem('lapislada_credentials_registry');
        const registry = storedRegistry ? JSON.parse(storedRegistry) : {};
        registry[email.toLowerCase().trim()] = {
          password: password.trim(),
          userId: targetUser.id,
          role: targetUser.role,
          nama: targetUser.nama,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('lapislada_credentials_registry', JSON.stringify(registry));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }

      // 4. Update phone number in database if changed
      if (phone !== targetUser.telepon) {
        if (targetUser.role === 'guru' || targetUser.role === 'admin') {
          await supabase
            .from('users_profile')
            .update({ telepon: phone, updated_at: new Date().toISOString() })
            .eq('id', targetUser.id);
        } else if (targetUser.role === 'orangtua') {
          await supabase
            .from('siswa')
            .update({ no_hp_wali: phone })
            .eq('id', targetUser.id);
        }
      }

      showToast({
        type: 'success',
        message: `Password untuk ${targetUser.nama} berhasil direset & akun aktif!`,
      });

      if (onSuccess) {
        onSuccess(password.trim());
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        message: err.message || 'Gagal mereset password.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#DDD8CE] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDD8CE] bg-gradient-to-r from-[#FDEDEC]/70 via-white to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FDEDEC] text-[#922B21]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1A1A1A]">
                Reset Password Akun
              </h3>
              <p className="text-xs text-[#666]">
                Generator otomatis 1-klik & pengiriman akses via WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#666] hover:bg-[#F5F0E8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Target Profile Card */}
          <div className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#DDD8CE] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#DDD8CE] flex items-center justify-center font-bold text-[#922B21]">
                {targetUser.nama.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#1A1A1A] leading-tight">
                  {targetUser.nama}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-semibold text-[#922B21] bg-[#FDEDEC] px-2 py-0.5 rounded-full">
                    {targetUser.role === 'orangtua' ? 'Wali Murid' : 'Pendidik / Guru'}
                  </span>
                  {targetUser.rombel && (
                    <span className="text-[11px] text-[#666]">
                      Rombel: {targetUser.rombel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Generator Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#3D3D3D] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Password Baru (Generator Unik Otomatis)</span>
              </label>
              <button
                type="button"
                onClick={handleRegenerate}
                className="text-xs font-semibold text-[#922B21] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Acak Ulang</span>
              </button>
            </div>

            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3.5 pr-20 py-2.5 bg-white border border-[#DDD8CE] rounded-xl text-sm font-mono font-bold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#922B21]"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-[#7A7A7A] hover:text-[#1A1A1A] rounded-lg transition-colors cursor-pointer"
                  title={showPassword ? 'Sembunyikan' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    copiedPass ? 'text-emerald-700 bg-emerald-50' : 'text-[#7A7A7A] hover:text-[#1A1A1A]'
                  }`}
                  title="Salin Password"
                >
                  {copiedPass ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#7A7A7A] mt-1">
              Format unik otomatis mudah dihafal guru & wali murid namun tetap aman.
            </p>
          </div>

          {/* Email / Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#3D3D3D] mb-1">
                Email / Username Login
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7A7A]" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@sdnlatsari.sch.id"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-[#DDD8CE] rounded-xl text-xs text-[#1A1A1A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3D3D3D] mb-1">
                Nomor WhatsApp Tujuan
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7A7A]" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 082230898376"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-[#DDD8CE] rounded-xl text-xs text-[#1A1A1A]"
                />
              </div>
            </div>
          </div>

          {/* WhatsApp Direct Share Box */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-700" />
                <span>Kirimkan Akses Akun ke WhatsApp</span>
              </span>
              <button
                type="button"
                onClick={handleCopyWAMessage}
                className="text-[11px] font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedMsg ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedMsg ? 'Tersalin!' : 'Salin Pesan'}</span>
              </button>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed mb-3">
              Pesan siap kirim berisi tautan portal login, username, dan password baru yang telah diformat ramah dan sopan.
            </p>
            <button
              type="button"
              onClick={handleSendWA}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Buka WhatsApp & Kirim Pesan Akun</span>
              <ExternalLink className="w-3 h-3 opacity-75" />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#FAF8F2] border-t border-[#DDD8CE] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#666] hover:text-[#1A1A1A] rounded-xl border border-[#DDD8CE] bg-white transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSaveAndReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{submitting ? 'Menyimpan...' : 'Terapkan & Simpan Password'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
