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

/**
 * Inisialisasi koneksi Redis secara async.
 * Dipanggil di app.js sebelum server mulai mendengarkan request.
 */
let redisConnected = false;
export const connectRedis = async () => {
  if (redisConnected) return;
  try {
    await redisClient.connect();
    redisConnected = true;
  } catch (err) {
    console.error('[ERROR] Gagal konek ke Redis:', err.message);
    throw err;
  }
};

export default redisClient;
