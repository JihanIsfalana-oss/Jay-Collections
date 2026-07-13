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
export const createTransaction = async (req, res) => {
  const { orderId } = req.body;
  const userId = req.user.id;

  try {
    const orderQuery = await pool.query(
      'SELECT id, order_code, total_amount, status FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    );
    const order = orderQuery.rows[0];

    if (!order) {
      return res.status(404).json({ status: 'error', message: '[ERROR] Pesanan tidak ditemukan!' });
    }

    const amount = parseFloat(order.total_amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: '[ERROR] Tidak dapat menginisiasi transaksi. Nominal harga pesanan kosong atau tidak valid!' 
      });
    }

    const midtransOrderId = `JAY-${order.order_code}-${Date.now()}`;

    let parameter = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: amount,
      },
      customer_details: {
        email: req.user.email || 'customer@jaycollections.com',
        first_name: req.user.nama_lengkap || 'Customer',
      },
    };

    const transaction = await snap.createTransaction(parameter);
    const snapToken = transaction.token;

    await pool.query(
      `INSERT INTO payments (order_id, midtrans_order_id, amount, status) 
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT (order_id) DO UPDATE 
       SET midtrans_order_id = $2, amount = $3, status = 'pending', updated_at = NOW()`,
      [orderId, midtransOrderId, amount]
    );

    return res.status(200).json({
      status: 'success',
      data: {
        snap_token: snapToken,
        redirect_url: transaction.redirect_url,
        midtrans_order_id: midtransOrderId
      }
    });

  } catch (error) {
    console.error('[ERROR] Inisiasi Transaksi Midtrans Gagal:', error);
    return res.status(500).json({ status: 'error', message: '[ERROR] Gagal membuat transaksi pembayaran.' });
  }
};

// ==========================================
// 2. WEBHOOK / CALLBACK DARI MIDTRANS
// ==========================================
export const midtransWebhook = async (req, res) => {
  const data = req.body;

  try {
    const hash = crypto
      .createHash('sha512')
      .update(`${data.order_id}${data.status_code}${data.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`)
      .digest('hex');

    if (hash !== data.signature_key) {
      return res.status(403).json({ status: 'error', message: '[WARNING] Ilegal Webhook Signature Key!' });
    }

    const midtransOrderId = data.order_id;
    const transactionStatus = data.transaction_status;
    const fraudStatus = data.fraud_status;

    let paymentStatus = 'pending';
    let orderStatus = 'pending_payment';

    if (transactionStatus == 'capture') {
      if (fraudStatus == 'challenge') {
        paymentStatus = 'challenge';
      } else if (fraudStatus == 'accept') {
        paymentStatus = 'settlement';
        orderStatus = 'paid';
      }
    } else if (transactionStatus == 'settlement') {
      paymentStatus = 'settlement';
      orderStatus = 'paid';
    } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
      paymentStatus = 'failure';
      orderStatus = 'cancelled';
    } else if (transactionStatus == 'pending') {
      paymentStatus = 'pending';
    }

    await pool.query('BEGIN');

    const updatePayment = await pool.query(
      `UPDATE payments 
       SET status = $1, midtrans_transaction_id = $2, midtrans_status = $3, payment_method = $4, raw_callback = $5, updated_at = NOW()
       WHERE midtrans_order_id = $6 RETURNING order_id`,
      [paymentStatus, data.transaction_id, transactionStatus, data.payment_type, data, midtransOrderId]
    );

    if (updatePayment.rows.length > 0) {
      const orderId = updatePayment.rows[0].order_id;
      await pool.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', [orderStatus, orderId]);
    }

    await pool.query('COMMIT');
    return res.status(200).json({ status: 'success' });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('[ERROR]:', error);
    return res.status(500).json({ status: 'error', message: '[ERROR] Gagal memproses webhook Midtrans.' });
  }
};
