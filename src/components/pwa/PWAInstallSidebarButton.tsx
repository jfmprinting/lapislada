'use client';

import { Smartphone, Download } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';
import IOSInstallModal from './IOSInstallModal';

interface PWAInstallSidebarButtonProps {
  compact?: boolean;
}

export default function PWAInstallSidebarButton({
  compact = false,
}: PWAInstallSidebarButtonProps) {
  const {
    isInstalled,
    isIOS,
    showIOSModal,
    setShowIOSModal,
    triggerInstall,
  } = usePWAInstall();

  // If already installed as standalone PWA, do not render this button
  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        onClick={triggerInstall}
        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-[#FAF8F2] hover:bg-[#FDEDEC] text-[#922B21] border border-[#DDD8CE] hover:border-[#F1948A] transition-all group active:scale-98 cursor-pointer shadow-2xs mb-2`}
        title="Pasang LAPIS LADA di Layar Utama HP / Laptop"
      >
        <div className="flex items-center gap-2.5 min-w-0 text-left">
          <div className="w-7 h-7 rounded-lg bg-[#FDEDEC] text-[#922B21] border border-[#F1948A]/50 flex items-center justify-center shrink-0 group-hover:bg-[#922B21] group-hover:text-white transition-colors">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#922B21] transition-colors truncate">
              Pasang Aplikasi
            </div>
            {!compact && (
              <div className="text-[10px] text-[#6B6B6B] truncate">
                Akses cepat di layar utama
              </div>
            )}
          </div>
        </div>

        <Download className="w-3.5 h-3.5 text-[#922B21] shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
      </button>

      <IOSInstallModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
        isIOS={isIOS}
      />
    </>
  );
}
