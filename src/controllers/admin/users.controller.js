import pool from '../../config/db.js';

// ========================================================
// 1. LIST SEMUA USER (DENGAN PAGINATION & FILTER)
// ========================================================
export const getAllUsers = async (req, res) => {
  const { page = 1, limit = 20, search, tier, is_banned } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(u.nama_lengkap ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.username ILIKE $${params.length})`);
  }
  if (tier) {
    params.push(tier);
    conditions.push(`ut.tier_slug = $${params.length}`);
  }
  if (is_banned === 'true') {
    conditions.push('uas.is_banned = true');
  } else if (is_banned === 'false') {
    conditions.push('(uas.is_banned = false OR uas.is_banned IS NULL)');
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total 
       FROM users u 
       LEFT JOIN user_account_status uas ON uas.user_id = u.id
       LEFT JOIN user_tier_subscriptions uts ON uts.user_id = u.id AND uts.status = 'active'
       LEFT JOIN user_tiers ut ON ut.id = uts.tier_id
       ${whereClause}`,
      params
    );

    const dataResult = await pool.query(
      `SELECT u.id, u.nama_lengkap, u.nama_panggilan, u.username, u.email, u.avatar_url, u.created_at,
              uas.is_banned, uas.ban_reason, uas.last_login_at, uas.login_fail_count,
              ut.tier_name, ut.tier_slug
       FROM users u 
       LEFT JOIN user_account_status uas ON uas.user_id = u.id
       LEFT JOIN user_tier_subscriptions uts ON uts.user_id = u.id AND uts.status = 'active'
       LEFT JOIN user_tiers ut ON ut.id = uts.tier_id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    );

    res.status(200).json({
      status: 'success',
      data: {
        users: dataResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.rows[0].total,
          total_pages: Math.ceil(countResult.rows[0].total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('[ERROR] Get All Users:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data users.' });
  }
};

// ========================================================
// 2. DETAIL USER
// ========================================================
export const getUserDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const userResult = await pool.query(
      `SELECT u.id, u.nama_lengkap, u.nama_panggilan, u.username, u.email, u.avatar_url, u.google_id, u.tempat_lahir, u.tanggal_lahir, u.created_at, u.updated_at,
              uas.is_banned, uas.ban_reason, uas.banned_until, uas.last_login_at, uas.login_fail_count,
              ut.tier_name, ut.tier_slug
       FROM users u
       LEFT JOIN user_account_status uas ON uas.user_id = u.id
       LEFT JOIN user_tier_subscriptions uts ON uts.user_id = u.id AND uts.status = 'active'
       LEFT JOIN user_tiers ut ON ut.id = uts.tier_id
       WHERE u.id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan.' });
    }

    const ordersResult = await pool.query(
      `SELECT id, order_code, status, total_amount, created_at 
       FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [id]
    );

    const paymentsResult = await pool.query(
      `SELECT p.id, p.amount, p.status, p.payment_method, p.created_at, p.paid_at, o.order_code
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       WHERE o.user_id = $1
       ORDER BY p.created_at DESC LIMIT 10`,
      [id]
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: userResult.rows[0],
        recent_orders: ordersResult.rows,
        recent_payments: paymentsResult.rows
      }
    });
  } catch (error) {
    console.error('[ERROR] Get User Detail:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil detail user.' });
  }
};

// ========================================================
// 3. BAN USER
// ========================================================
export const banUser = async (req, res) => {
  const { id } = req.params;
  const { reason, duration_hours } = req.body;
  const adminId = req.admin.admin_id || req.admin.id;

  try {
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan.' });
    }

    const bannedUntil = duration_hours 
      ? new Date(Date.now() + parseInt(duration_hours) * 3600000) 
      : null;

    await pool.query(
      `INSERT INTO user_account_status (user_id, is_banned, ban_reason, banned_until, updated_at)
       VALUES ($1, true, $2, $3, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET is_banned = true, ban_reason = $2, banned_until = $3, updated_at = NOW()`,
      [id, reason || 'Pelanggaran ketentuan', bannedUntil]
    );

    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id, details) 
       VALUES ($1, 'BAN_USER', 'users', $2, $3)`,
      [adminId, id, JSON.stringify({ reason, banned_until: bannedUntil })]
    );

    res.status(200).json({ status: 'success', message: 'User berhasil diban.' });
  } catch (error) {
    console.error('[ERROR] Ban User:', error);
    res.status(500).json({ status: 'error', message: 'Gagal memproses ban user.' });
  }
};

// ========================================================
// 4. UNBAN USER
// ========================================================
export const unbanUser = async (req, res) => {
  const { id } = req.params;
  const adminId = req.admin.admin_id || req.admin.id;

  try {
    const result = await pool.query(
      `UPDATE user_account_status 
       SET is_banned = false, ban_reason = null, banned_until = null, updated_at = NOW()
       WHERE user_id = $1
       RETURNING user_id`,
      [id]
    );

    if (result.rows.length === 0) {
      // Create record if not exists
      await pool.query(
        `INSERT INTO user_account_status (user_id, is_banned) VALUES ($1, false)`,
        [id]
      );
    }

    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id, details) 
       VALUES ($1, 'UNBAN_USER', 'users', $2, $3)`,
      [adminId, id, JSON.stringify({ action: 'unban' })]
    );

    res.status(200).json({ status: 'success', message: 'User berhasil di-unban.' });
  } catch (error) {
    console.error('[ERROR] Unban User:', error);
    res.status(500).json({ status: 'error', message: 'Gagal memproses unban user.' });
  }
};

// ========================================================
// 5. GET USER ORDERS
// ========================================================
export const getUserOrders = async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Cek apakah admin ini punya izin melihat data finansial
  const canViewRevenue = req.admin?.permissions?.can_view_revenue === true
    || req.admin?.role_slug === 'super_admin';

  try {
    const countResult = await pool.query(
      'SELECT COUNT(*)::int AS total FROM orders WHERE user_id = $1',
      [id]
    );

    // Query dasar tanpa kolom finansial
    let selectColumns = 'o.*';
    let joinClause = '';

    if (canViewRevenue) {
      selectColumns = 'o.*, p.status AS payment_status, p.payment_method, p.amount';
      joinClause = 'LEFT JOIN payments p ON p.order_id = o.id';
    }

    const ordersResult = await pool.query(
      `SELECT ${selectColumns}
       FROM orders o
       ${joinClause}
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, parseInt(limit), offset]
    );

    res.status(200).json({
      status: 'success',
      data: {
        orders: ordersResult.rows,
        financial_data_included: canViewRevenue,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.rows[0].total,
          total_pages: Math.ceil(countResult.rows[0].total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('[ERROR] Get User Orders:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data orders user.' });
  }
};
