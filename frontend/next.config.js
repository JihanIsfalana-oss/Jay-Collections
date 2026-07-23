// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aktifkan image optimization — WAJIB untuk LCP
  turbopack: {
    root: __dirname,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/your-cloud-name/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_BASE_URL ||
      "http://localhost:5000";

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/auth/:path*",
        destination: `${backendUrl}/auth/:path*`,
      },
    ];
  },
  
  // Security + SEO headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/(.*)\\.(jpg|jpeg|png|webp|avif|svg|ico)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
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