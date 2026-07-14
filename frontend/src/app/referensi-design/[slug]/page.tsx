import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Detail Referensi Desain',
  robots: {
    index: true,
    follow: true,
  },
};

export default function DesignCategoryPage({ params }: { params: { slug: string } }) {
  return (
    <main style={{ minHeight: '100vh', padding: 32 }}>
      <h1 style={{ marginTop: 0 }}>Referensi Desain</h1>
      <p>Halaman detail untuk kategori: {params.slug}</p>
    </main>
  );
}
