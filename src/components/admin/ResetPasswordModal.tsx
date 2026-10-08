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
  Lock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/components/ui/NotificationContext';

export interface TargetResetUser {
  id: string;
  nama: string;
  email?: string | null;
  telepon?: string | null;
  role: 'guru' | 'admin' | 'orangtua' | 'kepala_sekolah';
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

  if (user.role === 'kepala_sekolah') {
    return `KepsekLada-${capitalized || 'Pimpinan'}${num}${char}`;
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
  const [copiedExistingPass, setCopiedExistingPass] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Mode: false = melihat detail akun (default), true = mode reset password baru
  const [isResetMode, setIsResetMode] = useState(false);
  const [existingPassword, setExistingPassword] = useState<string | null>(null);
  const [showExistingPassword, setShowExistingPassword] = useState(false);

  useEffect(() => {
    if (targetUser && isOpen) {
      const generated = generateUniqueSchoolPassword(targetUser);
      setPassword(generated);
      setPhone(targetUser.telepon || '');
      const userEmail = targetUser.email || (targetUser.role === 'orangtua' ? `${targetUser.nisn || 'ortu'}@sdnlatsari.sch.id` : '');
      setEmail(userEmail);
      setCopiedPass(false);
      setCopiedExistingPass(false);
      setCopiedEmail(false);
      setCopiedMsg(false);
      setIsResetMode(false);
      setShowExistingPassword(false);
      setShowPassword(false);

      // Cek apakah ada password aktif di cache/registry
      try {
        const storedRegistry = localStorage.getItem('lapislada_credentials_registry');
        if (storedRegistry && userEmail) {
          const registry = JSON.parse(storedRegistry);
          const entry = registry[userEmail.toLowerCase().trim()];
          if (entry?.password) {
            setExistingPassword(entry.password);
          } else {
            setExistingPassword(null);
          }
        } else {
          setExistingPassword(null);
        }
      } catch {
        setExistingPassword(null);
      }
    }
  }, [targetUser, isOpen]);

  if (!isOpen || !targetUser) return null;

  const handleStartReset = () => {
    const newPass = generateUniqueSchoolPassword(targetUser);
    setPassword(newPass);
    setIsResetMode(true);
    setShowPassword(true);
  };

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

  const handleCopyExistingPassword = async () => {
    if (!existingPassword) return;
    try {
      await navigator.clipboard.writeText(existingPassword);
      setCopiedExistingPass(true);
      showToast({ type: 'success', message: 'Password aktif berhasil disalin.' });
      setTimeout(() => setCopiedExistingPass(false), 2500);
    } catch {
      showToast({ type: 'error', message: 'Gagal menyalin password.' });
    }
  };

  const handleCopyEmail = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(true);
      showToast({ type: 'success', message: 'Username/Email berhasil disalin.' });
      setTimeout(() => setCopiedEmail(false), 2500);
    } catch {
      showToast({ type: 'error', message: 'Gagal menyalin email.' });
    }
  };

  // Compose formatted WhatsApp message
  const activePasswordForWA = isResetMode ? password : (existingPassword || '(Gunakan password yang telah dibagikan)');

  const generateWAMessage = () => {
    const roleLabel =
      targetUser.role === 'orangtua'
        ? 'Wali Murid'
        : targetUser.role === 'kepala_sekolah'
        ? 'Kepala Sekolah'
        : targetUser.role === 'admin'
        ? 'Administrator'
        : 'Pendidik / Staf Guru';

    const recipientHeader =
      targetUser.role === 'orangtua'
        ? `Yth. Bapak/Ibu Wali Murid dari *${targetUser.nama}*${
            targetUser.rombel ? ` (${targetUser.rombel})` : ''
          }`
        : targetUser.role === 'kepala_sekolah'
        ? `Yth. Bapak/Ibu Kepala Sekolah *${targetUser.nama}*`
        : `Yth. Bapak/Ibu Guru *${targetUser.nama}*`;

    return `Assalamualaikum Wr. Wb. / Salam Sejahtera.

${recipientHeader}
UPT SD Negeri Latsari 2 Bancar

Berikut adalah informasi akun resmi Anda untuk mengakses portal aplikasi *LAPIS LADA*:

🌐 *Link Portal:* https://lapislada.web.id/login
👤 *Username / Email:* ${email || '-'}
🔑 *Kata Sandi (Password):* ${activePasswordForWA}
🏷️ *Peran Akun:* ${roleLabel}

*Catatan:*
Harap simpan akun ini dengan baik untuk memantau Buku Penghubung, Presensi, dan Nilai Siswa. Jika ada kendala, hubungi pihak sekolah. Terima kasih.`;
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
      // 1. Call Cloudflare Pages Serverless API
      let serverSaved = false;
      let serverErrorMsg = '';
      try {
        const res = await fetch('/api/admin-reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password: password.trim(),
            role: targetUser.role,
            nama: targetUser.role === 'orangtua' ? (targetUser.nama_wali || targetUser.nama) : targetUser.nama,
            phone: phone.trim(),
            targetUserId: targetUser.id,
          }),
        });
        if (res.ok) {
          serverSaved = true;
        } else {
          const errData = await res.json().catch(() => ({}));
          serverErrorMsg = errData.error || 'Terjadi kesalahan pada server saat membuat akun.';
        }
      } catch (apiErr: any) {
        serverErrorMsg = apiErr.message || 'Gagal menghubungi server.';
      }

      // 2. Direct client fallback if API wasn't reached
      if (!serverSaved) {
        throw new Error(serverErrorMsg || 'API server reset password gagal dihubungi. Pastikan koneksi internet lancar dan coba lagi.');
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
        setExistingPassword(password.trim());
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }

      // 4. Update phone number in database if changed
      if (phone !== targetUser.telepon) {
        if (targetUser.role === 'guru' || targetUser.role === 'admin' || targetUser.role === 'kepala_sekolah') {
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
        message: `Password untuk ${targetUser.nama} berhasil diperbarui & disimpan!`,
      });

      setIsResetMode(false);

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
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#DDD8CE] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDD8CE] bg-gradient-to-r from-[#FDEDEC]/60 via-white to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FDEDEC] text-[#922B21]">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1A1A1A]">
                Detail Akun & Hak Akses
              </h3>
              <p className="text-xs text-[#666]">
                Lihat informasi akun, nomor WhatsApp, serta kelola kata sandi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#666] hover:bg-[#F5F0E8] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Target Profile Card */}
          <div className="p-4 rounded-xl bg-[#FAF8F2] border border-[#DDD8CE]">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#DDD8CE] flex items-center justify-center font-bold text-base text-[#922B21] shadow-xs shrink-0">
                {targetUser.nama.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-[#1A1A1A] leading-tight truncate">
                  {targetUser.nama}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    targetUser.role === 'kepala_sekolah'
                      ? 'text-amber-900 bg-amber-100 border border-amber-300'
                      : targetUser.role === 'admin'
                      ? 'text-purple-800 bg-purple-100'
                      : targetUser.role === 'orangtua'
                      ? 'text-[#922B21] bg-[#FDEDEC]'
                      : 'text-emerald-800 bg-emerald-100'
                  }`}>
                    {targetUser.role === 'orangtua'
                      ? 'Wali Murid'
                      : targetUser.role === 'kepala_sekolah'
                      ? 'Kepala Sekolah'
                      : targetUser.role === 'admin'
                      ? 'Administrator'
                      : 'Guru / Pendidik'}
                  </span>
                  {targetUser.rombel && (
                    <span className="text-[11px] text-[#666] bg-white px-2 py-0.5 rounded-md border border-[#DDD8CE]">
                      Rombel: {targetUser.rombel}
                    </span>
                  )}
                  {targetUser.nisn && (
                    <span className="text-[11px] font-mono text-[#666] bg-white px-2 py-0.5 rounded-md border border-[#DDD8CE]">
                      NISN: {targetUser.nisn}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Email & No. WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#3D3D3D] mb-1">
                Username / Email Login
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7A7A]" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@sdnlatsari.sch.id"
                  className="w-full pl-8 pr-8 py-2 bg-white border border-[#DDD8CE] rounded-xl text-xs text-[#1A1A1A] font-mono"
                />
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#7A7A7A] hover:text-[#1A1A1A] cursor-pointer"
                  title="Salin Email/Username"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
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

          {/* Section: Password & Keamanan Akun */}
          <div className="rounded-xl border border-[#DDD8CE] bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#922B21]" />
                <span>Kata Sandi / Kredensial Akses</span>
              </span>
              {!isResetMode && (
                <button
                  type="button"
                  onClick={handleStartReset}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#922B21] bg-[#FDEDEC] hover:bg-[#FADBD8] rounded-lg transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Reset Password Baru</span>
                </button>
              )}
            </div>

            {/* View Mode: Informasi Password Aktif Saat Ini */}
            {!isResetMode ? (
              <div className="space-y-2.5">
                {existingPassword ? (
                  <div className="p-3 rounded-lg bg-[#FAF8F2] border border-[#DDD8CE] flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-medium text-[#666]">
                        Password Aktif Tersimpan:
                      </div>
                      <div className="font-mono text-sm font-bold text-[#1A1A1A] mt-0.5">
                        {showExistingPassword ? existingPassword : '••••••••••••••••'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowExistingPassword(!showExistingPassword)}
                        className="p-1.5 text-[#7A7A7A] hover:text-[#1A1A1A] rounded-lg transition-colors cursor-pointer"
                        title={showExistingPassword ? 'Sembunyikan' : 'Lihat password'}
                      >
                        {showExistingPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyExistingPassword}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          copiedExistingPass ? 'text-emerald-700 bg-emerald-50' : 'text-[#7A7A7A] hover:text-[#1A1A1A]'
                        }`}
                        title="Salin Password"
                      >
                        {copiedExistingPass ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-[#FAF8F2] border border-[#DDD8CE] text-xs text-[#666] leading-relaxed">
                    <p className="font-medium text-[#1A1A1A] mb-1">
                      🔒 Password terenkripsi aman di sistem
                    </p>
                    <p className="text-[11px] text-[#7A7A7A]">
                      Untuk alasan keamanan, kata sandi lama tidak ditampilkan secara teks terbuka. Jika pengguna lupa kata sandi atau ingin kredensial baru, klik tombol <strong>&ldquo;Reset Password Baru&rdquo;</strong> di kanan atas.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Mode Reset: Form Generator Password Baru */
              <div className="pt-2 border-t border-[#DDD8CE]/60 space-y-3 animate-in fade-in duration-150">
                <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 leading-snug">
                  Anda sedang dalam menu <strong>Reset Kata Sandi</strong>. Masukkan password baru atau gunakan generator otomatis di bawah ini.
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#3D3D3D] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Password Baru (Generator Otomatis)</span>
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
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsResetMode(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#666] hover:text-[#1A1A1A] rounded-lg border border-[#DDD8CE] bg-white transition-colors cursor-pointer"
                  >
                    Batal Reset
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSaveAndReset}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#922B21] hover:bg-[#771F18] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Menyimpan...' : 'Terapkan & Simpan Password'}</span>
                  </button>
                </div>
              </div>
            )}
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
              Pesan siap kirim berisi tautan portal login, username, dan info kata sandi yang telah diformat ramah dan sopan.
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
          <div className="text-[11px] text-[#7A7A7A]">
            Portal: <span className="font-semibold text-[#1A1A1A]">lapislada.web.id/login</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-[#666] hover:text-[#1A1A1A] rounded-xl border border-[#DDD8CE] bg-white transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export { ResetPasswordModal as AccountDetailModal };
