import pool from '../config/db.js';
import crypto from 'crypto';

// ==========================================
// 1. LINK ACCOUNT COUPLE
// ==========================================
export const linkCouple = async (req, res) => {
  const userId = req.user.id;
  const { partnerEmail } = req.body;

  try {
    const partnerQuery = await pool.query('SELECT id FROM users WHERE email = $1', [partnerEmail]);
    if (partnerQuery.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: '[ERROR] Email pasangan tidak ditemukan!' });
    }
    const partnerId = partnerQuery.rows[0].id;

    const checkLink = await pool.query(
      'SELECT id FROM couple_links WHERE ($1 IN (requester_user_id, target_user_id) OR $2 IN (requester_user_id, target_user_id))',
      [userId, partnerId]
    );
    if (checkLink.rows.length > 0) {
      return res.status(400).json({ status: 'error', message: '[ERROR] Salah satu akun sudah terhubung dengan akun lain!' });
    }

    const newLink = await pool.query(
      `INSERT INTO couple_links (requester_user_id, target_user_id, interaction_score) 
       VALUES ($1, $2, 0) RETURNING id, interaction_score`,
      [userId, partnerId]
    );

    res.status(201).json({
      status: 'success',
      message: '[SUCCESS] Selamat! Akun Anda berhasil terhubung dengan pasangan.',
      data: newLink.rows[0]
    });
  } catch (error) {
    console.error('[ERROR] Error Link Couple:', error);
    res.status(500).json({ status: 'error', message: '[ERROR] Gagal menghubungkan akun.' });
  }
};

// ==========================================
// 2. ADD INTERACTION SCORE 
// ==========================================
export const addInteractionScore = async (req, res) => {
  const userId = req.user.id;
  const { activityType } = req.body;
  const client = await pool.connect();
  let transactionStarted = false;

  let pointsToAdd = 0;

  switch (activityType) {
    case 'both_login_same_day':
      pointsToAdd = 5;
      break;
    case 'partner_profile_view':
      pointsToAdd = 3;
      break;
    case 'shared_order_created':
      pointsToAdd = 10;
      break;
    case 'partner_design_view':
      pointsToAdd = 2;
      break;
    default:
      return res.status(400).json({ status: 'error', message: '[ERROR] Tipe aktivitas tidak valid.' });
  }

  try {
    await client.query('BEGIN');
    transactionStarted = true;

    const coupleQuery = await client.query(
      'SELECT id, interaction_score, score_threshold_for_voucher, voucher_granted FROM couple_links WHERE requester_user_id = $1 OR target_user_id = $1 FOR UPDATE',
      [userId]
    );

    if (coupleQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      transactionStarted = false;
      return res.status(400).json({ status: 'error', message: '[ERROR] Anda belum menghubungkan akun dengan pasangan.' });
    }

    const coupleId = coupleQuery.rows[0].id;
    const threshold = coupleQuery.rows[0].score_threshold_for_voucher;

    if (activityType !== 'shared_order_created') {
      const checkToday = await client.query(
        `SELECT id FROM couple_interactions 
         WHERE couple_link_id = $1 AND interaction_type = $2 AND DATE(occurred_at) = CURRENT_DATE`,
        [coupleId, activityType]
      );
      if (checkToday.rows.length > 0) {
        await client.query('ROLLBACK');
        transactionStarted = false;
        return res.status(200).json({ status: 'success', message: '[Poin] Poin harian untuk aktivitas ini sudah diambil.' });
      }
    }

    await client.query(
      'INSERT INTO couple_interactions (couple_link_id, actor_user_id, interaction_type, score_delta) VALUES ($1, $2, $3, $4)',
      [coupleId, userId, activityType, pointsToAdd]
    );

    const refreshedCouple = await client.query(
      'SELECT id, interaction_score, score_threshold_for_voucher, voucher_granted FROM couple_links WHERE id = $1',
      [coupleId]
    );
    
    const currentScore = refreshedCouple.rows[0].interaction_score;

    let voucherData = null;
    let voucherCreatedNow = false;
    if (refreshedCouple.rows[0].voucher_granted) {
      const existingVoucher = await client.query(
        `SELECT code, discount_percent 
         FROM vouchers 
         WHERE couple_link_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [coupleId]
      );

      if (existingVoucher.rows.length === 0) {
        const voucherCode = `JAY-CINTA-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const randomDiscount = Math.floor(Math.random() * (20 - 5 + 1)) + 5; 

        const insertVoucher = await client.query(
          `INSERT INTO vouchers (code, discount_percent, is_used, couple_link_id) 
           VALUES ($1, $2, false, $3) RETURNING code, discount_percent`,
          [voucherCode, randomDiscount, coupleId]
        );

        voucherData = insertVoucher.rows[0];
        voucherCreatedNow = true;
      } else {
        voucherData = existingVoucher.rows[0];
      }
    }

    await client.query('COMMIT');
    transactionStarted = false;

    res.status(200).json({
      status: 'success',
      message: voucherCreatedNow ? `[Voucher] Selamat, poin pasangan Anda telah mencapai batas ${threshold}. Voucher berhasil diproses.` : '[Poin] Poin berhasil ditambahkan.',
      data: {
        current_score: currentScore,
        added_points: pointsToAdd,
        voucher_reward: voucherData 
      }
    });

  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK').catch(() => {});
    }
    console.error('[ERROR] Error Add Score:', error);
    res.status(500).json({ status: 'error', message: '[ERROR] Gagal menambahkan poin interaksi.' });
  } finally {
    client.release();
  }
};
