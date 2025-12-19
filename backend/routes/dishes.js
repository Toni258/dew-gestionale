import { Router } from 'express';
import {
    getFilteredDishes,
    getFirstMeals,
    checkDishName,
    createDish,
    deleteDish,
    getDishById,
    updateDish,
} from '../controllers/dishesController.js';
import { uploadFoodImage } from '../middlewares/uploadFoodImage.js';

const router = Router();

router.get('/', getFilteredDishes);
router.get('/exists', checkDishName);
router.get('/test', getFirstMeals);
router.get('/:id', getDishById);

router.post('/', uploadFoodImage.single('img'), createDish);

router.put('/:id', uploadFoodImage.single('img'), updateDish);

router.delete('/:id', deleteDish);

export default router;
