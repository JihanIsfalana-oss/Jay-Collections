import { BASE_URL } from '@/lib/constants';

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Jay Collections for Wedding",
  url: BASE_URL,
  description: "Platform undangan digital pernikahan terbaik di Indonesia.",
  inLanguage: "id-ID",
  publisher: {
    "@type": "Organization",
    name: "Jay Collections for Wedding",
    url: BASE_URL,
  },
  potentialAction: {
    "@type": "SearchAction",
    target: `${BASE_URL}/referensi-design?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Jay Collections for Wedding",
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  sameAs: ["https://www.instagram.com/jaycollection"],
};

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Jay Collections for Wedding",
  image: `${BASE_URL}/logo.png`,
  telephone: "+62-821-2265-2172",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Kota Depok",
    postalCode: "16511",
    addressCountry: "Indonesia",
    addressRegion: "Jawa Barat",
  },
  openingHours: "Mo-Su 00:00-24:00",
  url: BASE_URL,
};

export function designCategorySchema(category: {
  name: string;
  description: string;
  slug: string;
  thumbnail_url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Desain Undangan ${category.name}`,
    description: category.description,
    url: `${BASE_URL}/referensi-design/${category.slug}`,
    image: category.thumbnail_url,
    isPartOf: {
      "@type": "WebSite",
      url: BASE_URL,
    },
  };
}