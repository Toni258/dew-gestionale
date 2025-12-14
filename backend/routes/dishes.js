import { Router } from 'express';
import {
    getFilteredDishes,
    getFirstMeals,
} from '../controllers/dishesController.js';

const router = Router();

// GET /api/dishes?search=&stato=&tipologia=&allergeni[]=uova&allergeni[]=latte
router.get('/', getFilteredDishes);

// 🔴 ENDPOINT DI TEST
router.get('/test', getFirstMeals);

export default router;
