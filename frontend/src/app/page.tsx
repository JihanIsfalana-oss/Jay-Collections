import Link from 'next/link';
import { JsonLd } from "@/components/seo/JsonLd";

import { designCategorySchema, organizationSchema, websiteSchema, localBusinessSchema } from "@/components/seo/schema";
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
  gridTwoStyle,
  helpTextStyle,
  sectionSpacingStyle,
  subtitleStyle,
  titleStyle,
  surfaceStyle,
} from '../components/site-kit';

const features = [
  {
    title: 'Tata visual yang tenang',
    description: 'Palet gray, white, dan gold menjaga kesan premium tanpa terlihat berlebihan.',
  },
  {
    title: 'Bahasa formal dan baku',
    description: 'Seluruh salinan antarmuka diarahkan ke bahasa Indonesia baku yang profesional.',
  },
  {
    title: 'Alur yang lengkap',
    description: 'Dari referensi desain sampai dashboard, pengalaman dibuat utuh dan mudah ditelusuri.',
  },
];

const processSteps = [
  {
    step: '01',
    title: 'Pilih referensi',
    description: 'Telusuri kategori desain untuk menemukan gaya yang paling sesuai dengan karakter acara.',
  },
  {
    step: '02',
    title: 'Sesuaikan konten',
    description: 'Lengkapi informasi pasangan, galeri, jadwal, dan susunan acara secara rapi.',
  },
  {
    step: '03',
    title: 'Publikasikan',
    description: 'Bagikan tautan undangan digital yang konsisten, elegan, dan siap dipresentasikan.',
  },
];

const showcase = [
  {
    title: 'Elegan klasik',
    description: 'Cocok untuk pasangan yang menginginkan suasana formal dan berwibawa.',
  },
  {
    title: 'Minimalis modern',
    description: 'Memberikan ruang bernapas yang cukup dengan komposisi visual yang bersih.',
  },
  {
    title: 'Tradisional hangat',
    description: 'Menonjolkan nuansa adat dan keakraban tanpa mengorbankan keterbacaan.',
  },
];

