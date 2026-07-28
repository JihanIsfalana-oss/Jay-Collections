import pool from '../config/db.js';
import redisClient from '../config/redis.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { buildUserTokenPayload } from '../utils/authToken.js';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET_USER;
  if (!secret) {
    throw new Error('FATAL ERROR: JWT_SECRET_USER belum diatur di file .env! Keamanan sistem terancam.');
  }
  return secret;
};

// ==========================================
// 1. FITUR REGISTRASI AKUN
// ==========================================
export const register = async (req, res) => {
  const { full_name, nick_name, birth_date, birth_place, username, email, password } = req.body;
  try {
    const checkUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2', 
      [username, email]
    );
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: '[ERROR] Username atau Email sudah terdaftar!' 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const insertUser = await pool.query(
      `INSERT INTO users (nama_lengkap, nama_panggilan, tanggal_lahir, tempat_lahir, username, email, password_hash) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, email, created_at`,
      [full_name, nick_name, birth_date, birth_place, username, email, hashedPassword]
    );

    return res.status(201).json({ 
      status: 'success', 
      message: '[SUCCESS] Registrasi berhasil!', 
      data: insertUser.rows[0] 
    });
  } catch (error) {
    console.error('[ERROR] Register Error: ', error);
    return res.status(500).json({ status: 'error', message: '[ERROR] Gagal melakukan registrasi.' });
  }
};

// ==========================================
// 2. FITUR LOGIN & REDIS BAN LOGIC 24 JAM
// ==========================================
export const login = async (req, res) => {
  console.log('[AUTH LOGIN] received body:', req.body);
  const { username, email, identifier, user, password } = req.body;
  const loginIdentifier = username || email || identifier || user;
  console.log('[AUTH LOGIN] parsed identifier:', loginIdentifier);

  if (!loginIdentifier || !password) {
    return res.status(400).json({
      status: 'error',
      message: '[ERROR] Username/email dan password wajib diisi.'
    });
  }

  const redisKey = `login_count:${loginIdentifier}`;
  let attempts = null;

  try {
    // A. Cek Status Ban di Redis jika tersedia
    attempts = await redisClient.get(redisKey);
    if (attempts && parseInt(attempts, 10) >= 10) {
      return res.status(403).json({
        status: 'error',
        message: '[ERROR] Akun Anda diblokir selama 24 jam karena terlalu banyak percobaan login yang gagal.'
      });
    }
  } catch (redisError) {
    console.warn('[WARN] Redis tidak tersedia untuk rate-limit login:', redisError.message);
  }

  try {
    const userQuery = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [loginIdentifier]
    );
    const user = userQuery.rows[0];

    if (!user || !user.password_hash) {
      try {
        if (attempts) {
          await redisClient.incr(redisKey);
        } else {
          await redisClient.set(redisKey, 1, 'EX', 86400);
        }
      } catch (redisError) {
        console.warn('[WARN] Redis tidak tersedia untuk mencatat percobaan login:', redisError.message);
      }
      return res.status(400).json({ status: 'error', message: '[ERROR] Username atau Password salah!' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      try {
        if (attempts) {
          await redisClient.incr(redisKey);
        } else {
          await redisClient.set(redisKey, 1, 'EX', 86400);
        }
      } catch (redisError) {
        console.warn('[WARN] Redis tidak tersedia untuk mencatat percobaan login:', redisError.message);
      }
      return res.status(400).json({ status: 'error', message: '[ERROR] Username atau Password salah!' });
    }

    // Login Sukses -> Hapus counter kesalahan login di Redis jika tersedia
    try {
      await redisClient.del(redisKey);
    } catch (redisError) {
      console.warn('[WARN] Redis tidak tersedia untuk membersihkan counter login:', redisError.message);
    }

    const token = jwt.sign(
      buildUserTokenPayload(user),
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      status: 'success',
      message: '[SUCCESS] Login berhasil!',
      data: { token, user }
    });
  } catch (error) {
    console.error('[ERROR] Login Error: ', error);
    return res.status(500).json({ status: 'error', message: '[ERROR] Gagal melakukan login.' });
  }
};

