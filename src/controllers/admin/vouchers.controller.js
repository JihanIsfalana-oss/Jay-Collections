import pool from '../../config/db.js';

// ========================================================
// 1. LIST VOUCHER
// ========================================================
export const getVouchers = async (req, res) => {
  const { page = 1, limit = 20, is_used, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const conditions = [];

  if (is_used === 'true') {
    conditions.push('v.is_used = true');
  } else if (is_used === 'false') {
    conditions.push('v.is_used = false');
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`v.code ILIKE $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM vouchers v ${whereClause}`,
      params
    );

    const result = await pool.query(
      `SELECT v.*, o.order_code AS used_in_order
       FROM vouchers v
       LEFT JOIN orders o ON o.id = v.used_by_order_id
       ${whereClause}
       ORDER BY v.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    );

    res.status(200).json({
      status: 'success',
      data: {
        vouchers: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.rows[0].total,
          total_pages: Math.ceil(countResult.rows[0].total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('[ERROR] Get Vouchers:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data voucher.' });
  }
};

// ========================================================
// 2. CREATE VOUCHER MANUAL
// ========================================================
export const createVoucher = async (req, res) => {
  const { code, discount_percent, couple_link_id, expires_at } = req.body;
  const adminId = req.admin.admin_id || req.admin.id;

  if (!discount_percent || discount_percent < 1 || discount_percent > 100) {
    return res.status(400).json({ status: 'error', message: 'discount_percent harus antara 1-100.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO vouchers (code, discount_percent, couple_link_id, expires_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [code || null, discount_percent, couple_link_id || null, expires_at || null]
    );

    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id, details)
       VALUES ($1, 'CREATE_VOUCHER', 'vouchers', $2, $3)`,
      [adminId, result.rows[0].id, JSON.stringify({ code: result.rows[0].code, discount_percent })]
    );

    res.status(201).json({ status: 'success', message: 'Voucher berhasil dibuat.', data: result.rows[0] });
  } catch (error) {
    console.error('[ERROR] Create Voucher:', error);
    res.status(500).json({ status: 'error', message: 'Gagal membuat voucher.' });
  }
};

// ========================================================
// 3. REVOKE VOUCHER
// ========================================================
export const revokeVoucher = async (req, res) => {
  const { id } = req.params;
  const adminId = req.admin.admin_id || req.admin.id;

  try {
    const result = await pool.query(
      `UPDATE vouchers SET is_used = true, expires_at = NOW() WHERE id = $1 AND is_used = false RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Voucher tidak ditemukan atau sudah digunakan.' });
    }

    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id)
       VALUES ($1, 'REVOKE_VOUCHER', 'vouchers', $2)`,
      [adminId, id]
    );

    res.status(200).json({ status: 'success', message: 'Voucher berhasil dicabut.' });
  } catch (error) {
    console.error('[ERROR] Revoke Voucher:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mencabut voucher.' });
  }
};

// ========================================================
// 4. STATISTIK VOUCHER
// ========================================================
export const getVoucherStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*)::int AS total_vouchers,
        COUNT(*) FILTER (WHERE is_used = true)::int AS used_vouchers,
        COUNT(*) FILTER (WHERE is_used = false AND expires_at > NOW())::int AS active_vouchers,
        COUNT(*) FILTER (WHERE is_used = false AND expires_at <= NOW())::int AS expired_vouchers,
        ROUND(AVG(discount_percent)::decimal, 1) AS avg_discount_percent
      FROM vouchers
    `);

    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    console.error('[ERROR] Voucher Stats:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil statistik voucher.' });
  }
};
