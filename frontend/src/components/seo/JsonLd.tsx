// components/seo/JsonLd.tsx
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─── Schema untuk halaman utama (di app/layout.tsx atau homepage) ───
export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Jay Collections for Wedding',
  url: 'https://jaycollection.id',
  description: 'Platform undangan digital pernikahan terbaik di Indonesia.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://jaycollection.id/referensi-design?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

// ─── Schema untuk halaman referensi desain ───
export function designCategorySchema(category: {
  name: string;
  description: string;
  slug: string;
  thumbnail_url?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Desain Undangan ${category.name}`,
    description: category.description,
    url: `https://jaycollection.id/referensi-design/${category.slug}`,
    image: category.thumbnail_url,
    brand: {
      '@type': 'Brand',
      name: 'Jay Collections for Wedding',
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'IDR',
      availability: 'https://schema.org/InStock',
    },
  };
}

// ─── Schema untuk local business (di homepage) ───
export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Jay Collections for Wedding',
  description: 'Jasa pembuatan undangan digital pernikahan.',
  url: 'https://jaycollection.id',
  telephone: '+62-000-0000-0000',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'ID',
    addressRegion: 'Jawa Barat',
  },
  priceRange: 'IDR',
  openingHours: 'Mo-Su 00:00-24:00',
  sameAs: [
    'https://www.instagram.com/jaycollection',
  ],
};