import pool from '../config/db.js';

/**
 * Middleware factory: memeriksa apakah admin memiliki permission tertentu.
 * Permission diambil dari JSONB kolom permissions di tabel admin_roles.
 * 
 * Contoh penggunaan:
 *   router.get('/users', verifyAdminToken, requirePermission('can_manage_users'), getAllUsers);
 *   router.put('/orders/:id/status', verifyAdminToken, requireRole('super_admin', 'admin'), updateOrderStatus);
 */

/**
 * Cek permission spesifik dari JSONB permissions role admin.
 * @param {string} permission - Nama permission (e.g. 'can_ban_users')
 */
export const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const adminId = req.admin?.admin_id || req.admin?.id;
      if (!adminId) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized: admin tidak teridentifikasi.' });
      }

      // Ambil role dan permissions dari database
      const roleQuery = await pool.query(
        `SELECT r.role_name, r.permissions 
         FROM admins a 
         JOIN admin_roles r ON a.role_id = r.id 
         WHERE a.id = $1 AND a.is_active = true`,
        [adminId]
      );

      if (roleQuery.rows.length === 0) {
        return res.status(403).json({ status: 'error', message: 'Forbidden: admin tidak aktif atau tidak ditemukan.' });
      }

      const { role_name, permissions } = roleQuery.rows[0];

      // Super Admin selalu diizinkan
      if (role_name === 'Super Admin') {
        req.admin.role_name = role_name;
        return next();
      }

      // Cek permission spesifik
      if (permissions && permissions[permission] === true) {
        req.admin.role_name = role_name;
        return next();
      }

      return res.status(403).json({
        status: 'error',
        message: `Forbidden: role "${role_name}" tidak memiliki izin "${permission}".`
      });

    } catch (error) {
      console.error('[ERROR] Role Middleware:', error);
      return res.status(500).json({ status: 'error', message: 'Gagal memverifikasi otorisasi.' });
    }
  };
};

/**
 * Cek apakah role admin termasuk dalam daftar role yang diizinkan.
 * @param {...string} allowedRoles - Daftar role yang diizinkan (e.g. 'super_admin', 'admin')
 */
export const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const adminId = req.admin?.admin_id || req.admin?.id;
      if (!adminId) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized: admin tidak teridentifikasi.' });
      }

      const roleQuery = await pool.query(
        `SELECT r.role_slug 
         FROM admins a 
         JOIN admin_roles r ON a.role_id = r.id 
         WHERE a.id = $1 AND a.is_active = true`,
        [adminId]
      );

      if (roleQuery.rows.length === 0) {
        return res.status(403).json({ status: 'error', message: 'Forbidden: admin tidak aktif.' });
      }

      const roleSlug = roleQuery.rows[0].role_slug;

      if (allowedRoles.includes(roleSlug)) {
        req.admin.role_slug = roleSlug;
        return next();
      }

      return res.status(403).json({
        status: 'error',
        message: `Forbidden: role "${roleSlug}" tidak diizinkan. Required: ${allowedRoles.join(', ')}.`
      });

    } catch (error) {
      console.error('[ERROR] Role Middleware:', error);
      return res.status(500).json({ status: 'error', message: 'Gagal memverifikasi otorisasi.' });
    }
  };
};
