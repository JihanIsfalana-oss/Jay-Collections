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
    custom_notes,
    subtotal,
    discount_amount,
    total_amount,
    voucher_id,
    design_reference_id
  } = req.body;

  const hasSubtotal = subtotal !== undefined && subtotal !== null && subtotal !== '';
  const hasDiscount = discount_amount !== undefined && discount_amount !== null && discount_amount !== '';
  const hasTotal = total_amount !== undefined && total_amount !== null && total_amount !== '';

  const parsedSubtotal = hasSubtotal ? Number(subtotal) : (hasTotal ? Number(total_amount) : 0);
  const parsedDiscount = hasDiscount ? Number(discount_amount) : 0;
  const parsedTotal = hasTotal ? Number(total_amount) : Math.max(parsedSubtotal - parsedDiscount, 0);

  if ([parsedSubtotal, parsedDiscount, parsedTotal].some((value) => Number.isNaN(value))) {
    return res.status(400).json({ status: 'error', message: '[ERROR] Nominal harga pesanan tidak valid.' });
  }

  if (parsedSubtotal < 0 || parsedDiscount < 0 || parsedTotal < 0) {
    return res.status(400).json({ status: 'error', message: '[ERROR] Nominal harga pesanan tidak boleh negatif.' });
  }

  if (hasSubtotal && parsedDiscount > parsedSubtotal) {
    return res.status(400).json({ status: 'error', message: '[ERROR] Diskon tidak boleh melebihi subtotal.' });
  }

  if (hasSubtotal && hasTotal && parsedTotal !== (parsedSubtotal - parsedDiscount)) {
    return res.status(400).json({ status: 'error', message: '[ERROR] Total pesanan tidak konsisten dengan subtotal dan diskon.' });
  }

  try {
    const newOrder = await pool.query(
      `INSERT INTO orders 
      (user_id, voucher_id, design_reference_id, bride_name, groom_name, wedding_date, wedding_location, ceremony_location, reception_location, couple_story, custom_notes, subtotal, discount_amount, total_amount, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'draft') 
      RETURNING id, order_code, status, created_at`,
      [
        userId,
        voucher_id || null,
        design_reference_id || null,
        bride_name,
        groom_name,
        wedding_date,
        wedding_location,
        ceremony_location,
        reception_location,
        couple_story,
        custom_notes,
        parsedSubtotal,
        parsedDiscount,
        parsedTotal
      ]
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