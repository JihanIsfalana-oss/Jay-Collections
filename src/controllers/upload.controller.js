import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

export const getUploadTicket = async (req, res) => {
  const { fileType, fileSize, videoDurationSec, orderId, captchaToken } = req.body;
  const userId = req.user.id;

  try {
    if (!captchaToken) {
      return res.status(403).json({ status: 'error', message: '[ERROR] Verifikasi Human gagal. Token tidak ditemukan.' });
    }

    const recaptchaVerify = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`
    );

    if (!recaptchaVerify.data.success) {
      console.error('reCAPTCHA Error:', recaptchaVerify.data['error-codes']); // Buat nge-track error di terminal
      return res.status(403).json({ status: 'error', message: '[ERROR] Sistem mendeteksi aktivitas mencurigakan.' });
    }

    // 2. VALIDASI FORMAT
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'video/mp4'];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ status: 'error', message: '[ERROR] Format tidak diizinkan! Hanya JPG, PNG, PDF, dan MP4.' });
    }

    if (fileType.startsWith('image/') || fileType === 'application/pdf') {
      if (fileSize > 10 * 1024 * 1024) { // 10 MB
        return res.status(400).json({ status: 'error', message: '[ERROR] Ukuran foto/dokumen maksimal 10 MB!' });
      }
    } else if (fileType === 'video/mp4') {
      if (fileSize > 100 * 1024 * 1024) { // 100 MB 
        return res.status(400).json({ status: 'error', message: '[ERROR] Ukuran video maksimal 100 MB!' });
      }
      if (videoDurationSec > 150) { 
        return res.status(400).json({ status: 'error', message: '[ERROR] Durasi video maksimal 2 menit 30 detik!' });
      }
    }

    const timestamp = Math.round((new Date).getTime() / 1000);
    const folderPath = `jay_collections/order_${orderId}`;

    const paramsToSign = {
      timestamp: timestamp,
      folder: folderPath,
      moderation: "aws_rek" 
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign, 
      process.env.CLOUDINARY_API_SECRET
    );

    res.status(200).json({
      status: 'success',
      message: '[INFO] Tiket upload Cloudinary berhasil dibuat.',
      data: {
        signature,
        timestamp,
        folder: folderPath,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`
      }
    });

  } catch (error) {
    console.error('Error generate upload ticket:', error);
    res.status(500).json({ status: 'error', message: '[ERROR] Gagal membuat tiket upload.' });
  }
};