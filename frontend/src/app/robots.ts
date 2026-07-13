// app/robots.ts
import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://jaycollection.id';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/referensi-design',
          '/referensi-design/',
          '/statistik',
        ],
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/order',
          '/order/',
          '/profil',
          '/upgrade-akun',
          '/api/',        // ← Block semua API routes dari crawler
          '/_next/',      // ← Block Next.js internals
        ],
      },
      {
        // Block bad bots sepenuhnya
        userAgent: ['AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot'],
        disallow: ['/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}