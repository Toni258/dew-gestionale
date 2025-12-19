import { Router } from 'express';
import {
    getFilteredDishes,
    getFirstMeals,
    checkDishName,
    createDish,
    deleteDish,
} from '../controllers/dishesController.js';
import { uploadFoodImage } from '../middlewares/uploadFoodImage.js';

const router = Router();

router.get('/', getFilteredDishes);
router.get('/exists', checkDishName);
router.get('/test', getFirstMeals);

router.post('/', uploadFoodImage.single('img'), createDish);

router.delete('/:id', deleteDish);

export default router;
