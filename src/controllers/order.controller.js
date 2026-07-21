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

// ==========================================
// 3. UPDATE ORDER PRICING (sebelum checkout)
// ==========================================
export const updateOrderPricing = async (req, res) => {
  // GUARD SEMENTARA — endpoint ini menerima harga mentah dari client,
  // hanya untuk testing selama model harga final belum ditentukan.
  // WAJIB diganti dengan perhitungan server-side sebelum production.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_CLIENT_PRICING !== 'true') {
    return res.status(403).json({
      status: 'error',
      message: '[BLOCKED] Endpoint pricing client-side dinonaktifkan di production. Implementasikan perhitungan harga server-side terlebih dahulu.'
    });
  }

  const userId = req.user.id;
  const { id } = req.params;
  const { subtotal, discount_amount } = req.body;

  if (subtotal === undefined || subtotal === null || isNaN(subtotal) || subtotal < 0) {
    return res.status(400).json({ status: 'error', message: '[ERROR] subtotal wajib diisi dan tidak boleh negatif.' });
  }

  const discount = discount_amount || 0;
  if (isNaN(discount) || discount < 0) {
    return res.status(400).json({ status: 'error', message: '[ERROR] discount_amount tidak valid.' });
  }
  if (discount > subtotal) {
    return res.status(400).json({ status: 'error', message: '[ERROR] Diskon tidak boleh melebihi subtotal.' });
  }

  const totalAmount = subtotal - discount;

  try {
    const orderCheck = await pool.query(
      'SELECT id, status FROM orders WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: '[ERROR] Order tidak ditemukan.' });
    }

    if (orderCheck.rows[0].status !== 'draft') {
      return res.status(400).json({ status: 'error', message: '[ERROR] Harga hanya bisa diubah saat order masih berstatus draft.' });
    }

    const result = await pool.query(
      `UPDATE orders 
       SET subtotal = $1, discount_amount = $2, total_amount = $3, updated_at = NOW()
       WHERE id = $4 
       RETURNING id, order_code, subtotal, discount_amount, total_amount, status`,
      [subtotal, discount, totalAmount, id]
    );

    res.status(200).json({
      status: 'success',
      message: '[SUCCESS] Harga pesanan berhasil diupdate.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[ERROR] Update Order Pricing:', error);
    res.status(500).json({ status: 'error', message: '[ERROR] Gagal mengupdate harga pesanan.' });
  }
};