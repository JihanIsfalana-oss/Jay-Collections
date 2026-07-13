import pool from '../../config/db.js';
import bcrypt from 'bcryptjs';

// ========================================================
// 1. LIST SEMUA ADMIN
// ========================================================
export const getAllAdmins = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.full_name, a.email, a.is_active, a.last_login_at, a.created_at,
              r.role_name, r.role_slug, r.permissions
       FROM admins a
       JOIN admin_roles r ON a.role_id = r.id
       ORDER BY a.created_at DESC`
    );

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('[ERROR] Get All Admins:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data admin.' });
  }
};

// ========================================================
// 2. CREATE ADMIN BARU
// ========================================================
export const createAdmin = async (req, res) => {
  const { full_name, email, password, role_id } = req.body;
  const adminId = req.admin.admin_id || req.admin.id;

  if (!full_name || !email || !password || !role_id) {
    return res.status(400).json({ status: 'error', message: 'full_name, email, password, dan role_id wajib diisi.' });
  }

  try {
    const existingCheck = await pool.query('SELECT id FROM admins WHERE email = $1', [email]);
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ status: 'error', message: 'Email sudah terdaftar sebagai admin.' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO admins (full_name, email, password_hash, role_id, is_active)
       VALUES ($1, $2, $3, $4, true) RETURNING id, full_name, email, created_at`,
      [full_name, email, passwordHash, role_id]
    );

    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id, details)
       VALUES ($1, 'CREATE_ADMIN', 'admins', $2, $3)`,
      [adminId, result.rows[0].id, JSON.stringify({ full_name, email })]
    );

    res.status(201).json({
      status: 'success',
      message: 'Admin baru berhasil dibuat.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[ERROR] Create Admin:', error);
    res.status(500).json({ status: 'error', message: 'Gagal membuat admin baru.' });
  }
};

// ========================================================
// 3. UPDATE ADMIN
// ========================================================
export const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, role_id, is_active } = req.body;
  const adminId = req.admin.admin_id || req.admin.id;
  const updates = [];
  const params = [];
  let paramIndex = 0;

  if (full_name !== undefined) { paramIndex++; updates.push(`full_name = $${paramIndex}`); params.push(full_name); }
  if (email !== undefined) { paramIndex++; updates.push(`email = $${paramIndex}`); params.push(email); }
  if (role_id !== undefined) { paramIndex++; updates.push(`role_id = $${paramIndex}`); params.push(role_id); }
  if (is_active !== undefined) { paramIndex++; updates.push(`is_active = $${paramIndex}`); params.push(is_active); }

  if (updates.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Tidak ada data yang diupdate.' });
  }

  updates.push('updated_at = NOW()');

  try {
    paramIndex++;
    params.push(id);
    const result = await pool.query(
      `UPDATE admins SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, full_name, email, is_active`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Admin tidak ditemukan.' });
    }

    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id, details)
       VALUES ($1, 'UPDATE_ADMIN', 'admins', $2, $3)`,
      [adminId, id, JSON.stringify(req.body)]
    );

    res.status(200).json({ status: 'success', message: 'Admin berhasil diupdate.', data: result.rows[0] });
  } catch (error) {
    console.error('[ERROR] Update Admin:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengupdate admin.' });
  }
};

// ========================================================
// 4. DELETE / DEACTIVATE ADMIN
// ========================================================
export const deleteAdmin = async (req, res) => {
  const { id } = req.params;
  const adminId = req.admin.admin_id || req.admin.id;

  if (id === adminId) {
    return res.status(400).json({ status: 'error', message: 'Tidak dapat menonaktifkan akun sendiri.' });
  }

  try {
    const result = await pool.query(
      `UPDATE admins SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Admin tidak ditemukan.' });
    }

    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id)
       VALUES ($1, 'DEACTIVATE_ADMIN', 'admins', $2)`,
      [adminId, id]
    );

    res.status(200).json({ status: 'success', message: 'Admin berhasil dinonaktifkan.' });
  } catch (error) {
    console.error('[ERROR] Delete Admin:', error);
    res.status(500).json({ status: 'error', message: 'Gagal menonaktifkan admin.' });
  }
};

// ========================================================
// 5. LIST ADMIN ROLES
// ========================================================
export const getAdminRoles = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, role_name, role_slug, permissions, description, created_at FROM admin_roles ORDER BY role_name'
    );

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('[ERROR] Get Admin Roles:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data roles.' });
  }
};

// ========================================================
// 6. CREATE ADMIN ROLE
// ========================================================
export const createAdminRole = async (req, res) => {
  const { role_name, role_slug, permissions, description } = req.body;
  const adminId = req.admin.admin_id || req.admin.id;

  if (!role_name || !role_slug) {
    return res.status(400).json({ status: 'error', message: 'role_name dan role_slug wajib diisi.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO admin_roles (role_name, role_slug, permissions, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [role_name, role_slug, permissions || {}, description || null]
    );

    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id, details)
       VALUES ($1, 'CREATE_ADMIN_ROLE', 'admin_roles', $2, $3)`,
      [adminId, result.rows[0].id, JSON.stringify({ role_name, role_slug })]
    );

    res.status(201).json({ status: 'success', message: 'Role baru berhasil dibuat.', data: result.rows[0] });
  } catch (error) {
    console.error('[ERROR] Create Admin Role:', error);
    res.status(500).json({ status: 'error', message: 'Gagal membuat role baru.' });
  }
};

// ========================================================
// 7. AUDIT LOGS UNTUK ADMIN TERTENTU
// ========================================================
export const getAdminAuditLogs = async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const countResult = await pool.query(
      'SELECT COUNT(*)::int AS total FROM admin_audit_logs WHERE admin_id = $1',
      [id]
    );

    const result = await pool.query(
      `SELECT al.*, a.full_name AS admin_name
       FROM admin_audit_logs al
       LEFT JOIN admins a ON a.id = al.admin_id
       WHERE al.admin_id = $1
       ORDER BY al.performed_at DESC
       LIMIT $2 OFFSET $3`,
      [id, parseInt(limit), offset]
    );

    res.status(200).json({
      status: 'success',
      data: {
        logs: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.rows[0].total,
          total_pages: Math.ceil(countResult.rows[0].total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('[ERROR] Get Admin Audit Logs:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil audit logs admin.' });
  }
};
