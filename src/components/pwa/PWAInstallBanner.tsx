'use client';

import { Smartphone, X, Download, Sparkles } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';
import IOSInstallModal from './IOSInstallModal';

interface PWAInstallBannerProps {
  role?: 'guru' | 'admin' | 'orangtua';
  className?: string;
}

export default function PWAInstallBanner({
  role = 'guru',
  className = '',
}: PWAInstallBannerProps) {
  const {
    isInstalled,
    isDismissed,
    isIOS,
    showIOSModal,
    setShowIOSModal,
    triggerInstall,
    dismissBanner,
  } = usePWAInstall();

  // If already installed as standalone PWA or user dismissed this banner, don't render anything
  if (isInstalled || isDismissed) {
    return null;
  }

  const title =
    role === 'orangtua'
      ? 'Pasang LAPIS LADA di Layar Utama HP'
      : 'Pasang Aplikasi LAPIS LADA di Perangkat Anda';

  const description =
    role === 'orangtua'
      ? 'Akses cepat 1-ketukan untuk memantau kehadiran, nilai, dan buku penghubung Ananda tanpa repot mengetik alamat web di browser.'
      : 'Buka dashboard, catat kehadiran siswa, dan respon buku penghubung lebih cepat langsung dari layar utama ponsel atau laptop Anda.';

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FDEDEC] to-[#FAF8F2] border border-[#F1948A]/60 p-4 sm:p-5 shadow-xs transition-all ${className}`}
      >
        {/* Close / Dismiss button */}
        <button
          onClick={dismissBanner}
          className="absolute top-3 right-3 p-1 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-black/5 transition cursor-pointer"
          title="Tutup pemberitahuan ini"
          aria-label="Tutup saran pasang aplikasi"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-6 sm:pr-0">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#922B21] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0">
              <Smartphone className="w-5 h-5 text-amber-200" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif font-bold text-sm sm:text-base text-[#1A1A1A] leading-snug">
                  {title}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#922B21] text-white uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5 text-amber-200" />
                  PWA Ready
                </span>
              </div>
              <p className="text-xs text-[#3D3D3D] mt-1 leading-relaxed max-w-2xl">
                {description}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
            <button
              onClick={triggerInstall}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#922B21] hover:bg-[#771F18] text-white font-bold text-xs shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-200" />
              <span>Pasang Sekarang</span>
            </button>
          </div>
        </div>
      </div>

      <IOSInstallModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
        isIOS={isIOS}
      />
    </>
  );
}
