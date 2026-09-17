'use client';

import Link from 'next/link';
import { School, LogIn, User, LogOut } from 'lucide-react';
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
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-[#922B21] shadow-sm transition-transform group-hover:scale-105">
            <School className="w-5 h-5 text-[#922B21]" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-sm tracking-tight text-white line-clamp-1">
              {schoolName}
            </span>
            <span className="text-[11px] text-[#F1948A] font-medium tracking-wide">
              LAPIS LADA
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
