import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Konfigurasi Redis Client
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`
});

// Listener untuk memantau status Redis
redisClient.on('connect', () => {
  console.log('[INFO] Redis Cache berhasil terhubung!');
});

redisClient.on('error', (err) => {
  console.error('[ERROR] Redis Error:', err.message);
});

// Inisialisasi koneksi
await redisClient.connect();

export default redisClient;