// app/sitemap.ts
import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://jaycollection.id';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch design categories dari API (halaman publik yang perlu di-index)
  let designCategories: Array<{ slug: string; updated_at: string }> = [];
  
  try {
    const res = await fetch(`${process.env.API_URL}/api/public/designs/categories`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      designCategories = data.data || [];
    }
  } catch (err) {
    // Fail gracefully — sitemap tetap generate tanpa dynamic URLs
    console.error("Sitemap fetch failed:", err);
  }

  // Halaman statis publik
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/referensi-design`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/statistik`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Halaman dinamis per kategori desain
  const dynamicRoutes: MetadataRoute.Sitemap = designCategories.map((cat) => ({
    url: `${BASE_URL}/referensi-design/${cat.slug}`,
    lastModified: new Date(cat.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // TIDAK dimasukkan ke sitemap:
  // - /login, /register (noindex)
  // - /dashboard/* (authenticated, noindex)
  // - /order/* (private, noindex)
  // - /profil (private, noindex)

  return [...staticRoutes, ...dynamicRoutes];
}