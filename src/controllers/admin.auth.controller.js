import pool from '../config/db.js';
import redisClient from '../config/redis.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';

// Helper strict untuk mengambil JWT Secret Admin 
const getAdminSecret = () => {
  const secret = process.env.JWT_SECRET_ADMIN;
  if (!secret) {
    throw new Error('FATAL SECURITY ERROR: Tokenisasi belum diatur!');
  }
  return secret;
};

// Helper format IP Address
const cleanIpAddress = (ip) => {
  if (ip && ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  return ip || '127.0.0.1';
};

// ========================================================
// 1. LOGIN ADMIN
// ========================================================
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  const clientIp = cleanIpAddress(req.ip);
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email dan password wajib diisi!' });
    }

    // Cari admin berdasarkan email — hanya active admin
    const adminQuery = await pool.query(
      `SELECT a.*, r.role_name, r.permissions 
       FROM admins a 
       JOIN admin_roles r ON a.role_id = r.id 
       WHERE a.email = $1 AND a.is_active = true`,
      [email]
    );
    let admin = adminQuery.rows[0];

    if (!admin) {
      return res.status(401).json({ status: 'error', message: 'Kredensial admin tidak valid!' });
    }

    // Verifikasi password dengan bcrypt
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Kredensial admin tidak valid!' });
    }

    // Verifikasi IP Whitelisting
    const isSuperAdmin = admin.role_name === 'Super Admin';
    const bypassEnabled = process.env.SUPER_ADMIN_BYPASS_IPS === 'true';

    if (!(isSuperAdmin && bypassEnabled)) {
      const ipCheck = await pool.query('SELECT ip_address FROM admin_allowed_ips');
      if (ipCheck.rows.length > 0) {
        const allowedIps = ipCheck.rows.map(row => row.ip_address);
        if (!allowedIps.includes(clientIp)) {
          await pool.query(
            `INSERT INTO admin_audit_logs (admin_id, action, target_table, details, ip_address, user_agent) 
            VALUES ($1, 'BLOCKED_BY_IP_WHITELIST', 'admins', $2, $3, $4)`,
            [admin.id, JSON.stringify({ attempted_ip: clientIp }), clientIp, userAgent]
          );
          return res.status(403).json({ 
            status: 'error', 
            message: `IP Anda (${clientIp}) tidak terdaftar dalam whitelist!` 
          });
        }
      }
    }

    // Alur MFA TOTP
    if (admin.mfa_enabled) {
      return res.status(200).json({
        status: 'mfa_required',
        message: 'Otentikasi dua faktor (MFA) diperlukan!',
        data: {
          temp_token: jwt.sign({ id: admin.id, mfa_pending: true }, getAdminSecret(), { expiresIn: '5m' })
        }
      });
    }

    // Generate JWT Admin Token
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role_name },
      getAdminSecret(),
      { expiresIn: '8h' }
    );

    const sessionData = {
      admin_id: admin.id,
      email: admin.email,
      role: admin.role_name,
      role_slug: admin.role_slug,
      permissions: admin.permissions,
      ip_address: clientIp,
      user_agent: userAgent
    };
    
    // Simpan di Redis & PostgreSQL Session Table
    await redisClient.set(`admin_session:${token}`, JSON.stringify(sessionData), 'EX', 28800);

    await pool.query(
      `INSERT INTO admin_sessions (admin_id, session_token, expires_at, ip_address, user_agent) 
       VALUES ($1, $2, NOW() + INTERVAL '8 hours', $3, $4)`,
      [admin.id, token, clientIp, userAgent]
    );

    // Audit Log
    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_table, details, ip_address, user_agent) 
      VALUES ($1, 'LOGIN_SUCCESS', 'admins', $2, $3, $4)`,
      [admin.id, JSON.stringify({ session_status: 'active' }), clientIp, userAgent]
    );

    return res.status(200).json({
      status: 'success',
      message: 'Login administrator berhasil!',
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          full_name: admin.full_name,
          role: admin.role_name
        }
      }
    });

  } catch (error) {
    console.error('[ERROR] Admin Login:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal memproses autentikasi admin.' });
  }
};

// ========================================================
// 2. VERIFIKASI MFA TOTP
// ========================================================
export const verifyAdminMfa = async (req, res) => {
  const { temp_token, mfa_code } = req.body;
  const clientIp = cleanIpAddress(req.ip);
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const decoded = jwt.verify(temp_token, getAdminSecret());
    if (!decoded.mfa_pending) {
      return res.status(400).json({ status: 'error', message: 'Token otentikasi tidak valid!' });
    }

    const adminQuery = await pool.query(
      `SELECT a.*, r.role_name, r.permissions 
       FROM admins a 
       JOIN admin_roles r ON a.role_id = r.id 
       WHERE a.id = $1 AND a.is_active = true`,
      [decoded.id]
    );
    const admin = adminQuery.rows[0];

    if (!admin) {
      return res.status(401).json({ status: 'error', message: 'Admin tidak ditemukan!' });
    }

    // Validasi kode MFA — jika TOTP secret tersimpan, verifikasi real; fallback ke kode statis untuk development
    if (!admin.mfa_enabled || !admin.totp_secret) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'MFA belum diaktifkan untuk akun ini. Hubungi super admin.' 
      });
    }

    const isValidTotp = speakeasy.totp.verify({
      secret: admin.totp_secret,
      encoding: 'base32',
      token: mfa_code,
      window: 1 // toleransi 1 step (30 detik) untuk clock drift
    });

    if (!isValidTotp) {
      await pool.query(
        `INSERT INTO admin_audit_logs (admin_id, action, target_table, details, ip_address, user_agent) 
        VALUES ($1, 'MFA_FAILED', 'admins', $2, $3, $4)`,
        [admin.id, JSON.stringify({ reason: 'invalid_totp' }), clientIp, userAgent]
      );
      return res.status(400).json({ status: 'error', message: 'Kode MFA salah!' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role_name },
      getAdminSecret(),
      { expiresIn: '8h' }
    );

    const sessionData = {
      admin_id: admin.id,
      email: admin.email,
      role: admin.role_name,
      ip_address: clientIp,
      user_agent: userAgent
    };

    // Simpan sesi di Redis Cache
    await redisClient.set(`admin_session:${token}`, JSON.stringify(sessionData), 'EX', 28800);

    // Simpan sesi di PostgreSQL
    await pool.query(
      `INSERT INTO admin_sessions
      (admin_id, session_token, expires_at, ip_address, user_agent)
      VALUES ($1, $2, NOW() + INTERVAL '8 hours', $3, $4)`,
      [
        admin.id,
        token,
        clientIp,
        userAgent
      ]
    );

    // Audit Log MFA Success
    await pool.query(
      `INSERT INTO admin_audit_logs
      (admin_id, action, target_table, details, ip_address, user_agent)
      VALUES ($1, 'LOGIN_SUCCESS', 'admins', $2, $3, $4)`,
      [
        admin.id,
        JSON.stringify({
          session_status: 'active',
          login_method: 'mfa'
        }),
        clientIp,
        userAgent
      ]
    );

    return res.status(200).json({
      status: 'success',
      message: 'Otentikasi MFA sukses!',
      data: { token, email: admin.email, role: admin.role_name }
    });

  } catch (error) {
    console.error('[ERROR] Verify MFA:', error);
    return res.status(401).json({ status: 'error', message: 'Verifikasi MFA gagal atau token kedaluwarsa.' });
  }
};

// ========================================================
// 3. LOGOUT ADMINISTRATOR
// ========================================================
export const adminLogout = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    if (token) {
      await redisClient.del(`admin_session:${token}`);
      await pool.query('DELETE FROM admin_sessions WHERE session_token = $1', [token]);
    }
    return res.status(200).json({ status: 'success', message: 'Logout admin berhasil!' });
  } catch (error) {
    console.error('[ERROR] Admin Logout:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal melakukan logout admin.' });
  }
};
