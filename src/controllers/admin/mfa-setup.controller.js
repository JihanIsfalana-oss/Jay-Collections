import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import pool from '../../config/db.js';

export const setupMfa = async (req, res) => {
  const adminId = req.admin.admin_id || req.admin.id;

  try {
    const secret = speakeasy.generateSecret({
      name: `JayCollections Admin (${req.admin.email})`,
      length: 32
    });

    await pool.query(
      'UPDATE admins SET totp_secret = $1 WHERE id = $2',
      [secret.base32, adminId]
    );

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      status: 'success',
      message: 'Scan QR code ini dengan Google Authenticator, lalu aktifkan MFA.',
      data: { qr_code: qrCodeUrl, manual_entry_key: secret.base32 }
    });
  } catch (error) {
    console.error('[ERROR] Setup MFA:', error);
    res.status(500).json({ status: 'error', message: 'Gagal setup MFA.' });
  }
};

export const enableMfa = async (req, res) => {
  const adminId = req.admin.admin_id || req.admin.id;
  const { mfa_code } = req.body;

  try {
    const result = await pool.query('SELECT totp_secret FROM admins WHERE id = $1', [adminId]);
    const secret = result.rows[0]?.totp_secret;

    if (!secret) {
      return res.status(400).json({ status: 'error', message: 'Jalankan setup MFA terlebih dahulu.' });
    }

    const isValid = speakeasy.totp.verify({
      secret, encoding: 'base32', token: mfa_code, window: 1
    });

    if (!isValid) {
      return res.status(400).json({ status: 'error', message: 'Kode MFA salah, coba lagi.' });
    }

    await pool.query('UPDATE admins SET mfa_enabled = true WHERE id = $1', [adminId]);
    res.status(200).json({ status: 'success', message: 'MFA berhasil diaktifkan.' });
  } catch (error) {
    console.error('[ERROR] Enable MFA:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengaktifkan MFA.' });
  }
};