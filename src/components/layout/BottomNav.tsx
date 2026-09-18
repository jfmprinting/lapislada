'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Bell, CalendarCheck, GraduationCap, FolderLock, Menu, Award } from 'lucide-react';

interface BottomNavProps {
  role?: 'guru' | 'orangtua' | 'admin';
  onMenuClick?: () => void;
}

export default function BottomNav({ role = 'guru', onMenuClick }: BottomNavProps) {
  const pathname = usePathname();

  type NavItem = {
    label: string;
    href?: string;
    icon: any;
    isMenuTrigger?: boolean;
  };

  const getNavItems = (): NavItem[] => {
    if (role === 'orangtua') {
      return [
        { label: 'Beranda', href: '/dashboard/orangtua', icon: Home },
        { label: 'Nilai', href: '/nilai?role=orangtua', icon: Award },
        { label: 'Buku', href: '/buku-penghubung?role=orangtua', icon: BookOpen },
        { label: 'Kehadiran', href: '/kehadiran?role=orangtua', icon: CalendarCheck },
        { label: 'Pengumuman', href: '/pengumuman?role=orangtua', icon: Bell },
      ];
    }

    if (role === 'admin') {
      return [
        { label: 'Beranda', href: '/dashboard', icon: Home },
        { label: 'Siswa', href: '/admin/siswa', icon: GraduationCap },
        { label: 'BOS', href: '/dokumen-bos', icon: FolderLock },
        { label: 'Menu', icon: Menu, isMenuTrigger: true },
      ];
    }

    // Default: Guru
    return [
      { label: 'Beranda', href: '/dashboard', icon: Home },
      { label: 'Buku', href: '/buku-penghubung', icon: BookOpen },
      { label: 'Absensi', href: '/kehadiran', icon: CalendarCheck },
      { label: 'Menu', icon: Menu, isMenuTrigger: true },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DDD8CE] shadow-lg max-w-lg mx-auto md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href ? pathname === item.href.split('?')[0] : false;

          if (item.isMenuTrigger) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={onMenuClick}
                className="flex flex-col items-center justify-center flex-1 py-1 text-[#6B6B6B] hover:text-[#922B21] transition-all cursor-pointer active:scale-95"
              >
                <div className="relative">
                  <Icon className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-[10px] mt-1 tracking-tight font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive
                  ? 'text-[#922B21] font-bold scale-105'
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