// ==========================================
// 3. FITUR GOOGLE OAUTH LOGIN
// ==========================================
export const googleLogin = async (req, res) => {
  const { googleToken, email, name, picture } = req.body; 

  try {
    let payload;

    // Skenario 1: Mode Development Bypass (Tanpa Token Google Asli)
    if (process.env.NODE_ENV === 'development' && !googleToken) {
      if (!email || !name) {
        return res.status(400).json({ 
          status: 'error', 
          message: '[ERROR] Data mock email dan name diperlukan untuk mode development' 
        });
      }
      // Batasi bypass hanya untuk IP lokal (127.0.0.1, ::1, localhost)
      const clientIp = req.ip || req.connection?.remoteAddress || '';
      const isLocal = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1' || clientIp === 'localhost';
      if (!isLocal) {
        console.warn('[WARNING] Google Login bypass dicoba dari IP non-lokal:', clientIp);
        return res.status(403).json({ status: 'error', message: '[ERROR] Akses development bypass ditolak dari IP eksternal.' });
      }
      console.warn('[WARNING] Google Login DEVELOPMENT BYPASS digunakan! Jangan aktifkan di production.');
      payload = { sub: 'mock_google_id_' + Date.now(), email, name, picture: picture || '' };
    } else {
      // Skenario 2: Token Verifikator Asli Google SDK
      let idToken = googleToken;

      // Jika menggunakan Authorization Code Flow, tukarkan code menjadi tokens
      if (code) {
        const { tokens } = await client.getToken(code);
        idToken = tokens.id_token;
      }

      if (!idToken) {
        return res.status(400).json({ status: 'error', message: '[ERROR] googleToken atau code diperlukan!' });
      }

      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    }

    const google_id = payload.sub;
    const userEmail = payload.email;
    const userName = payload.name;
    const userPicture = payload.picture;

    let userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [userEmail]);
    let user = userQuery.rows[0];

    if (!user) {
      const randomUsername = `user_${Math.floor(Math.random() * 1000000)}`;
      const defaultDate = '1990-01-01'; 
      
      const insertUser = await pool.query(
        `INSERT INTO users (nama_lengkap, nama_panggilan, tanggal_lahir, tempat_lahir, username, email, google_id, avatar_url) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [userName, userName.split(' ')[0], defaultDate, 'Jakarta', randomUsername, userEmail, google_id, userPicture]
      );
      user = insertUser.rows[0];
    } else if (!user.google_id) {
      const updateUser = await pool.query(
        'UPDATE users SET google_id = $1, avatar_url = $2, updated_at = NOW() WHERE id = $3 RETURNING *', 
        [google_id, userPicture, user.id]
      );
      user = updateUser.rows[0];
    }

    const token = jwt.sign(
      buildUserTokenPayload(user),
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      status: 'success',
      message: '[SUCCESS] Login Google berhasil!',
      data: { token, user }
    });

  } catch (error) {
    console.error('[ERROR] Google Login Error:', error);
    return res.status(401).json({ status: 'error', message: '[ERROR] Autentikasi Google gagal.' });
  }
};

// ==========================================
// 4. FITUR FORGOT PASSWORD
// ==========================================
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const userQuery = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    const user = userQuery.rows[0];
    
    if (!user) {
      return res.status(404).json({ status: 'error', message: '[ERROR] Email tidak ditemukan!' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // Berlaku 1 Jam

    await pool.query(
      `INSERT INTO password_resets (user_id, reset_token, expires_at) 
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    );

    console.log(`\n🔑 [DEBUG TOKEN] Token reset password untuk ${email}: ${token}\n`);

    return res.status(200).json({
      status: 'success',
      message: '[SUCCESS] Token reset password berhasil digenerate!',
      token: process.env.SHOW_DEBUG_TOKEN === 'true' ? token : undefined
    });
  } catch (error) {
    console.error('[ERROR] : ', error);
    return res.status(500).json({ status: 'error', message: '[ERROR] Gagal memproses permintaan.' });
  }
};

// ==========================================
// 5. FITUR RESET PASSWORD 
// ==========================================
export const resetPassword = async (req, res) => {
  const { email, token, new_password } = req.body;
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query('BEGIN');
    transactionStarted = true;

    const tokenCheck = await client.query(
      `SELECT pr.id, u.id AS user_id 
       FROM password_resets pr
       JOIN users u ON pr.user_id = u.id
       WHERE u.email = $1 AND pr.reset_token = $2 AND pr.expires_at > NOW() AND pr.is_used = false
       FOR UPDATE OF pr`,
      [email, token]
    );

    if (tokenCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      transactionStarted = false;
      return res.status(400).json({ 
        status: 'error', 
        message: '[ERROR] Token reset password tidak valid!' 
      });
    }

    const userId = tokenCheck.rows[0].user_id;
    const resetId = tokenCheck.rows[0].id;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );

    await client.query(
      'UPDATE password_resets SET is_used = true WHERE id = $1',
      [resetId]
    );

    await client.query(
      'DELETE FROM login_sessions WHERE user_id = $1',
      [userId]
    );

    await client.query('COMMIT');
    transactionStarted = false;

    return res.status(200).json({ 
      status: 'success', 
      message: '[SUCCESS] Password berhasil diperbarui! Silakan login kembali.' 
    });

  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK').catch(() => {});
    }
    console.error('[ERROR] : ', error);
    return res.status(500).json({ status: 'error', message: '[ERROR] Gagal melakukan reset password.' });
  } finally {
    client.release();
  }
};
