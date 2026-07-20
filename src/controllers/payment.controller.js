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
  const client = await pool.connect();
  let transactionStarted = false;

  const rollbackTransaction = async () => {
    if (transactionStarted) {
      await client.query('ROLLBACK');
      transactionStarted = false;
    }
  };

  try {
    await client.query('BEGIN');
    transactionStarted = true;

    // Mencegah double-click / concurrent request memicu tiket ganda
    const orderQuery = await client.query(
      'SELECT id, order_code, total_amount, status FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [orderId, userId]
    );
    const order = orderQuery.rows[0];

    if (!order) {
      await rollbackTransaction();
      return res.status(404).json({ status: 'error', message: '[ERROR] Pesanan tidak ditemukan!' });
    }

    // Jika pesanan sudah dibayar atau selesai, cegah pembuatan transaksi baru
    if (['paid', 'completed', 'in_progress', 'ready'].includes(order.status)) {
      await rollbackTransaction();
      return res.status(400).json({ status: 'error', message: '[ERROR] Pesanan ini sudah lunas atau sedang diproses!' });
    }

    const amount = parseFloat(order.total_amount);
    if (!amount || amount <= 0) {
      await rollbackTransaction();
      return res.status(400).json({
        status: 'error',
        message: '[ERROR] Tidak dapat menginisiasi transaksi. Nominal harga pesanan tidak valid!'
      });
    }

    // Periksa riwayat pembayaran yang ada di database
    const existingPayment = await client.query(
      `SELECT id, midtrans_order_id, status FROM payments WHERE order_id = $1 LIMIT 1`,
      [orderId]
    );

    // Tolak jika pembayaran sebelumnya sudah berstatus sukses/settlement
    if (existingPayment.rows.length > 0 && ['settlement', 'capture'].includes(existingPayment.rows[0].status)) {
      await rollbackTransaction();
      return res.status(409).json({
        status: 'error',
        message: '[ERROR] Pembayaran untuk pesanan ini sudah berhasil diselesaikan!'
      });
    }

    // Gunakan kembali ID transaksi yang sama jika statusnya masih pending (menghindari spam registrasi di Midtrans)
    let midtransOrderId;
    if (existingPayment.rows.length > 0 && existingPayment.rows[0].status === 'pending') {
      midtransOrderId = existingPayment.rows[0].midtrans_order_id;
    } else {
      midtransOrderId = `JAY-${order.order_code}-${Date.now()}`;
    }

    const parameter = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: amount,
      },
      customer_details: {
        email: req.user.email || 'customer@jaycollections.com',
        first_name: req.user.nama_lengkap || 'Customer',
      },
    };

    // Panggil Midtrans Snap API
    const transaction = await snap.createTransaction(parameter);
    const snapToken = transaction.token;

    // Simpan/Perbarui data pembayaran
    await client.query(
      `INSERT INTO payments (order_id, midtrans_order_id, amount, status)
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT (order_id) DO UPDATE
       SET midtrans_order_id = $2, amount = $3, status = 'pending', updated_at = NOW()`,
      [orderId, midtransOrderId, amount]
    );

    await client.query(`SELECT set_config('app.changed_by_type', 'user', true)`);
    await client.query(`SELECT set_config('app.changed_by_id', $1, true)`, [String(userId)]);
    await client.query(`SELECT set_config('app.status_change_note', 'Menunggu pembayaran di Midtrans', true)`);

    await client.query(
      `UPDATE orders SET status = 'pending_payment', updated_at = NOW() WHERE id = $1`,
      [orderId]
    );

    await client.query('COMMIT');
    transactionStarted = false;

    return res.status(200).json({
      status: 'success',
      data: {
        snap_token: snapToken,
        redirect_url: transaction.redirect_url,
        midtrans_order_id: midtransOrderId
      }
    });
  } catch (error) {
    await rollbackTransaction();

    if (error?.code === '23505') {
      return res.status(409).json({
        status: 'error',
        message: '[ERROR] Transaksi pembayaran sudah ada untuk pesanan ini.'
      });
    }

    console.error('[ERROR] Inisiasi Transaksi Midtrans Gagal:', error);
    return res.status(500).json({ status: 'error', message: '[ERROR] Gagal membuat transaksi pembayaran.' });
  } finally {
    client.release();
  }
};

// ==========================================
// 2. WEBHOOK / CALLBACK DARI MIDTRANS
// ==========================================
export const midtransWebhook = async (req, res) => {
  const data = req.body;
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const hash = crypto
      .createHash('sha512')
      .update(`${data.order_id}${data.status_code}${data.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`)
      .digest('hex');

    if (hash !== data.signature_key) {
      client.release();
      return res.status(403).json({ status: 'error', message: '[WARNING] Ilegal Webhook Signature Key!' });
    }

    const midtransOrderId = data.order_id;
    const transactionStatus = data.transaction_status;
    const fraudStatus = data.fraud_status;

    let paymentStatus = 'pending';
    let orderStatus = 'pending_payment';

    if (transactionStatus == 'capture') {
      if (fraudStatus == 'challenge') {
        paymentStatus = 'pending';
      } else if (fraudStatus == 'accept') {
        paymentStatus = 'settlement';
        orderStatus = 'paid';
      }
    } else if (transactionStatus == 'settlement') {
      paymentStatus = 'settlement';
      orderStatus = 'paid';
    } else if (transactionStatus == 'deny') {
      paymentStatus = 'deny';
      orderStatus = 'cancelled';
    } else if (transactionStatus == 'cancel') {
      paymentStatus = 'cancel';
      orderStatus = 'cancelled';
    } else if (transactionStatus == 'expire') {
      paymentStatus = 'expire';
      orderStatus = 'cancelled';
    } else if (transactionStatus == 'pending') {
      paymentStatus = 'pending';
    }

    await client.query('BEGIN');
    transactionStarted = true;

    // Update data pembayaran di database
    const updatePayment = await client.query(
      `UPDATE payments 
       SET status = $1, midtrans_transaction_id = $2, midtrans_status = $3, payment_method = $4, raw_callback = $5, updated_at = NOW()
       WHERE midtrans_order_id = $6 RETURNING order_id`,
      [paymentStatus, data.transaction_id, transactionStatus, data.payment_type, data, midtransOrderId]
    );

    if (updatePayment.rows.length > 0) {
      const orderId = updatePayment.rows[0].order_id;

      // Integrasi ke audit logs trigger dengan mendaftarkan sistem webhook sebagai pengubah
      await client.query(`SELECT set_config('app.changed_by_type', 'system', true)`);
      await client.query(`SELECT set_config('app.status_change_note', $1, true)`, [`Midtrans webhook notification: ${transactionStatus}`]);

      await client.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', [orderStatus, orderId]);
    }

    await client.query('COMMIT');
    transactionStarted = false;
    
    return res.status(200).json({ status: 'success' });
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK').catch(() => {});
    }
    console.error('[ERROR Webhook Midtrans]:', error);
    return res.status(500).json({ status: 'error', message: '[ERROR] Gagal memproses webhook Midtrans.' });
  } finally {
    client.release();
  }
};