'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Bell, User, CalendarCheck } from 'lucide-react';

interface BottomNavProps {
  role?: 'guru' | 'orangtua' | 'admin';
}

export default function BottomNav({ role = 'guru' }: BottomNavProps) {
  const pathname = usePathname();

  const isOrangTua = role === 'orangtua';

  const navItems = isOrangTua
    ? [
        { label: 'Beranda', href: '/dashboard/orangtua', icon: Home },
        { label: 'Buku', href: '/buku-penghubung', icon: BookOpen },
        { label: 'Kehadiran', href: '/kehadiran', icon: CalendarCheck },
        { label: 'Pengumuman', href: '/pengumuman', icon: Bell },
      ]
    : [
        { label: 'Beranda', href: '/dashboard', icon: Home },
        { label: 'Buku', href: '/buku-penghubung', icon: BookOpen },
        { label: 'Pengumuman', href: '/pengumuman', icon: Bell },
        { label: 'Profil', href: role === 'admin' ? '/admin/profil-sekolah' : '/dashboard', icon: User },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DDD8CE] shadow-lg max-w-lg mx-auto sm:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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
