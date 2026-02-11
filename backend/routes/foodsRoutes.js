import { Router } from 'express';
import {
    getFoods,
    getFoodsAvailableForMenu,
    getCheeseFoods,
} from '../controllers/foodsController.js';

const router = Router();

router.get('/', getFoods);
router.get('/available-for-menu', getFoodsAvailableForMenu);
router.get('/cheeses', getCheeseFoods);

export default router;
