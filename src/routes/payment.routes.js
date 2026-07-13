import express from 'express';
import { createTransaction, midtransWebhook } from '../controllers/payment.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/webhook', midtransWebhook);

router.post('/create', verifyToken, createTransaction);

export default router;