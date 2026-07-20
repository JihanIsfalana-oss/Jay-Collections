import type { Metadata } from 'next';
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
  sectionSpacingStyle,
  subtitleStyle,
  titleStyle,
} from '../../components/site-kit';

export const metadata: Metadata = {
  title: 'Statistik Layanan',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/statistik',
  },
};

export default function StatistikPage() {
  return (
    <PageShell>
      <div style={{ ...containerStyle, padding: '32px 0 56px' }}>
        <section style={{ ...cardStyle, borderRadius: 34, padding: '32px clamp(24px, 4vw, 44px)' }}>
          <Pill>Statistik Publik</Pill>
          <h1 style={{ ...titleStyle, marginTop: 18, fontSize: 'clamp(2.1rem, 4vw, 3.8rem)' }}>Statistik layanan yang ringkas, informatif, dan mudah dipahami.</h1>
          <p style={{ ...subtitleStyle, maxWidth: 820 }}>
            Halaman ini menggantikan folder kosong dengan konteks yang lebih berguna untuk pengguna maupun pengunjung publik.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 26 }}>
            <ButtonLink href="/referensi-design">Buka referensi desain</ButtonLink>
            <ButtonLink href="/dashboard" variant="secondary">
              Masuk ke dashboard
            </ButtonLink>
          </div>
        </section>

        <section style={{ ...sectionSpacingStyle, ...gridThreeStyle }}>
          <MetricCard value="128" label="Pesanan aktif" note="Data ringkasan untuk pemantauan operasional." />
          <MetricCard value="96%" label="Kepuasan" note="Diwakili sebagai indikator pengalaman pengguna." />
          <MetricCard value="18" label="Kategori desain" note="Seluruh kategori disusun agar mudah dijelajahi." />
        </section>

        <section style={{ ...sectionSpacingStyle, display: 'grid', gap: 20, gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
          <Surface style={{ borderRadius: 32, padding: '28px clamp(24px, 4vw, 40px)' }}>
            <SectionTitle
              eyebrow="Tren"
              title="Performa layanan per bulan"
              summary="Area ini dapat dikembangkan menjadi grafik atau tabel berdasarkan data backend yang tersedia."
            />
            <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
              {[
                ['Januari', 'Stabil'],
                ['Februari', 'Meningkat'],
                ['Maret', 'Konsisten'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 16, borderRadius: 18, background: '#f8f7f3', border: '1px solid #d6d3cc' }}>
                  <span style={{ fontWeight: 700 }}>{label}</span>
                  <span style={{ color: '#4b5563' }}>{value}</span>
                </div>
              ))}
            </div>
          </Surface>

          <Surface style={{ borderRadius: 32, padding: '28px clamp(24px, 4vw, 40px)' }}>
            <SectionTitle
              eyebrow="Ringkasan"
              title="Arah pengembangan berikutnya"
              summary="Halaman ini dapat menjadi pusat pemantauan yang lebih substansial pada iterasi berikutnya."
            />
            <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
              {[
                'Tambahkan grafik penjualan atau pesanan',
                'Sertakan pemantauan aktivitas publik',
                'Hubungkan statistik dengan data backend aktual',
              ].map((item) => (
                <div key={item} style={{ padding: 16, borderRadius: 18, background: '#ffffff', border: '1px solid #d6d3cc' }}>
                  <p style={{ ...helpTextStyle, margin: 0, color: '#1f2937', fontWeight: 600 }}>{item}</p>
                </div>
              ))}
            </div>
          </Surface>
        </section>
      </div>
    </PageShell>
  );
}
