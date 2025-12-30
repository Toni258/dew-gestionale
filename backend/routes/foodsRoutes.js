import { Router } from 'express';
import { getFoods } from '../controllers/foodsController.js';

const router = Router();

router.get('/', getFoods);

export default router;
