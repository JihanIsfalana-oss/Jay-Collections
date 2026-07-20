// app/not-found.tsx
// Next.js otomatis mengembalikan HTTP 404 untuk file ini — JANGAN pakai redirect
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ButtonLink,
  PageShell,
  Pill,
  Surface,
  bodyTextStyle,
  containerStyle,
  subtitleStyle,
  titleStyle,
} from '../components/site-kit';

export const metadata: Metadata = {
  title: 'Halaman Tidak Ditemukan',
  robots: {
    index: false,   // Jangan index halaman 404
    follow: false,
  },
};

export default function NotFound() {
  return (
    <PageShell>
      <div style={{ ...containerStyle, minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '32px 0' }}>
        <Surface style={{ maxWidth: 760, borderRadius: 36, padding: '36px clamp(24px, 4vw, 48px)', textAlign: 'center' }}>
          <Pill>Kesalahan 404</Pill>
          <h1 style={{ ...titleStyle, marginTop: 18 }}>Halaman yang Anda tuju tidak ditemukan.</h1>
          <p style={{ ...subtitleStyle, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' }}>
            Tautan mungkin berubah, halaman belum tersedia, atau alamat yang dimasukkan tidak sesuai. Gunakan navigasi berikut untuk kembali ke jalur yang benar.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
            <ButtonLink href="/">Kembali ke beranda</ButtonLink>
            <ButtonLink href="/referensi-design" variant="secondary">
              Buka referensi desain
            </ButtonLink>
          </div>
          <div style={{ marginTop: 28, padding: 20, borderRadius: 22, background: '#f8f7f3', border: '1px solid #d6d3cc' }}>
            <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#b78b2e', fontSize: 12, fontWeight: 800 }}>Saran cepat</p>
            <p style={{ ...bodyTextStyle, marginTop: 10 }}>Jika Anda mencari area kerja internal, silakan masuk melalui halaman login terlebih dahulu.</p>
          </div>
        </Surface>
      </div>
    </PageShell>
  );
}