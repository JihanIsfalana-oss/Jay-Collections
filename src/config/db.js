import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('[INFO] Database berhasil terhubung!');
});

pool.on('error', (err) => {
  console.error('[ERROR] pada database client:', err);
  process.exit(1);
});

export const query = (text, params) => pool.query(text, params);
export default pool;
