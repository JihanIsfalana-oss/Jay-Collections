import type { Metadata } from 'next';

// app/referensi-design/page.tsx — PUBLIC, indexable
export const metadata: Metadata = {
  title: 'Referensi Desain Undangan Pernikahan',
  description: 'Pilihan desain undangan digital pernikahan: Modern Minimalis, Broken White, Grunge, Tradisional, Floral, Rustic, Conventional Minimalist, Elegant, dan Islami.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/referensi-design',
  },
};

export default function ReferensiDesignPage() {
  return (
    <main style={{ minHeight: '100vh', padding: 32 }}>
      <h1 style={{ marginTop: 0 }}>Referensi Desain</h1>
      <p>Halaman katalog desain undangan digital Jay Collections.</p>
    </main>
  );
}