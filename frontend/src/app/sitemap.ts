// app/sitemap.ts
import { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/constants';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let designCategories: Array<{ slug: string; updated_at: string }> = [];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/designs/categories`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      designCategories = data.data || [];
    }
  } catch (err) {
    console.error("Sitemap fetch failed:", err);
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/referensi-design`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/statistik`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ];

  const dynamicRoutes: MetadataRoute.Sitemap = designCategories.map((cat) => ({
    url: `${BASE_URL}/referensi-design/${cat.slug}`,
    lastModified: new Date(cat.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...dynamicRoutes];
}