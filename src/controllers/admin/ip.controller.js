import pool from '../../config/db.js';

// ========================================================
// 1. LIST SEMUA IP WHITELIST
// ========================================================
export const getAllowedIps = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ai.*, a.full_name AS created_by_name
       FROM admin_allowed_ips ai
       LEFT JOIN admins a ON a.id = ai.created_by
       ORDER BY ai.created_at DESC`
    );

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('[ERROR] Get Allowed IPs:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data IP whitelist.' });
  }
};

// ========================================================
// 2. TAMBAH IP KE WHITELIST
// ========================================================
export const addAllowedIp = async (req, res) => {
  const { ip_address, label } = req.body;
  const adminId = req.admin.admin_id || req.admin.id;

  if (!ip_address) {
    return res.status(400).json({ status: 'error', message: 'ip_address wajib disertakan!' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO admin_allowed_ips (ip_address, label, created_by) 
       VALUES ($1, $2, $3) RETURNING *`,
      [ip_address, label || 'IP Terdaftar', adminId]
    );

    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_table, details) 
       VALUES ($1, 'ADD_IP_WHITELIST', 'admin_allowed_ips', $2)`,
      [adminId, JSON.stringify(result.rows[0])]
    );

    return res.status(201).json({
      status: 'success',
      message: 'IP berhasil didaftarkan ke whitelist!',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[ERROR] Add Allowed IP:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal menambahkan IP whitelist.' });
  }
};

// ========================================================
// 3. HAPUS IP DARI WHITELIST
// ========================================================
export const deleteAllowedIp = async (req, res) => {
  const { id } = req.params;
  const adminId = req.admin.admin_id || req.admin.id;

  try {
    const result = await pool.query(
      'DELETE FROM admin_allowed_ips WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'IP tidak ditemukan.' });
    }

    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_table, details) 
       VALUES ($1, 'DELETE_IP_WHITELIST', 'admin_allowed_ips', $2)`,
      [adminId, JSON.stringify({ deleted_ip: result.rows[0].ip_address })]
    );

    return res.status(200).json({
      status: 'success',
      message: 'IP berhasil dihapus dari whitelist!'
    });
  } catch (error) {
    console.error('[ERROR] Delete Allowed IP:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal menghapus IP whitelist.' });
  }
};
