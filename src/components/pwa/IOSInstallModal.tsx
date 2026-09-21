'use client';

import { X, Share, PlusSquare, CheckCircle2, Smartphone } from 'lucide-react';

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS?: boolean;
}

export default function IOSInstallModal({
  isOpen,
  onClose,
  isIOS = true,
}: IOSInstallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#DDD8CE] overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
      >
        {/* Header Modal */}
        <div className="p-4 bg-[#922B21] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 id="pwa-install-title" className="font-serif font-bold text-sm text-white">
                Pasang Aplikasi LAPIS LADA
              </h3>
              <p className="text-[11px] text-amber-100/90 font-medium">
                {isIOS ? 'Panduan Pasang di iPhone / iPad' : 'Panduan Pasang Aplikasi'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
            aria-label="Tutup panduan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto bg-[#FAF8F2]">
          <p className="text-xs text-[#3D3D3D] leading-relaxed">
            Pasang LAPIS LADA di layar utama perangkat Anda agar dapat dibuka langsung dengan 1 ketukan tanpa perlu membuka browser.
          </p>

          {isIOS ? (
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#DDD8CE] shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-[#FDEDEC] text-[#922B21] border border-[#F1948A] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="min-w-0 text-xs">
                  <div className="font-bold text-[#1A1A1A] flex items-center gap-1.5 flex-wrap">
                    Ketuk tombol Bagikan
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[#1A1A1A] font-semibold text-[11px]">
                      <Share className="w-3.5 h-3.5 text-blue-600" />
                      <span>Share</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                    Tombol ini terletak di bilah navigasi bawah browser Safari iPhone/iPad Anda.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#DDD8CE] shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-[#FDEDEC] text-[#922B21] border border-[#F1948A] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div className="min-w-0 text-xs">
                  <div className="font-bold text-[#1A1A1A] flex items-center gap-1.5 flex-wrap">
                    Pilih menu
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[#1A1A1A] font-semibold text-[11px]">
                      <PlusSquare className="w-3.5 h-3.5 text-gray-700" />
                      <span>Tambah ke Layar Utama</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                    Gulir ke bawah pada menu pop-up Safari sampai menemukan opsi ini.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#DDD8CE] shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-[#FDEDEC] text-[#922B21] border border-[#F1948A] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div className="min-w-0 text-xs">
                  <div className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
                    Ketuk tombol
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-bold border border-blue-200 text-[11px]">
                      Tambah (Add)
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                    Tombol berada di pojok kanan atas layar Anda untuk mengonfirmasi pemasangan.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#DDD8CE] shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-[#FDEDEC] text-[#922B21] border border-[#F1948A] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="min-w-0 text-xs">
                  <div className="font-bold text-[#1A1A1A]">
                    Buka Menu Browser (Titik Tiga ⋮)
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                    Ketuk ikon titik tiga di pojok kanan atas browser Chrome/Edge Anda.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#DDD8CE] shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-[#FDEDEC] text-[#922B21] border border-[#F1948A] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div className="min-w-0 text-xs">
                  <div className="font-bold text-[#1A1A1A]">
                    Pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama"
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                    Ikon aplikasi LAPIS LADA akan otomatis muncul di beranda smartphone/laptop Anda.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-[#FDEDEC] border border-[#F1948A]/40 flex items-center gap-2.5 text-[11px] text-[#922B21]">
            <CheckCircle2 className="w-4 h-4 text-[#922B21] shrink-0" />
            <span>
              Setelah dipasang, Anda dapat membuka aplikasi secara cepat dan menerima notifikasi penting sekolah.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-white border-t border-[#DDD8CE] flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#922B21] hover:bg-[#771F18] transition active:scale-98 cursor-pointer shadow-xs"
          >
            Mengerti, Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
