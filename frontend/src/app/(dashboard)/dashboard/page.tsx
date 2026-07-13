// Semua halaman authenticated — WAJIB noindex
// app/(dashboard)/dashboard/page.tsx

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: {
    index: false,   // ← Wajib untuk semua halaman di balik login
    follow: false,
    noarchive: true,
  },
};