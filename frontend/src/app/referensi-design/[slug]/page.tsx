import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { designCategorySchema } from '@/components/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
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

// Helper function untuk menghindari duplikasi fetch data
async function getCategory(slug: string) {
  try {
    const res = await fetch(
      `${process.env.API_URL}/api/public/designs/categories`,
      {
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!res.ok) return null;

    const json = await res.json();
    return json.data?.find((item: any) => item.slug === slug) || null;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  return {
    title: `Desain ${category.name} | Jay Collections`,
    description: category.description,

    robots: {
      index: true,
      follow: true,
    },

    alternates: {
      canonical: `https://jaycollection.id/referensi-design/${category.slug}`,
    },

    openGraph: {
      title: `Desain ${category.name}`,
      description: category.description,
      url: `https://jaycollection.id/referensi-design/${category.slug}`,
      type: 'website',
      images: category.thumbnail_url ? [category.thumbnail_url] : [],
    },

    twitter: {
      card: 'summary_large_image',
      title: `Desain ${category.name}`,
      description: category.description,
    },
  };
}

export default async function DesignCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  // Fallback jika category.details bernilai undefined / null dari API
  const details: string[] = category.details ?? [
    'Desain ini dapat disesuaikan dengan kebutuhan pasangan.',
    'Template responsif untuk perangkat desktop maupun mobile.',
    'Informasi acara mudah dibaca dan dibagikan.',
  ];

  return (
    <PageShell>
      <JsonLd data={designCategorySchema(category)} />

      <div style={{ ...containerStyle, padding: '32px 0 56px' }}>
        <section
          style={{
            ...cardStyle,
            borderRadius: 34,
            padding: '32px clamp(24px, 4vw, 44px)',
          }}
        >
          <Pill>Detail Kategori</Pill>
          <h1
            style={{
              ...titleStyle,
              marginTop: 18,
              fontSize: 'clamp(2.1rem, 4vw, 3.8rem)',
            }}
          >
            {category.name}
          </h1>
          <p style={{ ...subtitleStyle, maxWidth: 820 }}>
            {category.description}
          </p>

          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              marginTop: 26,
            }}
          >
            <ButtonLink href="/referensi-design" variant="secondary">
              Kembali ke katalog
            </ButtonLink>
            <ButtonLink href="/dashboard">Buka dashboard</ButtonLink>
          </div>
        </section>

        <section
          style={{
            ...sectionSpacingStyle,
            ...gridTwoStyle,
            alignItems: 'start',
          }}
        >
          <Surface
            style={{ borderRadius: 32, padding: '28px clamp(24px, 4vw, 40px)' }}
          >
            <SectionTitle
              eyebrow="Rangkuman"
              title="Keterangan utama kategori"
              summary="Informasi berikut membantu Anda memahami karakter desain sebelum masuk ke tahap penyesuaian."
            />
            <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
              {details.map((item: string) => (
                <div
                  key={item}
                  style={{
                    padding: 16,
                    borderRadius: 18,
                    background: '#f8f7f3',
                    border: '1px solid #d6d3cc',
                  }}
                >
                  <p style={{ ...bodyTextStyle, margin: 0 }}>{item}</p>
                </div>
              ))}
            </div>
          </Surface>

          <Surface
            style={{ borderRadius: 32, padding: '28px clamp(24px, 4vw, 40px)' }}
          >
            <SectionTitle
              eyebrow="Relevansi"
              title="Kapan kategori ini digunakan"
              summary="Bagian ini dapat menjadi acuan untuk memilih gaya yang paling selaras dengan acara."
            />
            <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
              {[
                'Acara formal yang memerlukan kesan tenang',
                'Pasangan yang menyukai palet warna terkendali',
                'Halaman undangan yang harus tetap mudah dibaca',
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    padding: 16,
                    borderRadius: 18,
                    background: '#ffffff',
                    border: '1px solid #d6d3cc',
                  }}
                >
                  <p
                    style={{
                      ...helpTextStyle,
                      margin: 0,
                      color: '#1f2937',
                      fontWeight: 600,
                    }}
                  >
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </Surface>
        </section>
      </div>
    </PageShell>
  );
}