import express from 'express';
import { getPublicCategories, getPublicDesigns } from '../controllers/public.controller.js';

const router = express.Router();

router.get('/designs/categories', getPublicCategories);
router.get('/designs/references', getPublicDesigns);

export default router;