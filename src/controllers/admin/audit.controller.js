import pool from '../../config/db.js';

// ========================================================
// 1. LIST AUDIT LOGS
// ========================================================
export const getAuditLogs = async (req, res) => {
  const { page = 1, limit = 20, admin_id, action, target_table, start_date, end_date } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const conditions = [];

  if (admin_id) { params.push(admin_id); conditions.push(`al.admin_id = $${params.length}`); }
  if (action) { params.push(action); conditions.push(`al.action = $${params.length}`); }
  if (target_table) { params.push(target_table); conditions.push(`al.target_table = $${params.length}`); }
  if (start_date) { params.push(start_date); conditions.push(`al.performed_at >= $${params.length}`); }
  if (end_date) { params.push(end_date); conditions.push(`al.performed_at <= $${params.length}`); }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM admin_audit_logs al ${whereClause}`,
      params
    );

    const result = await pool.query(
      `SELECT al.*, a.full_name AS admin_name, a.email AS admin_email
       FROM admin_audit_logs al
       LEFT JOIN admins a ON a.id = al.admin_id
       ${whereClause}
       ORDER BY al.performed_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
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
    console.error('[ERROR] Get Audit Logs:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil audit logs.' });
  }
};

// ========================================================
// 2. DETAIL AUDIT LOG
// ========================================================
export const getAuditDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT al.*, a.full_name AS admin_name, a.email AS admin_email
       FROM admin_audit_logs al
       LEFT JOIN admins a ON a.id = al.admin_id
       WHERE al.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Audit log tidak ditemukan.' });
    }

    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    console.error('[ERROR] Get Audit Detail:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil detail audit log.' });
  }
};
