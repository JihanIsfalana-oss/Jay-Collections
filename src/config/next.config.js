// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aktifkan image optimization — WAJIB untuk LCP
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/your-cloud-name/**',  // Ganti dengan cloud name kamu
      },
    ],
    formats: ['image/avif', 'image/webp'],  // Otomatis convert ke WebP/AVIF
  },
  
  // Security + SEO headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Cache static assets agresif
      {
        source: '/(.*)\\.(jpg|jpeg|png|webp|avif|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache Next.js static files
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Jangan cache halaman HTML
      {
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },

  // Redirects — www ke non-www, HTTP ke HTTPS (Vercel handle ini otomatis)
  async redirects() {
    return [
      // Trailing slash consistency
      {
        source: '/referensi-design/',
        destination: '/referensi-design',
        permanent: true,
      },
    ];
  },
  
  // Compress responses
  compress: true,
  
  // Powered by header hide (minor security + tidak ada SEO value)
  poweredByHeader: false,
};

module.exports = nextConfig;