import midtransClient from 'midtrans-client';
import pool from '../config/db.js';
import crypto from 'crypto';

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// ==========================================
// 1. GENERATE TIKET PEMBAYARAN (SNAP TOKEN)
// ==========================================
export const createPayment = async (req, res) => {
  const { orderId } = req.body; 
  const userId = req.user.id;

  try {
    // A. Cek apakah Order valid 
    const orderQuery = await pool.query(
      'SELECT id, order_code, total_amount, status FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    );

    if (orderQuery.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: '[ERROR] Pesanan tidak ditemukan.' });
    }

    const order = orderQuery.rows[0];

    const grossAmount = parseFloat(order.total_amount) > 0 ? parseFloat(order.total_amount) : 150000;

    const midtransOrderId = `JAY-${order.order_code}-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: grossAmount
      },
      customer_details: {
        first_name: req.user.username,
      }
    };

    const transaction = await snap.createTransaction(parameter);

    await pool.query(
      `INSERT INTO payments (order_id, midtrans_order_id, amount, status) 
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT (order_id) DO UPDATE SET 
       midtrans_order_id = $2, amount = $3, status = 'pending'`,
      [orderId, midtransOrderId, grossAmount]
    );

    res.status(200).json({
      status: 'success',
      message: '[INFO] Tiket pembayaran berhasil dibuat!',
      data: {
        token: transaction.token,
        redirect_url: transaction.redirect_url 
      }
    });

  } catch (error) {
    console.error('Error Create Payment:', error);
    res.status(500).json({ status: 'error', message: '[ERROR] Gagal membuat tiket pembayaran.' });
  }
};

// ==========================================
// 2. WEBHOOK / CALLBACK DARI MIDTRANS
// ==========================================
export const midtransWebhook = async (req, res) => {
  try {
    const data = req.body;

    const hash = crypto.createHash('sha512').update(`${data.order_id}${data.status_code}${data.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`).digest('hex');
    
    if (data.signature_key !== hash) {
      return res.status(403).json({ status: 'error', message: '[ERROR] Invalid Signature!' });
    }

    const transactionStatus = data.transaction_status;
    const fraudStatus = data.fraud_status;
    const midtransOrderId = data.order_id;

    let paymentStatus = 'pending';
    let orderStatus = 'pending_payment';

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'accept' || !fraudStatus) {
        paymentStatus = 'settlement';
        orderStatus = 'paid'; 
      }
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
      paymentStatus = transactionStatus;
      orderStatus = 'cancelled';
    }

    const updatePayment = await pool.query(
      `UPDATE payments 
       SET status = $1, midtrans_transaction_id = $2, midtrans_status = $3, payment_method = $4, raw_callback = $5, updated_at = NOW()
       WHERE midtrans_order_id = $6 RETURNING order_id`,
      [paymentStatus, data.transaction_id, transactionStatus, data.payment_type, data, midtransOrderId]
    );

    if (updatePayment.rows.length > 0) {
      const orderId = updatePayment.rows[0].order_id;
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [orderStatus, orderId]);
    }

    res.status(200).json({ status: 'success' });

  } catch (error) {
    console.error('[ERROR] Webhook Error:', error);
    res.status(500).json({ status: 'error', message: '[ERROR] Terjadi kesalahan pada webhook.' });
  }
};