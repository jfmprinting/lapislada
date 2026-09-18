'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Trash2,
  HelpCircle,
  Loader2,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  icon?: React.ReactNode;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface NotificationContextType {
  showToast: (options: {
    type?: ToastType;
    title?: string;
    message: string;
    duration?: number;
  }) => void;
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  alert: (message: string, title?: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmDialogOptions;
    resolve?: (value: boolean) => void;
    isSubmitting?: boolean;
  } | null>(null);

  // -------------------------------------------------------------
  // Toast Logic
  // -------------------------------------------------------------
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      type = 'info',
      title,
      message,
      duration = 4000,
    }: {
      type?: ToastType;
      title?: string;
      message: string;
      duration?: number;
    }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // max 5 concurrent toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  // -------------------------------------------------------------
  // Confirm Dialog Logic
  // -------------------------------------------------------------
  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve,
        isSubmitting: false,
      });
    });
  }, []);

  const handleConfirmAccept = async () => {
    if (!confirmState) return;

    if (confirmState.options.onConfirm) {
      try {
        setConfirmState((prev) => (prev ? { ...prev, isSubmitting: true } : null));
        await confirmState.options.onConfirm();
      } catch (err) {
        console.error('Error during confirm action:', err);
      }
    }

    confirmState.resolve?.(true);
    setConfirmState(null);
  };

  const handleConfirmCancel = () => {
    if (!confirmState) return;
    confirmState.options.onCancel?.();
    confirmState.resolve?.(false);
    setConfirmState(null);
  };

  // Keyboard accessibility: Escape to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!confirmState?.isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        handleConfirmCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmState]);

  // Alert Dialog helper
  const alert = useCallback(
    (message: string, title: string = 'Informasi'): Promise<void> => {
      return new Promise((resolve) => {
        setConfirmState({
          isOpen: true,
          options: {
            title,
            message,
            confirmText: 'Mengerti',
            cancelText: '',
            isDanger: false,
          },
          resolve: () => resolve(),
          isSubmitting: false,
        });
      });
    },
    []
  );

  return (
    <NotificationContext.Provider value={{ showToast, confirm, alert }}>
      {children}

      {/* ========================================================= */}
      {/* TOAST NOTIFICATION CONTAINER (DESKTOP & MOBILE FRIENDLY)  */}
      {/* ========================================================= */}
      <div
        aria-live="assertive"
        className="fixed z-[9999] pointer-events-none flex flex-col gap-2.5 transition-all
          top-3 inset-x-3 max-w-sm mx-auto
          sm:top-5 sm:right-5 sm:left-auto sm:inset-x-auto sm:w-96"
      >
        {toasts.map((toast) => {
          let Icon = CheckCircle2;
          let iconBg = 'bg-emerald-100 text-emerald-700 border-emerald-200';
          let borderAccent = 'border-emerald-500/30';
          let defaultTitle = 'Berhasil';

          if (toast.type === 'error') {
            Icon = AlertCircle;
            iconBg = 'bg-red-100 text-[#C0392B] border-red-200';
            borderAccent = 'border-red-500/30';
            defaultTitle = 'Perhatian / Gagal';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            iconBg = 'bg-amber-100 text-amber-700 border-amber-200';
            borderAccent = 'border-amber-500/30';
            defaultTitle = 'Peringatan';
          } else if (toast.type === 'info') {
            Icon = Info;
            iconBg = 'bg-sky-100 text-sky-700 border-sky-200';
            borderAccent = 'border-sky-500/30';
            defaultTitle = 'Informasi';
          }

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto w-full bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-[#DDD8CE] ${borderAccent} flex items-start gap-3.5 transition-all animate-in fade-in slide-in-from-top-3 duration-200`}
            >
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                  {toast.title || defaultTitle}
                </h4>
                <p className="text-xs sm:text-sm text-[#4A4A4A] mt-0.5 leading-relaxed break-words font-medium">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-[#8C8C8C] hover:text-[#1A1A1A] p-1 rounded-lg hover:bg-[#F5F0E8] transition-colors shrink-0 cursor-pointer"
                title="Tutup Notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* POLISHED CONFIRMATION DIALOG (NO BROWSER POPUPS)          */}
      {/* ========================================================= */}
      {confirmState?.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#DDD8CE] overflow-hidden animate-in zoom-in-95 fade-in duration-150"
          >
            <div className="p-6">
              {/* Header Icon + Info */}
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                    confirmState.options.isDanger
                      ? 'bg-red-50 text-[#C0392B] border-red-200 shadow-xs'
                      : 'bg-amber-50 text-amber-700 border-amber-200 shadow-xs'
                  }`}
                >
                  {confirmState.options.icon ? (
                    confirmState.options.icon
                  ) : confirmState.options.isDanger ? (
                    <Trash2 className="w-6 h-6" />
                  ) : (
                    <HelpCircle className="w-6 h-6" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg text-[#1A1A1A] leading-snug">
                    {confirmState.options.title ||
                      (confirmState.options.isDanger ? 'Konfirmasi Hapus' : 'Konfirmasi Tindakan')}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1.5 leading-relaxed">
                    {confirmState.options.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-[#DDD8CE]/60 flex items-center justify-end gap-3">
                {confirmState.options.cancelText !== '' && (
                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    disabled={confirmState.isSubmitting}
                    className="px-4 py-2.5 text-xs sm:text-sm font-medium text-[#4A4A4A] hover:text-[#1A1A1A] rounded-xl hover:bg-[#F5F0E8] border border-[#DDD8CE] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {confirmState.options.cancelText || 'Batal'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleConfirmAccept}
                  disabled={confirmState.isSubmitting}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
                    confirmState.options.isDanger
                      ? 'bg-[#C0392B] hover:bg-[#922B21] active:bg-[#771F18]'
                      : 'bg-[#1A1A1A] hover:bg-[#333333] active:bg-[#000000]'
                  }`}
                >
                  {confirmState.isSubmitting && (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  )}
                  <span>
                    {confirmState.options.confirmText ||
                      (confirmState.options.isDanger ? 'Ya, Hapus' : 'Lanjutkan')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}
