import pool from '../config/db.js';

// =====================
// 1. CREATE ORDER 
// =====================
export const createOrder = async (req, res) => {
  const userId = req.user.id; 
  const { 
    bride_name, 
    groom_name, 
    wedding_date, 
    wedding_location, 
    ceremony_location, 
    reception_location, 
    couple_story, 
    custom_notes 
  } = req.body;

  try {
    const newOrder = await pool.query(
      `INSERT INTO orders 
      (user_id, bride_name, groom_name, wedding_date, wedding_location, ceremony_location, reception_location, couple_story, custom_notes, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft') 
      RETURNING id, order_code, status, created_at`,
      [userId, bride_name, groom_name, wedding_date, wedding_location, ceremony_location, reception_location, couple_story, custom_notes]
    );

    res.status(201).json({
      status: 'success',
      message: '[INFO] Pesanan undangan pernikahan berhasil dibuat!',
      data: newOrder.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: '[ERROR] Gagal membuat pesanan.' });
  }
};

// ==========================================
// 2. GET MY ORDERS (Lihat Riwayat Pesanan)
// ==========================================
export const getMyOrders = async (req, res) => {
  const userId = req.user.id;

  try {
    const orders = await pool.query(
      'SELECT id, order_code, status, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.status(200).json({
      status: 'success',
      data: orders.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: '[ERROR] Gagal mengambil data pesanan.' });
  }
};