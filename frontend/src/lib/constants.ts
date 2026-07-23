// lib/constants.ts
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://jaycollection.id';

if (process.env.NODE_ENV === 'development' && BASE_URL.includes(':5000')) {
  console.warn(
    '[constants.ts] BASE_URL mengarah ke port backend (5000). ' +
    'Periksa apakah NEXT_PUBLIC_BASE_URL tertukar dengan NEXT_PUBLIC_API_URL di .env.local.'
  );
}