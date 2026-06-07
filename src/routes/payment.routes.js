import express from 'express';
import { createPayment, midtransWebhook } from '../controllers/payment.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/webhook', midtransWebhook);

router.post('/create', verifyToken, createPayment);

export default router;