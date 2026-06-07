import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import pool from './config/db.js';
import redisClient from './config/redis.js';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/order.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import coupleRoutes from './routes/couple.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/couples', coupleRoutes);

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: "Selamat Datang di Jay Collection's for Wedding Invitation Server",
    timestamp: new Date()
  });
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as db_time, current_database() as db_name;');
    res.json({
      status: 'success',
      message: '[INFO] terkoneksi!',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('[ERROR] Error saat query ke database:', err.message);
    res.status(500).json({
      status: 'error',
      message: '[ERROR] Gagal query ke database!',
      error: err.message
    });
  }
});

// Jalankan Server Express
app.listen(PORT, async () => {
  console.log(`[INFO] Server berjalan di port ${PORT} [Mode: ${process.env.NODE_ENV}]`);
  try {
    await pool.query('SELECT 1;');
  } catch (err) {
    console.error('[ERROR] Server gagal terhubung ke Database:', err.message);
  }
});