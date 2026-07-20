import type { Metadata } from 'next';
import Link from 'next/link';
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
  title: 'Detail Referensi Desain',
  robots: {
    index: true,
    follow: true,
  },
};

const categoryCopy: Record<string, { title: string; summary: string; details: string[] }> = {
  'elegan-formal': {
    title: 'Elegan formal',
    summary: 'Tata letak yang menonjolkan wibawa, ketertiban, dan kesan premium yang terkendali.',
    details: ['Rasio ruang kosong dijaga agar teks mudah dipindai.', 'Aksen emas digunakan sebagai penegas, bukan sebagai dominasi.', 'Cocok untuk acara dengan nuansa resmi dan tenang.'],
  },
  'minimalis-modern': {
    title: 'Minimalis modern',
    summary: 'Pilihan untuk pengguna yang mengutamakan keterbacaan dan penataan informasi yang ringkas.',
    details: ['Komposisi sederhana memudahkan penyesuaian pada berbagai ukuran layar.', 'Struktur modular memudahkan penggantian komponen isi.', 'Warna netral menjaga tampilan tetap bersih dan profesional.'],
  },
  'floral-lembut': {
    title: 'Floral lembut',
    summary: 'Gaya yang memadukan ornamen halus dengan susunan visual yang tetap rapi.',
    details: ['Ornamen diposisikan sebagai aksen utama pada kartu.', 'Cocok untuk pasangan yang menginginkan kesan hangat.', 'Warna pastel dapat disesuaikan tanpa mengganggu hierarki teks.'],
  },
  'tradisional-modern': {
    title: 'Tradisional modern',
    summary: 'Menghadirkan identitas budaya dengan penyajian kontemporer yang lebih mudah dicerna.',
    details: ['Elemen adat ditampilkan dengan proporsi yang terukur.', 'Penataan konten tetap mengikuti pola pembacaan modern.', 'Memberi ruang yang cukup untuk detail acara dan silsilah.'],
  },
  'islami-tenang': {
    title: 'Islami tenang',
    summary: 'Desain yang menekankan kesahajaan, ketertiban, dan komunikasi yang sopan.',
    details: ['Komponen visual dibuat bersih dan tidak terlalu ramai.', 'Nada warna dijaga agar tetap lembut dan formal.', 'Struktur cocok untuk acara dengan fokus pada keterbacaan informasi.'],
  },
  'premium-monokrom': {
    title: 'Premium monokrom',
    summary: 'Pilihan yang mengutamakan kesan eksklusif melalui palet warna yang singkat namun tegas.',
    details: ['Monokrom memberi ruang untuk aksen emas tampil lebih elegan.', 'Kontras teks dibuat stabil untuk menjaga kenyamanan baca.', 'Sesuai untuk identitas yang ingin tampil modern dan berkelas.'],
  },
};

export default function DesignCategoryPage({ params }: { params: { slug: string } }) {
  const resolved = categoryCopy[params.slug] ?? {
    title: params.slug.replace(/-/g, ' '),
    summary: 'Kategori ini ditampilkan sebagai halaman detail agar struktur navigasi tetap utuh.',
    details: [
      'Halaman detail disiapkan untuk menggantikan placeholder kosong.',
      'Anda dapat menambahkan konten, gambar, dan galeri pada tahap berikutnya.',
      'Gunakan halaman ini sebagai titik masuk sebelum memilih desain final.',
    ],
  };

  return (
    <PageShell>
      <div style={{ ...containerStyle, padding: '32px 0 56px' }}>
        <section style={{ ...cardStyle, borderRadius: 34, padding: '32px clamp(24px, 4vw, 44px)' }}>
          <Pill>Detail Kategori</Pill>
          <h1 style={{ ...titleStyle, marginTop: 18, fontSize: 'clamp(2.1rem, 4vw, 3.8rem)' }}>{resolved.title}</h1>
          <p style={{ ...subtitleStyle, maxWidth: 820 }}>{resolved.summary}</p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 26 }}>
            <ButtonLink href="/referensi-design" variant="secondary">
              Kembali ke katalog
            </ButtonLink>
            <ButtonLink href="/dashboard">Buka dashboard</ButtonLink>
          </div>
        </section>

        <section style={{ ...sectionSpacingStyle, ...gridTwoStyle, alignItems: 'start' }}>
          <Surface style={{ borderRadius: 32, padding: '28px clamp(24px, 4vw, 40px)' }}>
            <SectionTitle
              eyebrow="Rangkuman"
              title="Keterangan utama kategori"
              summary="Informasi berikut membantu Anda memahami karakter desain sebelum masuk ke tahap penyesuaian."
            />
            <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
              {resolved.details.map((item) => (
                <div key={item} style={{ padding: 16, borderRadius: 18, background: '#f8f7f3', border: '1px solid #d6d3cc' }}>
                  <p style={{ ...bodyTextStyle, margin: 0 }}>{item}</p>
                </div>
              ))}
            </div>
          </Surface>

          <Surface style={{ borderRadius: 32, padding: '28px clamp(24px, 4vw, 40px)' }}>
            <SectionTitle
              eyebrow="Relevansi"
              title="Kapan kategori ini digunakan"
              summary="Bagian ini dapat menjadi acuan untuk memilih gaya yang paling selaras dengan acara."
            />
            <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
              {['Acara formal yang memerlukan kesan tenang', 'Pasangan yang menyukai palet warna terkendali', 'Halaman undangan yang harus tetap mudah dibaca'].map((item) => (
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
