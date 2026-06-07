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
      'SELECT id FROM couple_links WHERE requester_user_id = $1 OR target_user_id = $1 OR requester_user_id = $2 OR target_user_id = $2',
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
    const coupleQuery = await pool.query(
      'SELECT id, interaction_score FROM couple_links WHERE requester_user_id = $1 OR target_user_id = $1',
      [userId]
    );

    if (coupleQuery.rows.length === 0) {
      return res.status(400).json({ status: 'error', message: '[ERROR] Anda belum menghubungkan akun dengan pasangan.' });
    }

    const coupleId = coupleQuery.rows[0].id;
    let currentScore = coupleQuery.rows[0].interaction_score;

    if (activityType !== 'shared_order_created') {
      const checkToday = await pool.query(
        `SELECT id FROM couple_interactions 
         WHERE couple_link_id = $1 AND interaction_type = $2 AND DATE(occurred_at) = CURRENT_DATE`,
        [coupleId, activityType]
      );
      if (checkToday.rows.length > 0) {
        return res.status(200).json({ status: 'success', message: '[Poin] Poin harian untuk aktivitas ini sudah diambil.' });
      }
    }

    await pool.query(
      'INSERT INTO couple_interactions (couple_link_id, actor_user_id, interaction_type, score_delta) VALUES ($1, $2, $3, $4)',
      [coupleId, userId, activityType, pointsToAdd]
    );

    const updateScore = await pool.query(
      'UPDATE couple_links SET interaction_score = interaction_score + $1 WHERE id = $2 RETURNING interaction_score',
      [pointsToAdd, coupleId]
    );
    
    currentScore = updateScore.rows[0].interaction_score;

    let voucherData = null;
    if (currentScore >= 100) {
      const voucherCode = `JAY-CINTA-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const randomDiscount = Math.floor(Math.random() * (20 - 5 + 1)) + 5; 

      const insertVoucher = await pool.query(
        `INSERT INTO vouchers (code, discount_percent, is_used, couple_link_id) 
         VALUES ($1, $2, false, $3) RETURNING code, discount_percent`,
        [voucherCode, randomDiscount, coupleId]
      );

      await pool.query('UPDATE couple_links SET interaction_score = 0 WHERE id = $1', [coupleId]);
      
      voucherData = insertVoucher.rows[0];
    }

    res.status(200).json({
      status: 'success',
      message: voucherData ? '[Voucher] Selamat, Poin mencapai 100. Anda mendapat Voucher!' : '[Poin] Poin berhasil ditambahkan.',
      data: {
        current_score: voucherData ? 0 : currentScore,
        added_points: pointsToAdd,
        voucher_reward: voucherData 
      }
    });

  } catch (error) {
    console.error('[ERROR] Error Add Score:', error);
    res.status(500).json({ status: 'error', message: '[ERROR] Gagal menambahkan poin interaksi.' });
  }
};