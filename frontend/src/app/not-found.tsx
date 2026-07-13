// app/not-found.tsx
// Next.js otomatis mengembalikan HTTP 404 untuk file ini — JANGAN pakai redirect
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Halaman Tidak Ditemukan',
  robots: {
    index: false,   // Jangan index halaman 404
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div>
      <h1>404 — Halaman Tidak Ditemukan</h1>
      <p>Halaman yang Anda cari tidak tersedia.</p>
      <Link href="/">Kembali ke Beranda</Link>
    </div>
  );
}