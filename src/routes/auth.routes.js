import express from 'express';
import { register, login, resetPassword, googleLogin, forgotPassword } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;