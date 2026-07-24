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
} from '../../../components/site-kit';

export const metadata: Metadata = {
  title: 'Profil Pengguna',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfilePage() {
  return (
    <PageShell>
      <div style={{ ...containerStyle, padding: '32px 0 56px' }}>
        <section style={{ ...cardStyle, borderRadius: 34, padding: '32px clamp(24px, 4vw, 44px)' }}>
          <Pill>Profil</Pill>
          <h1 style={{ ...titleStyle, marginTop: 18, fontSize: 'clamp(2.1rem, 4vw, 3.8rem)' }}>Profil pengguna yang lebih jelas dan profesional.</h1>
          <p style={{ ...subtitleStyle, maxWidth: 820 }}>
            Halaman profil ini dirancang sebagai pengganti placeholder agar pengguna memiliki ruang yang layak untuk meninjau identitas dan preferensi dasar.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 26 }}>
            <ButtonLink href="/dashboard">Kembali ke dashboard</ButtonLink>
            <ButtonLink href="/statistik" variant="secondary">
              Lihat statistik layanan
            </ButtonLink>
          </div>
        </section>

        <section style={{ ...sectionSpacingStyle, ...gridTwoStyle, alignItems: 'start' }}>
          <Surface style={{ borderRadius: 32, padding: '28px clamp(24px, 4vw, 40px)' }}>
            <SectionTitle
              eyebrow="Identitas"
              title="Data dasar akun"
              summary="Gunakan ruang ini untuk merapikan informasi pengguna agar mudah dipelihara."
            />
            <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
              {[
                ['Nama tampilan', 'Pengguna Jay Digital Invitation'],
                ['Peran', 'Pengguna terdaftar'],
                ['Status akun', 'Aktif'],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: 16, borderRadius: 18, background: '#f8f7f3', border: '1px solid #d6d3cc' }}>
                  <p style={{ margin: 0, color: '#b78b2e', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 12, fontWeight: 800 }}>{label}</p>
                  <p style={{ ...bodyTextStyle, marginTop: 8 }}>{value}</p>
                </div>
              ))}
            </div>
          </Surface>

          <Surface style={{ borderRadius: 32, padding: '28px clamp(24px, 4vw, 40px)' }}>
            <SectionTitle
              eyebrow="Preferensi"
              title="Pilihan yang dapat disesuaikan"
              summary="Pengguna dapat menambahkan preferensi untuk warna, gaya, dan kebutuhan komunikasi."
            />
            <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
              {[
                'Pilih tampilan berwarna netral sebagai default',
                'Gunakan bahasa formal pada semua notifikasi',
                'Tampilkan referensi desain yang paling relevan lebih dahulu',
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
