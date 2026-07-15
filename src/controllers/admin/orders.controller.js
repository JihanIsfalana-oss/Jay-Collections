import pool from '../../config/db.js';

// ========================================================
// 1. LIST SEMUA ORDER (DENGAN PAGINATION & FILTER)
// ========================================================
export const getAllOrders = async (req, res) => {
  const { page = 1, limit = 20, search, status, engineer_id } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(o.order_code ILIKE $${params.length} OR o.bride_name ILIKE $${params.length} OR o.groom_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
  }
  if (status) {
    params.push(status);
    conditions.push(`o.status = $${params.length}`);
  }
  if (engineer_id) {
    params.push(engineer_id);
    conditions.push(`oa.assigned_to_admin_id = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total 
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN order_assignments oa ON oa.order_id = o.id AND oa.assignment_status NOT IN ('reassigned')
       ${whereClause}`,
      params
    );

    const dataResult = await pool.query(
      `SELECT o.id, o.order_code, o.status, o.bride_name, o.groom_name, o.wedding_date, o.total_amount, o.created_at,
              u.nama_lengkap AS user_name, u.email AS user_email,
              oa.assigned_to_admin_id, oa.assignment_status,
              adm.full_name AS engineer_name,
              p.status AS payment_status, p.amount AS payment_amount
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN order_assignments oa ON oa.order_id = o.id AND oa.assignment_status NOT IN ('reassigned')
       LEFT JOIN admins adm ON adm.id = oa.assigned_to_admin_id
       LEFT JOIN payments p ON p.order_id = o.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    );

    res.status(200).json({
      status: 'success',
      data: {
        orders: dataResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.rows[0].total,
          total_pages: Math.ceil(countResult.rows[0].total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('[ERROR] Get All Orders:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data orders.' });
  }
};

// ========================================================
// 2. DETAIL ORDER
// ========================================================
export const getOrderDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const orderResult = await pool.query(
      `SELECT o.*, u.nama_lengkap AS user_name, u.email AS user_email, u.username AS user_username,
              p.id AS payment_id, p.amount, p.status AS payment_status, p.payment_method, p.midtrans_order_id, p.paid_at,
              dr.title AS design_title, dc.name AS design_category
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN payments p ON p.order_id = o.id
       LEFT JOIN design_references dr ON dr.id = o.design_reference_id
       LEFT JOIN design_categories dc ON dc.id = dr.category_id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order tidak ditemukan.' });
    }

    const assignmentsResult = await pool.query(
      `SELECT oa.*, adm.full_name AS engineer_name, adm.email AS engineer_email
       FROM order_assignments oa
       LEFT JOIN admins adm ON adm.id = oa.assigned_to_admin_id
       WHERE oa.order_id = $1
       ORDER BY oa.assigned_at DESC`,
      [id]
    );

    const assetsResult = await pool.query(
      `SELECT * FROM order_assets WHERE order_id = $1 ORDER BY display_order`,
      [id]
    );

    const outputsResult = await pool.query(
      `SELECT io.*, adm.full_name AS uploader_name
       FROM invitation_outputs io
       LEFT JOIN admins adm ON adm.id = io.uploaded_by_admin_id
       WHERE io.order_id = $1
       ORDER BY io.created_at DESC`,
      [id]
    );

    const notesResult = await pool.query(
      `SELECT oin.*, adm.full_name AS admin_name
       FROM order_internal_notes oin
       LEFT JOIN admins adm ON adm.id = oin.admin_id
       WHERE oin.order_id = $1
       ORDER BY oin.created_at DESC`,
      [id]
    );

    const statusLogsResult = await pool.query(
      `SELECT * FROM order_status_logs WHERE order_id = $1 ORDER BY changed_at DESC`,
      [id]
    );

    res.status(200).json({
      status: 'success',
      data: {
        order: orderResult.rows[0],
        assignments: assignmentsResult.rows,
        assets: assetsResult.rows,
        outputs: outputsResult.rows,
        internal_notes: notesResult.rows,
        status_logs: statusLogsResult.rows
      }
    });
  } catch (error) {
    console.error('[ERROR] Get Order Detail:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil detail order.' });
  }
};

