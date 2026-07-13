// app/referensi-design/page.tsx — PUBLIC, indexable
export const metadata: Metadata = {
  title: 'Referensi Desain Undangan Pernikahan',
  description: 'Pilihan desain undangan digital pernikahan: Modern Minimalis, Broken White, Grunge, Tradisional, Floral, Rustic, Conventional Minimalist, Elegant, dan Islami.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/referensi-design',
  },
};

// app/referensi-design/[slug]/page.tsx — PUBLIC, indexable per kategori
export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  // Fetch dari API
  const category = await getDesignCategory(params.slug);
  
  if (!category) {
    return { title: 'Kategori Tidak Ditemukan' };
  }
  
  return {
    title: `Desain Undangan ${category.name}`,
    description: category.description,
    robots: { index: true, follow: true },
    alternates: { canonical: `/referensi-design/${params.slug}` },
    openGraph: {
      title: `Desain Undangan ${category.name} | Jay Collection`,
      description: category.description,
      images: category.thumbnail_url 
        ? [{ url: category.thumbnail_url, width: 1200, height: 630 }]
        : undefined,
    },
  };
}