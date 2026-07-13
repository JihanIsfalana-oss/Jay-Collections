import pool from '../../config/db.js';

// ========================================================
// 1. DASHBOARD STATISTIK UTAMA
// ========================================================
export const getDashboardStats = async (req, res) => {
  try {
    const results = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total FROM users'),
      pool.query('SELECT COUNT(*)::int AS total FROM admins WHERE is_active = true'),
      pool.query("SELECT COUNT(*)::int AS total FROM orders WHERE status != 'draft'"),
      pool.query("SELECT COUNT(*)::int AS total FROM orders WHERE status = 'paid' OR status = 'in_queue' OR status = 'in_progress' OR status = 'review' OR status = 'ready'"),
      pool.query("SELECT COUNT(*)::int AS total FROM orders WHERE status = 'completed'"),
      pool.query("SELECT COUNT(*)::int AS total FROM orders WHERE status = 'cancelled'"),
      pool.query('SELECT COALESCE(SUM(amount), 0)::float AS total FROM payments WHERE status = \'settlement\''),
      pool.query("SELECT COUNT(*)::int AS total FROM user_account_status WHERE is_banned = true"),
      pool.query('SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status ORDER BY count DESC'),
      pool.query('SELECT COUNT(*)::int AS total FROM admin_audit_logs WHERE performed_at >= NOW() - INTERVAL \'24 hours\'')
    ]);

    const [totalUsers, totalAdmins, totalOrders, activeOrders, completedOrders, cancelledOrders, totalRevenue, bannedUsers, ordersByStatus, activities24h] = results;

    res.status(200).json({
      status: 'success',
      data: {
        users: { total: totalUsers.rows[0].total, banned: bannedUsers.rows[0].total },
        admins: { total: totalAdmins.rows[0].total },
        orders: {
          total: totalOrders.rows[0].total,
          active: activeOrders.rows[0].total,
          completed: completedOrders.rows[0].total,
          cancelled: cancelledOrders.rows[0].total,
          by_status: ordersByStatus.rows
        },
        revenue: { total: totalRevenue.rows[0].total },
        activities_24h: activities24h.rows[0].total
      }
    });
  } catch (error) {
    console.error('[ERROR] Dashboard Stats:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data dashboard.' });
  }
};

// ========================================================
// 2. REVENUE CHART (PER BULAN)
// ========================================================
export const getRevenueChart = async (req, res) => {
  const { year } = req.query;
  const targetYear = year || new Date().getFullYear();

  try {
    const result = await pool.query(
      `SELECT 
        EXTRACT(MONTH FROM paid_at)::int AS month,
        COUNT(*)::int AS transaction_count,
        COALESCE(SUM(amount), 0)::float AS revenue
       FROM payments 
       WHERE status = 'settlement' 
         AND EXTRACT(YEAR FROM paid_at) = $1
       GROUP BY month
       ORDER BY month`,
      [targetYear]
    );

    // Fill missing months with zero
    const monthlyData = [];
    for (let m = 1; m <= 12; m++) {
      const found = result.rows.find(r => r.month === m);
      monthlyData.push({
        month: m,
        transaction_count: found ? found.transaction_count : 0,
        revenue: found ? found.revenue : 0
      });
    }

    res.status(200).json({
      status: 'success',
      data: { year: targetYear, months: monthlyData }
    });
  } catch (error) {
    console.error('[ERROR] Revenue Chart:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data revenue.' });
  }
};

// ========================================================
// 3. RECENT ACTIVITIES (10 TERAKHIR)
// ========================================================
export const getRecentActivities = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        al.id,
        al.action,
        al.target_table,
        al.target_id,
        al.details,
        al.ip_address,
        al.performed_at,
        a.full_name AS admin_name,
        a.email AS admin_email
       FROM admin_audit_logs al
       LEFT JOIN admins a ON a.id = al.admin_id
       ORDER BY al.performed_at DESC
       LIMIT 10`
    );

    res.status(200).json({
      status: 'success',
      data: result.rows
    });
  } catch (error) {
    console.error('[ERROR] Recent Activities:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil aktivitas terbaru.' });
  }
};
