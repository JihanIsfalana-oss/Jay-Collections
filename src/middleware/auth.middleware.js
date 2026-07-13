import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: '[ERROR] Akses ditolak! Token tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_USER);
    req.user = decoded; 
    next(); 
  } catch (error) {
    return res.status(403).json({ status: 'error', message: '[ERROR] Token tidak valid atau sudah kedaluwarsa!' });
  }
};