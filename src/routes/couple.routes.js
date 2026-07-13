import express from 'express';
import { linkCouple, addInteractionScore } from '../controllers/couple.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken); 

router.post('/link', linkCouple);
router.post('/score', addInteractionScore);

export default router;