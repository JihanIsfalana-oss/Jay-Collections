import express from 'express';
import { createOrder, getMyOrders, updateOrderPricing } from '../controllers/order.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', createOrder);
router.get('/', getMyOrders);
router.put('/:id/pricing', updateOrderPricing);

export default router;