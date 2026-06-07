import pool from '../config/db.js';
import redisClient from '../config/redis.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ==========================================
// 1. FITUR REGISTRASI AKUN
// ==========================================
export const register = async (req, res) => {
  const { nama_lengkap, nama_panggilan, tanggal_lahir, tempat_lahir, username, email, password } = req.body;

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

    const newUser = await pool.query(
      `INSERT INTO users (nama_lengkap, nama_panggilan, tanggal_lahir, tempat_lahir, username, email, password_hash) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, email`,
      [nama_lengkap, nama_panggilan, tanggal_lahir, tempat_lahir, username, email, hashedPassword]
    );

    res.status(201).json({
      status: 'success',
      message: '[INFO] Registrasi berhasil! Silakan login.',
      data: newUser.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: '[ERROR] Gagal melakukan registrasi.' });
  }
};

// ==========================================
// 2. FITUR LOGIN & REDIS BAN LOGIC 24 JAM
// ==========================================
export const login = async (req, res) => {
  const { username, password } = req.body;
  const redisKey = `login_count:${username}`;

  try {
    const attempts = await redisClient.get(redisKey);
    if (attempts && parseInt(attempts) >= 10) {
      return res.status(403).json({
        status: 'error',
        message: '[ERROR] Akun Anda diblokir selama 24 jam karena terlalu banyak percobaan login yang gagal.'
      });
    }

    const userQuery = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (userQuery.rows.length === 0) {
      return handleFailedLogin(redisKey, res, attempts);
    }

    const user = userQuery.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return handleFailedLogin(redisKey, res, attempts);
    }

    await redisClient.del(redisKey);

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET_USER,
      { expiresIn: '7d' } 
    );

    res.json({
      status: 'success',
      message: '[INFO] Login berhasil!',
      token,
      data: { id: user.id, username: user.username, full_name: user.full_name }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: '[ERROR] Terjadi kesalahan pada server.' });
  }
};

const handleFailedLogin = async (redisKey, res, currentAttempts) => {
  const count = currentAttempts ? parseInt(currentAttempts) + 1 : 1;

  await redisClient.set(redisKey, count);

  if (count === 1) {
    await redisClient.expire(redisKey, 86400); 
  }

  const sisa = 10 - count;
  return res.status(401).json({
    status: 'error',
    message: `[ERROR] Username atau password salah. Sisa percobaan Anda: ${sisa} kali.`
  });
};

// ==========================================
// 3. FITUR LUPA PASSWORD (RESET PASSWORD)
// ==========================================
export const resetPassword = async (req, res) => {
  const { email, new_password } = req.body;

  try {
    // 1. Cari user berdasarkan email
    const checkUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: '[ERROR] Email tidak terdaftar di sistem.' });
    }

    const userId = checkUser.rows[0].id;

    // 2. Hash password baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // 3. Update password di database
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, userId]);

    res.status(200).json({
      status: 'success',
      message: '[SUCCESS] Password berhasil di-reset. Silakan login dengan password baru Anda.'
    });
  } catch (error) {
    console.error('[ERROR] Error:', error);
    res.status(500).json({ status: 'error', message: '[ERROR] Gagal melakukan reset password.' });
  }
};

// ==========================================
// 4. FITUR LOGIN VIA GOOGLE OAUTH
// ==========================================
export const googleLogin = async (req, res) => {
  const { googleToken } = req.body; 

  try {
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: google_id, email, name, picture } = payload;

    let userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = userQuery.rows[0];

    if (!user) {
      const randomUsername = `user_${Math.floor(Math.random() * 1000000)}`;
      const defaultDate = '1990-01-01'; 
      
      const insertUser = await pool.query(
        `INSERT INTO users (nama_lengkap, nama_panggilan, tanggal_lahir, tempat_lahir, username, email, google_id, avatar_url) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [name, name.split(' ')[0], defaultDate, 'Jakarta', randomUsername, email, google_id, picture]
      );
      user = insertUser.rows[0];
    } else if (!user.google_id) {
      await pool.query('UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3', [google_id, picture, user.id]);
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      status: 'success',
      message: '[SUCCESS] Login berhasil!',
      data: { token, user }
    });

  } catch (error) {
    console.error('[ERROR] Error:', error);
    res.status(401).json({ status: 'error', message: '[ERROR] Token Google tidak valid atau kadaluarsa.' });
  }
};
/*
export const googleLogin = async (req, res) => {
  const { googleToken, email, name, picture } = req.body; 

  try {
    let payload;

    // [DEBUG] Menghindari ReferenceError dengan memastikan data payload terisi dengan benar
    if (process.env.NODE_ENV === 'development' && !googleToken) {
      if (!email || !name) return res.status(400).json({ status: 'error', message: 'Data mock email/name diperlukan untuk dev mode' });
      // Gunakan variabel email dan name yang sudah dideklarasikan di baris atas
      payload = { sub: 'mock_google_id_' + Date.now(), email, name, picture: picture || '' };
    } else {
      if (!googleToken) return res.status(400).json({ status: 'error', message: 'ID Token diperlukan' });
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    }
    // [DEBUG SELESAI]

    // Sekarang payload sudah pasti ada, aman untuk di-destructure
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
      await pool.query('UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3', [google_id, userPicture, user.id]);
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      status: 'success',
      message: '[SUCCESS] Login Google berhasil!',
      data: { token, user }
    });

  } catch (error) {
    console.error('[ERROR] Google Login Error:', error);
    res.status(401).json({ status: 'error', message: '[ERROR] Token Google tidak valid.' });
  }
};*/