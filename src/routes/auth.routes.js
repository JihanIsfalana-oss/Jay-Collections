import express from 'express';
import { register, login, resetPassword, googleLogin } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/reset-password', resetPassword);

export default router;