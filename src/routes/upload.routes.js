import express from 'express';
import { getUploadTicket, saveUploadRecord } from '../controllers/upload.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken); 
router.post('/ticket', getUploadTicket);
router.post('/save-record', saveUploadRecord);

export default router;