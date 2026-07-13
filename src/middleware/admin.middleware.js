import jwt from 'jsonwebtoken';
import redisClient from '../config/redis.js';
import pool from '../config/db.js';

// Helper untuk membersihkan format IP Address
const cleanIpAddress = (ip) => {
  if (ip && ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  return ip || '127.0.0.1';
};

export const verifyAdminToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const clientIp = cleanIpAddress(req.ip);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: '[SECURITY] Token admin diperlukan!' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Verifikasi JWT secara kriptografis menggunakan secret khusus admin
    const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN);
    
    // 2. Cek keaslian session di Redis Cache
    const redisSession = await redisClient.get(`admin_session:${token}`);
    if (!redisSession) {
      return res.status(401).json({ status: 'error', message: '[SECURITY] Sesi admin telah kedaluwarsa atau dicabut!' });
    }

    // 3. Strict IP Whitelisting Verification
    const ipCheck = await pool.query('SELECT ip_address FROM admin_allowed_ips');
    if (ipCheck.rows.length > 0) {
      const allowedIps = ipCheck.rows.map(row => row.ip_address);
      if (!allowedIps.includes(clientIp)) {
        return res.status(403).json({ 
          status: 'error', 
          message: `[SECURITY BLOCKED] IP Anda (${clientIp}) tidak memiliki izin akses rute ini!` 
        });
      }
    }

    req.admin = JSON.parse(redisSession);
    req.admin.id = decoded.id; 
    
    next();
  } catch (error) {
    console.error('[SECURITY ERROR] Admin Auth Middleware:', error.message);
    return res.status(401).json({ status: 'error', message: '[SECURITY] Sesi Administrator tidak Valid!' });
  }
};