// ========================================================
// 3. UPDATE STATUS ORDER
// ========================================================
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  const adminId = req.admin.admin_id || req.admin.id;
  const validStatuses = ['draft', 'pending_payment', 'paid', 'in_queue', 'in_progress', 'review', 'ready', 'completed', 'cancelled', 'refunded'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ status: 'error', message: `Status tidak valid. Gunakan: ${validStatuses.join(', ')}` });
  }

  try {
    await pool.query('BEGIN');

    const orderCheck = await pool.query('SELECT id, status FROM orders WHERE id = $1 FOR UPDATE', [id]);
    if (orderCheck.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'Order tidak ditemukan.' });
    }

    const oldStatus = orderCheck.rows[0].status;

    await pool.query(`SELECT set_config('app.changed_by_type', 'admin', true)`);
    await pool.query(`SELECT set_config('app.changed_by_id', $1, true)`, [String(adminId)]);
    if (note) {
      await pool.query(`SELECT set_config('app.status_change_note', $1, true)`, [String(note)]);
    }

    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );


    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id, details) 
       VALUES ($1, 'UPDATE_ORDER_STATUS', 'orders', $2, $3)`,
      [adminId, id, JSON.stringify({ from: oldStatus, to: status, note })]
    );

    await pool.query('COMMIT');

    res.status(200).json({
      status: 'success',
      message: 'Status order berhasil diupdate.',
      data: result.rows[0]
    });
  } catch (error) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('[ERROR] Update Order Status:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengupdate status order.' });
  }
};

// ========================================================
// 4. ASSIGN ORDER KE ENGINEER
// ========================================================
export const assignOrder = async (req, res) => {
  const { id } = req.params;
  const { engineer_id, internal_notes } = req.body;
  const adminId = req.admin.admin_id || req.admin.id;

  if (!engineer_id) {
    return res.status(400).json({ status: 'error', message: 'engineer_id wajib diisi.' });
  }

  try {
    const orderCheck = await pool.query('SELECT id FROM orders WHERE id = $1', [id]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order tidak ditemukan.' });
    }

    const engineerCheck = await pool.query(
      `SELECT a.id FROM admins a JOIN admin_roles r ON a.role_id = r.id WHERE a.id = $1 AND r.role_slug = 'engineer' AND a.is_active = true`,
      [engineer_id]
    );
    if (engineerCheck.rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Engineer tidak ditemukan atau tidak aktif.' });
    }

    // Mark previous assignments as reassigned
    await pool.query(
      `UPDATE order_assignments SET assignment_status = 'reassigned' WHERE order_id = $1 AND assignment_status NOT IN ('completed', 'reassigned')`,
      [id]
    );

    const result = await pool.query(
      `INSERT INTO order_assignments (order_id, assigned_to_admin_id, assigned_by_admin_id, internal_notes, assignment_status)
       VALUES ($1, $2, $3, $4, 'assigned')
       RETURNING *`,
      [id, engineer_id, adminId, internal_notes || null]
    );

    // Auto-update order status to in_queue if still draft/pending_payment
    await pool.query(
      `UPDATE orders SET status = CASE WHEN status IN ('draft','pending_payment') THEN 'in_queue' ELSE status END, updated_at = NOW() WHERE id = $1`,
      [id]
    );

    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id, details) 
       VALUES ($1, 'ASSIGN_ORDER', 'order_assignments', $2, $3)`,
      [adminId, result.rows[0].id, JSON.stringify({ order_id: id, assigned_to: engineer_id })]
    );

    res.status(200).json({
      status: 'success',
      message: 'Order berhasil di-assign ke engineer.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[ERROR] Assign Order:', error);
    res.status(500).json({ status: 'error', message: 'Gagal meng-assign order.' });
  }
};

// ========================================================
// 5. TAMBAH CATATAN INTERNAL
// ========================================================
export const addInternalNote = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  const adminId = req.admin.admin_id || req.admin.id;

  if (!note) {
    return res.status(400).json({ status: 'error', message: 'Note wajib diisi.' });
  }

  try {
    const orderCheck = await pool.query('SELECT id FROM orders WHERE id = $1', [id]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order tidak ditemukan.' });
    }

    const result = await pool.query(
      `INSERT INTO order_internal_notes (order_id, admin_id, note) VALUES ($1, $2, $3) RETURNING *`,
      [id, adminId, note]
    );

    res.status(201).json({
      status: 'success',
      message: 'Catatan internal berhasil ditambahkan.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[ERROR] Add Internal Note:', error);
    res.status(500).json({ status: 'error', message: 'Gagal menambahkan catatan internal.' });
  }
};

// ========================================================
// 6. LIST ENGINEERS UNTUK ASSIGNMENT DROPDOWN
// ========================================================
export const getEngineers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.full_name, a.email 
       FROM admins a 
       JOIN admin_roles r ON a.role_id = r.id 
       WHERE r.role_slug = 'engineer' AND a.is_active = true
       ORDER BY a.full_name`
    );

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('[ERROR] Get Engineers:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data engineer.' });
  }
};
