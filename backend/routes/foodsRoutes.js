import { Router } from 'express';
import {
    getFoods,
    getFoodsAvailableForMenu,
} from '../controllers/foodsController.js';

const router = Router();

router.get('/', getFoods);
router.get('/available-for-menu', getFoodsAvailableForMenu);

export default router;
