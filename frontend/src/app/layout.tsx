// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';

const bodyFont = Manrope({
  subsets: ['latin'],
  display: 'swap', // Wajib untuk font-display: swap
  variable: '--font-body',
});

const headingFont = Cormorant_Garamond({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
});

// Default metadata — di-override per halaman
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://jaydigitalinvitation.example'),
  
  title: {
    default: 'Jay Digital Invitation',
    template: '%s | Jay Digital Invitation',
  },
  description: 'Platform undangan digital pernikahan dengan pendekatan klasik modern, alur kerja yang rapi, dan tampilan yang elegan.',
  
  keywords: [
    'undangan digital pernikahan',
    'undangan pernikahan online',
    'referensi desain undangan',
    'undangan nikah digital',
    'desain undangan pernikahan',
    'undangan pernikahan digital',
    'undangan pernikahan online gratis',
    'undangan pernikahan digital murah',
    'undangan pernikahan digital elegan',
    'undangan pernikahan digital minimalis',
    'undangan pernikahan digital modern',
    'undangan pernikahan digital tradisional',
    'undangan pernikahan digital klasik',
    'undangan pernikahan digital kreatif',
    'undangan pernikahan digital unik',
  ],
  
  authors: [{ name: "Mochammad Jihan Isfalana"}, {name: "Ade Putri"}],
  creator: 'Jay Digital Invitation',
  publisher: 'Jay Digital Invitation',
  
  // Open Graph — untuk social sharing
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://jaydigitalinvitation.example',
    siteName: 'Jay Digital Invitation',
    title: 'Jay Digital Invitation',
    description: 'Platform undangan digital pernikahan dengan nuansa klasik modern.',
    images: [
      {
        url: '/og-default.jpg',     // 1200x630px — buat aset ini
        width: 1200,
        height: 630,
        alt: 'Jay Digital Invitation — Undangan Digital Pernikahan',
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Jay Digital Invitation',
    description: 'Platform undangan digital pernikahan dengan nuansa klasik dipadukan dengan nuansa modern.',
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
  themeColor: '#f8f7f3',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${bodyFont.variable} ${headingFont.variable}`}>
      <body style={{ margin: 0, fontFamily: 'var(--font-body), system-ui, sans-serif', background: '#f3f4f6', color: '#1f2937' }}>
        {children}
      </body>
    </html>
  );
}