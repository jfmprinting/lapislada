'use client';

import Link from 'next/link';
import { LogIn, User, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface NavbarProps {
  schoolName?: string;
  showLoginCta?: boolean;
}

export default function Navbar({
  schoolName = 'SDN Latsari 2 Bancar',
  showLoginCta = true,
}: NavbarProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 bg-[#922B21] text-white shadow-md border-b border-[#771F18]">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 overflow-hidden border border-white/30 shrink-0">
            <img src="/logo.webp" alt="Logo Sekolah" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm sm:text-base tracking-wider text-white drop-shadow-sm">
                LAPIS LADA
              </span>
              <span className="hidden xs:inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-400/25 text-amber-200 border border-amber-300/30 uppercase tracking-wider">
                PORTAL
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-amber-100/90 font-medium line-clamp-1">
              {schoolName}
            </span>
          </div>
        </Link>

        {showLoginCta && (
          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#C0392B] hover:bg-[#a93226] text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Keluar"
                  className="p-1.5 text-[#F1948A] hover:text-white hover:bg-[#771F18] rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white hover:bg-[#FAF8F2] text-[#922B21] text-xs font-bold shadow-sm transition-all active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
