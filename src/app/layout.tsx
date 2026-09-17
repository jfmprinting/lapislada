import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Lora } from "next/font/google";
import "./globals.css";
import PWARegister from "@/components/PWARegister";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LAPIS LADA: Layanan Pusat Informasi Sekolah Latsari Dua",
  description: "Platform komunikasi terpadu: Layanan Pusat Informasi Sekolah Latsari Dua. Buku Penghubung Dua Arah, Kehadiran Siswa, dan Dokumen BOS.",
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
    <html lang="id" className={`h-full ${plusJakartaSans.variable} ${lora.variable}`}>
      <head>
        <link rel="icon" href="/logo.webp" type="image/webp" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="min-h-full flex flex-col bg-[#F5F0E8] text-[#1A1A1A] antialiased selection:bg-[#C0392B] selection:text-white">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
