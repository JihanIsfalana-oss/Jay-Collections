import pool from '../../config/db.js';

// ========================================================
// 1. LIST NOTIFIKASI
// ========================================================
export const getNotifications = async (req, res) => {
  const { page = 1, limit = 20, is_active } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  let whereClause = '';

  if (is_active === 'true') {
    whereClause = 'WHERE n.is_active = true';
  } else if (is_active === 'false') {
    whereClause = 'WHERE n.is_active = false';
  }

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM system_notifications n ${whereClause}`
    );

    const result = await pool.query(
      `SELECT n.*, a.full_name AS created_by_name
       FROM system_notifications n
       LEFT JOIN admins a ON a.id = n.created_by_admin_id
       ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );

    res.status(200).json({
      status: 'success',
      data: {
        notifications: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.rows[0].total,
          total_pages: Math.ceil(countResult.rows[0].total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('[ERROR] Get Notifications:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data notifikasi.' });
  }
};

// ========================================================
// 2. CREATE NOTIFIKASI
// ========================================================
export const createNotification = async (req, res) => {
  const { target_audience, target_user_id, title, body, published_at, expires_at } = req.body;
  const adminId = req.admin.admin_id || req.admin.id;

  if (!title || !body) {
    return res.status(400).json({ status: 'error', message: 'title dan body wajib diisi.' });
  }

  if (target_audience === 'specific_user' && !target_user_id) {
    return res.status(400).json({ status: 'error', message: 'target_user_id wajib diisi untuk audience specific_user.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO system_notifications (created_by_admin_id, target_audience, target_user_id, title, body, published_at, expires_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING *`,
      [adminId, target_audience || 'all_users', target_user_id || null, title, body, published_at || null, expires_at || null]
    );

    res.status(201).json({
      status: 'success',
      message: 'Notifikasi berhasil dibuat.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[ERROR] Create Notification:', error);
    res.status(500).json({ status: 'error', message: 'Gagal membuat notifikasi.' });
  }
};

// ========================================================
// 3. UPDATE NOTIFIKASI
// ========================================================
export const updateNotification = async (req, res) => {
  const { id } = req.params;
  const { target_audience, target_user_id, title, body, is_active, published_at, expires_at } = req.body;
  const updates = [];
  const params = [];
  let paramIndex = 0;

  if (target_audience !== undefined) { paramIndex++; updates.push(`target_audience = $${paramIndex}`); params.push(target_audience); }
  if (target_user_id !== undefined) { paramIndex++; updates.push(`target_user_id = $${paramIndex}`); params.push(target_user_id); }
  if (title !== undefined) { paramIndex++; updates.push(`title = $${paramIndex}`); params.push(title); }
  if (body !== undefined) { paramIndex++; updates.push(`body = $${paramIndex}`); params.push(body); }
  if (is_active !== undefined) { paramIndex++; updates.push(`is_active = $${paramIndex}`); params.push(is_active); }
  if (published_at !== undefined) { paramIndex++; updates.push(`published_at = $${paramIndex}`); params.push(published_at); }
  if (expires_at !== undefined) { paramIndex++; updates.push(`expires_at = $${paramIndex}`); params.push(expires_at); }

  if (updates.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Tidak ada data yang diupdate.' });
  }

  try {
    paramIndex++;
    params.push(id);
    const result = await pool.query(
      `UPDATE system_notifications SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Notifikasi tidak ditemukan.' });

    res.status(200).json({ status: 'success', message: 'Notifikasi berhasil diupdate.', data: result.rows[0] });
  } catch (error) {
    console.error('[ERROR] Update Notification:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengupdate notifikasi.' });
  }
};

// ========================================================
// 4. DELETE NOTIFIKASI
// ========================================================
export const deleteNotification = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM system_notifications WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Notifikasi tidak ditemukan.' });

    res.status(200).json({ status: 'success', message: 'Notifikasi berhasil dihapus.' });
  } catch (error) {
    console.error('[ERROR] Delete Notification:', error);
    res.status(500).json({ status: 'error', message: 'Gagal menghapus notifikasi.' });
  }
};
