import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import pool from './config/db.js';
import redisClient, { connectRedis } from './config/redis.js';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/order.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import coupleRoutes from './routes/couple.routes.js';
import adminRoutes from './routes/admin.routes.js';
import rateLimit from 'express-rate-limit';

const app = express();
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5000', 'http://127.0.0.1:5000', 'http://127.0.0.1:5432'];

// Rate limiting for API requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://app.midtrans.com", "https://api.midtrans.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "https://api.midtrans.com"],
      frameSrc: ["'self'", "https://app.midtrans.com"],
    },
  },
  hsts: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('[ERROR] Blocked by CORS security policy!'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: "Selamat Datang di Jay Collection's for Wedding Invitation Server",
    timestamp: new Date()
  });
});

app.get('/api/health', async (req, res) => {
  const healthToken = req.headers['x-health-token'];
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && healthToken !== process.env.HEALTH_CHECK_TOKEN) {
    return res.status(401).json({ status: 'error', message: '[ERROR] Unauthorized system health access.' });
  }

  const healthStatus = {
    timestamp: new Date(),
    uptime: process.uptime(),
    services: { database: 'DOWN', redis: 'DOWN' }
  };

  try {
    // 1. Uji Database Connection
    await pool.query('SELECT 1');
    healthStatus.services.database = 'UP';

    // 2. Uji Redis Cache Reachability
    const redisPing = await redisClient.ping();
    if (redisPing === 'PONG') {
      healthStatus.services.redis = 'UP';
    }

    return res.status(200).json({ status: 'healthy', data: healthStatus });
  } catch (error) {
    console.error('[HEALTH CHECK ERROR]:', error.message);
    return res.status(500).json({ 
      status: 'unhealthy', 
      error: isDev ? error.message : '[ERROR] Internal service connection failed', 
      data: healthStatus 
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/couples', coupleRoutes);
app.use('/api/admin', adminRoutes);

// Jalankan Server Express
app.use((err, req, res, next) => {
  console.error('[ERROR HANDLER]:', err.stack);
  res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
    status: 'error',
    message: err.message || '[ERROR] Terjadi kesalahan sistem internal.'
  });
});

async function startServer() {
  // Koneksi Redis via fungsi async — aman di CommonJS maupun ES Module
  try {
    await connectRedis();
  } catch (err) {
    console.warn('[WARNING] Redis tidak tersedia — cache akan dinonaktifkan.');
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[INFO] Server berjalan di port ${PORT} [Mode: ${process.env.NODE_ENV || 'development'}]`);

    pool.query('SELECT 1')
      .then(() => console.log('[INFO] Database berhasil terhubung!'))
      .catch((err) => console.error('[ERROR] Gagal menghubungkan ke database lokal:', err.message));
  });
}

startServer();

export default app;
