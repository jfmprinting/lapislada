import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "LAPIS LADA — Layanan Pintar untuk Sekolah Dasar",
  description: "Platform manajemen komunikasi terpadu untuk Sekolah Dasar: Buku Penghubung Dua Arah, Kehadiran Siswa, Dokumen BOS, dan Informasi Sekolah.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LAPIS LADA",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#922B21",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:ital,wght@0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-full flex flex-col bg-[#F5F0E8] text-[#1A1A1A] antialiased selection:bg-[#C0392B] selection:text-white">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
