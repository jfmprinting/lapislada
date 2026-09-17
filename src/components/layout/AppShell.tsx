'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  Bell,
  CalendarCheck,
  Award,
  FolderOpen,
  FolderLock,
  HeartHandshake,
  School,
  ExternalLink,
  LogOut,
  ChevronRight,
  User,
  Users,
  GraduationCap,
  Layers,
  BookMarked,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import BottomNav from './BottomNav';
import Navbar from './Navbar';

interface AppShellProps {
  children: React.ReactNode;
  role?: 'guru' | 'admin' | 'orangtua';
  pageTitle?: string;
  pageSubtitle?: string;
  unreadCount?: number;
}

export default function AppShell({
  children,
  role = 'guru',
  pageTitle,
  pageSubtitle,
  unreadCount = 1,
}: AppShellProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const navGroups = [
    {
      title: 'Menu Utama',
      items: [
        {
          label: 'Dashboard',
          href: role === 'orangtua' ? '/dashboard/orangtua' : '/dashboard',
          icon: Home,
        },
        {
          label: 'Buku Penghubung',
          href: '/buku-penghubung',
          icon: BookOpen,
          badge: unreadCount > 0 ? `${unreadCount} Baru` : undefined,
        },
        {
          label: 'Pengumuman',
          href: '/pengumuman',
          icon: Bell,
        },
      ],
    },
    {
      title: 'Akademik Kelas',
      items: [
        {
          label: 'Absensi Siswa',
          href: '/kehadiran',
          icon: CalendarCheck,
        },
        {
          label: 'Nilai Siswa',
          href: '/nilai',
          icon: Award,
        },
        {
          label: 'Materi Pelajaran',
          href: '/materi',
          icon: FolderOpen,
        },
        {
          label: 'Karakter KAIH',
          href: '/kaih',
          icon: HeartHandshake,
        },
      ],
    },
    {
      title: 'Master Data',
      items: [
        {
          label: 'Data Siswa',
          href: '/admin/siswa',
          icon: GraduationCap,
        },
        {
          label: 'Guru & PTK',
          href: '/admin/guru',
          icon: Users,
        },
        {
          label: 'Kelas & Rombel',
          href: '/admin/kelas',
          icon: Layers,
        },
        {
          label: 'Mata Pelajaran',
          href: '/admin/mapel',
          icon: BookMarked,
        },
      ],
    },
    {
      title: 'Administrasi',
      items: [
        {
          label: 'Dokumen BOS',
          href: '/dokumen-bos',
          icon: FolderLock,
        },
        {
          label: 'Profil Sekolah',
          href: '/admin/profil-sekolah',
          icon: School,
        },
        {
          label: 'Halaman Publik',
          href: '/',
          icon: ExternalLink,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1A1A1A] flex flex-col md:flex-row">
      {/* ============================================================ */}
      {/* DESKTOP SIDEBAR (Visible on md screens and wider >= 768px) */}
      {/* ============================================================ */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-[#DDD8CE] h-screen sticky top-0 shrink-0 z-30 shadow-xs">
        {/* Brand & School Header */}
        <div className="p-4 border-b border-[#E8E0D0] bg-[#922B21] text-white">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shadow-md transition-transform group-hover:scale-105 shrink-0 overflow-hidden">
              <img src="/logo.webp" alt="Logo Sekolah" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="font-serif font-bold text-sm tracking-tight text-white truncate">
                LAPIS LADA
              </div>
              <div className="text-[11px] text-[#F1948A] font-medium leading-tight truncate">
                SDN Latsari 2 Bancar
              </div>
            </div>
          </Link>
        </div>

        {/* User Profile Snippet */}
        <div className="px-4 py-3 bg-[#FAF8F2] border-b border-[#E8E0D0] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#FDEDEC] border border-[#F1948A] text-[#922B21] flex items-center justify-center font-bold text-xs shrink-0">
              {role === 'admin' ? 'AD' : role === 'guru' ? 'BS' : 'WM'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#1A1A1A] truncate">
                {currentUser?.user_metadata?.nama || (role === 'admin' ? 'Administrator' : role === 'guru' ? 'Bu Sari, S.Pd' : 'Pak Budi')}
              </div>
              <div className="text-[10px] text-[#6B6B6B] truncate">
                {role === 'admin' ? 'Admin Sekolah' : role === 'guru' ? 'Wali Kelas 4A' : 'Wali Murid'}
              </div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#FDEDEC] text-[#922B21] border border-[#F1948A]">
            {role}
          </span>
        </div>

        {/* Navigation Links (Grouped) */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {navGroups.map((group) => (
            <div key={group.title}>
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-1.5">
                {group.title}
              </div>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-[#922B21] text-white shadow-sm font-semibold'
                            : 'text-[#3D3D3D] hover:bg-[#F5F0E8] hover:text-[#922B21]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#6B6B6B]'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                            isActive ? 'bg-white text-[#922B21]' : 'bg-[#FDEDEC] text-[#922B21] border border-[#F1948A]'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer (Logout) */}
        <div className="p-3 border-t border-[#E8E0D0] bg-[#FAF8F2]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-[#922B21] hover:bg-[#FDEDEC] border border-[#F1948A]/40 transition active:scale-98 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MOBILE TOP NAVBAR (Only on small screens < 768px) */}
      {/* ============================================================ */}
      <div className="md:hidden sticky top-0 z-40">
        <Navbar schoolName="LAPIS LADA" showLoginCta={false} />
      </div>

      {/* ============================================================ */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header Bar (Breadcrumb, Date, Role) */}
        <header className="hidden md:flex items-center justify-between px-6 lg:px-8 py-3.5 bg-white border-b border-[#DDD8CE] shadow-xs">
          <div>
            <h1 className="font-serif font-bold text-lg lg:text-xl text-[#1A1A1A] leading-tight">
              {pageTitle || 'Dashboard'}
            </h1>
            {pageSubtitle && (
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                {pageSubtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="block text-xs font-bold text-[#1A1A1A]">
                {todayFormatted}
              </span>
              <span className="block text-[11px] text-[#6B6B6B]">
                UPT SD Negeri Latsari 2 Bancar
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#FDEDEC] text-[#922B21] flex items-center justify-center border border-[#F1948A] shadow-xs">
              <School className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          {children}
        </main>
      </div>

      {/* ============================================================ */}
      {/* MOBILE BOTTOM NAVIGATION (Only on screens < 768px) */}
      {/* ============================================================ */}
      <BottomNav role={role} />
    </div>
  );
}