export default function HomePage() {
  return (
    <PageShell>
      <JsonLd data={websiteSchema} />
      <JsonLd data={organizationSchema} />
      <JsonLd data={localBusinessSchema} />
      <div style={{ ...containerStyle, padding: '28px 0 56px' }}>
        <section style={{ ...cardStyle, borderRadius: 36, padding: '32px clamp(24px, 4vw, 48px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Pill>Jay Digital Invitation</Pill>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <ButtonLink href="/referensi-design" variant="secondary">
                Lihat referensi
              </ButtonLink>
              <ButtonLink href="/register">Buat akun</ButtonLink>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 28, gridTemplateColumns: 'minmax(0, 1.25fr) minmax(280px, 0.75fr)', alignItems: 'center', marginTop: 30 }}>
            <div>
              <p style={titleStyle}>Undangan digital dengan karakter klasik modern yang tertata dan berkelas.</p>
              <p style={subtitleStyle}>
                Jay Digital Invitation merancang pengalaman undangan digital yang lebih rapi, formal, dan otomatisasi pembagian undangan, dengan penekanan pada estetika abu, putih, dan emas yang konsisten.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 26 }}>
                <ButtonLink href="/dashboard">Masuk ke dashboard</ButtonLink>
                <ButtonLink href="/login" variant="secondary">
                  Masuk ke akun
                </ButtonLink>
              </div>
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 28 }}>
                <MetricCard value="18+" label="Kategori" note="Referensi desain yang terkurasi." />
                <MetricCard value="24 jam" label="Layanan" note="Akses dan pemantauan sepanjang waktu." />
                <MetricCard value="100%" label="Bahasa baku" note="Seluruh antarmuka ditulis formal." />
              </div>
            </div>

            <Surface style={{ borderRadius: 30, padding: 24 }}>
              <p style={{ ...helpTextStyle, textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 800, color: '#7a5a18' }}>Sorotan singkat</p>
              <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
                {showcase.map((item) => (
                  <article key={item.title} style={{ background: 'rgba(255,255,255,0.78)', borderRadius: 20, padding: 18, border: '1px solid #d6d3cc' }}>
                    <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#1f2937' }}>{item.title}</h2>
                    <p style={{ ...bodyTextStyle, marginTop: 8 }}>{item.description}</p>
                  </article>
                ))}
              </div>
            </Surface>
          </div>
        </section>

        <section style={{ ...sectionSpacingStyle, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {features.map((item) => (
            <article key={item.title} style={cardStyle}>
              <p style={{ ...helpTextStyle, color: '#b78b2e', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Keunggulan</p>
              <h2 style={{ margin: '10px 0 0', fontFamily: 'var(--font-heading), serif', fontSize: '1.5rem', color: '#1f2937' }}>{item.title}</h2>
              <p style={{ ...bodyTextStyle, marginTop: 12 }}>{item.description}</p>
            </article>
          ))}
        </section>

        <section style={{ ...sectionSpacingStyle, ...cardStyle, borderRadius: 32, padding: '28px clamp(24px, 4vw, 40px)' }}>
          <SectionTitle
            eyebrow="Alur kerja"
            title="Rangkaian pengalaman yang utuh dari pemilihan hingga publikasi"
            summary="Seluruh halaman disusun agar pengunjung memahami perjalanan layanan tanpa harus menebak-nebak fungsi setiap bagian."
          />
          <div style={{ ...gridThreeStyle, marginTop: 24 }}>
            {processSteps.map((item) => (
              <article key={item.step} style={{ ...surfaceStyle, borderRadius: 24, padding: 22, background: 'rgba(255,255,255,0.75)' }}>
                <p style={{ margin: 0, color: '#b78b2e', fontWeight: 800, letterSpacing: '0.12em' }}>{item.step}</p>
                <h3 style={{ margin: '12px 0 0', fontFamily: 'var(--font-heading), serif', fontSize: '1.4rem', color: '#1f2937' }}>{item.title}</h3>
                <p style={{ ...bodyTextStyle, marginTop: 10 }}>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ ...sectionSpacingStyle, display: 'grid', gap: 20, gridTemplateColumns: 'minmax(0, 0.95fr) minmax(0, 1.05fr)' }}>
          <Surface style={{ borderRadius: 32, padding: '28px clamp(24px, 4vw, 40px)' }}>
            <SectionTitle
              eyebrow="Sorotan desain"
              title="Palet warna tenang untuk menegaskan kesan premium"
              summary="Perpaduan gray, putih, dan gold menjaga tampilan tetap formal, bersih, serta mudah dipindai pada layar kecil maupun besar."
            />
            <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 18, background: '#f8f7f3', border: '1px solid #d6d3cc' }}>
                <span style={{ fontWeight: 700 }}>Warna dominan</span>
                <span style={{ color: '#4b5563' }}>Gray, putih, emas</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 18, background: '#f8f7f3', border: '1px solid #d6d3cc' }}>
                <span style={{ fontWeight: 700 }}>Nada bahasa</span>
                <span style={{ color: '#4b5563' }}>Baku, formal, profesional</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 18, background: '#f8f7f3', border: '1px solid #d6d3cc' }}>
                <span style={{ fontWeight: 700 }}>Arah pengalaman</span>
                <span style={{ color: '#4b5563' }}>Lengkap dan konsisten</span>
              </div>
            </div>
          </Surface>

          <Surface style={{ borderRadius: 32, padding: '28px clamp(24px, 4vw, 40px)' }}>
            <SectionTitle
              eyebrow="Akses cepat"
              title="Masuk ke area kerja dan katalog referensi"
              summary="Halaman publik dan halaman internal dipisahkan dengan jelas agar navigasi tetap efisien."
            />
            <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
              <ButtonLink href="/referensi-design">Buka katalog desain</ButtonLink>
              <ButtonLink href="/statistik" variant="secondary">
                Lihat statistik layanan
              </ButtonLink>
              <ButtonLink href="/dashboard" variant="ghost">
                Buka dashboard pengguna
              </ButtonLink>
            </div>
          </Surface>
        </section>

        <section style={{ ...sectionSpacingStyle, ...cardStyle, borderRadius: 32, padding: '28px clamp(24px, 4vw, 40px)' }}>
          <SectionTitle
            eyebrow="Katalog singkat"
            title="Kategori referensi yang menampilkan pilihan paling relevan"
            summary="Tampilan ini menggantikan halaman kosong dengan konteks yang benar-benar berguna bagi pengunjung pertama kali."
          />
          <div style={{ ...gridThreeStyle, marginTop: 24 }}>
            {['Elegan formal', 'Floral lembut', 'Tradisional modern'].map((item) => (
              <article key={item} style={{ ...surfaceStyle, borderRadius: 24, padding: 20, background: 'rgba(255,255,255,0.76)' }}>
                <p style={{ ...helpTextStyle, color: '#b78b2e', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Kategori</p>
                <h3 style={{ margin: '8px 0 0', fontFamily: 'var(--font-heading), serif', fontSize: '1.35rem', color: '#1f2937' }}>{item}</h3>
                <p style={{ ...bodyTextStyle, marginTop: 10 }}>Disusun untuk memberikan arah visual yang jelas pada calon pengguna.</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
