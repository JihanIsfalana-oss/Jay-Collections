// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Wajib untuk font-display: swap
});

// Default metadata — di-override per halaman
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://jaycollection.id'),
  
  title: {
    default: "Jay Collection's for Wedding — Menangani Kebutuhan Kehidupan Pasangan Indonesia",
    template: "%s | Jay Collection's for Wedding",
  },
  description: 'Platform undangan digital pernikahan terbaik di Indonesia. Desain elegan, upload foto & video, bayar mudah, selesai dalam 24 jam.',
  
  keywords: [
    'undangan digital pernikahan',
    'undangan pernikahan online',
    'wedding invitation indonesia',
    'undangan nikah digital',
    'desain undangan pernikahan',
  ],
  
  authors: [{ name: "Mochammad Jihan Isfalana" }],
  creator: "Jay Collection's for Wedding",
  publisher: "Jay Collection's for Wedding",
  
  // Open Graph — untuk social sharing
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://jaycollection.id',
    siteName: "Jay Collection's for Wedding",
    title: "Jay Collection's for Wedding — Undangan Digital Pernikahan",
    description: 'Platform undangan digital pernikahan terbaik di Indonesia.',
    images: [
      {
        url: '/og-default.jpg',     // 1200x630px — buat aset ini
        width: 1200,
        height: 630,
        alt: "Jay Collection's for Wedding",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: "Jay Collection's for Wedding",
    description: 'Platform undangan digital pernikahan terbaik di Indonesia.',
    images: ['/og-default.jpg'],
  },
  
  // Halaman authenticated — default noindex
  // Di-override ke index: true hanya untuk halaman publik
  robots: {
    index: false,
    follow: false,
  },
  
  // Canonical default
  alternates: {
    canonical: '/',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFFFFF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}