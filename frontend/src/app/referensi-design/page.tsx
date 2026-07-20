import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ButtonLink,
  MetricCard,
  PageShell,
  Pill,
  SectionTitle,
  Surface,
  bodyTextStyle,
  cardStyle,
  containerStyle,
  gridThreeStyle,
  helpTextStyle,
  metricCardStyle,
  sectionSpacingStyle,
  subtitleStyle,
  titleStyle,
  surfaceStyle,
} from '../../components/site-kit';

// app/referensi-design/page.tsx — PUBLIC, indexable
export const metadata: Metadata = {
  title: 'Referensi Desain Undangan Pernikahan',
  description: 'Koleksi referensi desain undangan digital pernikahan dengan pilihan klasik, modern, minimalis, dan tradisional yang lebih terstruktur.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/referensi-design',
  },
};

const categories = [
  {
    title: 'Elegan formal',
    description: 'Susunan visual yang rapi untuk acara dengan karakter berwibawa dan tenang.',
    tone: 'Paling sesuai untuk tampilan klasik',
  },
  {
    title: 'Minimalis modern',
    description: 'Komposisi bersih dengan ruang kosong yang memadai agar informasi mudah dibaca.',
    tone: 'Tegas dan ringan',
  },
  {
    title: 'Floral lembut',
    description: 'Detail dekoratif yang memberi kesan hangat tanpa mengurangi kesederhanaan.',
    tone: 'Romantis dan halus',
  },
  {
    title: 'Tradisional modern',
    description: 'Memadukan unsur adat dengan penyajian kontemporer yang tetap sopan.',
    tone: 'Berakar pada tradisi',
  },
  {
    title: 'Islami tenang',
    description: 'Pilihan tata letak yang menonjolkan ketertiban dan kesahajaan.',
    tone: 'Sederhana dan tertata',
  },
  {
    title: 'Premium monokrom',
    description: 'Kesan eksklusif dengan warna yang terkendali dan aksen emas yang terukur.',
    tone: 'Cocok untuk identitas premium',
  },
];

export default function ReferensiDesignPage() {
  return (
    <PageShell>
      <div style={{ ...containerStyle, padding: '32px 0 56px' }}>
        <section style={{ ...cardStyle, borderRadius: 34, padding: '32px clamp(24px, 4vw, 44px)' }}>
          <Pill>Katalog publik</Pill>
          <h1 style={{ ...titleStyle, marginTop: 18, fontSize: 'clamp(2.2rem, 4.5vw, 4rem)' }}>Referensi desain undangan yang lebih lengkap, jelas, dan terkurasi.</h1>
          <p style={{ ...subtitleStyle, maxWidth: 820 }}>
            Katalog ini membantu pengunjung memilih arah visual yang tepat sejak awal. Setiap kategori disusun dengan bahasa yang baku dan informasi yang mudah dipahami.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 26 }}>
            <ButtonLink href="/register">Mulai pendaftaran</ButtonLink>
            <ButtonLink href="/statistik" variant="secondary">
              Lihat statistik layanan
            </ButtonLink>
          </div>

          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 28 }}>
            <MetricCard value="06" label="Kategori utama" note="Pilihan dasar yang paling relevan untuk pengguna." />
            <MetricCard value="KBBI" label="Bahasa" note="Semua deskripsi menggunakan bahasa Indonesia baku." />
            <MetricCard value="Gold" label="Aksen" note="Digunakan secukupnya sebagai penegas visual." />
          </div>
        </section>

        <section style={{ ...sectionSpacingStyle, ...cardStyle, borderRadius: 34, padding: '32px clamp(24px, 4vw, 44px)' }}>
          <SectionTitle
            eyebrow="Kategori"
            title="Pilihan desain yang mudah dijelajahi"
            summary="Setiap kartu berikut memuat ringkasan singkat agar pengguna dapat menyaring pilihan tanpa menebak-nebak."
          />
          <div style={{ ...gridThreeStyle, marginTop: 24 }}>
            {categories.map((item) => (
              <article key={item.title} style={{ ...surfaceStyle, borderRadius: 26, padding: 22, background: 'rgba(255,255,255,0.76)' }}>
                <p style={{ margin: 0, color: '#b78b2e', fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{item.tone}</p>
                <h2 style={{ margin: '10px 0 0', fontFamily: 'var(--font-heading), serif', fontSize: '1.5rem', color: '#1f2937' }}>{item.title}</h2>
                <p style={{ ...bodyTextStyle, marginTop: 10 }}>{item.description}</p>
                <div style={{ marginTop: 18 }}>
                  <Link href={`/referensi-design/${item.title.toLowerCase().replace(/\s+/g, '-')}`} style={{ color: '#b78b2e', fontWeight: 700, textDecoration: 'none' }}>
                    Lihat detail kategori
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={{ ...sectionSpacingStyle, display: 'grid', gap: 20, gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)' }}>
          <Surface style={{ borderRadius: 32, padding: '28px clamp(24px, 4vw, 40px)' }}>
            <SectionTitle
              eyebrow="Panduan singkat"
              title="Cara memilih referensi desain"
              summary="Gunakan tiga pertimbangan utama agar hasil akhir tetap konsisten dengan karakter acara."
            />
            <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
              {['Kesan acara yang ingin ditonjolkan', 'Keterbacaan informasi pada layar kecil', 'Kesesuaian warna dengan identitas pasangan'].map((item) => (
                <div key={item} style={{ padding: 16, borderRadius: 18, background: '#f8f7f3', border: '1px solid #d6d3cc' }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{item}</p>
                </div>
              ))}
            </div>
          </Surface>

          <Surface style={{ borderRadius: 32, padding: '28px clamp(24px, 4vw, 40px)' }}>
            <SectionTitle
              eyebrow="Akses cepat"
              title="Masuk ke halaman kategori yang lebih spesifik"
              summary="Setiap jalur berikut dibuat untuk memperjelas struktur dan menghilangkan kesan halaman kosong."
            />
            <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
              <ButtonLink href="/referensi-design/elegan-formal">Kategori elegan formal</ButtonLink>
              <ButtonLink href="/referensi-design/minimalis-modern" variant="secondary">
                Kategori minimalis modern
              </ButtonLink>
              <ButtonLink href="/dashboard" variant="ghost">
                Buka dashboard
              </ButtonLink>
            </div>
          </Surface>
        </section>
      </div>
    </PageShell>
  );
}