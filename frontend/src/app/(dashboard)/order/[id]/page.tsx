import type { Metadata } from 'next';
import {
  ButtonLink,
  PageShell,
  Pill,
  SectionTitle,
  Surface,
  bodyTextStyle,
  cardStyle,
  containerStyle,
  gridTwoStyle,
  helpTextStyle,
  sectionSpacingStyle,
  subtitleStyle,
  titleStyle,
} from '../../../../components/site-kit';

export const metadata: Metadata = {
  title: 'Detail Pesanan',
  robots: {
    index: false,
    follow: false,
  },
};

const steps = ['Menunggu peninjauan', 'Pembuatan konten', 'Pemeriksaan akhir', 'Siap dipublikasikan'];

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return (
    <PageShell>
      <div style={{ ...containerStyle, padding: '32px 0 56px' }}>
        <section style={{ ...cardStyle, borderRadius: 34, padding: '32px clamp(24px, 4vw, 44px)' }}>
          <Pill>Detail Pesanan</Pill>
          <h1 style={{ ...titleStyle, marginTop: 18, fontSize: 'clamp(2.1rem, 4vw, 3.8rem)' }}>Pesanan #{params.id}</h1>
          <p style={{ ...subtitleStyle, maxWidth: 820 }}>
            Halaman ini menggantikan area kosong pada rute order dengan ringkasan status yang lebih berguna bagi pengguna.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 26 }}>
            <ButtonLink href="/dashboard" variant="secondary">
              Kembali ke dashboard
            </ButtonLink>
            <ButtonLink href="/referensi-design">Buka referensi desain</ButtonLink>
          </div>
        </section>

        <section style={{ ...sectionSpacingStyle, ...gridTwoStyle, alignItems: 'start' }}>
          <Surface style={{ borderRadius: 32, padding: '28px clamp(24px, 4vw, 40px)' }}>
            <SectionTitle
              eyebrow="Status"
              title="Tahapan pengerjaan"
              summary="Gunakan urutan berikut untuk memantau kemajuan pesanan secara ringkas."
            />
            <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
              {steps.map((item, index) => (
                <div key={item} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 16, borderRadius: 18, background: '#f8f7f3', border: '1px solid #d6d3cc' }}>
                  <span style={{ width: 36, height: 36, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#1f2937', color: '#fff', fontWeight: 800 }}>{index + 1}</span>
                  <p style={{ margin: 0, fontWeight: 700, color: '#1f2937' }}>{item}</p>
                </div>
              ))}
            </div>
          </Surface>

          <Surface style={{ borderRadius: 32, padding: '28px clamp(24px, 4vw, 40px)' }}>
            <SectionTitle
              eyebrow="Catatan"
              title="Informasi pesanan"
              summary="Rincian berikut membantu pengguna memahami isi pesanan tanpa perlu menunggu halaman lain dimuat."
            />
            <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
              {[
                ['Nomor pesanan', `#${params.id}`],
                ['Status saat ini', 'Dalam peninjauan'],
                ['Catatan', 'Konten siap dilengkapi setelah revisi desain selesai'],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: 16, borderRadius: 18, background: '#ffffff', border: '1px solid #d6d3cc' }}>
                  <p style={{ margin: 0, color: '#b78b2e', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 12, fontWeight: 800 }}>{label}</p>
                  <p style={{ ...bodyTextStyle, marginTop: 8 }}>{value}</p>
                </div>
              ))}
            </div>
          </Surface>
        </section>
      </div>
    </PageShell>
  );
}
